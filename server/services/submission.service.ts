import type { Role } from "../db/schema";
import { isReviewable, roundLabel, START_ROUND, VERDICT_LABEL, waitingOf } from "../../src/lib/submission";
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
const mine = async (userId: number) => (await submissionRepository.ofUser(userId)).map(({ username, nickname, cohortId, userId: _, ...s }) => s);

export const submissionService = {
  // หน้าส่งงานของน้อง: โจทย์ที่ส่งได้ + ประวัติการส่ง + รุ่นจบแล้วหรือยัง (จบแล้วส่งไม่ได้ แต่ดูประวัติได้)
  async listMine(user: Viewer) {
    const [assignments, items, locked] = await Promise.all([assignmentService.listFor(user), mine(user.id), cohortService.endedFor(user.id)]);
    return { assignments: assignments.map(({ slug, name }) => ({ slug, name })), items, locked };
  },

  async submit(user: Viewer, input: SubmitInput) {
    if (await cohortService.endedFor(user.id)) throw new Error("COHORT_ENDED_SUBMIT");
    // ส่งได้เฉพาะโจทย์ของรุ่นตัวเอง · โจทย์ของรุ่นอื่นตอบเหมือนไม่มี
    const allowed = await assignmentService.listFor(user);
    if (!allowed.some((a) => a.slug === input.assignment)) throw new Error("ASSIGNMENT_NOT_FOUND");
    const a = (await assignmentRepository.findBySlug(input.assignment))!;
    const s = await submissionRepository.create({ userId: user.id, assignmentId: a.id, round: input.round, repoUrl: input.repoUrl, ref: input.ref, note: input.note });
    const who = (await userRepository.findById(user.id))?.username ?? "น้อง";
    const title = input.round === START_ROUND ? `${who} ส่งลิงก์ repo แล้ว ตามดูโค้ดได้` : `${who} ส่งงาน ${roundLabel(input.round)} (${input.ref})`;
    await notificationService.toRoles(["dev"], { kind: "submission", title, link: DEV_LINK }, user.id);
    return s;
  },

  // หลังบ้าน: ทุกแถว + จำนวนที่รอตรวจ (นับแค่ครั้งล่าสุดของแต่ละรอบ)
  async listAll() {
    const items = await submissionRepository.all();
    return { items, waiting: waitingOf(items).length };
  },
  ofUser: (userId: number) => submissionRepository.ofUser(userId),

  async review(devId: number, id: number, input: ReviewInput) {
    const s = await submissionRepository.find(id);
    if (!s) throw new Error("SUBMISSION_NOT_FOUND");
    if (!isReviewable(s.round)) throw new Error("SUBMISSION_NOT_REVIEWABLE");
    await submissionRepository.review(id, { verdict: input.verdict, review: input.review || null, reviewedBy: devId, reviewedAt: new Date() });
    const who = (await userRepository.findById(s.userId))?.username ?? `#${s.userId}`;
    await auditService.log(devId, "submission.review", who, `${roundLabel(s.round)} ${s.ref} · ${VERDICT_LABEL[input.verdict]}`);
    await notificationService.toUser(s.userId, { kind: "submission_review", title: `ผล${roundLabel(s.round)} (${s.ref}): ${VERDICT_LABEL[input.verdict]}`, link: INTERN_LINK });
  },
};
