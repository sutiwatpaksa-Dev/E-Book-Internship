import { z } from "zod";
import { QUESTION_STATUSES, REQUEST_STATUSES, THREAD_KINDS } from "../db/schema";

const body = z.string().trim().min(1).max(2000);

export const createThreadSchema = z.object({
  kind: z.enum(THREAD_KINDS),
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
