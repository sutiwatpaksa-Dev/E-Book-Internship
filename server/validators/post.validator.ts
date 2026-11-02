import { z } from "zod";
import { BODY_MAX, LINKS_MAX } from "../../src/lib/submission";
import { DUE_DAY_MAX, POST_KINDS, postInputProblem, TITLE_MAX } from "../../src/lib/post";

const link = z.object({ label: z.string().trim().max(60), url: z.string().trim().max(300) });

// รูปร่างก่อน แล้วค่อยใช้กฎชุดเดียวกับฟอร์ม (postInputProblem) ตัดสินความหมาย
export const postSchema = z
  .object({
    kind: z.enum(POST_KINDS),
    assignmentId: z.number().int().positive().nullable(),
    title: z.string().trim().max(TITLE_MAX),
    body: z.string().max(BODY_MAX),
    links: z.array(link).max(LINKS_MAX),
    allCohorts: z.boolean(),
    cohortIds: z.array(z.number().int().positive()).max(50),
    dueDay: z.number().int().min(1).max(DUE_DAY_MAX).nullable(),
    dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    pinned: z.boolean(),
  })
  .superRefine((p, ctx) => {
    const problem = postInputProblem(p);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  });
export type PostSchemaInput = z.infer<typeof postSchema>;

export const pinSchema = z.object({ pinned: z.boolean() });
