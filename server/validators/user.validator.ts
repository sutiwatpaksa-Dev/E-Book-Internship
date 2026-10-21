import { z } from "zod";
import { ROLES } from "../db/schema";

export const createUserSchema = z.object({
  // ตัวพิมพ์เล็ก ตัวเลข . _ - เท่านั้น รูปแบบจริงพี่เลี้ยงกำหนดเอง
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,64}$/),
  role: z.enum(ROLES),
});

export const updateUserSchema = z.object({
  role: z.enum(ROLES).optional(),
  disabled: z.boolean().optional(),
  unlock: z.literal(true).optional(),
});
