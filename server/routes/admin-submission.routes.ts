import { Hono } from "hono";
import type { AuthVars } from "../middleware/require-role";
import { submissionService } from "../services/submission.service";
import { commentSchema, reviewListQuerySchema, reviewSchema, reviewSummaryQuerySchema } from "../validators/submission.validator";

// หลังบ้าน: งานที่น้องส่ง · ต่ออยู่ใต้ admin.routes.ts จึงผ่านด่าน requireRole("dev") ของที่นั่นแล้ว
export const adminSubmissionRoutes = new Hono<AuthVars>();

adminSubmissionRoutes.get("/", async (c) => c.json(await submissionService.listAll()));

// หน้าตรวจงานแบบเจาะลง (รุ่น → งาน → คน) · ต้องอยู่ก่อน "/:id/..." ไม่งั้นชื่อ path ถูกอ่านเป็น id
// ?cohort=&assignment=&round=&status=waiting|reviewed|all&sort=oldest|newest|name&q=&offset=&limit=
adminSubmissionRoutes.get("/page", async (c) => {
  const parsed = reviewListQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, 400);
  return c.json(await submissionService.reviewPage(parsed.data));
});
adminSubmissionRoutes.get("/summary", async (c) => {
  const parsed = reviewSummaryQuerySchema.safeParse(c.req.query());
  if (!parsed.success || parsed.data.cohort === undefined) return c.json({ error: parsed.success ? "เลือกรุ่นก่อน" : (parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง") }, 400);
  return c.json(await submissionService.reviewSummary(parsed.data.cohort));
});

// ตรวจงาน = ตั้งผลตรวจของแถวนั้น (ทับของเดิมได้ ถ้าพี่เลี้ยงเปลี่ยนใจ)
adminSubmissionRoutes.put("/:id/review", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("SUBMISSION_NOT_FOUND");
  const parsed = reviewSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return c.json({ error: issue?.path.length ? issue.message : "ข้อมูลไม่ถูกต้อง: ต้องส่งเป็น JSON object" }, 400);
  }
  await submissionService.review(c.get("user").id, id, parsed.data);
  return c.body(null, 204);
});

// ความเห็นใต้งานของน้อง 1 คน (อ่านและเขียนในนามพี่เลี้ยง)
const userIdOf = (v: string) => {
  const id = Number(v);
  if (!Number.isInteger(id) || id <= 0) throw new Error("TASK_NOT_FOUND");
  return id;
};
adminSubmissionRoutes.get("/comments/:userId/:assignment/:round", async (c) =>
  c.json(await submissionService.commentsOf(userIdOf(c.req.param("userId")), c.req.param("assignment"), c.req.param("round"))),
);
adminSubmissionRoutes.post("/comments/:userId/:assignment/:round", async (c) => {
  const parsed = commentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, 400);
  return c.json(await submissionService.commentTo(c.get("user").id, userIdOf(c.req.param("userId")), c.req.param("assignment"), c.req.param("round"), parsed.data), 201);
});
