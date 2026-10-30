import { Hono } from "hono";
import type { AuthVars } from "../middleware/require-role";
import { assignmentService } from "../services/assignment.service";
import { cohortService } from "../services/cohort.service";
import { cohortAssignmentsSchema } from "../validators/assignment.validator";
import { cohortEndedSchema, cohortMentorsSchema, cohortSchema, cohortSignupSchema } from "../validators/cohort.validator";

// หลังบ้าน: รุ่นฝึกงาน · ต่ออยู่ใต้ admin.routes.ts จึงผ่านด่าน requireRole("dev") ของที่นั่นแล้ว
export const adminCohortRoutes = new Hono<AuthVars>();

const json = (c: { req: { json: () => Promise<unknown> } }) => c.req.json().catch(() => null);
// id ใน URL ต้องเป็นเลขบวก ไม่งั้นตอบ "ไม่พบ" (ส่ง NaN ต่อไปถึง DB จะกลายเป็น 500)
const id = (c: { req: { param: (k: string) => string } }) => {
  const n = Number(c.req.param("id"));
  if (!Number.isInteger(n) || n <= 0) throw new Error("COHORT_NOT_FOUND");
  return n;
};
const BAD_COHORT = "ชื่อรุ่น 2–80 ตัวอักษร และวันที่ต้องเป็น YYYY-MM-DD";

adminCohortRoutes.get("/", async (c) => c.json(await cohortService.list()));

adminCohortRoutes.post("/", async (c) => {
  const parsed = cohortSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: BAD_COHORT }, 400);
  return c.json(await cohortService.create(c.get("user").id, parsed.data), 201);
});

adminCohortRoutes.put("/:id", async (c) => {
  const parsed = cohortSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: BAD_COHORT }, 400);
  await cohortService.update(c.get("user").id, id(c), parsed.data);
  return c.body(null, 204);
});

// จบรุ่น / เปิดรุ่นคืน = เปลี่ยนสถานะของรุ่น จึงเป็น PATCH ช่อง ended (ไม่ใช่ path คำกริยา /end /reopen)
adminCohortRoutes.patch("/:id", async (c) => {
  const parsed = cohortEndedSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "ส่ง { ended: true } เพื่อจบรุ่น หรือ { ended: false } เพื่อเปิดคืน" }, 400);
  await cohortService.setEnded(c.get("user").id, id(c), parsed.data.ended);
  return c.body(null, 204);
});

// รหัสรุ่นใหม่ แสดงครั้งเดียว (ตอบรหัสจริงกลับไปแค่คำขอนี้)
adminCohortRoutes.post("/:id/invite", async (c) => c.json(await cohortService.newInvite(c.get("user").id, id(c))));

adminCohortRoutes.put("/:id/signup", async (c) => {
  const parsed = cohortSignupSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "วันปิดรับต้องเป็น YYYY-MM-DD และจำนวนที่ 1–500 (ว่าง = ไม่จำกัด)" }, 400);
  await cohortService.setSignup(c.get("user").id, id(c), parsed.data);
  return c.body(null, 204);
});

adminCohortRoutes.put("/:id/mentors", async (c) => {
  const parsed = cohortMentorsSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "รายชื่อพี่เลี้ยงไม่ถูกต้อง" }, 400);
  await cohortService.setMentors(c.get("user").id, id(c), parsed.data.userIds);
  return c.body(null, 204);
});

// โจทย์ของรุ่น = ชุดของโจทย์ทั้งชุด (ส่งรายการที่ต้องการ server เพิ่ม/เอาออกให้ตรง) · รุ่นที่จบแล้วแก้ไม่ได้
adminCohortRoutes.put("/:id/assignments", async (c) => {
  const parsed = cohortAssignmentsSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "รายการโจทย์ไม่ถูกต้อง" }, 400);
  await assignmentService.setForCohort(c.get("user").id, id(c), parsed.data.assignmentIds);
  return c.body(null, 204);
});
