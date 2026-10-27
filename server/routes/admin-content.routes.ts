import { Hono } from "hono";
import type { AuthVars } from "../middleware/require-role";
import { announcementService } from "../services/announcement.service";
import { cardOverrideService } from "../services/card-override.service";
import { mentorCardService } from "../services/mentor-card.service";
import { pageNoteService } from "../services/page-note.service";
import { announcementSchema, cardOverrideSchema, cardSlug, cardStatusSchema, mentorCardSchema, pageNoteSchema } from "../validators/content.validator";

// หลังบ้าน: พี่เลี้ยงเขียนเนื้อหาเอง · ต่ออยู่ใต้ admin.routes.ts จึงผ่านด่าน requireRole("dev") ของที่นั่นแล้ว
export const adminContentRoutes = new Hono<AuthVars>();

const json = (c: { req: { json: () => Promise<unknown> } }) => c.req.json().catch(() => null);
// id ใน URL ต้องเป็นเลขบวก ไม่งั้นตอบ "ไม่พบ" (ส่ง NaN ต่อไปถึง DB จะกลายเป็น 500)
const id = (c: { req: { param: (k: string) => string } }, notFound: string) => {
  const n = Number(c.req.param("id"));
  if (!Number.isInteger(n) || n <= 0) throw new Error(notFound);
  return n;
};

// ---- การ์ดของพี่เลี้ยง ----
adminContentRoutes.get("/cards", async (c) => c.json(await mentorCardService.listAll()));

adminContentRoutes.post("/cards", async (c) => {
  const parsed = mentorCardSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "กรอกให้ครบ: ชื่อ 3–120 ตัวอักษร, URL ใช้ a-z 0-9 และ - ยาว 3–60 ตัว, เวลาอ่าน 1–60 นาที" }, 400);
  return c.json(await mentorCardService.create(c.get("user").id, parsed.data), 201);
});

adminContentRoutes.put("/cards/:id", async (c) => {
  const parsed = mentorCardSchema.omit({ slug: true }).safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "กรอกให้ครบ: ชื่อ 3–120 ตัวอักษร, เวลาอ่าน 1–60 นาที" }, 400);
  await mentorCardService.update(c.get("user").id, id(c, "CARD_NOT_FOUND"), parsed.data);
  return c.body(null, 204);
});

adminContentRoutes.patch("/cards/:id/status", async (c) => {
  const parsed = cardStatusSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "สถานะไม่ถูกต้อง" }, 400);
  await mentorCardService.setStatus(c.get("user").id, id(c, "CARD_NOT_FOUND"), parsed.data.status);
  return c.body(null, 204);
});

adminContentRoutes.delete("/cards/:id", async (c) => {
  await mentorCardService.remove(c.get("user").id, id(c, "CARD_NOT_FOUND"));
  return c.body(null, 204);
});

// ---- โน้ตท้ายหน้า ----
adminContentRoutes.get("/notes", async (c) => c.json(await pageNoteService.listAll()));

adminContentRoutes.post("/notes", async (c) => {
  const parsed = pageNoteSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "ใส่หน้า (เช่น /learn/cards/migration) และข้อความไม่เกิน 4,000 ตัวอักษร" }, 400);
  return c.json(await pageNoteService.create(c.get("user").id, parsed.data), 201);
});

adminContentRoutes.put("/notes/:id", async (c) => {
  const parsed = pageNoteSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "ใส่หน้า (เช่น /learn/cards/migration) และข้อความไม่เกิน 4,000 ตัวอักษร" }, 400);
  await pageNoteService.update(c.get("user").id, id(c, "NOTE_NOT_FOUND"), parsed.data);
  return c.body(null, 204);
});

adminContentRoutes.delete("/notes/:id", async (c) => {
  await pageNoteService.remove(c.get("user").id, id(c, "NOTE_NOT_FOUND"));
  return c.body(null, 204);
});

// ---- ประกาศ ----
adminContentRoutes.get("/announcements", async (c) => c.json(await announcementService.listAll()));

adminContentRoutes.post("/announcements", async (c) => {
  const parsed = announcementSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "ข้อความ 3–500 ตัวอักษร และเลือกว่าใครเห็น" }, 400);
  return c.json(await announcementService.create(c.get("user").id, parsed.data), 201);
});

adminContentRoutes.post("/announcements/:id/end", async (c) => {
  await announcementService.end(c.get("user").id, id(c, "ANNOUNCEMENT_NOT_FOUND"));
  return c.body(null, 204);
});

// ---- ปรับการ์ดในระบบ (ซ่อน / เปลี่ยนชื่อ) ----
adminContentRoutes.put("/overrides/:slug", async (c) => {
  const slug = cardSlug.safeParse(c.req.param("slug"));
  const parsed = cardOverrideSchema.safeParse(await json(c));
  if (!slug.success || !parsed.success) return c.json({ error: "ชื่อ 3–120 ตัวอักษร เวลาอ่าน 1–60 นาที (เว้นว่าง = ใช้ค่าเดิม)" }, 400);
  await cardOverrideService.set(c.get("user").id, slug.data, parsed.data);
  return c.body(null, 204);
});
