import { z } from "zod";
import { USERNAME_PATTERN } from "../../src/lib/username";
import { ROLES } from "../db/schema";

// กติกาเดียวกับที่หน้าเว็บใช้ตรวจก่อนส่ง (src/lib/username.ts) · server ยังตรวจซ้ำเสมอ เพราะใครก็ยิง API ตรงได้
const username = z.string().trim().toLowerCase().regex(USERNAME_PATTERN);

// รุ่น (ไม่บังคับ) ใช้กับบัญชีน้องเท่านั้น · พี่เลี้ยงไม่มีรุ่น service จึงไม่ใส่ให้
const cohortId = z.number().int().positive().nullable().optional();

export const createUserSchema = z.object({ username, role: z.enum(ROLES), cohortId });

// สร้างทีละหลายคน (เช่นน้องรุ่นใหม่ทั้งรุ่น) จำกัด 50 ชื่อต่อครั้ง ออก PIN ทีละคนใช้เวลา hash
export const createManySchema = z.object({ usernames: z.array(username).min(1).max(50), role: z.enum(ROLES), cohortId });

// ช่องที่ไม่รู้จัก (เช่น superAdmin) ถูกตัดทิ้ง ถ้าเหลือว่างต้องตอบ 400 ไม่งั้น DB ได้คำสั่ง update เปล่าแล้วพังเป็น 500
export const updateUserSchema = z
  .object({
    role: z.enum(ROLES).optional(),
    disabled: z.boolean().optional(),
    unlock: z.literal(true).optional(),
  })
  .refine((v) => v.role !== undefined || v.disabled !== undefined || v.unlock !== undefined);
