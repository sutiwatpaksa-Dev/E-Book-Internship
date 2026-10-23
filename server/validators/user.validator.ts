import { z } from "zod";
import { ROLES } from "../db/schema";

// ตัวพิมพ์เล็ก ตัวเลข . _ - เท่านั้น รูปแบบจริงพี่เลี้ยงกำหนดเอง
const username = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,64}$/);

export const createUserSchema = z.object({ username, role: z.enum(ROLES) });

// สร้างทีละหลายคน (เช่นน้องรุ่นใหม่ทั้งรุ่น) จำกัด 50 ชื่อต่อครั้ง ออก PIN ทีละคนใช้เวลา hash
export const createManySchema = z.object({ usernames: z.array(username).min(1).max(50), role: z.enum(ROLES) });

export const updateUserSchema = z.object({
  role: z.enum(ROLES).optional(),
  disabled: z.boolean().optional(),
  unlock: z.literal(true).optional(),
});
