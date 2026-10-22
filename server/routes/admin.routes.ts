import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { fileService } from "../services/file.service";
import { questionService } from "../services/question.service";
import { userService } from "../services/user.service";
import { answerSchema } from "../validators/question.validator";
import { createUserSchema, updateUserSchema } from "../validators/user.validator";

export const adminRoutes = new Hono<AuthVars>();
adminRoutes.use("*", requireRole("dev"));

adminRoutes.get("/users", async (c) => c.json(await userService.list()));

adminRoutes.post("/users", async (c) => {
  const parsed = createUserSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "username ใช้ได้เฉพาะ a-z 0-9 . _ - ยาว 3–64 ตัว และต้องเลือก role" }, 400);
  return c.json(await userService.create(parsed.data.username, parsed.data.role), 201);
});

adminRoutes.post("/users/:id/reset-pin", async (c) => c.json(await userService.resetPin(Number(c.req.param("id")))));

adminRoutes.patch("/users/:id", async (c) => {
  const parsed = updateUserSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
  return c.json(await userService.update(c.get("user").id, Number(c.req.param("id")), parsed.data));
});

adminRoutes.get("/requirement", async (c) => c.json(await fileService.getRequirementInfo()));

adminRoutes.put("/requirement", async (c) => {
  if (c.req.header("content-type") !== "application/pdf") return c.json({ error: "ต้องเป็นไฟล์ PDF" }, 415);
  return c.json(await fileService.saveRequirement(Buffer.from(await c.req.arrayBuffer()), c.get("user").id));
});

adminRoutes.get("/questions", async (c) => c.json(await questionService.listAll()));

adminRoutes.put("/questions/:id/answer", async (c) => {
  const parsed = answerSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "เขียนคำตอบก่อนส่ง (ไม่เกิน 4,000 ตัวอักษร)" }, 400);
  await questionService.answer(Number(c.req.param("id")), c.get("user").id, parsed.data.answer);
  return c.body(null, 204);
});
