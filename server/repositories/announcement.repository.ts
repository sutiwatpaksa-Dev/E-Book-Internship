import { and, desc, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "../db/client";
import { announcements, users, type Audience } from "../db/schema";

type NewAnnouncement = typeof announcements.$inferInsert;

const columns = {
  id: announcements.id,
  body: announcements.body,
  audience: announcements.audience,
  startsAt: announcements.startsAt,
  endsAt: announcements.endsAt,
  author: users.username,
  createdAt: announcements.createdAt,
};

export const announcementRepository = {
  // หลังบ้านเห็นทั้งหมด รวมที่หมดเวลาแล้ว (ไว้ย้อนดูว่าเคยประกาศอะไร)
  listAll: () => db.select(columns).from(announcements).innerJoin(users, eq(users.id, announcements.authorId)).orderBy(desc(announcements.createdAt)).limit(100),
  // ที่กำลังแสดงอยู่ตอนนี้สำหรับกลุ่มนี้: เริ่มแล้ว และยังไม่จบ (หรือไม่มีวันจบ)
  listActive: (audiences: Audience[], now: Date) =>
    db
      .select(columns)
      .from(announcements)
      .innerJoin(users, eq(users.id, announcements.authorId))
      .where(
        and(
          inArray(announcements.audience, audiences),
          lte(announcements.startsAt, now),
          or(isNull(announcements.endsAt), gt(announcements.endsAt, now)),
        ),
      )
      .orderBy(desc(announcements.startsAt)),
  async findById(id: number) {
    const [a] = await db.select().from(announcements).where(eq(announcements.id, id));
    return a;
  },
  async create(values: NewAnnouncement) {
    const [a] = await db.insert(announcements).values(values).returning({ id: announcements.id });
    return a;
  },
  end: (id: number, at: Date) => db.update(announcements).set({ endsAt: at }).where(eq(announcements.id, id)),
};
