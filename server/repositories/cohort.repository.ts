import { and, asc, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../db/client";
import { cohortMentors, cohorts, users } from "../db/schema";

type NewCohort = typeof cohorts.$inferInsert;
export type CohortFields = Pick<NewCohort, "name" | "startsOn" | "endsOn">;
export type SignupFields = Pick<NewCohort, "signupOpen" | "signupUntil" | "seatLimit">;

export const cohortRepository = {
  // รุ่นใหม่สุดขึ้นก่อน + จำนวนน้องในรุ่น + id พี่เลี้ยงประจำรุ่น (3 query เล็ก แทน join ที่ซ้ำแถว)
  async list() {
    const [rows, counts, mentors] = await Promise.all([
      db.select().from(cohorts).orderBy(desc(cohorts.startsOn), desc(cohorts.id)),
      db
        .select({ cohortId: users.cohortId, n: count() })
        .from(users)
        .where(and(isNotNull(users.cohortId), eq(users.role, "intern")))
        .groupBy(users.cohortId),
      db.select().from(cohortMentors).orderBy(asc(cohortMentors.userId)),
    ]);
    const n = new Map(counts.map((c) => [c.cohortId, c.n]));
    // ไม่ส่ง hash ของรหัสรุ่นออกไป บอกแค่ว่ามีรหัสแล้วหรือยัง
    return rows.map(({ inviteHash, ...r }) => ({
      ...r,
      hasInvite: !!inviteHash,
      internCount: n.get(r.id) ?? 0,
      mentorIds: mentors.filter((m) => m.cohortId === r.id).map((m) => m.userId),
    }));
  },
  async findById(id: number) {
    const [c] = await db.select().from(cohorts).where(eq(cohorts.id, id));
    return c;
  },
  async create(values: CohortFields) {
    const [c] = await db.insert(cohorts).values(values).returning({ id: cohorts.id });
    return c;
  },
  async findByInviteHash(hash: string) {
    const [c] = await db.select().from(cohorts).where(eq(cohorts.inviteHash, hash));
    return c;
  },
  // พี่เลี้ยงประจำรุ่นที่ยังเปิดบัญชีอยู่ พร้อมข้อมูลติดต่อ · เรียกจากโปรไฟล์ของน้องในรุ่นนั้นเท่านั้น (น้องรุ่นอื่นไม่เห็นเบอร์)
  mentorsOf: (cohortId: number) =>
    db
      .select({
        username: users.username,
        fullName: users.fullName,
        nickname: users.nickname,
        jobTitle: users.jobTitle,
        phone: users.phone,
        schoolName: users.schoolName,
        major: users.major,
        expertise: users.expertise,
        lineId: users.lineId,
        instagram: users.instagram,
        facebook: users.facebook,
      })
      .from(cohortMentors)
      .innerJoin(users, eq(users.id, cohortMentors.userId))
      .where(and(eq(cohortMentors.cohortId, cohortId), eq(users.disabled, false)))
      .orderBy(asc(users.username)),
  mentorIdsOf: async (cohortId: number) =>
    (
      await db
        .select({ id: users.id })
        .from(cohortMentors)
        .innerJoin(users, eq(users.id, cohortMentors.userId))
        .where(and(eq(cohortMentors.cohortId, cohortId), eq(users.disabled, false)))
    ).map((r) => r.id),
  async internCount(cohortId: number) {
    const [r] = await db
      .select({ n: count() })
      .from(users)
      .where(and(eq(users.cohortId, cohortId), eq(users.role, "intern")));
    return r?.n ?? 0;
  },
  update: (id: number, changes: Partial<CohortFields & SignupFields> & { endedAt?: Date | null; inviteHash?: string | null }) => db.update(cohorts).set(changes).where(eq(cohorts.id, id)),
  // แทนที่รายชื่อพี่เลี้ยงทั้งชุดใน transaction เดียว (ลบครึ่งทางแล้วล้ม = รุ่นไม่มีพี่เลี้ยง)
  setMentors: (cohortId: number, userIds: number[]) =>
    db.transaction(async (tx) => {
      await tx.delete(cohortMentors).where(eq(cohortMentors.cohortId, cohortId));
      if (userIds.length) await tx.insert(cohortMentors).values(userIds.map((userId) => ({ cohortId, userId })));
    }),
  // ย้ายน้องเข้ารุ่น (cohortId = null คือเอาออกจากรุ่น) · แตะเฉพาะบัญชีน้อง พี่เลี้ยงไม่มีรุ่น
  assign: (userIds: number[], cohortId: number | null) =>
    db
      .update(users)
      .set({ cohortId })
      .where(and(inArray(users.id, userIds), eq(users.role, "intern")))
      .returning({ username: users.username }),
  // รุ่นของบัญชีนี้จบแล้วไหม (ไม่มีรุ่น = ไม่จบ)
  async endedFor(userId: number) {
    const [r] = await db.select({ endedAt: cohorts.endedAt }).from(users).innerJoin(cohorts, eq(cohorts.id, users.cohortId)).where(eq(users.id, userId));
    return !!r?.endedAt;
  },
};
