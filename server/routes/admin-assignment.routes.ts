import { Hono } from "hono";
import type { AuthVars } from "../middleware/require-role";
import { assignmentService } from "../services/assignment.service";
import { assignmentSchema, newAssignmentSchema } from "../validators/assignment.validator";

// หลังบ้าน: โจทย์ฝึกงาน · ต่ออยู่ใต้ admin.routes.ts จึงผ่านด่าน requireRole("dev") ของที่นั่นแล้ว
export const adminAssignmentRoutes = new Hono<AuthVars>();

const id = (c: { req: { param: (k: string) => string } }) => {
  const n = Number(c.req.param("id"));
  if (!Number.isInteger(n) || n <= 0) throw new Error("ASSIGNMENT_NOT_FOUND");
  return n;
};
const BAD = "ชื่อโจทย์ 2–80 ตัวอักษร · ชื่อใน URL ใช้ a-z 0-9 - · หัวข้อต้องมี key ไม่ซ้ำและเลขหน้า";

adminAssignmentRoutes.get("/", async (c) => c.json(await assignmentService.list()));

adminAssignmentRoutes.post("/", async (c) => {
  const parsed = newAssignmentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: BAD }, 400);
  const { slug, ...f } = parsed.data;
  return c.json(await assignmentService.create(c.get("user").id, slug, f), 201);
});

adminAssignmentRoutes.put("/:id", async (c) => {
  const parsed = assignmentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: BAD }, 400);
  await assignmentService.update(c.get("user").id, id(c), parsed.data);
  return c.body(null, 204);
});

// PDF ของโจทย์ = ไฟล์ชิ้นเดียวใต้โจทย์นั้น อัปโหลดใหม่ก็แทนที่ (PUT)
adminAssignmentRoutes.put("/:id/pdf", async (c) => {
  if (c.req.header("content-type") !== "application/pdf") return c.json({ error: "ต้องเป็นไฟล์ PDF" }, 415);
  return c.json(await assignmentService.savePdf(c.get("user").id, id(c), Buffer.from(await c.req.arrayBuffer())));
});
