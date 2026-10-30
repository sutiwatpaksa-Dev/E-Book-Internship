import type { AssignmentSection, Role } from "../db/schema";
import { pickAssignment, visibleAssignments } from "../lib/assignment-access";
import { assignmentRepository } from "../repositories/assignment.repository";
import { cohortRepository } from "../repositories/cohort.repository";
import { fileRepository } from "../repositories/file.repository";
import { submissionRepository } from "../repositories/submission.repository";
import type { AssignmentInput } from "../validators/assignment.validator";
import { auditService } from "./audit.service";
import { checkPdf } from "./file.service";

type Viewer = { id: number; role: Role };

// โจทย์ที่บัญชีนี้มีสิทธิ์ดู (ชื่อ slug ตามลำดับ) · น้องเห็นของรุ่นตัวเอง พี่เลี้ยงเห็นทั้งหมด
async function visibleSlugs(user: Viewer) {
  const all = await assignmentRepository.slugs();
  const cohortId = user.role === "intern" ? await assignmentRepository.cohortOf(user.id) : null;
  const cohortSlugs = cohortId === null ? null : await assignmentRepository.slugsOfCohort(cohortId);
  return { all, cohortSlugs };
}

// เรียงรอบตามวัน (วันเท่ากันคงลำดับที่กรอก)
const byDay = <T extends { day: number }>(rounds: T[]) => [...rounds].sort((a, b) => a.day - b.day);

// หน้าโจทย์ของ section key (เช่น "api") · ไม่มีในโจทย์นี้ = หน้า 1
export const pageOf = (sections: AssignmentSection[], key: string) => sections.find((s) => s.key === key)?.page ?? 1;

export const assignmentService = {
  // แผงโจทย์ในหน้าเว็บ: ชิ้นแรก = ชิ้นที่ควรเปิดก่อน (ใหม่สุดของรุ่น)
  async listFor(user: Viewer) {
    const { all, cohortSlugs } = await visibleSlugs(user);
    const order = visibleAssignments(user.role, cohortSlugs, all);
    const first = pickAssignment(user.role, cohortSlugs, all);
    const sorted = first ? [first, ...order.filter((s) => s !== first)] : order;
    const rows = await assignmentRepository.findManyBySlug(sorted);
    return sorted.flatMap((slug) => {
      const a = rows.find((r) => r.slug === slug);
      return a ? [{ slug: a.slug, name: a.name, brief: a.brief, sections: a.sections, rounds: a.rubric.rounds }] : [];
    });
  },

  // PDF ของโจทย์ที่ขอ (หรือชิ้นหลักของรุ่น) · ไม่มีสิทธิ์และไม่มีจริงตอบเหมือนกัน
  async pdfFor(user: Viewer, requested?: string) {
    const { all, cohortSlugs } = await visibleSlugs(user);
    const slug = pickAssignment(user.role, cohortSlugs, all, requested);
    if (!slug) throw new Error(requested ? "ASSIGNMENT_NOT_FOUND" : "NO_ASSIGNMENT");
    const a = (await assignmentRepository.findBySlug(slug))!;
    return { assignment: a, file: await fileRepository.find(a.pdfKey) };
  },

  // หลังบ้าน: รอบส่งออกเป็น rounds (ไม่ส่งโครง rubric ทั้งก้อน เฟสต่อไปจะเพิ่มเกณฑ์ที่นี่)
  async list() {
    return (await assignmentRepository.list()).map(({ rubric, ...a }) => ({ ...a, rounds: rubric.rounds }));
  },

  async create(devId: number, slug: string, { rounds, ...f }: AssignmentInput) {
    if (await assignmentRepository.findBySlug(slug)) throw new Error("ASSIGNMENT_SLUG_TAKEN");
    const a = await assignmentRepository.create({ ...f, rubric: { rounds: byDay(rounds) }, slug, pdfKey: `requirement:${slug}` });
    await auditService.log(devId, "assignment.create", f.name, slug);
    return a;
  },
  async update(devId: number, id: number, { rounds, ...f }: AssignmentInput) {
    const a = await assignmentRepository.findById(id);
    if (!a) throw new Error("ASSIGNMENT_NOT_FOUND");
    // รอบที่มีคนส่งแล้วลบไม่ได้ (ประวัติต้องยังบอกชื่อรอบได้) · แก้ชื่อ วัน คำอธิบายได้เสมอ
    const used = await submissionRepository.roundsUsed(id);
    if (used.some((r) => r !== "start" && !rounds.some((x) => x.id === r))) throw new Error("ROUND_IN_USE");
    await assignmentRepository.update(id, { ...f, rubric: { ...a.rubric, rounds: byDay(rounds) } });
    await auditService.log(devId, "assignment.update", f.name, a.slug);
  },
  async savePdf(devId: number, id: number, data: Buffer) {
    const a = await assignmentRepository.findById(id);
    if (!a) throw new Error("ASSIGNMENT_NOT_FOUND");
    checkPdf(data);
    const updatedAt = new Date();
    await fileRepository.upsert({ key: a.pdfKey, data, contentType: "application/pdf", size: data.length, updatedBy: devId, updatedAt });
    await auditService.log(devId, "assignment.pdf", a.name, `${Math.round(data.length / 1024)} KB`);
    return { size: data.length, updatedAt };
  },

  // โจทย์ของรุ่น: เพิ่มหรือเอาออกได้จนกว่าจะจบรุ่น (จบแล้วต้องเปิดรุ่นกลับก่อน กันแก้ประวัติของรุ่นที่ปิดไปแล้ว)
  async setForCohort(devId: number, cohortId: number, ids: number[]) {
    const c = await cohortRepository.findById(cohortId);
    if (!c) throw new Error("COHORT_NOT_FOUND");
    if (c.endedAt) throw new Error("COHORT_LOCKED");
    const unique = [...new Set(ids)];
    const known = new Set((await assignmentRepository.list()).map((a) => a.id));
    if (unique.some((id) => !known.has(id))) throw new Error("ASSIGNMENT_NOT_FOUND");
    const before = new Set(await assignmentRepository.idsOfCohort(cohortId));
    await assignmentRepository.setForCohort(cohortId, unique);
    const added = unique.filter((id) => !before.has(id)).length;
    const removed = [...before].filter((id) => !unique.includes(id)).length;
    await auditService.log(devId, "cohort.assignments", c.name, `เพิ่ม ${added} · เอาออก ${removed} · รวม ${unique.length}`);
  },
};
