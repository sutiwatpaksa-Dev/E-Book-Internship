import { Hono } from "hono";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { announcementService } from "../services/announcement.service";
import { cardOverrideService } from "../services/card-override.service";
import { mentorCardService } from "../services/mentor-card.service";
import { pageNoteService } from "../services/page-note.service";
import { cardSlug, noteQuerySchema } from "../validators/content.validator";

// เนื้อหาที่พี่เลี้ยงเพิ่มจากหลังบ้าน ฝั่งคนอ่าน (เขียนอยู่ที่ admin-content.routes.ts)
// เปิดให้ทุกคน: หัวการ์ด (ชื่อ ขั้น หมวด) และการ์ดที่ถูกซ่อน · ต้อง login: เนื้อหาการ์ด, โน้ต, ประกาศ
export const contentRoutes = new Hono<AuthVars>();
const loggedIn = requireRole("intern", "dev");

contentRoutes.get("/cards", async (c) => c.json(await mentorCardService.listPublished()));
contentRoutes.get("/overrides", async (c) => c.json(await cardOverrideService.listAll()));

contentRoutes.get("/cards/:slug", loggedIn, async (c) => {
  const slug = cardSlug.safeParse(c.req.param("slug"));
  if (!slug.success) return c.json({ error: "ไม่พบการ์ดนี้" }, 404);
  return c.json(await mentorCardService.read(slug.data, c.get("user").role === "dev"));
});

contentRoutes.get("/notes", loggedIn, async (c) => {
  const parsed = noteQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
  return c.json(await pageNoteService.listFor(parsed.data.page));
});

contentRoutes.get("/announcements", loggedIn, async (c) => c.json(await announcementService.activeFor(c.get("user"))));
