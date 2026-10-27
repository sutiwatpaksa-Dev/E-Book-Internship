import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { env } from "../config/env";
import type { Role } from "../db/schema";
import { createSessionToken, readSessionToken, ROLE_HINT_COOKIE, SESSION_COOKIE, SESSION_SECONDS } from "../lib/session";
import { authService } from "../services/auth.service";
import { registerService } from "../services/register.service";
import { loginSchema, setPasswordSchema } from "../validators/auth.validator";
import { inviteCodeSchema, registerSchema } from "../validators/register.validator";

const secure = env.APP_ORIGIN.startsWith("https://");
const cookieBase = { path: "/", secure, sameSite: "Lax" as const, maxAge: SESSION_SECONDS };

// Vercel ใส่ IP จริงของผู้ใช้ไว้ใน x-real-ip (ผู้ใช้ปลอม header นี้ผ่าน Vercel ไม่ได้)
const clientIp = (h: (n: string) => string | undefined) => h("x-real-ip") ?? h("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

export const authRoutes = new Hono();

// ออกบัตรผ่านให้เครื่องนี้ (ใช้ทั้งตอน login และหลังตั้งรหัสผ่าน ซึ่งบัตรเดิมหมดรอบไปแล้ว)
async function issue(c: Context, u: { id: number; username: string; role: Role; ver: number; tmp: boolean }, status: 200 | 201 = 200) {
  const token = await createSessionToken({ userId: u.id, username: u.username, role: u.role, ver: u.ver, tmp: u.tmp }, env.SESSION_SECRET);
  setCookie(c, SESSION_COOKIE, token, { ...cookieBase, httpOnly: true });
  setCookie(c, ROLE_HINT_COOKIE, u.role, cookieBase);
  return c.json({ username: u.username, role: u.role, mustSetPassword: u.tmp }, status);
}

authRoutes.post("/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "กรอกชื่อผู้ใช้ และ PIN 6 หลัก หรือรหัสผ่าน (10 ตัวขึ้นไป)" }, 400);
  return issue(c, await authService.login(parsed.data.username, parsed.data.secret, clientIp((n) => c.req.header(n))));
});

// ตั้ง/เปลี่ยนรหัสผ่าน · ไม่ผ่าน requireRole เพราะคนที่ยังถือ PIN ชั่วคราวต้องเรียกได้ (ด่านนั้นกันเขาไว้)
authRoutes.post("/password", async (c) => {
  const session = await readSessionToken(getCookie(c, SESSION_COOKIE), env.SESSION_SECRET);
  if (!session || !(await authService.activeUser(session.userId, session.ver))) return c.json({ error: "ต้อง login ก่อน" }, 401);
  const parsed = setPasswordSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "กรอกรหัสผ่านใหม่" }, 400);
  return issue(c, await authService.setPassword(session.userId, parsed.data.current, parsed.data.password));
});

// สมัครด้วยรหัสรุ่น ขั้นที่ 1: รหัสใช้ได้ไหม (ผิดนับรวมกับขั้นที่ 2 ต่อ IP)
authRoutes.post("/register/check", async (c) => {
  const parsed = inviteCodeSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "กรอกรหัสรุ่นที่พี่เลี้ยงส่งให้" }, 400);
  return c.json(await registerService.check(parsed.data.code, clientIp((n) => c.req.header(n))));
});

// ขั้นที่ 2: สร้างบัญชีแล้ว login ให้เลย (ไม่ต้องกรอกซ้ำที่หน้า login)
authRoutes.post("/register", async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "ข้อมูลไม่ครบ: ชื่อผู้ใช้ (a-z 0-9 . _ - ยาว 3 ตัวขึ้นไป), ชื่อ-นามสกุล, ประเภทและชื่อสถานศึกษา, ระดับการศึกษา" }, 400);
  return issue(c, await registerService.register(parsed.data, clientIp((n) => c.req.header(n))), 201);
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  deleteCookie(c, ROLE_HINT_COOKIE, { path: "/" });
  return c.body(null, 204);
});

authRoutes.get("/me", async (c) => {
  const session = await readSessionToken(getCookie(c, SESSION_COOKIE), env.SESSION_SECRET);
  // ตรวจกับ DB ด้วย: เปลี่ยนรหัสผ่านจากเครื่องอื่นแล้ว เครื่องนี้ต้องเห็นว่าหลุด (เมนูบัญชีจะพา logout)
  const user = session && (await authService.activeUser(session.userId, session.ver));
  if (!session || !user) return c.json({ error: "ยังไม่ได้ login" }, 401);
  return c.json({ username: session.username, role: session.role, mustSetPassword: user.mustSetPassword });
});
