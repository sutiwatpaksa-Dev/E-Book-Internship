import { z } from "zod";

// /08-orm หรือการ์ดของโครงใหม่ /learn/cards/migration (ไม่เกิน 3 ชั้น)
const link = z.string().regex(/^(\/[a-z0-9-]{1,80}){1,3}$/);

export const setProgressSchema = z.object({ link, done: z.boolean() });
export const importProgressSchema = z.object({ links: z.array(link).max(100) });
