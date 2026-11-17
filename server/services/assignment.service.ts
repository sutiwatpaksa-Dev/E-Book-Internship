import type { AssignmentSection, Role } from "../db/schema";
import { DEFAULT_CRITERIA } from "../../src/lib/rubric";
import { DEFAULT_ASSIGNMENT, pickAssignment, visibleAssignments } from "../lib/assignment-access";
import { userRepository } from "../repositories/user.repository";
import { assignmentRepository } from "../repositories/assignment.repository";
import { cohortRepository } from "../repositories/cohort.repository";
import { fileRepository } from "../repositories/file.repository";
import { submissionRepository } from "../repositories/submission.repository";
import type { AssignmentInput, PostInput } from "../validators/assignment.validator";
import { auditService } from "./audit.service";
import { checkPdf } from "./file.service";
import { weightOf, weightTotal, type DeliverableKind, type RoundDef } from "../../src/lib/submission";

type Viewer = { id: number; role: Role };

// โจทย์ที่บัญชีนี้มีสิทธิ์ดู · น้องเห็นของรุ่นตัวเอง พี่เลี้ยงเห็นทุก slug (สำเนาของรุ่นที่กำลังดู)
async function scope(user: Viewer) {
  const all = await assignmentRepository.refs();
  const cohortId = user.role === "intern" ? await assignmentRepository.cohortOf(user.id) : null;
  const focus = user.role === "dev" ? await cohortRepository.focusId() : null;
  return { all, cohortId, focus };
}
// โจทย์ 1 ชิ้นจาก slug ตามสิทธิ์ของบัญชีนี้ (ไม่มีสิทธิ์ = undefined เหมือนไม่มี)
export async function assignmentFor(user: Viewer, slug: string) {
  const { all, cohortId, focus } = await scope(user);
  const ref = pickAssignment(user.role, cohortId, all, focus, slug);
  return ref ? assignmentRepository.findById(ref.id) : undefined;
}

// โจทย์ที่จะแก้: ต้องมีจริง และรุ่นเจ้าของยังไม่จบ (รุ่นที่จบแล้วล็อกโจทย์ไว้ตามฉบับที่น้องใช้จริง)
async function editable(id: number) {
  const a = await assignmentRepository.findById(id);
  if (!a) throw new Error("ASSIGNMENT_NOT_FOUND");
  if ((await cohortRepository.findById(a.cohortId))?.endedAt) throw new Error("COHORT_LOCKED");
  return a;
}

const postPdfKey = (assignmentId: number, roundId: string) => `post:${assignmentId}:${roundId}`;

// เรียงรอบตามวัน (วันเท่ากันคงลำดับที่กรอก)
const byDay = <T extends { day: number }>(rounds: T[]) => [...rounds].sort((a, b) => a.day - b.day);

// หน้าโจทย์ของ section key (เช่น "api") · ไม่มีในโจทย์นี้ = หน้า 1
export const pageOf = (sections: AssignmentSection[], key: string) => sections.find((s) => s.key === key)?.page ?? 1;

