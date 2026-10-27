import { z } from "zod";
import { EDU_LEVELS, SCHOOL_TYPES } from "../db/schema";

// ช่องข้อความว่าง = ไม่กรอก (เก็บเป็น null ไม่ใช่ "") · ตัดช่องว่างหัวท้ายก่อนนับความยาว
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional();

export const profileSchema = z.object({
  fullName: text(100),
  nickname: text(30),
  schoolType: z.enum(SCHOOL_TYPES).nullable().optional(),
  schoolName: text(150),
  major: text(150),
  eduLevel: z.enum(EDU_LEVELS).nullable().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;
