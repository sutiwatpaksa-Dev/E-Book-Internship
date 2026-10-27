import { asc, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { mentorCards, users } from "../db/schema";

type NewCard = typeof mentorCards.$inferInsert;
export type CardChanges = Partial<Omit<NewCard, "id" | "slug" | "authorId" | "createdAt">>;

// ส่วนหัวของการ์ด (ไม่มีเนื้อหา) ใช้ทำรายการในคลัง · เนื้อหายาวดึงเฉพาะตอนเปิดการ์ดทีละใบ
const summary = {
  id: mentorCards.id,
  slug: mentorCards.slug,
  title: mentorCards.title,
  step: mentorCards.step,
  topic: mentorCards.topic,
  minutes: mentorCards.minutes,
  needs: mentorCards.needs,
  status: mentorCards.status,
  author: users.username,
  publishedAt: mentorCards.publishedAt,
  updatedAt: mentorCards.updatedAt,
};

export const mentorCardRepository = {
  listAll: () => db.select(summary).from(mentorCards).innerJoin(users, eq(users.id, mentorCards.authorId)).orderBy(desc(mentorCards.updatedAt)),
  listPublished: () =>
    db
      .select(summary)
      .from(mentorCards)
      .innerJoin(users, eq(users.id, mentorCards.authorId))
      .where(eq(mentorCards.status, "published"))
      .orderBy(asc(mentorCards.publishedAt)),
  async findBySlug(slug: string) {
    const [c] = await db
      .select({ ...summary, body: mentorCards.body })
      .from(mentorCards)
      .innerJoin(users, eq(users.id, mentorCards.authorId))
      .where(eq(mentorCards.slug, slug));
    return c;
  },
  async findById(id: number) {
    const [c] = await db.select().from(mentorCards).where(eq(mentorCards.id, id));
    return c;
  },
  // slug ซ้ำคืน undefined ให้ service ตอบ 409 (unique constraint ใน DB เป็นด่านจริง ไม่ต้องเช็กก่อนแล้วเสี่ยงชนกันพอดี)
  async create(values: NewCard) {
    const [c] = await db.insert(mentorCards).values(values).onConflictDoNothing().returning({ id: mentorCards.id });
    return c;
  },
  async update(id: number, changes: CardChanges) {
    const [c] = await db
      .update(mentorCards)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(mentorCards.id, id))
      .returning({ id: mentorCards.id });
    return c;
  },
  remove: (id: number) => db.delete(mentorCards).where(eq(mentorCards.id, id)),
};
