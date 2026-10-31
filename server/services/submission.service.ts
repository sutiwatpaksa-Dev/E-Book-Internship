import type { Role } from "../db/schema";
import type { RoundDef } from "../../src/lib/submission";
import { buildScores } from "../../src/lib/rubric";
import { hasRound, isReviewable, roundLabel, START_ROUND, takesDeploy, VERDICT_LABEL, waitingOf } from "../../src/lib/submission";
import { assignmentRepository } from "../repositories/assignment.repository";
import { submissionRepository } from "../repositories/submission.repository";
import { taskCommentRepository } from "../repositories/task-comment.repository";
import { userRepository } from "../repositories/user.repository";
import type { CommentInput, ReviewInput, SubmitInput } from "../validators/submission.validator";
import { assignmentService } from "./assignment.service";
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
    return { assignments: assignments.map(({ slug, name, rounds }) => ({ slug, name, rounds })), items, locked };
  },

  async submit(user: Viewer, input: SubmitInput) {
    if (await cohortService.endedFor(user.id)) throw new Error("COHORT_ENDED_SUBMIT");
    // ส่งได้เฉพาะโจทย์ของรุ่นตัวเอง · โจทย์ของรุ่นอื่นตอบเหมือนไม่มี
    const allowed = await assignmentService.listFor(user);
    if (!allowed.some((a) => a.slug === input.assignment)) throw new Error("ASSIGNMENT_NOT_FOUND");
    const a = (await assignmentRepository.findBySlug(input.assignment))!;
    // รอบและช่องลิงก์เว็บเป็นของโจทย์ ตั้งจากหลังบ้าน
    if (!hasRound(a.rubric.rounds, input.round)) throw new Error("ROUND_NOT_FOUND");
    if (input.deployUrl && !takesDeploy(a.rubric.rounds, input.round)) throw new Error("DEPLOY_NOT_ALLOWED");
    const s = await submissionRepository.create({ userId: user.id, assignmentId: a.id, round: input.round, repoUrl: input.repoUrl, ref: input.ref, deployUrl: input.deployUrl, note: input.note });
    const who = (await userRepository.findById(user.id))?.username ?? "น้อง";
    const title = input.round === START_ROUND ? `${who} ส่งลิงก์ repo แล้ว ตามดูโค้ดได้` : `${who} ส่งงาน ${roundLabel(input.round, a.rubric.rounds)} (${input.ref})`;
    await notificationService.toRoles(["dev"], { kind: "submission", title, link: DEV_LINK }, user.id);
    return s;
  },

  // หลังบ้าน: ทุกแถว + จำนวนที่รอตรวจ (นับแค่ครั้งล่าสุดของแต่ละรอบ)
  async listAll() {
    const items = await submissionRepository.all();
    return { items: items.map(labeled), waiting: waitingOf(items).length };
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
      const criteria = a?.rubric.criteria ?? [];
      if (criteria.length === 0) throw new Error("SCORES_NO_CRITERIA");
      scores = buildScores(criteria, input.scores);
      if (!scores) throw new Error("SCORES_INVALID");
    }
    await submissionRepository.review(id, { verdict: input.verdict, review: input.review || null, reviewedBy: devId, reviewedAt: new Date(), scores });
    const who = (await userRepository.findById(s.userId))?.username ?? `#${s.userId}`;
    const label = roundLabel(s.round, a?.rubric.rounds ?? []);
    await auditService.log(devId, "submission.review", who, `${label} ${s.ref} · ${VERDICT_LABEL[input.verdict]}${scores ? ` · ${scores.total}/${scores.max}` : ""}`);
    await notificationService.toUser(s.userId, { kind: "submission_review", title: `ผล${label} (${s.ref}): ${VERDICT_LABEL[input.verdict]}`, link: INTERN_LINK });
  },

  // ---- ความเห็นใต้งาน (เห็นเฉพาะน้องเจ้าของงานกับพี่เลี้ยง) ----
  // งาน = รอบหนึ่งของโจทย์หนึ่ง · น้องเปิดได้เฉพาะโจทย์ของรุ่นตัวเอง · ที่เหลือตอบเหมือนไม่มี
  async commentsMine(user: Viewer, assignment: string, round: string) {
    await assertOwnTask(user, assignment, round);
    return taskCommentRepository.forTask(user.id, taskKey(assignment, round));
  },
  async commentMine(user: Viewer, assignment: string, round: string, input: CommentInput) {
    await assertOwnTask(user, assignment, round);
    if (input.kind !== "review") throw new Error("COMMENT_KIND_FORBIDDEN");
    const c = await taskCommentRepository.create({ userId: user.id, task: taskKey(assignment, round), authorId: user.id, kind: "review", ref: null, body: input.body });
    const who = (await userRepository.findById(user.id))?.username ?? "น้อง";
    await notificationService.toRoles(["dev"], { kind: "submission", title: `${who} เขียนความเห็นใต้งาน ${await labelOf(assignment, round)}`, link: DEV_LINK }, user.id);
    return c;
  },
  async commentsOf(userId: number, assignment: string, round: string) {
    await assertTask(userId, assignment, round);
    return taskCommentRepository.forTask(userId, taskKey(assignment, round));
  },
  async commentTo(devId: number, userId: number, assignment: string, round: string, input: CommentInput) {
    await assertTask(userId, assignment, round);
    const c = await taskCommentRepository.create({ userId, task: taskKey(assignment, round), authorId: devId, kind: input.kind, ref: input.ref || null, body: input.body });
    await notificationService.toUser(userId, { kind: "submission_review", title: `พี่เลี้ยงเขียนความเห็นใต้งาน ${await labelOf(assignment, round)}`, link: INTERN_LINK });
    return c;
  },
};

const taskKey = (assignment: string, round: string) => `${assignment}/${round}`;
async function labelOf(assignment: string, round: string) {
  const a = await assignmentRepository.findBySlug(assignment);
  return `${a?.name ?? assignment} · ${roundLabel(round, a?.rubric.rounds ?? [])}`;
}
// งานต้องมีจริง: โจทย์มี และรอบอยู่ในโจทย์ (รอบ "start" ของลงทะเบียน repo ไม่ใช่งานให้คุยใต้)
async function assertTask(userId: number, assignment: string, round: string) {
  const a = await assignmentRepository.findBySlug(assignment);
  if (!a || !isReviewable(round) || !hasRound(a.rubric.rounds, round) || !(await userRepository.findById(userId))) throw new Error("TASK_NOT_FOUND");
}
async function assertOwnTask(user: Viewer, assignment: string, round: string) {
  const allowed = await assignmentService.listFor(user);
  if (!allowed.some((a) => a.slug === assignment)) throw new Error("TASK_NOT_FOUND");
  await assertTask(user.id, assignment, round);
}
