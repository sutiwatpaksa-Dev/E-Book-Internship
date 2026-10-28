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
  // ช่องของพี่เลี้ยง (service ทิ้งให้ถ้าเป็นบัญชีน้อง)
  jobTitle: text(100),
  // เบอร์: ตัวเลข ขีด ช่องว่าง วงเล็บ และ + นำหน้า (เช่น 081-234-5678, +66 81 234 5678)
  phone: text(20).refine((v) => !v || /^\+?[\d\s()-]{9,20}$/.test(v), "เบอร์โทรใส่ได้แค่ตัวเลข ขีด และ +"),
  expertise: text(300),
  lineId: text(50),
  instagram: text(50),
  facebook: text(100),
});

// ช่องที่แต่ละ role กรอกได้ · น้องไม่มีช่องตำแหน่ง/เบอร์ พี่เลี้ยงไม่มีประเภทสถานศึกษา/ระดับ
export const INTERN_FIELDS = ["fullName", "nickname", "schoolType", "schoolName", "major", "eduLevel"] as const;
export const MENTOR_FIELDS = ["fullName", "nickname", "jobTitle", "phone", "schoolName", "major", "expertise", "lineId", "instagram", "facebook"] as const;
export type ProfileInput = z.infer<typeof profileSchema>;
