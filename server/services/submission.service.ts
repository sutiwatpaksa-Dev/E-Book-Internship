import type { Role } from "../db/schema";
import type { RoundDef } from "../../src/lib/submission";
import { buildScores } from "../../src/lib/rubric";
import { criteriaOf, hasRepo, hasRound, normalizeSubmit, repoChanged, submitProblem, isReviewable, roundLabel, START_REF, START_ROUND, takesDeploy, VERDICT_LABEL, waitingOf } from "../../src/lib/submission";
import { assignmentRepository } from "../repositories/assignment.repository";
import { submissionRepository } from "../repositories/submission.repository";
import { taskCommentRepository } from "../repositories/task-comment.repository";
import { userRepository } from "../repositories/user.repository";
import type { CommentInput, ReviewInput, ReviewListQuery, SubmitInput } from "../validators/submission.validator";
import { assignmentFor, assignmentService } from "./assignment.service";
import { auditService } from "./audit.service";
import { cohortService } from "./cohort.service";
import { notificationService } from "./notification.service";

type Viewer = { id: number; role: Role };

const INTERN_LINK = "/starter/submission#ส่งงานของคุณ";
const DEV_LINK = "/dev/admin?tab=submissions";

// น้องเห็นแค่แถวของตัวเอง: ทุกคำขอใช้ id จากบัตรผ่าน ไม่รับ userId จาก body
// ไม่ส่ง username/nickname ของตัวเองซ้ำกลับไป (หน้าเว็บของน้องไม่ต้องใช้)
// ทุกแถวมี roundLabel (ชื่อรอบตามโจทย์ของแถวนั้น) หน้าเว็บจึงไม่ต้องถือรายการรอบเอง · ไม่ส่งโครง rubric ออกไป
const labeled = <T extends { round: string; rubric: { rounds: RoundDef[] } }>({ rubric, ...s }: T) => ({ ...s, roundLabel: roundLabel(s.round, rubric.rounds) });
const mine = async (userId: number) => (await submissionRepository.ofUser(userId)).map(({ username, nickname, cohortId, userId: _, ...s }) => labeled(s));

