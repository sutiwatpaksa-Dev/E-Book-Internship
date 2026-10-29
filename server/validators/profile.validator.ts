import { z } from "zod";
import { facebookProblem, instagramProblem, lineProblem, phoneProblem } from "../../src/lib/contact";
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

const check = (ctx: z.RefinementCtx, problem: string | null) => {
  if (problem) ctx.addIssue({ code: "custom", message: problem });
};

export const profileSchema = z.object({
  fullName: text(100),
  nickname: text(30),
  schoolType: z.enum(SCHOOL_TYPES).nullable().optional(),
  schoolName: text(150),
  major: text(150),
  eduLevel: z.enum(EDU_LEVELS).nullable().optional(),
  // ช่องของพี่เลี้ยง (service ทิ้งให้ถ้าเป็นบัญชีน้อง)
  jobTitle: text(100),
  // กฎเดียวกับฟอร์ม (src/lib/contact.ts) · ข้อความที่ผิดส่งกลับไปให้หน้าเว็บแสดง
  phone: text(25).superRefine((v, ctx) => check(ctx, phoneProblem(v))),
  expertise: text(300),
  lineId: text(20).superRefine((v, ctx) => check(ctx, lineProblem(v))),
  instagram: text(31).superRefine((v, ctx) => check(ctx, instagramProblem(v))),
  facebook: text(100).superRefine((v, ctx) => check(ctx, facebookProblem(v))),
});

// ช่องที่แต่ละ role กรอกได้ · น้องไม่มีช่องตำแหน่ง/เบอร์ พี่เลี้ยงไม่มีประเภทสถานศึกษา/ระดับ
// น้องกรอกช่องติดต่อได้เหมือนพี่เลี้ยง (พี่เลี้ยงทุกคนเห็นในหน้าน้องรายคน) · expertise ของน้อง = ด้านที่สนใจ/ถนัด
export const INTERN_FIELDS = ["fullName", "nickname", "schoolType", "schoolName", "major", "eduLevel", "phone", "expertise", "lineId", "instagram", "facebook"] as const;
export const MENTOR_FIELDS = ["fullName", "nickname", "jobTitle", "phone", "schoolName", "major", "expertise", "lineId", "instagram", "facebook"] as const;
export type ProfileInput = z.infer<typeof profileSchema>;
