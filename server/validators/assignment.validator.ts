import { z } from "zod";
import { COMMENT_KINDS, criteriaProblem, templatesProblem } from "../../src/lib/rubric";
import { BODY_MAX, LINKS_MAX, linksProblem, roundsProblem } from "../../src/lib/submission";

// key ใช้ในลิงก์ของคู่มือ (?sec=api) จึงเป็นตัวพิมพ์เล็กล้วน
const section = z.object({
  key: z.string().regex(/^[a-z0-9-]{1,40}$/),
  label: z.string().trim().min(1).max(80),
  page: z.number().int().min(1).max(500),
});

const link = z.object({ label: z.string().trim().min(1).max(60), url: z.string().trim().max(300) });
// ช่อง body/links ฯลฯ ต้องประกาศไว้ ไม่งั้น zod ตัดทิ้งตอนบันทึกโจทย์ทั้งก้อน แล้วโพสต์งานหาย
const round = z.object({
  id: z.string().max(30),
  label: z.string().trim().min(1).max(40),
  day: z.number().int().min(1).max(60),
  what: z.string().trim().max(60),
  deploy: z.boolean(),
  body: z.string().max(BODY_MAX).optional(),
  links: z.array(link).max(LINKS_MAX).optional(),
  postedBy: z.string().max(60).optional(),
  postedAt: z.string().max(40).optional(),
  editedAt: z.string().max(40).optional(),
});

const criterion = z.object({ id: z.string().max(30), label: z.string().trim().min(1).max(80), max: z.number().int().min(1).max(100) });
const template = z.object({ id: z.string().max(30), kind: z.enum(COMMENT_KINDS), title: z.string().trim().min(1).max(60), body: z.string().trim().min(1).max(1000) });

export const assignmentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  brief: z.string().trim().max(500),
  // รอบส่งงานของโจทย์นี้ (กฎเดียวกับฟอร์มหลังบ้าน)
  rounds: z.array(round).superRefine((r, ctx) => {
    const problem = roundsProblem(r);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  }),
  // เกณฑ์ให้คะแนนและ template ความเห็น: ไม่ส่ง = ไม่แตะของเดิม (ฟอร์มโจทย์เดิมยังใช้ได้)
  criteria: z
    .array(criterion)
    .superRefine((c, ctx) => {
      const problem = criteriaProblem(c);
      if (problem) ctx.addIssue({ code: "custom", message: problem });
    })
    .optional(),
  templates: z
    .array(template)
    .superRefine((t, ctx) => {
      const problem = templatesProblem(t);
      if (problem) ctx.addIssue({ code: "custom", message: problem });
    })
    .optional(),
  sections: z.array(section).max(40).refine((s) => new Set(s.map((x) => x.key)).size === s.length, "key ซ้ำ"),
});

// slug อยู่ใน URL ของ PDF และเปลี่ยนไม่ได้หลังสร้าง (ลิงก์ที่ส่งไปแล้วต้องไม่พัง)
export const newAssignmentSchema = assignmentSchema.extend({ slug: z.string().regex(/^[a-z0-9-]{2,40}$/) });

export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const cohortAssignmentsSchema = z.object({ assignmentIds: z.array(z.number().int().positive()).max(20) });

// โพสต์งาน 1 ชิ้น = 1 รอบของโจทย์ · id/ผู้โพสต์/เวลา server เป็นคนตั้ง
export const postSchema = z
  .object({
    label: z.string({ error: "ใส่ชื่องาน" }).trim().min(1, { error: "ใส่ชื่องาน" }).max(40, { error: "ชื่องานไม่เกิน 40 ตัวอักษร" }),
    what: z.string().trim().max(60, { error: "สรุปสั้นไม่เกิน 60 ตัวอักษร" }).default(""),
    day: z.number({ error: "เลือกกำหนดส่ง" }).int().min(1, { error: "เลือกกำหนดส่ง" }).max(60, { error: "กำหนดส่งต้องไม่เกินวันที่ 60 ของรุ่น" }),
    deploy: z.boolean().default(false),
    body: z.string().max(BODY_MAX, { error: `คำสั่งงานไม่เกิน ${BODY_MAX} ตัวอักษร` }).default(""),
    links: z
      .array(link)
      .default([])
      .superRefine((l, ctx) => {
        const problem = linksProblem(l);
        if (problem) ctx.addIssue({ code: "custom", message: problem });
      }),
  });
export type PostInput = z.infer<typeof postSchema>;
