import { Hono } from "hono";
import type { AuthVars } from "../middleware/require-role";
import { submissionService } from "../services/submission.service";
import { reviewSchema } from "../validators/submission.validator";

// หลังบ้าน: งานที่น้องส่ง · ต่ออยู่ใต้ admin.routes.ts จึงผ่านด่าน requireRole("dev") ของที่นั่นแล้ว
export const adminSubmissionRoutes = new Hono<AuthVars>();

adminSubmissionRoutes.get("/", async (c) => c.json(await submissionService.listAll()));

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
