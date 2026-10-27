import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { cardOverrides } from "../db/schema";

type Override = typeof cardOverrides.$inferInsert;

export const cardOverrideRepository = {
  // มีแค่การ์ดที่ถูกปรับ (หลักสิบแถว) ดึงทั้งตารางทีเดียว หน้าเว็บเอาไปรวมกับรายการในโค้ดเอง
  listAll: () =>
    db
      .select({ slug: cardOverrides.slug, hidden: cardOverrides.hidden, title: cardOverrides.title, minutes: cardOverrides.minutes, topic: cardOverrides.topic })
      .from(cardOverrides),
  // มีแล้วแก้ ไม่มีสร้างใหม่ ในคำสั่งเดียว
  upsert: (row: Override) =>
    db
      .insert(cardOverrides)
      .values(row)
      .onConflictDoUpdate({ target: cardOverrides.slug, set: { ...row, updatedAt: new Date() } }),
  remove: (slug: string) => db.delete(cardOverrides).where(eq(cardOverrides.slug, slug)),
};
