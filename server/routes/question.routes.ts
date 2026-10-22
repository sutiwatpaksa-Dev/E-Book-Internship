import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { questionService } from "../services/question.service";
import { askSchema } from "../validators/question.validator";

// ฝั่งน้อง: ถาม และดูคำถามของตัวเอง (ไม่มีทางเห็นของคนอื่น เพราะค้นด้วย id จากบัตรผ่าน ไม่ใช่จากค่าที่ส่งมา)
export const questionRoutes = new Hono<AuthVars>();
questionRoutes.use("*", requireRole("intern", "dev"));

questionRoutes.get("/mine", async (c) => c.json(await questionService.mine(c.get("user").id)));

questionRoutes.post("/", async (c) => {
  const parsed = askSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "เขียนคำถามอย่างน้อย 10 ตัวอักษร (ไม่เกิน 2,000)" }, 400);
  return c.json(await questionService.ask(c.get("user").id, parsed.data.pageUrl, parsed.data.body), 201);
});
