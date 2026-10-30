import type { Role } from "../db/schema";
import type { RoundDef } from "../../src/lib/submission";
import { hasRound, isReviewable, roundLabel, START_ROUND, takesDeploy, VERDICT_LABEL, waitingOf } from "../../src/lib/submission";
import { assignmentRepository } from "../repositories/assignment.repository";
import { submissionRepository } from "../repositories/submission.repository";
import { userRepository } from "../repositories/user.repository";
import type { ReviewInput, SubmitInput } from "../validators/submission.validator";
import { assignmentService } from "./assignment.service";
import { auditService } from "./audit.service";
import { cohortService } from "./cohort.service";
import { notificationService } from "./notification.service";

type Viewer = { id: number; role: Role };

const INTERN_LINK = "/starter/submission#-ส่งงานของคุณ";
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
    await submissionRepository.review(id, { verdict: input.verdict, review: input.review || null, reviewedBy: devId, reviewedAt: new Date() });
    const who = (await userRepository.findById(s.userId))?.username ?? `#${s.userId}`;
    const label = roundLabel(s.round, (await assignmentRepository.findById(s.assignmentId))?.rubric.rounds ?? []);
    await auditService.log(devId, "submission.review", who, `${label} ${s.ref} · ${VERDICT_LABEL[input.verdict]}`);
    await notificationService.toUser(s.userId, { kind: "submission_review", title: `ผล${label} (${s.ref}): ${VERDICT_LABEL[input.verdict]}`, link: INTERN_LINK });
  },
};
