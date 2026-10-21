import { Hono } from "hono";
import { env } from "../config/env";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { fileService } from "../services/file.service";

export const fileRoutes = new Hono<AuthVars>();
fileRoutes.use("*", requireRole("intern", "dev"));

fileRoutes.get("/requirement.pdf", async (c) => {
  const f = await fileService.getRequirement();
  if (!f) return c.json({ error: "ยังไม่มีไฟล์ Requirement ให้พี่เลี้ยงอัปโหลดในหน้า admin" }, 404);
  return c.body(new Uint8Array(f.data), 200, {
    "Content-Type": f.contentType,
    "Content-Disposition": 'inline; filename="starter-requirement.pdf"',
    // ไฟล์ส่วนตัว ห้าม CDN หรือเครื่องกลางเก็บสำเนาไว้แจกคนอื่น
    "Cache-Control": "private, no-store",
  });
});

// ลิงก์ที่เปิดให้เฉพาะคนที่ login แล้ว ถ้า repo ปลายทางเป็นสาธารณะ การซ่อนลิงก์ไม่ได้กันอะไร ต้องตั้ง repo เป็น private แล้วเพิ่มสิทธิ์ทีละคน
fileRoutes.get("/links", (c) => c.json({ exampleRepo: env.EXAMPLE_REPO_URL ?? null }));
