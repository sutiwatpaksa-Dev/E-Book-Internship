import { Hono } from "hono";
import { LEAVE_STATUSES } from "../db/schema";
import type { AuthVars } from "../middleware/require-role";
import { leaveService } from "../services/leave.service";
import { leaveDecisionSchema } from "../validators/leave.validator";

// หลังบ้าน: ใบลา/แจ้งสายของน้อง · ต่ออยู่ใต้ admin.routes.ts จึงผ่านด่าน requireRole("dev") ของที่นั่นแล้ว
export const adminLeaveRoutes = new Hono<AuthVars>();

const positive = (v: string | undefined) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ?cohortId=1&status=pending (ไม่ส่ง status = ทุกสถานะ)
adminLeaveRoutes.get("/", async (c) => {
  const cohortId = positive(c.req.query("cohortId"));
  const status = c.req.query("status");
  if (!cohortId || (status && !(LEAVE_STATUSES as readonly string[]).includes(status))) return c.json({ error: "ต้องระบุรุ่น และสถานะที่ถูกต้อง" }, 400);
  return c.json(await leaveService.list(cohortId, (status as (typeof LEAVE_STATUSES)[number]) || null));
});

// จำนวนใบรออนุมัติ ไว้ขึ้นตัวเลขบนเมนู (?cohorts=1,2 ไม่ส่ง = ทุกรุ่น)
adminLeaveRoutes.get("/pending-count", async (c) => {
  const raw = c.req.query("cohorts");
  const ids = raw ? raw.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0) : undefined;
  return c.json({ count: await leaveService.pendingCount(ids) });
});

adminLeaveRoutes.put("/:id", async (c) => {
  const id = positive(c.req.param("id"));
  if (!id) throw new Error("LEAVE_NOT_FOUND");
  const parsed = leaveDecisionSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "ไม่อนุมัติต้องเขียนเหตุผลอย่างน้อย 3 ตัวอักษร" }, 400);
  await leaveService.decide(c.get("user").id, id, parsed.data);
  return c.body(null, 204);
});
