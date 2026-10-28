import type { Role } from "../db/schema";
import { notificationRepository, type NewNotification } from "../repositories/notification.repository";
import { userRepository } from "../repositories/user.repository";

const LATEST = 30;

// ส่งแจ้งเตือนเป็นงานรอง: ถ้าพลาด งานหลัก (ตอบแชท, เผยแพร่การ์ด) ต้องสำเร็จอยู่ดี จึงจับ error ไว้แล้วจด log
async function safely(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.error("notify failed:", (e as Error).message);
  }
}

export const notificationService = {
  toUser: (userId: number, n: NewNotification) => safely(() => notificationRepository.addMany([userId], n)),
  toUsers: (ids: number[], n: NewNotification) => safely(async () => (ids.length ? notificationRepository.addMany(ids, n) : undefined)),

  // ถึงทุกคนในบทบาทนั้น ยกเว้นคนที่ทำเรื่องนี้เอง (พี่เลี้ยงที่ประกาศไม่ต้องได้แจ้งเตือนของตัวเอง)
  toRoles: (roles: Role[], n: NewNotification, exceptUserId?: number) =>
    safely(async () => {
      const ids = (await userRepository.activeIdsByRole(roles)).filter((id) => id !== exceptUserId);
      await notificationRepository.addMany(ids, n);
    }),

  async listMine(userId: number) {
    const [items, unread] = await Promise.all([notificationRepository.latest(userId, LATEST), notificationRepository.countUnread(userId)]);
    return { items, unread };
  },
  unreadMine: (userId: number) => notificationRepository.countUnread(userId),
  // ไม่ส่ง ids = อ่านทั้งหมด (กดเปิดกระดิ่ง)
  markRead: (userId: number, ids?: number[]) => notificationRepository.markRead(userId, ids),
};
