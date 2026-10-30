import { z } from "zod";
import { INTERN_THREAD_KINDS, QUESTION_STATUSES, REQUEST_STATUSES } from "../db/schema";

const body = z.string().trim().min(1).max(2000);

export const createThreadSchema = z.object({
  kind: z.enum(INTERN_THREAD_KINDS),
  subject: z.string().trim().min(3).max(120),
  body: body.min(10),
  // path ของหน้าในคู่มือเท่านั้น (ไม่รับ URL เว็บอื่น)
  pageUrl: z.string().max(200).regex(/^\/[a-z0-9/-]*$/).optional(),
});

export const messageSchema = z.object({ body });

export const statusSchema = z.object({
  status: z.enum([...QUESTION_STATUSES, ...REQUEST_STATUSES]),
  note: z.string().trim().max(2000).optional(),
});

// พี่เลี้ยงส่งข้อความหาน้อง: เลือกคนเป็นรายชื่อ หรือทั้งรุ่น (อย่างใดอย่างหนึ่ง) · ส่งครั้งเดียวไม่เกิน 100 คน
export const sendMessageSchema = z
  .object({
    userIds: z.array(z.number().int().positive()).min(1).max(100).optional(),
    cohortId: z.number().int().positive().optional(),
    subject: z.string().trim().min(3).max(120),
    body: body.min(5),
  })
  .refine((v) => (v.userIds ? 1 : 0) + (v.cohortId ? 1 : 0) === 1, { message: "เลือกผู้รับ" });
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
