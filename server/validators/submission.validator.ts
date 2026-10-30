import { z } from "zod";
import { normalizeRepo, refProblem, repoProblem, ROUND_IDS, START_REF, START_ROUND, VERDICTS } from "../../src/lib/submission";

// กฎของช่องอยู่ใน src/lib/submission.ts ใช้ร่วมกับฟอร์มของน้อง · ที่นี่คือด่านจริง (ยิง API ตรงก็ต้องผ่านกฎเดียวกัน)
const check = (ctx: z.RefinementCtx, path: string, problem: string | null) => {
  if (problem) ctx.addIssue({ code: "custom", path: [path], message: problem });
};

export const submitSchema = z
  .object({
    assignment: z.string({ error: "เลือกโจทย์ที่ส่ง" }).regex(/^[a-z0-9-]{1,40}$/, { error: "เลือกโจทย์ที่ส่ง" }),
    round: z.enum(ROUND_IDS, { error: "เลือกรอบที่ส่งจากรายการ" }),
    repoUrl: z.string({ error: "ใส่ลิงก์ repo บน GitHub" }).max(300, { error: "ลิงก์ยาวเกินไป" }),
    // ลงทะเบียน repo (วันที่ 1) ไม่ต้องมี tag
    ref: z.string({ error: "ใส่ชื่อ tag หรือ commit ที่ส่ง" }).default(""),
    note: z.string().trim().max(1000, { error: "ข้อความถึงพี่เลี้ยงไม่เกิน 1,000 ตัว" }).default(""),
  })
  .superRefine((v, ctx) => {
    check(ctx, "repoUrl", repoProblem(v.repoUrl));
    if (v.round !== START_ROUND) check(ctx, "ref", refProblem(v.ref));
  })
  // เก็บลิงก์แบบเดียวกันเสมอ (ไม่มี .git, www, / ท้าย) หน้าเว็บจะได้เทียบว่า "repo เดิม" ได้ และพี่เลี้ยงกดเปิดได้ทุกแถว
  .transform((v) => ({ ...v, repoUrl: normalizeRepo(v.repoUrl)!, ref: v.round === START_ROUND ? START_REF : v.ref.trim() }));

export const reviewSchema = z
  .object({
    verdict: z.enum(VERDICTS, { error: "เลือกผลตรวจ: ผ่าน หรือ แก้แล้วส่งใหม่" }),
    review: z.string().trim().max(2000, { error: "ความเห็นไม่เกิน 2,000 ตัว" }).default(""),
  })
  // ให้แก้ต้องบอกว่าแก้อะไร ไม่งั้นน้องส่งรอบใหม่แบบเดาสุ่ม
  .superRefine((v, ctx) => check(ctx, "review", v.verdict === "revise" && !v.review ? "ถ้าให้แก้ เขียนบอกน้องด้วยว่าต้องแก้อะไร" : null));

export type SubmitInput = z.infer<typeof submitSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
