import { QUESTION_STATUSES, REQUEST_STATUSES, type Role, type ThreadKind, type ThreadStatus } from "../db/schema";
import { threadRepository } from "../repositories/thread.repository";
import { userRepository } from "../repositories/user.repository";
import { auditService } from "./audit.service";
import { cohortRepository } from "../repositories/cohort.repository";
import type { SendMessageInput } from "../validators/thread.validator";
import { cohortService } from "./cohort.service";
import { notificationService } from "./notification.service";

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

// ขอเนื้อหามีสถานะของตัวเอง ที่เหลือ (คำถาม, ข้อความจากพี่เลี้ยง) ใช้สถานะแบบคำถาม: รอตอบ ↔ ตอบแล้ว
const isRequest = (kind: ThreadKind) => kind === "content_request";
const allowedStatuses = (kind: ThreadKind): readonly ThreadStatus[] => (isRequest(kind) ? REQUEST_STATUSES : QUESTION_STATUSES);

// กดแจ้งเตือนแล้วเปิดเรื่องนั้นเลย: พี่เลี้ยงเปิดในหลังบ้าน น้องเปิดในหน้าคุยกับพี่เลี้ยง
const devLink = (id: number) => `/dev/admin?tab=questions&t=${id}`;
const internLink = (id: number) => `/questions?t=${id}`;
const nameOf = async (userId: number) => (await userRepository.findById(userId))?.username ?? "น้อง";

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
    // รุ่นจบแล้ว: อ่านคู่มือต่อได้ แต่ไม่เปิดเรื่องใหม่ (พี่เลี้ยงรุ่นนั้นไม่ได้ดูหลังบ้านทุกวันแล้ว) · ตอบเรื่องเดิมยังได้
    if (await cohortService.endedFor(userId)) throw new Error("COHORT_ENDED");
    if ((await threadRepository.countOpenByOwner(userId)) >= MAX_OPEN_PER_USER) throw new Error("TOO_MANY_OPEN_THREADS");
    const id = await threadRepository.create(
      { createdBy: userId, kind: input.kind, subject: input.subject, pageUrl: input.pageUrl ?? null, status: input.kind === "question" ? "waiting" : "new" },
      input.body,
    );
    const what = input.kind === "question" ? "ถามใหม่" : "ขอเนื้อหา";
    await notificationService.toRoles(["dev"], { kind: `new_${input.kind}`, title: `${await nameOf(userId)} ${what}: ${input.subject}`, link: devLink(id) });
    return { id };
  },

  async getMine(userId: number, id: number) {
    await ownedThread(userId, id);
    return detail(id, "intern");
  },

  // น้องพิมพ์ต่อในคำถาม = กลับไปรอพี่เลี้ยงตอบ (แม้เคยปิดไปแล้ว) · ขอเนื้อหาสถานะไม่เปลี่ยน พี่เลี้ยงเป็นคนเลื่อน
  async replyMine(userId: number, id: number, body: string) {
    const t = await ownedThread(userId, id);
    await threadRepository.addMessages(id, userId, "intern", [{ body }], isRequest(t.kind) ? undefined : "waiting");
    await notificationService.toRoles(["dev"], { kind: "intern_reply", title: `${await nameOf(userId)} ตอบกลับ: ${t.subject}`, link: devLink(id) });
  },

  // ---- ฝั่งพี่เลี้ยง ----
  // ส่งข้อความหาน้อง: รายชื่อหรือทั้งรุ่น · ข้ามบัญชีที่ปิดอยู่ · ได้เรื่องคนละเรื่อง (น้องตอบกลับแล้วเห็นแค่ของตัวเอง)
  async sendToInterns(devId: number, input: SendMessageInput) {
    if (input.cohortId) {
      const c = await cohortRepository.findById(input.cohortId);
      if (!c) throw new Error("COHORT_NOT_FOUND");
    }
    const to = await userRepository.activeInterns({ ids: input.userIds, cohortId: input.cohortId });
    if (to.length === 0) throw new Error("NO_RECIPIENTS");
    const created = await threadRepository.createFromMentor(devId, to.map((u) => u.id), input.subject, input.body);
    await Promise.all(created.map((c) => notificationService.toUser(c.userId, { kind: "mentor_message", title: `พี่เลี้ยงส่งข้อความ: ${input.subject}`, link: internLink(c.threadId) })));
    await auditService.log(devId, "thread.send", input.subject, input.cohortId ? `ทั้งรุ่น ${to.length} คน` : `${to.length} คน: ${to.map((u) => u.username).slice(0, 5).join(", ")}${to.length > 5 ? " …" : ""}`);
    return { count: to.length };
  },

  listAll: () => threadRepository.listAll(),
  unreadForDevs: () => threadRepository.countUnread("dev"),

  async getAny(id: number) {
    await anyThread(id);
    return detail(id, "dev");
  },

  async replyAsDev(devId: number, id: number, body: string) {
    const t = await anyThread(id);
    await threadRepository.addMessages(id, devId, "dev", [{ body }], isRequest(t.kind) ? undefined : "answered");
    await notificationService.toUser(t.createdBy, { kind: "dev_reply", title: `พี่เลี้ยงตอบแล้ว: ${t.subject}`, link: internLink(id) });
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
    await notificationService.toUser(t.createdBy, { kind: "status", title: `"${t.subject}" เปลี่ยนเป็น ${STATUS_LABEL[status]}`, link: internLink(id) });
  },
};
