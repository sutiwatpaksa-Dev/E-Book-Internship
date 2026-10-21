import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { requireRole, type AuthVars } from "../auth";
import { db } from "../db/client";
import { files } from "../db/schema";
import { env } from "../env";
import { REQUIREMENT_KEY } from "./admin";

export const fileRoutes = new Hono<AuthVars>();

fileRoutes.get("/requirement.pdf", requireRole("intern", "dev"), async (c) => {
  const [f] = await db.select().from(files).where(eq(files.key, REQUIREMENT_KEY));
  if (!f) return c.json({ error: "ยังไม่มีไฟล์ Requirement ให้พี่เลี้ยงอัปโหลดในหน้า admin" }, 404);
  return c.body(new Uint8Array(f.data), 200, {
    "Content-Type": f.contentType,
    "Content-Disposition": 'inline; filename="starter-requirement.pdf"',
    // ไฟล์ส่วนตัว ห้าม CDN หรือเครื่องกลางเก็บสำเนาไว้แจกคนอื่น
    "Cache-Control": "private, no-store",
  });
});

// ลิงก์ที่เปิดให้เฉพาะคนที่ login แล้ว ถ้า repo ปลายทางเป็นสาธารณะ การซ่อนลิงก์ไม่ได้กันอะไร ต้องตั้ง repo เป็น private แล้วเพิ่มสิทธิ์ทีละคน
fileRoutes.get("/links", requireRole("intern", "dev"), (c) => c.json({ exampleRepo: env.EXAMPLE_REPO_URL ?? null }));
