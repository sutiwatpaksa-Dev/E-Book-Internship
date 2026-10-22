import { z } from "zod";

export const askSchema = z.object({
  // path ของหน้าในคู่มือเท่านั้น (ไม่รับ URL เว็บอื่น)
  pageUrl: z.string().max(200).regex(/^\/[a-z0-9/-]*$/),
  body: z.string().trim().min(10).max(2000),
});

export const answerSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
});
