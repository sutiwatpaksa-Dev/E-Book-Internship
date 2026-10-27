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
  if (!parsed.success) return c.json({ error: "ข้อมูลไม่ถูกต้อง: ชื่อไม่เกิน 100 ตัว ชื่อเล่นไม่เกิน 30 ตัว ชื่อสถานศึกษาและสาขาไม่เกิน 150 ตัว" }, 400);
  return c.json(await profileService.update(c.get("user").id, parsed.data));
});
