import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { attendanceService } from "../services/attendance.service";

// เช็คอินของตัวเอง: id มาจากบัตรผ่านเสมอ เช็คอินแทนคนอื่นไม่ได้ · ไม่รับเวลาจากหน้าเว็บ (ไม่มี body เลย)
export const attendanceRoutes = new Hono<AuthVars>();
attendanceRoutes.use("*", requireRole("intern"));

attendanceRoutes.get("/today", async (c) => c.json(await attendanceService.today(c.get("user").id)));
attendanceRoutes.post("/check-in", async (c) => c.json(await attendanceService.checkIn(c.get("user").id)));
attendanceRoutes.post("/check-out", async (c) => c.json(await attendanceService.checkOut(c.get("user").id)));
