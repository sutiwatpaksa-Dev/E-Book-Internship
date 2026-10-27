import { z } from "zod";

// /08-orm, การ์ด /learn/cards/migration หรือการ์ดพี่เลี้ยง /learn/cards/m/<slug> (ไม่เกิน 4 ชั้น)
const link = z.string().regex(/^(\/[a-z0-9-]{1,80}){1,4}$/);

export const setProgressSchema = z.object({ link, done: z.boolean() });
export const importProgressSchema = z.object({ links: z.array(link).max(100) });
