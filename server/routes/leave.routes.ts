import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { leaveService } from "../services/leave.service";
import { leaveRequestSchema } from "../validators/leave.validator";

// ใบลาของตัวเอง: id มาจากบัตรผ่านเสมอ ขอแทนคนอื่นไม่ได้
export const leaveRoutes = new Hono<AuthVars>();
leaveRoutes.use("*", requireRole("intern"));

leaveRoutes.get("/", async (c) => c.json(await leaveService.mine(c.get("user").id)));

leaveRoutes.post("/", async (c) => {
  const parsed = leaveRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "เลือกวันที่และชนิด และเขียนเหตุผลอย่างน้อย 5 ตัวอักษร" }, 400);
  await leaveService.request(c.get("user").id, parsed.data);
  return c.body(null, 201);
});

leaveRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("LEAVE_NOT_FOUND");
  await leaveService.withdraw(c.get("user").id, id);
  return c.body(null, 204);
});
