import { z } from "zod";
import { COMMENT_KINDS } from "../../src/lib/rubric";
import { deployProblem, normalizeDeploy, normalizeRepo, refProblem, repoProblem, ROUND_ID, START_REF, START_ROUND, VERDICTS } from "../../src/lib/submission";

// กฎของช่องอยู่ใน src/lib/submission.ts ใช้ร่วมกับฟอร์มของน้อง · ที่นี่คือด่านจริง (ยิง API ตรงก็ต้องผ่านกฎเดียวกัน)
const check = (ctx: z.RefinementCtx, path: string, problem: string | null) => {
  if (problem) ctx.addIssue({ code: "custom", path: [path], message: problem });
};

export const submitSchema = z
  .object({
    assignment: z.string({ error: "เลือกโจทย์ที่ส่ง" }).regex(/^[a-z0-9-]{1,40}$/, { error: "เลือกโจทย์ที่ส่ง" }),
    // รอบที่ส่งได้ขึ้นกับโจทย์ ด่านนั้นอยู่ที่ submission.service
    round: z.string({ error: "เลือกรอบที่ส่งจากรายการ" }).regex(ROUND_ID, { error: "เลือกรอบที่ส่งจากรายการ" }),
    repoUrl: z.string({ error: "ใส่ลิงก์ repo บน GitHub" }).max(300, { error: "ลิงก์ยาวเกินไป" }),
    // ลงทะเบียน repo (วันที่ 1) ไม่ต้องมี tag
    ref: z.string({ error: "ใส่ชื่อ tag หรือ commit ที่ส่ง" }).default(""),
    // ลิงก์เว็บที่ deploy แล้ว ไม่บังคับ
    deployUrl: z.string().default(""),
    note: z.string().trim().max(1000, { error: "ข้อความถึงพี่เลี้ยงไม่เกิน 1,000 ตัว" }).default(""),
  })
  .superRefine((v, ctx) => {
    check(ctx, "repoUrl", repoProblem(v.repoUrl));
    if (v.round !== START_ROUND) check(ctx, "ref", refProblem(v.ref));
    check(ctx, "deployUrl", deployProblem(v.deployUrl));
  })
  // เก็บลิงก์แบบเดียวกันเสมอ (ไม่มี .git, www, / ท้าย) หน้าเว็บจะได้เทียบว่า "repo เดิม" ได้ และพี่เลี้ยงกดเปิดได้ทุกแถว
  .transform((v) => ({ ...v, repoUrl: normalizeRepo(v.repoUrl)!, ref: v.round === START_ROUND ? START_REF : v.ref.trim(), deployUrl: normalizeDeploy(v.deployUrl) }));

export const reviewSchema = z
  .object({
    verdict: z.enum(VERDICTS, { error: "เลือกผลตรวจ: ผ่าน หรือ แก้แล้วส่งใหม่" }),
    review: z.string().trim().max(2000, { error: "ความเห็นไม่เกิน 2,000 ตัว" }).default(""),
    // คะแนนรายข้อ (id เกณฑ์ → คะแนน) · ไม่ส่ง = ตรวจแบบไม่ให้คะแนน · ความถูกต้องเทียบกับเกณฑ์ของโจทย์ที่ submission.service
    scores: z.record(z.string().max(30), z.number({ error: "คะแนนต้องเป็นตัวเลข" })).optional(),
  })
  // ให้แก้ต้องบอกว่าแก้อะไร ไม่งั้นน้องส่งรอบใหม่แบบเดาสุ่ม
  .superRefine((v, ctx) => check(ctx, "review", v.verdict === "revise" && !v.review ? "ถ้าให้แก้ เขียนบอกน้องด้วยว่าต้องแก้อะไร" : null));

export type SubmitInput = z.infer<typeof submitSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;

// ความเห็นใต้งาน: น้องเขียนได้เฉพาะ "ความเห็นงาน" · พี่เลี้ยงเลือกประเภทได้ (commit, แนะนำการ์ด, เนื้อหาเพิ่มเติม)
export const commentSchema = z.object({
  kind: z.enum(COMMENT_KINDS, { error: "เลือกประเภทความเห็น" }).default("review"),
  ref: z
    .string()
    .trim()
    .max(100)
    .default("")
    .refine((v) => !v || refProblem(v) === null, "ชื่อ tag หรือ commit ไม่ถูกต้อง"),
  body: z.string({ error: "เขียนความเห็นก่อนส่ง" }).trim().min(1, { error: "เขียนความเห็นก่อนส่ง" }).max(2000, { error: "ความเห็นไม่เกิน 2,000 ตัว" }),
});
export type CommentInput = z.infer<typeof commentSchema>;
