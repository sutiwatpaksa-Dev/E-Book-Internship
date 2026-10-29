import { z } from "zod";
import { facebookProblem, instagramProblem, lineProblem, phoneProblem } from "../../src/lib/contact";
import { EDU_LEVELS, SCHOOL_TYPES } from "../db/schema";

// ช่องข้อความว่าง = ไม่กรอก (เก็บเป็น null ไม่ใช่ "") · ตัดช่องว่างหัวท้ายก่อนนับความยาว
// ทุกช่องมีข้อความของตัวเอง route ส่งข้อแรกกลับไป หน้าเว็บจะได้บอกว่าช่องไหนผิด ไม่ใช่บอกกฎทุกช่องรวมกัน
const text = (max: number, label: string) =>
  z
    .string({ error: `${label}ต้องเป็นข้อความ` })
    .trim()
    .max(max, { error: `${label}ไม่เกิน ${max} ตัว` })
    .transform((v) => v || null)
    .nullable()
    .optional();

const check = (ctx: z.RefinementCtx, problem: string | null) => {
  if (problem) ctx.addIssue({ code: "custom", message: problem });
};

// ค่าที่ต้องเลือกจากรายการ ส่งค่าอื่นมา (เช่นแก้ request เอง) ต้องบอกให้เลือกจากรายการ ไม่ใช่เรื่องความยาว
const choice = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z.enum(values, { error: `เลือก${label}จากรายการ` }).nullable().optional();

export const profileSchema = z.object({
  fullName: text(100, "ชื่อ-นามสกุล"),
  nickname: text(30, "ชื่อเล่น"),
  schoolType: choice(SCHOOL_TYPES, "ประเภทสถานศึกษา"),
  schoolName: text(150, "ชื่อสถานศึกษา"),
  major: text(150, "สาขา"),
  eduLevel: choice(EDU_LEVELS, "ระดับการศึกษา"),
  // ช่องของพี่เลี้ยง (service ทิ้งให้ถ้าเป็นบัญชีน้อง)
  jobTitle: text(100, "ตำแหน่ง"),
  // กฎเดียวกับฟอร์ม (src/lib/contact.ts) · ข้อความที่ผิดส่งกลับไปให้หน้าเว็บแสดง
  phone: text(25, "เบอร์โทร").superRefine((v, ctx) => check(ctx, phoneProblem(v))),
  expertise: text(300, "ด้านที่สนใจ/ถนัด"),
  lineId: text(20, "LINE ID").superRefine((v, ctx) => check(ctx, lineProblem(v))),
  instagram: text(31, "Instagram").superRefine((v, ctx) => check(ctx, instagramProblem(v))),
  facebook: text(100, "Facebook").superRefine((v, ctx) => check(ctx, facebookProblem(v))),
});

// ช่องที่แต่ละ role กรอกได้ · น้องไม่มีช่องตำแหน่ง/เบอร์ พี่เลี้ยงไม่มีประเภทสถานศึกษา/ระดับ
// น้องกรอกช่องติดต่อได้เหมือนพี่เลี้ยง (พี่เลี้ยงทุกคนเห็นในหน้าน้องรายคน) · expertise ของน้อง = ด้านที่สนใจ/ถนัด
export const INTERN_FIELDS = ["fullName", "nickname", "schoolType", "schoolName", "major", "eduLevel", "phone", "expertise", "lineId", "instagram", "facebook"] as const;
export const MENTOR_FIELDS = ["fullName", "nickname", "jobTitle", "phone", "schoolName", "major", "expertise", "lineId", "instagram", "facebook"] as const;
export type ProfileInput = z.infer<typeof profileSchema>;