export const assignmentService = {
  // แผงโจทย์ในหน้าเว็บ: ชิ้นแรก = ชิ้นที่ควรเปิดก่อน (ใหม่สุดของรุ่น)
  async listFor(user: Viewer) {
    const { all, cohortId, focus } = await scope(user);
    const order = visibleAssignments(user.role, cohortId, all, focus);
    const first = pickAssignment(user.role, cohortId, all, focus);
    const sorted = first ? [first, ...order.filter((a) => a.id !== first.id)] : order;
    const rows = await assignmentRepository.findManyById(sorted.map((a) => a.id));
    return sorted.flatMap((ref) => {
      const a = rows.find((r) => r.id === ref.id);
      return a ? [{ id: a.id, slug: a.slug, name: a.name, brief: a.brief, overview: a.overview, sections: a.sections, rounds: a.rubric.rounds, submitKind: a.submitKind }] : [];
    });
  },

  // PDF ของโจทย์ที่ขอ (หรือชิ้นหลักของรุ่น) · ไม่มีสิทธิ์และไม่มีจริงตอบเหมือนกัน
  async pdfFor(user: Viewer, requested?: string, roundId?: string) {
    const { all, cohortId, focus } = await scope(user);
    const ref = pickAssignment(user.role, cohortId, all, focus, requested);
    if (!ref) throw new Error(requested ? "ASSIGNMENT_NOT_FOUND" : "NO_ASSIGNMENT");
    const a = (await assignmentRepository.findById(ref.id))!;
    // ?r=<โพสต์> = PDF ที่แนบกับโพสต์นั้น (ไม่แนบ = ไม่มีไฟล์ · ไม่ตั้ง = PDF ของกล่องงาน)
    const round = roundId ? a.rubric.rounds.find((r) => r.id === roundId) : undefined;
    if (roundId && !round) throw new Error("ASSIGNMENT_NOT_FOUND");
    if (round?.pdf === "none") return { assignment: a, file: undefined };
    return { assignment: a, file: await fileRepository.find(round?.pdf === "own" ? postPdfKey(a.id, round.id) : a.pdfKey) };
  },

  // หลังบ้าน: แยก rubric ออกเป็น rounds / criteria / templates (ไม่ตั้ง = รายการว่าง)
  async list() {
    return (await assignmentRepository.list()).map(({ rubric, ...a }) => ({ ...a, rounds: rubric.rounds, criteria: rubric.criteria ?? [], templates: rubric.templates ?? [] }));
  },

  // โจทย์เป็นของรุ่นเดียว · slug ซ้ำได้ข้ามรุ่น แต่ไม่ซ้ำในรุ่นเดียวกัน · ไฟล์ PDF แยกตามรุ่น
  async create(devId: number, cohortId: number, slug: string, { rounds, criteria, templates, overview, submitKind, ...f }: AssignmentInput) {
    const c = await cohortRepository.findById(cohortId);
    if (!c) throw new Error("COHORT_NOT_FOUND");
    if (c.endedAt) throw new Error("COHORT_LOCKED");
    if (await assignmentRepository.findInCohort(cohortId, slug)) throw new Error("ASSIGNMENT_SLUG_TAKEN");
    const a = await assignmentRepository.create({ ...f, cohortId, submitKind: submitKind ?? "repo", overview: overview ?? "", rubric: { rounds: byDay(rounds), criteria: criteria ?? DEFAULT_CRITERIA, templates: templates ?? [] }, slug, pdfKey: `requirement:${slug}:c${cohortId}` });
    await auditService.log(devId, "assignment.create", f.name, `${slug} · ${c.name}`);
    return a;
  },
  async update(devId: number, id: number, { rounds, criteria, templates, overview, submitKind, ...f }: AssignmentInput) {
    const a = await editable(id);
    // เปลี่ยนชนิดที่ส่งได้เฉพาะตอนยังไม่มีใครส่ง (ไม่งั้นลิงก์เก่ากับชนิดใหม่ปนกัน)
    if (submitKind && submitKind !== a.submitKind && (await submissionRepository.roundsUsed(id)).length > 0) throw new Error("SUBMIT_KIND_LOCKED");
    // รอบที่มีคนส่งแล้วลบไม่ได้ (ประวัติต้องยังบอกชื่อรอบได้) · แก้ชื่อ วัน คำอธิบายได้เสมอ
    const used = await submissionRepository.roundsUsed(id);
    if (used.some((r) => r !== "start" && !rounds.some((x) => x.id === r))) throw new Error("ROUND_IN_USE");
    await assignmentRepository.update(id, { ...f, ...(submitKind ? { submitKind } : {}), ...(overview !== undefined ? { overview } : {}), rubric: { ...a.rubric, rounds: byDay(rounds), ...(criteria ? { criteria } : {}), ...(templates ? { templates } : {}) } });
    await auditService.log(devId, "assignment.update", f.name, `${a.slug}${criteria ? " · เกณฑ์คะแนน" : ""}${templates ? " · template" : ""}${overview !== undefined && overview !== a.overview ? " · ภาพรวม" : ""}`);
  },
  // ชนิดที่น้องส่ง (repo, ลิงก์ทั่วไป, ข้อความ) · เปลี่ยนได้เฉพาะตอนยังไม่มีใครส่ง
  async setSubmitKind(devId: number, id: number, submitKind: DeliverableKind) {
    const a = await editable(id);
    if (submitKind === a.submitKind) return;
    if ((await submissionRepository.roundsUsed(id)).length > 0) throw new Error("SUBMIT_KIND_LOCKED");
    await assignmentRepository.update(id, { name: a.name, brief: a.brief, sections: a.sections, rubric: a.rubric, submitKind });
    await auditService.log(devId, "assignment.update", a.name, `ชนิดที่ส่ง: ${a.submitKind} → ${submitKind}`);
  },
  // % คะแนนของโพสต์: รวมทุกโพสต์ไม่เกิน 100 · ตรวจงานของกล่องนี้แล้วแก้ % ไม่ได้ (โพสต์ใหม่ที่ไม่นับคะแนนยังเพิ่มได้)
  async checkWeights(a: { id: number; rubric: { rounds: RoundDef[] } }, next: RoundDef[], changed: { before: number; after: number }) {
    if (changed.before !== changed.after && (await submissionRepository.anyReviewed(a.id))) throw new Error("WEIGHT_LOCKED");
    if (weightTotal(next) > 100) throw new Error("WEIGHT_OVER");
  },
  // ---- โพสต์งาน = เพิ่ม/แก้/ลบ 1 รอบของโจทย์ (ไม่ต้องส่งทั้งโจทย์ ลดโอกาสสองคนแก้ทับกัน) ----
  async addPost(devId: number, id: number, { alsoOthers, ...input }: PostInput) {
    const a = await editable(id);
    const who = (await userRepository.findById(devId))?.username ?? "พี่เลี้ยง";
    const round: RoundDef = { id: `p${Date.now().toString(36)}`, ...input, postedBy: who, postedAt: new Date().toISOString() };
    await this.checkWeights(a, [...a.rubric.rounds, round], { before: 0, after: weightOf(round) });
    await assignmentRepository.update(id, { name: a.name, brief: a.brief, sections: a.sections, rubric: { ...a.rubric, rounds: byDay([...a.rubric.rounds, round]) } });
    await auditService.log(devId, "assignment.update", a.name, `โพสต์งาน: ${input.label}`);
    // รุ่นอื่นที่ยังไม่จบและมีโจทย์ชื่อเดียวกัน: ได้สำเนาโพสต์ (id เดียวกัน) · PDF ของโพสต์ใช้ของรุ่นนั้นแทน (ไฟล์อัปโหลดเข้าโพสต์ต้นทางเท่านั้น)
    // รุ่นที่ใส่ไม่ได้ (% เกิน หรือล็อกแล้ว) ข้ามไป แล้วบอกจำนวนกลับ
    let copied = 0;
    if (alsoOthers) {
      for (const other of await assignmentRepository.openSiblings(a.slug, a.id)) {
        const copy: RoundDef = { ...round, pdf: round.pdf === "own" ? "shared" : round.pdf };
        const next = [...other.rubric.rounds, copy];
        if (weightTotal(next) > 100 || (weightOf(copy) > 0 && (await submissionRepository.anyReviewed(other.id)))) continue;
        await assignmentRepository.update(other.id, { name: other.name, brief: other.brief, sections: other.sections, rubric: { ...other.rubric, rounds: byDay(next) } });
        await auditService.log(devId, "assignment.update", other.name, `โพสต์งาน (สำเนา): ${input.label}`);
        copied++;
      }
    }
    return { id: round.id, copied };
  },
  async updatePost(devId: number, id: number, roundId: string, input: PostInput) {
    const a = await editable(id);
    const old = a.rubric.rounds.find((r) => r.id === roundId);
    if (!old) throw new Error("ASSIGNMENT_NOT_FOUND");
    const next: RoundDef = { ...old, ...input, editedAt: new Date().toISOString() };
    await this.checkWeights(a, a.rubric.rounds.map((r) => (r.id === roundId ? next : r)), { before: weightOf(old), after: weightOf(next) });
    await assignmentRepository.update(id, { name: a.name, brief: a.brief, sections: a.sections, rubric: { ...a.rubric, rounds: byDay(a.rubric.rounds.map((r) => (r.id === roundId ? next : r))) } });
    await auditService.log(devId, "assignment.update", a.name, `แก้โพสต์งาน: ${input.label}`);
  },
  async removePost(devId: number, id: number, roundId: string) {
    const a = await editable(id);
    const old = a.rubric.rounds.find((r) => r.id === roundId);
    if (!old) throw new Error("ASSIGNMENT_NOT_FOUND");
    // มีน้องส่งงานรอบนี้แล้วลบไม่ได้ (ประวัติต้องยังบอกชื่อรอบได้)
    if ((await submissionRepository.roundsUsed(id)).includes(roundId)) throw new Error("ROUND_IN_USE");
    if (a.rubric.rounds.length <= 1) throw new Error("LAST_ROUND");
    await assignmentRepository.update(id, { name: a.name, brief: a.brief, sections: a.sections, rubric: { ...a.rubric, rounds: a.rubric.rounds.filter((r) => r.id !== roundId) } });
    await auditService.log(devId, "assignment.update", a.name, `ลบโพสต์งาน: ${old.label}`);
  },
  // PDF ของโพสต์เดียว (ต่างจาก PDF ของกล่องงาน) · อัปโหลดแล้วโพสต์นี้ใช้ไฟล์ของตัวเอง
  async savePostPdf(devId: number, id: number, roundId: string, data: Buffer) {
    const a = await editable(id);
    const round = a.rubric.rounds.find((r) => r.id === roundId);
    if (!round) throw new Error("ASSIGNMENT_NOT_FOUND");
    checkPdf(data);
    const updatedAt = new Date();
    await fileRepository.upsert({ key: postPdfKey(a.id, roundId), data, contentType: "application/pdf", size: data.length, updatedBy: devId, updatedAt });
    if (round.pdf !== "own") await assignmentRepository.update(id, { name: a.name, brief: a.brief, sections: a.sections, rubric: { ...a.rubric, rounds: a.rubric.rounds.map((r) => (r.id === roundId ? { ...r, pdf: "own" as const } : r)) } });
    await auditService.log(devId, "assignment.pdf", a.name, `${round.label} · ${Math.round(data.length / 1024)} KB`);
    return { size: data.length, updatedAt };
  },
  async savePdf(devId: number, id: number, data: Buffer) {
    const a = await editable(id);
    checkPdf(data);
    const updatedAt = new Date();
    // สำเนาที่ยังใช้ไฟล์ร่วมกับรุ่นอื่น: อัปโหลดแล้วได้ไฟล์ของตัวเอง (ไม่ทับไฟล์ของรุ่นอื่น)
    let key = a.pdfKey;
    if (await assignmentRepository.pdfShared(a.pdfKey, a.id)) {
      key = `requirement:${a.slug}:c${a.cohortId}`;
      await assignmentRepository.setPdfKey(a.id, key);
    }
    await fileRepository.upsert({ key, data, contentType: "application/pdf", size: data.length, updatedBy: devId, updatedAt });
    await auditService.log(devId, "assignment.pdf", a.name, `${Math.round(data.length / 1024)} KB`);
    return { size: data.length, updatedAt };
  },

};
