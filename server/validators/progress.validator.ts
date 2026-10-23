import { z } from "zod";

const link = z.string().regex(/^\/[a-z0-9-]{1,80}$/);

export const setProgressSchema = z.object({ link, done: z.boolean() });
export const importProgressSchema = z.object({ links: z.array(link).max(100) });
