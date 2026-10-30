import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { adminCohortRoutes } from "./admin-cohort.routes";
import { adminAssignmentRoutes } from "./admin-assignment.routes";
import { adminContentRoutes } from "./admin-content.routes";
import { adminSubmissionRoutes } from "./admin-submission.routes";
import { auditService } from "../services/audit.service";
import { progressService } from "../services/progress.service";
import { threadService } from "../services/thread.service";
import { cohortService } from "../services/cohort.service";
import { userService } from "../services/user.service";
import { cohortAssignSchema } from "../validators/cohort.validator";
import { messageSchema, sendMessageSchema, statusSchema } from "../validators/thread.validator";
import { createManySchema, createUserSchema, updateUserSchema } from "../validators/user.validator";

export const adminRoutes = new Hono<AuthVars>();
adminRoutes.use("*", requireRole("dev"));
adminRoutes.route("/content", adminContentRoutes);
adminRoutes.route("/cohorts", adminCohortRoutes);
adminRoutes.route("/assignments", adminAssignmentRoutes);
adminRoutes.route("/submissions", adminSubmissionRoutes);

adminRoutes.get("/users", async (c) => c.json(await userService.list()));
// หน้า admin ใช้ซ่อนปุ่มที่ทำไม่ได้ (server ตรวจซ้ำทุกคำสั่งอยู่แล้ว ซ่อนปุ่มไม่ใช่ตัวกันสิทธิ์)
adminRoutes.get("/me", (c) => {
  const { id, superAdmin } = c.get("user");
  return c.json({ id, superAdmin });
});

// สร้างบัญชี = POST ที่ collection เดียว (REST: URL เป็นคำนาม method เป็นคำกริยา ไม่มี /users/bulk)
// body มี usernames = สร้างหลายคน ตอบผลรายคน (ชื่อซ้ำไม่ทำให้ทั้งชุดล้ม) · มี username = คนเดียว ตอบ PIN
adminRoutes.post("/users", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (body && typeof body === "object" && "usernames" in body) {
    const parsed = createManySchema.safeParse(body);
    if (!parsed.success) return c.json({ error: "ใส่ 1–50 ชื่อ บรรทัดละชื่อ ใช้ได้เฉพาะ a-z 0-9 . _ - ยาว 3–64 ตัว" }, 400);
    return c.json(await userService.createMany(c.get("user"), parsed.data.usernames, parsed.data.role, parsed.data.cohortId), 201);
  }
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "username ใช้ได้เฉพาะ a-z 0-9 . _ - ยาว 3–64 ตัว และต้องเลือก role" }, 400);
  return c.json(await userService.create(c.get("user"), parsed.data.username, parsed.data.role, parsed.data.cohortId), 201);
});

// ย้ายน้องหลายคนเข้า/ออกรุ่น = แก้ช่อง cohortId ของหลายบัญชีพร้อมกัน จึงเป็น PATCH ที่ collection
adminRoutes.patch("/users", async (c) => {
  const parsed = cohortAssignSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "เลือกบัญชีอย่างน้อย 1 บัญชี" }, 400);
  return c.json(await cohortService.assign(c.get("user").id, parsed.data.userIds, parsed.data.cohortId));
});

// ออก PIN ใหม่ = สร้าง PIN ชิ้นใหม่ใต้บัญชีนั้น (PIN เดิมใช้ไม่ได้ทันที)
adminRoutes.post("/users/:id/pins", async (c) => c.json(await userService.resetPin(Number(c.req.param("id")), undefined, c.get("user")), 201));

adminRoutes.patch("/users/:id", async (c) => {
  const parsed = updateUserSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
  return c.json(await userService.update(c.get("user"), Number(c.req.param("id")), parsed.data));
});

adminRoutes.get("/progress", async (c) => c.json(await progressService.byUser()));
adminRoutes.get("/audit", async (c) => c.json(await auditService.latest()));


// ส่งข้อความหาน้อง (ต้องมาก่อน /threads/:id ไม่งั้น "send" ถูกอ่านเป็น id)
adminRoutes.post("/threads/send", async (c) => {
  const parsed = sendMessageSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "เลือกผู้รับ ใส่หัวข้อ (3–120 ตัวอักษร) และข้อความอย่างน้อย 5 ตัวอักษร (ไม่เกิน 2,000)" }, 400);
  return c.json(await threadService.sendToInterns(c.get("user").id, parsed.data), 201);
});

adminRoutes.get("/threads", async (c) => c.json(await threadService.listAll()));
adminRoutes.get("/threads/unread-count", async (c) => c.json({ count: await threadService.unreadForDevs() }));
adminRoutes.get("/threads/:id", async (c) => c.json(await threadService.getAny(Number(c.req.param("id")))));

adminRoutes.post("/threads/:id/messages", async (c) => {
  const parsed = messageSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "พิมพ์ข้อความก่อนส่ง (ไม่เกิน 2,000 ตัวอักษร)" }, 400);
  await threadService.replyAsDev(c.get("user").id, Number(c.req.param("id")), parsed.data.body);
  return c.body(null, 204);
});

adminRoutes.patch("/threads/:id", async (c) => {
  const parsed = statusSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "สถานะไม่ถูกต้อง" }, 400);
  await threadService.setStatus(c.get("user").id, Number(c.req.param("id")), parsed.data.status, parsed.data.note || undefined);
  return c.body(null, 204);
});
