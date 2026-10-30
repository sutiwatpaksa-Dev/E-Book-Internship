import { Hono } from "hono";
import { env } from "../config/env";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { assignmentService, pageOf } from "../services/assignment.service";

export const fileRoutes = new Hono<AuthVars>();
fileRoutes.use("*", requireRole("intern", "dev"));

// โจทย์ที่บัญชีนี้ดูได้ (น้อง = ของรุ่นตัวเอง ชิ้นแรกคือชิ้นที่ควรเปิด · พี่เลี้ยง = ทุกโจทย์)
fileRoutes.get("/assignments", async (c) => c.json(await assignmentService.listFor(c.get("user"))));

// ?a=<slug> เลือกโจทย์ (ไม่ใส่ = ชิ้นหลักของรุ่น) · ?sec=<key> = ลิงก์จากคู่มือที่ชี้หัวข้อ เช่น "api"
// หัวข้อเดียวกันอยู่คนละหน้าในแต่ละโจทย์ จึงให้ server แปลงเป็นเลขหน้าของโจทย์ที่น้องได้ แล้วส่งต่อไป #page=N
fileRoutes.get("/requirement.pdf", async (c) => {
  const { assignment: a, file: f } = await assignmentService.pdfFor(c.get("user"), c.req.query("a") || undefined);
  const sec = c.req.query("sec");
  if (sec) return c.redirect(`/api/files/requirement.pdf?a=${a.slug}#page=${pageOf(a.sections, sec)}`, 302);
  if (!f) return c.json({ error: `ยังไม่มีไฟล์ของโจทย์ ${a.name} ให้พี่เลี้ยงอัปโหลดในหน้า admin` }, 404);
  return c.body(new Uint8Array(f.data), 200, {
    "Content-Type": f.contentType,
    "Content-Disposition": `inline; filename="${a.slug}-requirement.pdf"`,
    // ไฟล์ส่วนตัว ห้าม CDN หรือเครื่องกลางเก็บสำเนาไว้แจกคนอื่น
    "Cache-Control": "private, no-store",
  });
});

// ลิงก์ที่เปิดให้เฉพาะคนที่ login แล้ว ถ้า repo ปลายทางเป็นสาธารณะ การซ่อนลิงก์ไม่ได้กันอะไร ต้องตั้ง repo เป็น private แล้วเพิ่มสิทธิ์ทีละคน
fileRoutes.get("/links", (c) => c.json({ exampleRepo: env.EXAMPLE_REPO_URL ?? null }));
