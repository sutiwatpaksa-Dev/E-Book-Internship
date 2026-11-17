import { and, asc, desc, eq, gt, ilike, isNotNull, isNull, ne, notExists, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/client";
import { assignments, submissions, users } from "../db/schema";
import { START_ROUND } from "../../src/lib/submission";
import type { ReviewListQuery } from "../validators/submission.validator";

type NewSubmission = typeof submissions.$inferInsert;
const reviewer = alias(users, "reviewer");

// คอลัมน์ที่หน้าเว็บใช้: แถวส่งงาน + ชื่อโจทย์ + ชื่อคนตรวจ (ไม่ส่ง id ของพี่เลี้ยงออกไป)
const row = {
  id: submissions.id,
  userId: submissions.userId,
  assignment: assignments.slug,
  assignmentName: assignments.name,
  submitKind: assignments.submitKind,
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
  scores: submissions.scores,
  reviewer: reviewer.username,
};
const base = <E extends Record<string, SQL | SQL.Aliased>>(extra?: E) =>
  db
    .select({ ...row, username: users.username, nickname: users.nickname, cohortId: users.cohortId, ...(extra ?? ({} as E)) })
    .from(submissions)
    .innerJoin(assignments, eq(assignments.id, submissions.assignmentId))
    .innerJoin(users, eq(users.id, submissions.userId))
    .leftJoin(reviewer, eq(reviewer.id, submissions.reviewedBy));

// ---- หน้าตรวจงานแบบเจาะลง: กรอง/นับ/แบ่งหน้าใน SQL (ไม่ดึงทุกชิ้นทุกรุ่นมากรองในเบราว์เซอร์) ----
// "ครั้งล่าสุด" ของแต่ละ (คน, โจทย์, รอบ) = ไม่มีแถวใหม่กว่าในกลุ่มเดียวกัน · ส่งซ้ำก่อนตรวจ = ตรวจแค่ครั้งล่าสุด (กฎเดียวกับ latestOnly ฝั่งเว็บ)
// เวลาเท่ากันเป๊ะ ตัดสินด้วย id ที่มากกว่า (เหมือน orderBy desc createdAt, desc id ของ all())
const newer = alias(submissions, "newer");
const isLatest = notExists(
  db
    .select({ one: sql`1` })
    .from(newer)
    .where(
      and(
        eq(newer.userId, submissions.userId),
        eq(newer.assignmentId, submissions.assignmentId),
        eq(newer.round, submissions.round),
        or(gt(newer.createdAt, submissions.createdAt), and(eq(newer.createdAt, submissions.createdAt), gt(newer.id, submissions.id))),
      ),
    ),
);
// repo ของการส่งครั้งก่อนหน้าของคนเดียวกันในโจทย์เดียวกัน (ทุกรอบ รวมรอบลงทะเบียน) · ไว้ติดป้าย "เปลี่ยน repo จากครั้งก่อน"
// ลำดับ "ก่อนหน้า" ใช้กฎเดียวกับ isLatest (เวลา แล้วตามด้วย id)
const prevRepoUrl = sql<string | null>`(
  select p.repo_url from submissions p
  where p.user_id = ${submissions.userId} and p.assignment_id = ${submissions.assignmentId}
    and (p.created_at < ${submissions.createdAt} or (p.created_at = ${submissions.createdAt} and p.id < ${submissions.id}))
  order by p.created_at desc, p.id desc limit 1
)`;
// % และ _ ในคำค้นต้องเป็นตัวอักษรธรรมดา ไม่งั้นพิมพ์ "%" แล้วได้ทุกคน
const likeOf = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;
const reviewable = (f: Pick<ReviewListQuery, "cohort" | "assignment" | "round" | "q">) =>
  and(
    ne(submissions.round, START_ROUND),
    isLatest,
    f.cohort !== undefined ? eq(users.cohortId, f.cohort) : undefined,
    f.assignment ? eq(assignments.slug, f.assignment) : undefined,
    f.round ? eq(submissions.round, f.round) : undefined,
    f.q ? or(ilike(users.username, likeOf(f.q)), ilike(users.nickname, likeOf(f.q))) : undefined,
  );
const waitingCount = sql<number>`count(*) filter (where ${submissions.reviewedAt} is null)`.mapWith(Number);
const reviewedCount = sql<number>`count(*) filter (where ${submissions.reviewedAt} is not null)`.mapWith(Number);
const counts = () =>
  db
    .select({ waiting: waitingCount, reviewed: reviewedCount })
    .from(submissions)
    .innerJoin(assignments, eq(assignments.id, submissions.assignmentId))
    .innerJoin(users, eq(users.id, submissions.userId));

export const submissionRepository = {
  // ชั้น 3 (คน): ครั้งล่าสุดของแต่ละรอบ ตามตัวกรอง + แบ่งหน้า · counts ไม่ขึ้นกับ status (ไว้ทำแท็บ "รอตรวจ n / ตรวจแล้ว n")
  async reviewPage(f: ReviewListQuery) {
    const where = and(
      reviewable(f),
      f.status === "waiting" ? isNull(submissions.reviewedAt) : f.status === "reviewed" ? isNotNull(submissions.reviewedAt) : undefined,
    );
    // รอตรวจเรียงเก่าสุดก่อน (คนรอนานสุดอยู่บน) · ที่เหลือใหม่สุดก่อน · id ปิดท้ายให้ลำดับนิ่ง ไม่สลับแถวข้ามหน้า
    const order =
      f.sort === "name" ? [asc(users.username), desc(submissions.createdAt), desc(submissions.id)] : f.sort === "newest" ? [desc(submissions.createdAt), desc(submissions.id)] : [asc(submissions.createdAt), asc(submissions.id)];
    const [items, [c]] = await Promise.all([
      base({ prevRepoUrl }).where(where).orderBy(...order).limit(f.limit).offset(f.offset),
      counts().where(reviewable(f)),
    ]);
    return { items, waiting: c?.waiting ?? 0, reviewed: c?.reviewed ?? 0 };
  },
  // ชั้น 2 (งาน): ต่อโพสต์ (โจทย์ + รอบ) ของรุ่นเดียว นับคนที่ส่งแล้วรอตรวจ/ตรวจแล้ว
  summaryByPost: (cohort: number) =>
    db
      .select({ assignment: assignments.slug, assignmentName: assignments.name, rubric: assignments.rubric, round: submissions.round, waiting: waitingCount, reviewed: reviewedCount })
      .from(submissions)
      .innerJoin(assignments, eq(assignments.id, submissions.assignmentId))
      .innerJoin(users, eq(users.id, submissions.userId))
      .where(reviewable({ cohort, q: "" }))
      .groupBy(assignments.id, submissions.round),
  // จำนวนงานรอตรวจแยกตามรุ่น (ป้ายเมนู) · นับที่ SQL ด้วยกฎ "ครั้งล่าสุดของแต่ละรอบ" เดียวกับหน้าตรวจ ไม่ดึงแถวมานับเอง (ของเดิมตัดที่ 500 แถว)
  waitingByCohort: () =>
    db
      .select({ cohortId: users.cohortId, waiting: waitingCount })
      .from(submissions)
      .innerJoin(assignments, eq(assignments.id, submissions.assignmentId))
      .innerJoin(users, eq(users.id, submissions.userId))
      .where(and(reviewable({ q: "" }), isNull(submissions.reviewedAt)))
      .groupBy(users.cohortId),
  // น้องที่ยังฝึกอยู่ในรุ่น (ตัวหารของ "ส่งแล้ว x จาก y คน")
  async internCount(cohort: number) {
    const [r] = await db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(users)
      .where(and(eq(users.cohortId, cohort), eq(users.role, "intern"), eq(users.disabled, false)));
    return r?.n ?? 0;
  },
  // ของน้องคนเดียว ใหม่สุดก่อน
  ofUser: (userId: number) => base().where(eq(submissions.userId, userId)).orderBy(desc(submissions.createdAt), desc(submissions.id)),
  // หลังบ้าน: ทุกแถว ใหม่สุดก่อน (รุ่นหนึ่งไม่กี่สิบคน × 3 รอบ ดึงทั้งหมดแล้วกรองในหน้าเว็บได้)
  all: (limit = 500) => base().orderBy(desc(submissions.createdAt), desc(submissions.id)).limit(limit),
  // รหัสรอบที่มีคนส่งแล้วของโจทย์นี้ (ใช้กันไม่ให้ลบรอบที่มีประวัติ)
  // มีงานที่ตรวจแล้วในกล่องงานนี้ไหม (ตรวจแล้ว = ล็อก % คะแนนของโพสต์)
  async anyReviewed(assignmentId: number) {
    const [r] = await db.select({ id: submissions.id }).from(submissions).where(and(eq(submissions.assignmentId, assignmentId), isNotNull(submissions.reviewedAt))).limit(1);
    return !!r;
  },
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
  review: (id: number, changes: Pick<NewSubmission, "verdict" | "review" | "reviewedBy" | "reviewedAt" | "scores">) =>
    db.update(submissions).set(changes).where(eq(submissions.id, id)),
};
