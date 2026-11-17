import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { isMonth } from "../../src/lib/attendance";
import { todayTH } from "../../src/lib/cohort";
import { attendanceService } from "../services/attendance.service";

// เช็คอินของตัวเอง: id มาจากบัตรผ่านเสมอ เช็คอินแทนคนอื่นไม่ได้ · ไม่รับเวลาจากหน้าเว็บ (ไม่มี body เลย)
export const attendanceRoutes = new Hono<AuthVars>();
attendanceRoutes.use("*", requireRole("intern"));

// ?month=2026-11 (ไม่ส่ง = เดือนนี้) · ประวัติของตัวเองเท่านั้น
attendanceRoutes.get("/history", async (c) => {
  const month = c.req.query("month") ?? todayTH().slice(0, 7);
  if (!isMonth(month)) return c.json({ error: "เดือนต้องเป็นรูปแบบ YYYY-MM" }, 400);
  return c.json(await attendanceService.history(c.get("user").id, month));
});

attendanceRoutes.get("/today", async (c) => c.json(await attendanceService.today(c.get("user").id)));
attendanceRoutes.post("/check-in", async (c) => c.json(await attendanceService.checkIn(c.get("user").id)));
attendanceRoutes.post("/check-out", async (c) => c.json(await attendanceService.checkOut(c.get("user").id)));
