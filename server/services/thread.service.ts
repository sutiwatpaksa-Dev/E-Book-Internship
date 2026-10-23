import { QUESTION_STATUSES, REQUEST_STATUSES, type Role, type ThreadKind, type ThreadStatus } from "../db/schema";
import { threadRepository } from "../repositories/thread.repository";
import { auditService } from "./audit.service";

// กันเปิดเรื่องรัวๆ: ค้างได้ไม่เกินเท่านี้ (เรื่องที่ปิด/ทำเสร็จ/ไม่ทำ ไม่นับ)
const MAX_OPEN_PER_USER = 10;

const STATUS_LABEL: Record<ThreadStatus, string> = {
  waiting: "รอตอบ",
  answered: "ตอบแล้ว",
  closed: "ปิดเรื่อง",
  new: "เรื่องใหม่",
  accepted: "รับเรื่องแล้ว",
  in_progress: "กำลังทำ",
  done: "ทำเสร็จแล้ว",
  declined: "ไม่ทำ",
};

const allowedStatuses = (kind: ThreadKind): readonly ThreadStatus[] => (kind === "question" ? QUESTION_STATUSES : REQUEST_STATUSES);

// หาเรื่อง + ตรวจว่าเป็นของคนนี้ ไม่ใช่ของเขาตอบ "ไม่พบ" (ไม่บอกว่ามีเรื่องเลขนี้อยู่)
async function ownedThread(ownerId: number, id: number) {
  const t = await threadRepository.find(id);
  if (!t || t.createdBy !== ownerId) throw new Error("THREAD_NOT_FOUND");
  return t;
}

async function anyThread(id: number) {
  const t = await threadRepository.find(id);
  if (!t) throw new Error("THREAD_NOT_FOUND");
  return t;
}

// เปิดอ่าน = จดว่าฝั่งนี้อ่านถึงตอนนี้แล้ว ป้าย "ใหม่" จะหายไป
async function detail(id: number, side: Role) {
  await threadRepository.markRead([id], side);
  const { kind, subject, pageUrl, status, createdAt } = (await threadRepository.find(id))!;
  return { thread: { id, kind, subject, pageUrl, status, createdAt }, messages: await threadRepository.messages(id) };
}

export const threadService = {
  // ---- ฝั่งน้อง (เจ้าของเรื่อง) ----
  listMine: (userId: number) => threadRepository.listByOwner(userId),
  unreadMine: (userId: number) => threadRepository.countUnread("intern", userId),

  async create(userId: number, input: { kind: ThreadKind; subject: string; body: string; pageUrl?: string }) {
    if ((await threadRepository.countOpenByOwner(userId)) >= MAX_OPEN_PER_USER) throw new Error("TOO_MANY_OPEN_THREADS");
    const id = await threadRepository.create(
      { createdBy: userId, kind: input.kind, subject: input.subject, pageUrl: input.pageUrl ?? null, status: input.kind === "question" ? "waiting" : "new" },
      input.body,
    );
    return { id };
  },

  async getMine(userId: number, id: number) {
    await ownedThread(userId, id);
    return detail(id, "intern");
  },

  // น้องพิมพ์ต่อในคำถาม = กลับไปรอพี่เลี้ยงตอบ (แม้เคยปิดไปแล้ว) · ขอเนื้อหาสถานะไม่เปลี่ยน พี่เลี้ยงเป็นคนเลื่อน
  async replyMine(userId: number, id: number, body: string) {
    const t = await ownedThread(userId, id);
    await threadRepository.addMessages(id, userId, "intern", [{ body }], t.kind === "question" ? "waiting" : undefined);
  },

  // ---- ฝั่งพี่เลี้ยง ----
  listAll: () => threadRepository.listAll(),
  unreadForDevs: () => threadRepository.countUnread("dev"),

  async getAny(id: number) {
    await anyThread(id);
    return detail(id, "dev");
  },

  async replyAsDev(devId: number, id: number, body: string) {
    const t = await anyThread(id);
    await threadRepository.addMessages(id, devId, "dev", [{ body }], t.kind === "question" ? "answered" : undefined);
  },

  // เปลี่ยนสถานะ = บันทึกเป็นบรรทัดของระบบในแชทด้วย น้องจึงเห็นว่าเปลี่ยนเมื่อไรและได้ป้าย "ใหม่"
  async setStatus(devId: number, id: number, status: ThreadStatus, note?: string) {
    const t = await anyThread(id);
    if (!allowedStatuses(t.kind).includes(status)) throw new Error("INVALID_STATUS");
    // ไม่ทำต้องบอกเหตุผล น้องจะได้รู้ว่าทำไม ไม่ใช่เงียบหายไป
    if (status === "declined" && !note) throw new Error("NOTE_REQUIRED");
    const items = [{ body: `เปลี่ยนสถานะเป็น "${STATUS_LABEL[status]}"`, isSystem: true }, ...(note ? [{ body: note }] : [])];
    await threadRepository.addMessages(id, devId, "dev", items, status);
    await auditService.log(devId, "thread.status", `#${id} ${t.subject}`, STATUS_LABEL[status]);
  },
};
