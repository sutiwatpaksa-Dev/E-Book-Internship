import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/client";
import { assignments, submissions, users } from "../db/schema";

type NewSubmission = typeof submissions.$inferInsert;
const reviewer = alias(users, "reviewer");

// คอลัมน์ที่หน้าเว็บใช้: แถวส่งงาน + ชื่อโจทย์ + ชื่อคนตรวจ (ไม่ส่ง id ของพี่เลี้ยงออกไป)
const row = {
  id: submissions.id,
  userId: submissions.userId,
  assignment: assignments.slug,
  assignmentName: assignments.name,
  rubric: assignments.rubric,
  round: submissions.round,
  repoUrl: submissions.repoUrl,
  ref: submissions.ref,
  deployUrl: submissions.deployUrl,
  note: submissions.note,
  createdAt: submissions.createdAt,
  verdict: submissions.verdict,
  review: submissions.review,
  reviewedAt: submissions.reviewedAt,
  reviewer: reviewer.username,
};
const base = () =>
  db
    .select({ ...row, username: users.username, nickname: users.nickname, cohortId: users.cohortId })
    .from(submissions)
    .innerJoin(assignments, eq(assignments.id, submissions.assignmentId))
    .innerJoin(users, eq(users.id, submissions.userId))
    .leftJoin(reviewer, eq(reviewer.id, submissions.reviewedBy));

export const submissionRepository = {
  // ของน้องคนเดียว ใหม่สุดก่อน
  ofUser: (userId: number) => base().where(eq(submissions.userId, userId)).orderBy(desc(submissions.createdAt), desc(submissions.id)),
  // หลังบ้าน: ทุกแถว ใหม่สุดก่อน (รุ่นหนึ่งไม่กี่สิบคน × 3 รอบ ดึงทั้งหมดแล้วกรองในหน้าเว็บได้)
  all: (limit = 500) => base().orderBy(desc(submissions.createdAt), desc(submissions.id)).limit(limit),
  // รหัสรอบที่มีคนส่งแล้วของโจทย์นี้ (ใช้กันไม่ให้ลบรอบที่มีประวัติ)
  async roundsUsed(assignmentId: number) {
    const rows = await db.selectDistinct({ round: submissions.round }).from(submissions).where(eq(submissions.assignmentId, assignmentId));
    return rows.map((r) => r.round);
  },
  async find(id: number) {
    const [s] = await db.select().from(submissions).where(eq(submissions.id, id));
    return s;
  },
  async create(values: NewSubmission) {
    const [s] = await db.insert(submissions).values(values).returning({ id: submissions.id });
    return s;
  },
  review: (id: number, changes: Pick<NewSubmission, "verdict" | "review" | "reviewedBy" | "reviewedAt">) =>
    db.update(submissions).set(changes).where(eq(submissions.id, id)),
};
