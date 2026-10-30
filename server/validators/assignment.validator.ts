import { z } from "zod";
import { roundsProblem } from "../../src/lib/submission";

// key ใช้ในลิงก์ของคู่มือ (?sec=api) จึงเป็นตัวพิมพ์เล็กล้วน
const section = z.object({
  key: z.string().regex(/^[a-z0-9-]{1,40}$/),
  label: z.string().trim().min(1).max(80),
  page: z.number().int().min(1).max(500),
});

const round = z.object({
  id: z.string().max(30),
  label: z.string().trim().min(1).max(40),
  day: z.number().int().min(1).max(60),
  what: z.string().trim().max(60),
  deploy: z.boolean(),
});

export const assignmentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  brief: z.string().trim().max(500),
  // รอบส่งงานของโจทย์นี้ (กฎเดียวกับฟอร์มหลังบ้าน)
  rounds: z.array(round).superRefine((r, ctx) => {
    const problem = roundsProblem(r);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  }),
  sections: z.array(section).max(40).refine((s) => new Set(s.map((x) => x.key)).size === s.length, "key ซ้ำ"),
});

// slug อยู่ใน URL ของ PDF และเปลี่ยนไม่ได้หลังสร้าง (ลิงก์ที่ส่งไปแล้วต้องไม่พัง)
export const newAssignmentSchema = assignmentSchema.extend({ slug: z.string().regex(/^[a-z0-9-]{2,40}$/) });

export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const cohortAssignmentsSchema = z.object({ assignmentIds: z.array(z.number().int().positive()).max(20) });
