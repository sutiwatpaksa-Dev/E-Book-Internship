import { and, asc, count, desc, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "../db/client";
import { assignments, cohortAssignments, files, users } from "../db/schema";

type NewAssignment = typeof assignments.$inferInsert;
export type AssignmentFields = Pick<NewAssignment, "name" | "brief" | "sections" | "rubric">;

export const assignmentRepository = {
  // หลังบ้าน: ทุกโจทย์ + ไฟล์ PDF (ขนาด เวลา) + รุ่นที่ใช้ · ไม่ดึงตัวไฟล์ (bytea) มา
  async list() {
    const [rows, pdfs, links] = await Promise.all([
      db.select().from(assignments).orderBy(asc(assignments.id)),
      db.select({ key: files.key, size: files.size, updatedAt: files.updatedAt }).from(files),
      db.select().from(cohortAssignments),
    ]);
    const pdf = new Map(pdfs.map((p) => [p.key, { size: p.size, updatedAt: p.updatedAt }]));
    return rows.map((a) => ({ ...a, pdf: pdf.get(a.pdfKey) ?? null, cohortIds: links.filter((l) => l.assignmentId === a.id).map((l) => l.cohortId) }));
  },
  slugs: async () => (await db.select({ slug: assignments.slug }).from(assignments).orderBy(asc(assignments.id))).map((r) => r.slug),
  async findBySlug(slug: string) {
    const [a] = await db.select().from(assignments).where(eq(assignments.slug, slug));
    return a;
  },
  async findById(id: number) {
    const [a] = await db.select().from(assignments).where(eq(assignments.id, id));
    return a;
  },
  async findManyBySlug(slugs: string[]) {
    if (slugs.length === 0) return [];
    return db.select().from(assignments).where(inArray(assignments.slug, slugs));
  },
  async create(values: NewAssignment) {
    const [a] = await db.insert(assignments).values(values).returning({ id: assignments.id });
    return a;
  },
  update: (id: number, changes: AssignmentFields) => db.update(assignments).set(changes).where(eq(assignments.id, id)),

  // รุ่นของบัญชีนี้ (null = ไม่มีรุ่น)
  async cohortOf(userId: number) {
    const [r] = await db.select({ cohortId: users.cohortId }).from(users).where(eq(users.id, userId));
    return r?.cohortId ?? null;
  },
  // โจทย์ของรุ่น ใหม่สุดก่อน (โจทย์ที่เพิ่มทีหลังมักเป็นงานที่น้องกำลังทำ)
  slugsOfCohort: async (cohortId: number) =>
    (
      await db
        .select({ slug: assignments.slug })
        .from(cohortAssignments)
        .innerJoin(assignments, eq(assignments.id, cohortAssignments.assignmentId))
        .where(eq(cohortAssignments.cohortId, cohortId))
        .orderBy(desc(cohortAssignments.addedAt), desc(assignments.id))
    ).map((r) => r.slug),
  idsOfCohort: async (cohortId: number) =>
    (await db.select({ id: cohortAssignments.assignmentId }).from(cohortAssignments).where(eq(cohortAssignments.cohortId, cohortId))).map((r) => r.id),
  async usageCount(assignmentId: number) {
    const [r] = await db.select({ n: count() }).from(cohortAssignments).where(eq(cohortAssignments.assignmentId, assignmentId));
    return r?.n ?? 0;
  },
  // แทนชุดโจทย์ของรุ่น: ชิ้นที่มีอยู่แล้วเก็บวันที่เพิ่มเดิมไว้ (ลำดับใหม่สุดก่อนจึงไม่สลับ) · ทำใน transaction เดียว
  setForCohort: (cohortId: number, assignmentIds: number[]) =>
    db.transaction(async (tx) => {
      const keep = assignmentIds.length ? notInArray(cohortAssignments.assignmentId, assignmentIds) : undefined;
      await tx.delete(cohortAssignments).where(and(eq(cohortAssignments.cohortId, cohortId), keep));
      if (assignmentIds.length) await tx.insert(cohortAssignments).values(assignmentIds.map((assignmentId) => ({ cohortId, assignmentId }))).onConflictDoNothing();
    }),
};
