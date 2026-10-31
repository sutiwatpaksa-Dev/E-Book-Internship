import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { submissionService } from "../services/submission.service";
import { commentSchema, submitSchema } from "../validators/submission.validator";

// ส่งงานของตัวเอง: id มาจากบัตรผ่านเสมอ ส่งแทนคนอื่นหรือดูของคนอื่นไม่ได้
export const submissionRoutes = new Hono<AuthVars>();
submissionRoutes.use("*", requireRole("intern"));

submissionRoutes.get("/", async (c) => c.json(await submissionService.listMine(c.get("user"))));

submissionRoutes.post("/", async (c) => {
  const parsed = submitSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    // ทุกช่องมีข้อความไทยของตัวเอง ส่งข้อแรกกลับไป · issue ที่ไม่มี path = body ไม่ใช่ object เลย
    const issue = parsed.error.issues[0];
    return c.json({ error: issue?.path.length ? issue.message : "ข้อมูลไม่ถูกต้อง: ต้องส่งเป็น JSON object" }, 400);
  }
  return c.json(await submissionService.submit(c.get("user"), parsed.data), 201);
});

// ความเห็นใต้งานของตัวเอง (งาน = โจทย์ + รอบ)
submissionRoutes.get("/:assignment/:round/comments", async (c) => c.json(await submissionService.commentsMine(c.get("user"), c.req.param("assignment"), c.req.param("round"))));
submissionRoutes.post("/:assignment/:round/comments", async (c) => {
  const parsed = commentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, 400);
  return c.json(await submissionService.commentMine(c.get("user"), c.req.param("assignment"), c.req.param("round"), parsed.data), 201);
});
