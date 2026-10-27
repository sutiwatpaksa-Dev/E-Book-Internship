import { Hono } from "hono";
import type { AuthVars } from "../middleware/require-role";
import { cohortService } from "../services/cohort.service";
import { cohortAssignSchema, cohortMentorsSchema, cohortSchema } from "../validators/cohort.validator";

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

// ย้ายน้องเข้า/ออกรุ่น (วางก่อน /:id เพื่อไม่ให้ "assign" ถูกอ่านเป็น id)
adminCohortRoutes.post("/assign", async (c) => {
  const parsed = cohortAssignSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "เลือกบัญชีอย่างน้อย 1 บัญชี" }, 400);
  return c.json(await cohortService.assign(c.get("user").id, parsed.data.userIds, parsed.data.cohortId));
});

adminCohortRoutes.put("/:id", async (c) => {
  const parsed = cohortSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: BAD_COHORT }, 400);
  await cohortService.update(c.get("user").id, id(c), parsed.data);
  return c.body(null, 204);
});

adminCohortRoutes.post("/:id/end", async (c) => {
  await cohortService.setEnded(c.get("user").id, id(c), true);
  return c.body(null, 204);
});

adminCohortRoutes.post("/:id/reopen", async (c) => {
  await cohortService.setEnded(c.get("user").id, id(c), false);
  return c.body(null, 204);
});

adminCohortRoutes.put("/:id/mentors", async (c) => {
  const parsed = cohortMentorsSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "รายชื่อพี่เลี้ยงไม่ถูกต้อง" }, 400);
  await cohortService.setMentors(c.get("user").id, id(c), parsed.data.userIds);
  return c.body(null, 204);
});
