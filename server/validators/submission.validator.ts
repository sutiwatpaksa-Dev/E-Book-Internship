import { z } from "zod";
import { COMMENT_KINDS } from "../../src/lib/rubric";
import { REVIEW_PAGE_MAX, REVIEW_PAGE_SIZE, REVIEW_SORTS, REVIEW_STATUSES } from "../../src/lib/review-url";
import { deployProblem, LINK_MAX, normalizeDeploy, refProblem, ROUND_ID, START_REF, START_ROUND, VERDICTS } from "../../src/lib/submission";

// กฎของช่องอยู่ใน src/lib/submission.ts ใช้ร่วมกับฟอร์มของน้อง · ที่นี่คือด่านจริง (ยิง API ตรงก็ต้องผ่านกฎเดียวกัน)
const check = (ctx: z.RefinementCtx, path: string, problem: string | null) => {
  if (problem) ctx.addIssue({ code: "custom", path: [path], message: problem });
};

export const submitSchema = z
  .object({
    assignment: z.string({ error: "เลือกโจทย์ที่ส่ง" }).regex(/^[a-z0-9-]{1,40}$/, { error: "เลือกโจทย์ที่ส่ง" }),
    // รอบที่ส่งได้ขึ้นกับโจทย์ ด่านนั้นอยู่ที่ submission.service
    round: z.string({ error: "เลือกรอบที่ส่งจากรายการ" }).regex(ROUND_ID, { error: "เลือกรอบที่ส่งจากรายการ" }),
    // ลิงก์ของงาน: ชนิด repo = GitHub, link = https ทั่วไป, text = ว่าง · กฎตามชนิดตรวจที่ submission.service (ต้องรู้โจทย์ก่อน)
    repoUrl: z.string({ error: "ใส่ลิงก์งานที่ส่ง" }).max(LINK_MAX, { error: "ลิงก์ยาวเกินไป" }).default(""),
    // ไม่ต้องใส่ tag แล้ว (6 พ.ย. 2569) ว่าง = HEAD พี่เลี้ยงเปิดดูโค้ดล่าสุดตอนตรวจ · ใส่มาก็ยังรับ (ฟอร์มเก่า/API ตรง)
    ref: z.string().default(""),
    // ลิงก์เว็บที่ deploy แล้ว · รอบที่ต้องส่งลิงก์เว็บ บังคับที่ submission.service
    deployUrl: z.string().default(""),
    note: z.string().trim().max(1000, { error: "ข้อความถึงพี่เลี้ยงไม่เกิน 1,000 ตัว" }).default(""),
  })
  .superRefine((v, ctx) => {
    if (v.ref.trim()) check(ctx, "ref", refProblem(v.ref));
    check(ctx, "deployUrl", deployProblem(v.deployUrl));
  })
  // ลิงก์จัดรูปที่ submission.service ตามชนิดงาน (repo ไม่มี .git, www, / ท้าย) หน้าเว็บจะได้เทียบว่า "repo เดิม" ได้ และพี่เลี้ยงกดเปิดได้ทุกแถว
  .transform((v) => ({ ...v, ref: v.round === START_ROUND || !v.ref.trim() ? START_REF : v.ref.trim(), deployUrl: normalizeDeploy(v.deployUrl) }));

export const reviewSchema = z
  .object({
    verdict: z.enum(VERDICTS, { error: "เลือกผลตรวจ: ผ่าน หรือ แก้แล้วส่งใหม่" }),
    review: z.string().trim().max(2000, { error: "ความเห็นไม่เกิน 2,000 ตัว" }).default(""),
    // คะแนนรายข้อ (id เกณฑ์ → คะแนน) · ไม่ส่ง = ตรวจแบบไม่ให้คะแนน · ความถูกต้องเทียบกับเกณฑ์ของโจทย์ที่ submission.service
    scores: z.record(z.string().max(30), z.number({ error: "คะแนนต้องเป็นตัวเลข" })).optional(),
  })
  // ให้แก้ต้องบอกว่าแก้อะไร ไม่งั้นน้องส่งรอบใหม่แบบเดาสุ่ม
  .superRefine((v, ctx) => check(ctx, "review", v.verdict === "revise" && !v.review ? "ถ้าให้แก้ เขียนบอกน้องด้วยว่าต้องแก้อะไร" : null));

// หน้าตรวจงานแบบเจาะลง (รุ่น → งาน → คน): ตัวกรองและหน้าอยู่ใน URL จึงต้องตรวจทุกค่าเหมือนรับจากคนนอก
// ค่าผิด = 400 (ไม่ทิ้งเงียบ เพราะตัวกรองที่หายไปทำให้ผลกว้างกว่าที่ขอ) · ไม่ส่ง = ไม่กรองตามนั้น
// ค่าคงที่ (สถานะ ลำดับ ขนาดหน้า) อยู่ใน src/lib/review-url.ts ใช้ร่วมกับหน้าเว็บ
const intParam = (msg: string, max: number) =>
  z
    .string()
    .regex(/^\d{1,9}$/, { error: msg })
    .transform(Number)
    .refine((n) => n <= max, { error: msg });
export const reviewListQuerySchema = z.object({
  cohort: intParam("รุ่นไม่ถูกต้อง", 2_000_000_000).refine((n) => n > 0, { error: "รุ่นไม่ถูกต้อง" }).optional(),
  assignment: z.string().regex(/^[a-z0-9-]{1,40}$/, { error: "โจทย์ไม่ถูกต้อง" }).optional(),
  round: z.string().regex(ROUND_ID, { error: "รอบไม่ถูกต้อง" }).optional(),
  status: z.enum(REVIEW_STATUSES, { error: "สถานะไม่ถูกต้อง" }).default("waiting"),
  sort: z.enum(REVIEW_SORTS, { error: "ลำดับไม่ถูกต้อง" }).default("oldest"),
  // ค้นชื่อผู้ใช้/ชื่อเล่น · ช่องว่างหัวท้ายตัดทิ้ง
  q: z.string().trim().max(60, { error: "คำค้นยาวเกินไป" }).default(""),
  offset: intParam("หน้าไม่ถูกต้อง", 1_000_000).default(0),
  limit: intParam("จำนวนต่อหน้าไม่ถูกต้อง", REVIEW_PAGE_MAX).refine((n) => n > 0, { error: "จำนวนต่อหน้าไม่ถูกต้อง" }).default(REVIEW_PAGE_SIZE),
});
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
// สรุปราย "งาน" ของรุ่นเดียว (ชั้นที่ 2 ของหน้าเจาะลง) ใช้แค่ตัวกรองรุ่น
export const reviewSummaryQuerySchema = reviewListQuerySchema.pick({ cohort: true });

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
