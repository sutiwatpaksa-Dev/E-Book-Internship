import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { threadService } from "../services/thread.service";
import { createThreadSchema, messageSchema } from "../validators/thread.validator";

// ฝั่งน้อง: เรื่องของตัวเองเท่านั้น ทุกคำขอใช้ id จากบัตรผ่าน ไม่ใช่จากค่าที่ส่งมา จึงขอดูของคนอื่นไม่ได้
export const threadRoutes = new Hono<AuthVars>();
threadRoutes.use("*", requireRole("intern", "dev"));

threadRoutes.get("/", async (c) => c.json(await threadService.listMine(c.get("user").id)));
threadRoutes.get("/unread", async (c) => c.json({ count: await threadService.unreadMine(c.get("user").id) }));

threadRoutes.post("/", async (c) => {
  const parsed = createThreadSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "ใส่หัวข้อ (3–120 ตัวอักษร) และรายละเอียดอย่างน้อย 10 ตัวอักษร" }, 400);
  return c.json(await threadService.create(c.get("user").id, parsed.data), 201);
});

threadRoutes.get("/:id", async (c) => c.json(await threadService.getMine(c.get("user").id, Number(c.req.param("id")))));

threadRoutes.post("/:id/messages", async (c) => {
  const parsed = messageSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "พิมพ์ข้อความก่อนส่ง (ไม่เกิน 2,000 ตัวอักษร)" }, 400);
  await threadService.replyMine(c.get("user").id, Number(c.req.param("id")), parsed.data.body);
  return c.body(null, 204);
});
