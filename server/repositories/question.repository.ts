import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/client";
import { questions, users } from "../db/schema";

type NewQuestion = typeof questions.$inferInsert;

// คอลัมน์ที่น้องเห็น (ไม่บอกว่าพี่เลี้ยงคนไหนตอบ)
const mineColumns = {
  id: questions.id,
  pageUrl: questions.pageUrl,
  body: questions.body,
  answer: questions.answer,
  answeredAt: questions.answeredAt,
  createdAt: questions.createdAt,
};

const asker = alias(users, "asker");
const answerer = alias(users, "answerer");

export const questionRepository = {
  async create(row: NewQuestion) {
    const [q] = await db.insert(questions).values(row).returning(mineColumns);
    return q;
  },
  listByAsker: (askedBy: number) => db.select(mineColumns).from(questions).where(eq(questions.askedBy, askedBy)).orderBy(desc(questions.createdAt)),
  async countOpenByAsker(askedBy: number) {
    const [r] = await db.select({ n: count() }).from(questions).where(and(eq(questions.askedBy, askedBy), isNull(questions.answer)));
    return r.n;
  },
  // ข้อที่รอตอบขึ้นก่อน แล้วเรียงใหม่ไปเก่า
  listAll: () =>
    db
      .select({ ...mineColumns, askedBy: asker.username, answeredBy: answerer.username })
      .from(questions)
      .innerJoin(asker, eq(asker.id, questions.askedBy))
      .leftJoin(answerer, eq(answerer.id, questions.answeredBy))
      .orderBy(sql`${questions.answer} is not null`, desc(questions.createdAt)),
  async answer(id: number, answeredBy: number, answer: string) {
    const [q] = await db.update(questions).set({ answer, answeredBy, answeredAt: new Date() }).where(eq(questions.id, id)).returning({ id: questions.id });
    return q;
  },
};
