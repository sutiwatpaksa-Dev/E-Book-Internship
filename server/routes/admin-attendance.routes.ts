import { Hono } from "hono";
import type { AuthVars } from "../middleware/require-role";
import { attendanceAdminService } from "../services/attendance-admin.service";
import { editAttendanceSchema, holidaySchema, workRuleSchema } from "../validators/attendance.validator";

// หลังบ้าน: เช็คอินของน้อง · ต่ออยู่ใต้ admin.routes.ts จึงผ่านด่าน requireRole("dev") ของที่นั่นแล้ว
export const adminAttendanceRoutes = new Hono<AuthVars>();

const json = (c: { req: { json: () => Promise<unknown> } }) => c.req.json().catch(() => null);
const positive = (v: string | undefined) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ?cohortId=1&date=2026-11-14 (ไม่ส่ง date = วันนี้)
adminAttendanceRoutes.get("/day", async (c) => {
  const cohortId = positive(c.req.query("cohortId"));
  const date = c.req.query("date");
  if (!cohortId || (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date))) return c.json({ error: "ต้องระบุรุ่น และวันที่เป็น YYYY-MM-DD" }, 400);
  return c.json(await attendanceAdminService.day(cohortId, date));
});

adminAttendanceRoutes.put("/records", async (c) => {
  const parsed = editAttendanceSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "กรอกเวลาเป็น HH:MM และเขียนเหตุผลอย่างน้อย 5 ตัวอักษร" }, 400);
  await attendanceAdminService.edit(c.get("user").id, parsed.data);
  return c.body(null, 204);
});

adminAttendanceRoutes.get("/holidays", async (c) => {
  const cohortId = positive(c.req.query("cohortId"));
  if (!cohortId) return c.json({ error: "ต้องระบุรุ่น" }, 400);
  return c.json(await attendanceAdminService.holidays(cohortId));
});

adminAttendanceRoutes.post("/holidays", async (c) => {
  const parsed = holidaySchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "วันที่ต้องเป็น YYYY-MM-DD และชื่อวันหยุดไม่เกิน 80 ตัวอักษร" }, 400);
  await attendanceAdminService.addHoliday(c.get("user").id, parsed.data);
  return c.body(null, 201);
});

adminAttendanceRoutes.delete("/holidays/:id", async (c) => {
  const id = positive(c.req.param("id"));
  if (!id) throw new Error("HOLIDAY_NOT_FOUND");
  await attendanceAdminService.removeHoliday(c.get("user").id, id);
  return c.body(null, 204);
});

adminAttendanceRoutes.get("/rules", async (c) => {
  const cohortId = positive(c.req.query("cohortId"));
  if (!cohortId) return c.json({ error: "ต้องระบุรุ่น" }, 400);
  return c.json(await attendanceAdminService.rules(cohortId));
});

adminAttendanceRoutes.post("/rules", async (c) => {
  const parsed = workRuleSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "วันที่เป็น YYYY-MM-DD เวลาเป็น HH:MM และผ่อนผันสาย 0–120 นาที" }, 400);
  await attendanceAdminService.addRule(c.get("user").id, parsed.data);
  return c.body(null, 201);
});

adminAttendanceRoutes.delete("/rules/:id", async (c) => {
  const id = positive(c.req.param("id"));
  if (!id) throw new Error("RULE_NOT_FOUND");
  await attendanceAdminService.removeRule(c.get("user").id, id);
  return c.body(null, 204);
});
