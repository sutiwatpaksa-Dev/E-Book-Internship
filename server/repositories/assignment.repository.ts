import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "../db/client";
import { assignments, files, users } from "../db/schema";

type NewAssignment = typeof assignments.$inferInsert;
export type AssignmentFields = Pick<NewAssignment, "name" | "brief" | "sections" | "rubric"> & { overview?: string };

export const assignmentRepository = {
  // หลังบ้าน: ทุกโจทย์ + ไฟล์ PDF (ขนาด เวลา) + รุ่นเจ้าของ · ไม่ดึงตัวไฟล์ (bytea) มา
  // cohortIds คงรูปเป็นรายการไว้ให้หน้าหลังบ้านเดิมใช้ได้ (ตั้งแต่ 0023 มีรุ่นเดียวเสมอ)
  async list() {
    const [rows, pdfs] = await Promise.all([
      db.select().from(assignments).orderBy(asc(assignments.id)),
      db.select({ key: files.key, size: files.size, updatedAt: files.updatedAt }).from(files),
    ]);
    const pdf = new Map(pdfs.map((p) => [p.key, { size: p.size, updatedAt: p.updatedAt }]));
    return rows.map((a) => ({ ...a, pdf: pdf.get(a.pdfKey) ?? null, cohortIds: [a.cohortId] }));
  },
  // ทุกโจทย์แบบย่อ ใช้ตัดสินสิทธิ์ (server/lib/assignment-access.ts)
  refs: () => db.select({ id: assignments.id, slug: assignments.slug, cohortId: assignments.cohortId }).from(assignments).orderBy(asc(assignments.id)),
  async findInCohort(cohortId: number, slug: string) {
    const [a] = await db.select().from(assignments).where(and(eq(assignments.cohortId, cohortId), eq(assignments.slug, slug)));
    return a;
  },
  async ofCohort(cohortId: number) {
    return db.select().from(assignments).where(eq(assignments.cohortId, cohortId)).orderBy(desc(assignments.id));
  },
  async findById(id: number) {
    const [a] = await db.select().from(assignments).where(eq(assignments.id, id));
    return a;
  },
  async findManyById(ids: number[]) {
    if (ids.length === 0) return [];
    return db.select().from(assignments).where(inArray(assignments.id, ids));
  },
  async create(values: NewAssignment) {
    const [a] = await db.insert(assignments).values(values).returning({ id: assignments.id });
    return a;
  },
  // รุ่นล่าสุดที่มีโจทย์ (ใช้เป็นต้นแบบตอนสร้างรุ่นใหม่) · ไม่นับรุ่นที่ระบุ
  async latestCohortWithAssignments(exceptCohortId: number) {
    const [r] = await db.select({ cohortId: assignments.cohortId }).from(assignments).where(ne(assignments.cohortId, exceptCohortId)).orderBy(desc(assignments.cohortId)).limit(1);
    return r?.cohortId ?? null;
  },
  // คัดลอกโจทย์ทั้งชิ้น (รอบ เกณฑ์ ภาพรวม · การ์ดที่ผูกเลิกใช้แล้ว 6 พ.ย. 2569) ไปเป็นของอีกรุ่น · PDF ใช้ไฟล์เดิมร่วมกันจนกว่าจะอัปโหลดใหม่
  copyToCohort: (sourceIds: number[], cohortId: number) =>
    db.transaction(async (tx) => {
      if (sourceIds.length === 0) return 0;
      const src = await tx.select().from(assignments).where(inArray(assignments.id, sourceIds)).orderBy(asc(assignments.id));
      for (const a of src) {
        const [n] = await tx
          .insert(assignments)
          .values({ cohortId, slug: a.slug, name: a.name, brief: a.brief, pdfKey: a.pdfKey, sections: a.sections, rubric: a.rubric, overview: a.overview })
          .returning({ id: assignments.id });
        // PDF ที่แนบกับโพสต์ (key ผูกกับ id ของกล่องงาน) คัดลอกไฟล์ให้สำเนาด้วย
        for (const r of a.rubric.rounds.filter((x) => x.pdf === "own")) {
          const [f] = await tx.select().from(files).where(eq(files.key, `post:${a.id}:${r.id}`));
          if (f) await tx.insert(files).values({ ...f, key: `post:${n.id}:${r.id}` }).onConflictDoNothing();
        }
      }
      return src.length;
    }),
  // ไฟล์ PDF นี้มีโจทย์อื่นใช้อยู่ด้วยไหม (สำเนาข้ามรุ่นใช้ไฟล์ร่วมกันจนกว่าจะอัปโหลดใหม่)
  async pdfShared(key: string, exceptId: number) {
    const [r] = await db.select({ id: assignments.id }).from(assignments).where(and(eq(assignments.pdfKey, key), ne(assignments.id, exceptId))).limit(1);
    return !!r;
  },
  setPdfKey: (id: number, pdfKey: string) => db.update(assignments).set({ pdfKey }).where(eq(assignments.id, id)),
  update: (id: number, changes: AssignmentFields) => db.update(assignments).set(changes).where(eq(assignments.id, id)),

  // รุ่นของบัญชีนี้ (null = ไม่มีรุ่น)
  async cohortOf(userId: number) {
    const [r] = await db.select({ cohortId: users.cohortId }).from(users).where(eq(users.id, userId));
    return r?.cohortId ?? null;
  },
};
