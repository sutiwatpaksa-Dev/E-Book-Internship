import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { env } from "../config/env";
import { createSessionToken, readSessionToken, ROLE_HINT_COOKIE, SESSION_COOKIE, SESSION_SECONDS } from "../lib/session";
import { authService } from "../services/auth.service";
import { loginSchema } from "../validators/auth.validator";

const secure = env.APP_ORIGIN.startsWith("https://");
const cookieBase = { path: "/", secure, sameSite: "Lax" as const, maxAge: SESSION_SECONDS };

// Vercel ใส่ IP จริงของผู้ใช้ไว้ใน x-real-ip (ผู้ใช้ปลอม header นี้ผ่าน Vercel ไม่ได้)
const clientIp = (h: (n: string) => string | undefined) => h("x-real-ip") ?? h("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "กรอก username และ PIN 6 หลัก" }, 400);
  const user = await authService.login(parsed.data.username, parsed.data.pin, clientIp((n) => c.req.header(n)));
  const token = await createSessionToken({ userId: user.id, username: user.username, role: user.role }, env.SESSION_SECRET);
  setCookie(c, SESSION_COOKIE, token, { ...cookieBase, httpOnly: true });
  setCookie(c, ROLE_HINT_COOKIE, user.role, cookieBase);
  return c.json({ username: user.username, role: user.role });
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  deleteCookie(c, ROLE_HINT_COOKIE, { path: "/" });
  return c.body(null, 204);
});

authRoutes.get("/me", async (c) => {
  const session = await readSessionToken(getCookie(c, SESSION_COOKIE), env.SESSION_SECRET);
  if (!session) return c.json({ error: "ยังไม่ได้ login" }, 401);
  return c.json({ username: session.username, role: session.role });
});
