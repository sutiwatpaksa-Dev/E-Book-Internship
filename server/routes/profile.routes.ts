import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { profileService } from "../services/profile.service";
import { profileSchema } from "../validators/profile.validator";

// โปรไฟล์ของคนที่ login อยู่ (น้องและพี่เลี้ยงใช้ร่วมกัน)
export const profileRoutes = new Hono<AuthVars>();
profileRoutes.use("*", requireRole("intern", "dev"));

profileRoutes.get("/", async (c) => c.json(await profileService.get(c.get("user").id)));

profileRoutes.put("/", async (c) => {
  const parsed = profileSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    // ทุกช่องมีข้อความไทยของตัวเองใน validator ส่งข้อแรกกลับไป · issue ที่ไม่มี path = body ไม่ใช่ object เลย
    const issue = parsed.error.issues[0];
    return c.json({ error: issue?.path.length ? issue.message : "ข้อมูลไม่ถูกต้อง: ต้องส่งเป็น JSON object" }, 400);
  }
  const me = c.get("user");
  return c.json(await profileService.update(me.id, me.role, parsed.data));
});
