import { z } from "zod";
import { USERNAME_PATTERN } from "../../src/lib/username";
import { EDU_LEVELS, SCHOOL_TYPES } from "../db/schema";

export const inviteCodeSchema = z.object({ code: z.string().trim().min(1).max(20) });

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional();

// สมัครเอง: ชื่อจริงและการศึกษาบังคับกรอก (พี่เลี้ยงต้องรู้ว่าใครสมัครเข้ามา) · ชื่อเล่นกับสาขาไม่บังคับ
// กติการหัสผ่านตรวจใน service (passwordProblem) จะได้บอกเหตุผลเป็นข้อๆ เหมือนตอนตั้งรหัส
export const registerSchema = z.object({
  code: z.string().trim().min(1).max(20),
  username: z.string().trim().toLowerCase().regex(USERNAME_PATTERN),
  password: z.string().min(1).max(128),
  fullName: z.string().trim().min(2).max(100),
  nickname: optional(30),
  schoolType: z.enum(SCHOOL_TYPES),
  schoolName: z.string().trim().min(2).max(150),
  major: optional(150),
  eduLevel: z.enum(EDU_LEVELS),
});
export type RegisterInput = z.infer<typeof registerSchema>;
