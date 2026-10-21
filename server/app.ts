import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";
import { fileRoutes } from "./routes/file.routes";

// โครงแบบแบ่งตามหน้าที่ (Layered / MVC): routes → services → repositories → db
export const app = new Hono().basePath("/api");

app.use("*", csrf({ origin: env.APP_ORIGIN }));
app.route("/auth", authRoutes);
app.route("/admin", adminRoutes);
app.route("/files", fileRoutes);

app.notFound((c) => c.json({ error: "ไม่พบ" }, 404));
app.onError(errorHandler);