export const submissionService = {
  // หน้าส่งงานของน้อง: โจทย์ที่ส่งได้ + ประวัติการส่ง + รุ่นจบแล้วหรือยัง (จบแล้วส่งไม่ได้ แต่ดูประวัติได้)
  async listMine(user: Viewer) {
    const [assignments, items, locked] = await Promise.all([assignmentService.listFor(user), mine(user.id), cohortService.endedFor(user.id)]);
    return { assignments: assignments.map(({ slug, name, rounds, submitKind }) => ({ slug, name, rounds, submitKind })), items, locked };
  },

  async submit(user: Viewer, input: SubmitInput) {
    if (await cohortService.endedFor(user.id)) throw new Error("COHORT_ENDED_SUBMIT");
    // ส่งได้เฉพาะโจทย์ของรุ่นตัวเอง · โจทย์ของรุ่นอื่นตอบเหมือนไม่มี
    const a = await assignmentFor(user, input.assignment);
    if (!a) throw new Error("ASSIGNMENT_NOT_FOUND");
    // รอบและช่องลิงก์เว็บเป็นของโจทย์ ตั้งจากหลังบ้าน
    if (!hasRound(a.rubric.rounds, input.round)) throw new Error("ROUND_NOT_FOUND");
    // ช่องส่งขึ้นกับชนิดงาน: repo = GitHub · link = https ทั่วไป · text = ข้อความ (ไม่มีลิงก์)
    // รอบ "ลงทะเบียน repo" และ branch/tag ใช้ได้เฉพาะงานแบบ repo
    const kind = a.submitKind;
    if (input.round === START_ROUND && !hasRepo(kind)) throw new Error("ROUND_NOT_FOUND");
    const problem = submitProblem(kind, input.repoUrl, input.note);
    if (problem) throw Object.assign(new Error("SUBMIT_INVALID"), { detail: problem });
    const repoUrl = normalizeSubmit(kind, input.repoUrl);
    const ref = hasRepo(kind) ? input.ref : START_REF;
    if (input.deployUrl && !takesDeploy(a.rubric.rounds, input.round)) throw new Error("DEPLOY_NOT_ALLOWED");
    // รอบที่ติ๊ก "ต้องส่งลิงก์เว็บ" ไว้ ส่งไม่ได้ถ้าไม่มีลิงก์
    if (!input.deployUrl && takesDeploy(a.rubric.rounds, input.round)) throw new Error("DEPLOY_REQUIRED");
    const s = await submissionRepository.create({ userId: user.id, assignmentId: a.id, round: input.round, repoUrl, ref, deployUrl: input.deployUrl, note: input.note });
    const who = (await userRepository.findById(user.id))?.username ?? "น้อง";
    const title = input.round === START_ROUND ? `${who} ส่งลิงก์ repo แล้ว ตามดูโค้ดได้` : `${who} ส่งงาน ${roundLabel(input.round, a.rubric.rounds)}${ref === START_REF ? "" : ` (${ref})`}`;
    await notificationService.toMentorsOf(user.id, { kind: "submission", title, link: DEV_LINK });
    return s;
  },

  // หลังบ้าน: ทุกแถว + จำนวนที่รอตรวจ (นับแค่ครั้งล่าสุดของแต่ละรอบ)
  async listAll() {
    const items = await submissionRepository.all();
    return { items: items.map(labeled), waiting: waitingOf(items).length };
  },
  // หน้าตรวจงานชั้น "คน": ครั้งล่าสุดของแต่ละรอบ กรอง/เรียง/แบ่งหน้าที่ server · total = จำนวนตามแท็บที่เลือก (ไว้คำนวณหน้า)
  async reviewPage(q: ReviewListQuery) {
    const { items, waiting, reviewed } = await submissionRepository.reviewPage(q);
    const total = q.status === "waiting" ? waiting : q.status === "reviewed" ? reviewed : waiting + reviewed;
    return { items: items.map(({ prevRepoUrl, ...s }) => ({ ...labeled(s), prevRepoUrl: hasRepo(s.submitKind) && repoChanged(prevRepoUrl, s.repoUrl) ? prevRepoUrl : null })), total, waiting, reviewed, offset: q.offset, limit: q.limit };
  },

  // ป้ายเมนู "งานรอตรวจ": จำนวนแยกตามรุ่น (รุ่นที่ไม่มีงานรอตรวจไม่อยู่ในรายการ) หน้าเว็บรวมเฉพาะรุ่นที่อยู่ในตัวกรอง
  async waitingByCohort() {
    return { items: (await submissionRepository.waitingByCohort()).filter((r) => r.waiting > 0) };
  },

  // หน้าตรวจงานชั้น "งาน": ทุกโพสต์ (โจทย์ × รอบ) ของรุ่นนี้ แม้ยังไม่มีใครส่ง (ขึ้น 0) · รอบ "ลงทะเบียน repo" ไม่ใช่โพสต์ที่ตรวจ
  async reviewSummary(cohort: number) {
    const [assignments, counted, interns] = await Promise.all([assignmentRepository.ofCohort(cohort), submissionRepository.summaryByPost(cohort), submissionRepository.internCount(cohort)]);
    const count = new Map(counted.map((c) => [`${c.assignment}/${c.round}`, c]));
    const posts = assignments
      .filter((a) => !a.archivedAt)
      .flatMap((a) =>
        a.rubric.rounds.map((r) => {
          const c = count.get(`${a.slug}/${r.id}`);
          return { assignment: a.slug, assignmentName: a.name, round: r.id, roundLabel: r.label, day: r.day, waiting: c?.waiting ?? 0, reviewed: c?.reviewed ?? 0 };
        }),
      )
      // รอตรวจเยอะสุดขึ้นก่อน ที่เท่ากันเรียงตามวันส่ง
      .sort((x, y) => y.waiting - x.waiting || x.day - y.day);
    return { interns, posts };
  },
  ofUser: async (userId: number) => (await submissionRepository.ofUser(userId)).map(labeled),

  async review(devId: number, id: number, input: ReviewInput) {
    const s = await submissionRepository.find(id);
    if (!s) throw new Error("SUBMISSION_NOT_FOUND");
    if (!isReviewable(s.round)) throw new Error("SUBMISSION_NOT_REVIEWABLE");
    const a = await assignmentRepository.findById(s.assignmentId);
    // คะแนน: เทียบกับเกณฑ์ของโจทย์ ณ ตอนนี้ แล้วเก็บสำเนา (แก้เกณฑ์ทีหลังคะแนนที่ตรวจไปแล้วไม่เปลี่ยน)
    let scores = null;
    if (input.scores) {
      const criteria = criteriaOf(a?.rubric.rounds.find((r) => r.id === s.round), a?.rubric.criteria ?? []);
      if (criteria.length === 0) throw new Error("SCORES_NO_CRITERIA");
      scores = buildScores(criteria, input.scores);
      if (!scores) throw new Error("SCORES_INVALID");
    }
    await submissionRepository.review(id, { verdict: input.verdict, review: input.review || null, reviewedBy: devId, reviewedAt: new Date(), scores });
    const who = (await userRepository.findById(s.userId))?.username ?? `#${s.userId}`;
    const label = roundLabel(s.round, a?.rubric.rounds ?? []);
    await auditService.log(devId, "submission.review", who, `${label}${s.ref === START_REF ? "" : ` ${s.ref}`} · ${VERDICT_LABEL[input.verdict]}${scores ? ` · ${scores.total}/${scores.max}` : ""}`);
    await notificationService.toUser(s.userId, { kind: "submission_review", title: `ผล${label}: ${VERDICT_LABEL[input.verdict]}`, link: a ? `/work/${a.slug}/${s.round}` : INTERN_LINK });
  },

  // ---- ความเห็นใต้งาน (เห็นเฉพาะน้องเจ้าของงานกับพี่เลี้ยง) ----
  // งาน = รอบหนึ่งของโจทย์หนึ่ง · น้องเปิดได้เฉพาะโจทย์ของรุ่นตัวเอง · ที่เหลือตอบเหมือนไม่มี
  async commentsMine(user: Viewer, assignment: string, round: string) {
    await assertTask(user.id, assignment, round);
    return taskCommentRepository.forTask(user.id, taskKey(assignment, round));
  },
  async commentMine(user: Viewer, assignment: string, round: string, input: CommentInput) {
    await assertTask(user.id, assignment, round);
    if (input.kind !== "review") throw new Error("COMMENT_KIND_FORBIDDEN");
    const c = await taskCommentRepository.create({ userId: user.id, task: taskKey(assignment, round), authorId: user.id, kind: "review", ref: null, body: input.body });
    const who = (await userRepository.findById(user.id))?.username ?? "น้อง";
    await notificationService.toMentorsOf(user.id, { kind: "submission", title: `${who} เขียนความเห็นใต้งาน ${await labelOf(user.id, assignment, round)}`, link: DEV_LINK });
    return c;
  },
  async commentsOf(userId: number, assignment: string, round: string) {
    await assertTask(userId, assignment, round);
    return taskCommentRepository.forTask(userId, taskKey(assignment, round));
  },
  async commentTo(devId: number, userId: number, assignment: string, round: string, input: CommentInput) {
    await assertTask(userId, assignment, round);
    const c = await taskCommentRepository.create({ userId, task: taskKey(assignment, round), authorId: devId, kind: input.kind, ref: input.ref || null, body: input.body });
    await notificationService.toUser(userId, { kind: "submission_review", title: `พี่เลี้ยงเขียนความเห็นใต้งาน ${await labelOf(userId, assignment, round)}`, link: INTERN_LINK });
    return c;
  },
};

const taskKey = (assignment: string, round: string) => `${assignment}/${round}`;
// งานของน้องคนหนึ่ง: slug หาในรุ่นของน้องคนนั้น (slug ซ้ำข้ามรุ่นได้ตั้งแต่ 0023) ไม่ใช่ของคนที่เปิดดู
const internsAssignment = (userId: number, slug: string) => assignmentFor({ id: userId, role: "intern" }, slug);
async function labelOf(userId: number, assignment: string, round: string) {
  const a = await internsAssignment(userId, assignment);
  return `${a?.name ?? assignment} · ${roundLabel(round, a?.rubric.rounds ?? [])}`;
}
// งานต้องมีจริง: น้องมีจริง โจทย์อยู่ในรุ่นของน้อง และรอบอยู่ในโจทย์ (รอบ "start" ของลงทะเบียน repo ไม่ใช่งานให้คุยใต้)
async function assertTask(userId: number, assignment: string, round: string) {
  const u = await userRepository.findById(userId);
  const a = u ? await internsAssignment(userId, assignment) : undefined;
  if (!a || !isReviewable(round) || !hasRound(a.rubric.rounds, round)) throw new Error("TASK_NOT_FOUND");
}
