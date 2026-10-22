import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { sql } from "drizzle-orm";
import { env } from "./config/env";
import { db } from "./db/client";
import { errorHandler } from "./middleware/error-handler";
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";
import { fileRoutes } from "./routes/file.routes";
import { questionRoutes } from "./routes/question.routes";

// โครงแบบแบ่งตามหน้าที่ (Layered / MVC): routes → services → repositories → db
export const app = new Hono().basePath("/api");

app.use("*", csrf({ origin: env.APP_ORIGIN }));

// ตรวจว่า API ต่อฐานข้อมูลได้และสร้างตารางแล้ว (ใช้ตอนตั้งระบบใหม่) ไม่บอกข้อมูลลับ
app.get("/health", async (c) => {
  try {
    await db.execute(sql`select 1 from users limit 1`);
    return c.json({ ok: true, db: "ok" });
  } catch (e) {
    // drizzle ห่อ error ของ pg ไว้ใน cause · ส่งออกแค่รหัส (เช่น 42P01, 28P01, ENOTFOUND) ไม่มีค่าลับ
    const err = ((e as Error).cause ?? e) as { code?: string; message?: string };
    // บอกใน log ฝั่ง server ว่าต่อเครื่องไหน ฐานไหน (host + ชื่อฐาน ไม่มีรหัสผ่าน) ไว้เทียบกับที่ migrate
    const target = new URL(env.DATABASE_URL);
    console.error("health check failed:", err.code, err.message, `target=${target.host}${target.pathname}`);
    const missingTable = err.code === "42P01"; // undefined_table
    return c.json({ ok: false, db: missingTable ? "ยังไม่ได้ migrate (ไม่มีตาราง users)" : "ต่อฐานข้อมูลไม่ได้", code: err.code ?? null }, 503);
  }
});
app.route("/auth", authRoutes);
app.route("/admin", adminRoutes);
app.route("/files", fileRoutes);
app.route("/questions", questionRoutes);

// บอก path ที่ server เห็นด้วย ช่วยตรวจว่า rewrite ของ Vercel ส่ง path เดิมมาครบไหม
app.notFound((c) => c.json({ error: "ไม่พบ", path: c.req.path }, 404));
app.onError(errorHandler);
