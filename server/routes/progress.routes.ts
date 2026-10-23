import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { progressService } from "../services/progress.service";
import { importProgressSchema, setProgressSchema } from "../validators/progress.validator";

// ความคืบหน้าของตัวเอง: id มาจากบัตรผ่านเสมอ แก้ของคนอื่นไม่ได้
export const progressRoutes = new Hono<AuthVars>();
progressRoutes.use("*", requireRole("intern", "dev"));

progressRoutes.get("/", async (c) => c.json(await progressService.listMine(c.get("user").id)));

progressRoutes.put("/", async (c) => {
  const parsed = setProgressSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
  await progressService.set(c.get("user").id, parsed.data.link, parsed.data.done);
  return c.body(null, 204);
});

progressRoutes.post("/import", async (c) => {
  const parsed = importProgressSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
  return c.json(await progressService.importLocal(c.get("user").id, parsed.data.links));
});
