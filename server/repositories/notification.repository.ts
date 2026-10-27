import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { notifications } from "../db/schema";

export type NewNotification = { kind: string; title: string; link?: string | null };

export const notificationRepository = {
  // คนละแถวต่อผู้รับ ใส่ทีเดียวทั้งชุด
  async addMany(userIds: number[], n: NewNotification) {
    if (userIds.length === 0) return;
    await db.insert(notifications).values(userIds.map((userId) => ({ userId, kind: n.kind, title: n.title, link: n.link ?? null })));
  },
  latest: (userId: number, limit: number) =>
    db
      .select({ id: notifications.id, kind: notifications.kind, title: notifications.title, link: notifications.link, readAt: notifications.readAt, createdAt: notifications.createdAt })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit),
  async countUnread(userId: number) {
    const [r] = await db
      .select({ n: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return r.n;
  },
  // อ่านได้แค่ของตัวเอง: เงื่อนไข userId อยู่ใน where เสมอ ส่ง id ของคนอื่นมาก็ไม่มีผล
  markRead: (userId: number, ids?: number[]) =>
    db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt), ids ? inArray(notifications.id, ids) : undefined)),
};
