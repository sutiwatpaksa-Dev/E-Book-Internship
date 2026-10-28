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
    // ข้อความจาก refine (เช่นเบอร์โทร) บอกตรงจุด ที่เหลือบอกความยาวสูงสุดรวมๆ
    const custom = parsed.error.issues.find((i) => i.code === "custom")?.message;
    return c.json({ error: custom ?? "ข้อมูลไม่ถูกต้อง: ชื่อไม่เกิน 100 ตัว ชื่อเล่นไม่เกิน 30 ตัว สถานศึกษาและสาขาไม่เกิน 150 ตัว ความถนัดไม่เกิน 300 ตัว" }, 400);
  }
  const me = c.get("user");
  return c.json(await profileService.update(me.id, me.role, parsed.data));
});
