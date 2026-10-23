import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { progress } from "../db/schema";

export const progressRepository = {
  listByUser: (userId: number) =>
    db.select({ link: progress.link, doneAt: progress.doneAt }).from(progress).where(eq(progress.userId, userId)).orderBy(asc(progress.doneAt)),
  // น้องมีไม่กี่สิบคน × ~30 บท ดึงทั้งตารางครั้งเดียวแล้วจัดกลุ่มใน service ง่ายกว่าเขียน SQL รวมยอดหลายแบบ
  listAll: () => db.select().from(progress).orderBy(asc(progress.doneAt)),
  // ติ๊กซ้ำไม่ error และไม่เปลี่ยนเวลาที่ผ่านครั้งแรก
  async add(userId: number, links: string[]) {
    if (links.length === 0) return;
    await db
      .insert(progress)
      .values(links.map((link) => ({ userId, link })))
      .onConflictDoNothing();
  },
  remove: (userId: number, link: string) => db.delete(progress).where(and(eq(progress.userId, userId), eq(progress.link, link))),
};
