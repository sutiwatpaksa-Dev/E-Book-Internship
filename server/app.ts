import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { HTTPException } from "hono/http-exception";
import { env } from "./env";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { fileRoutes } from "./routes/files";

export const app = new Hono().basePath("/api");

app.use("*", csrf({ origin: env.APP_ORIGIN }));
app.route("/auth", authRoutes);
app.route("/admin", adminRoutes);
app.route("/files", fileRoutes);

app.notFound((c) => c.json({ error: "ไม่พบ" }, 404));
app.onError((err, c) => {
  // ด่าน csrf ตอบ 403 โดยไม่มีข้อความ เติมให้อ่านรู้เรื่อง
  if (err instanceof HTTPException) return c.json({ error: err.message || "คำขอนี้ไม่ได้มาจากหน้าเว็บของเรา" }, err.status);
  console.error(err);
  return c.json({ error: "ระบบขัดข้อง" }, 500);
});
