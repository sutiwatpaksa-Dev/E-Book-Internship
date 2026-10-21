import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(64),
  pin: z.string().regex(/^\d{6}$/),
});
