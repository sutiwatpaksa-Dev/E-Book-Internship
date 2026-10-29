import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { notificationService } from "../services/notification.service";
import { readNotificationsSchema } from "../validators/content.validator";

// แจ้งเตือนของตัวเองเท่านั้น: id มาจากบัตรผ่าน
export const notificationRoutes = new Hono<AuthVars>();
notificationRoutes.use("*", requireRole("intern", "dev"));

notificationRoutes.get("/", async (c) => c.json(await notificationService.listMine(c.get("user").id)));
// หน้าเว็บถามทุก 1 นาที ตอบแค่ตัวเลข เบาที่สุด
notificationRoutes.get("/unread-count", async (c) => c.json({ count: await notificationService.unreadMine(c.get("user").id) }));

// ทำเป็นอ่านแล้ว = แก้ช่อง readAt ของแจ้งเตือน จึงเป็น PATCH ที่ collection (ไม่ใช่ POST /read)
notificationRoutes.patch("/", async (c) => {
  const parsed = readNotificationsSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
  await notificationService.markRead(c.get("user").id, parsed.data.ids);
  return c.body(null, 204);
});
