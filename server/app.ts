import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { sql } from "drizzle-orm";
import { env } from "./config/env";
import { db } from "./db/client";
import { errorHandler } from "./middleware/error-handler";
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";
import { fileRoutes } from "./routes/file.routes";

// โครงแบบแบ่งตามหน้าที่ (Layered / MVC): routes → services → repositories → db
export const app = new Hono().basePath("/api");

app.use("*", csrf({ origin: env.APP_ORIGIN }));

// ตรวจว่า API ต่อฐานข้อมูลได้และสร้างตารางแล้ว (ใช้ตอนตั้งระบบใหม่) ไม่บอกข้อมูลลับ
app.get("/health", async (c) => {
  try {
    await db.execute(sql`select 1 from users limit 1`);
    return c.json({ ok: true, db: "ok" });
  } catch (e) {
    const missingTable = /relation .* does not exist/.test(String((e as Error).cause ?? e));
    return c.json({ ok: false, db: missingTable ? "ยังไม่ได้ migrate (ไม่มีตาราง users)" : "ต่อฐานข้อมูลไม่ได้" }, 503);
  }
});
app.route("/auth", authRoutes);
app.route("/admin", adminRoutes);
app.route("/files", fileRoutes);

app.notFound((c) => c.json({ error: "ไม่พบ" }, 404));
app.onError(errorHandler);
