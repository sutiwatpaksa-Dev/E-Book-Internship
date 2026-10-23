import { z } from "zod";
import { USERNAME_PATTERN } from "../../src/lib/username";
import { ROLES } from "../db/schema";

// กติกาเดียวกับที่หน้าเว็บใช้ตรวจก่อนส่ง (src/lib/username.ts) · server ยังตรวจซ้ำเสมอ เพราะใครก็ยิง API ตรงได้
const username = z.string().trim().toLowerCase().regex(USERNAME_PATTERN);

export const createUserSchema = z.object({ username, role: z.enum(ROLES) });

// สร้างทีละหลายคน (เช่นน้องรุ่นใหม่ทั้งรุ่น) จำกัด 50 ชื่อต่อครั้ง ออก PIN ทีละคนใช้เวลา hash
export const createManySchema = z.object({ usernames: z.array(username).min(1).max(50), role: z.enum(ROLES) });

export const updateUserSchema = z.object({
  role: z.enum(ROLES).optional(),
  disabled: z.boolean().optional(),
  unlock: z.literal(true).optional(),
});
