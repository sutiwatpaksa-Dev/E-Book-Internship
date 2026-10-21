import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { users, type Role } from "./db/schema";
import { env } from "./env";
import { readSessionToken, SESSION_COOKIE } from "./session";

export type AuthVars = { Variables: { user: { id: number; username: string; role: Role } } };

// บัตรผ่านอายุ 12 ชม. แต่ API ยังเช็กกับ DB ทุกครั้ง ปิดบัญชีแล้วเรียก API ไม่ได้ทันที
// (หน้าเว็บที่ middleware ล็อกเช็กแค่บัตร จะเปิดได้จนบัตรหมดอายุ)
export function requireRole(...roles: Role[]) {
  return async (c: Context<AuthVars>, next: Next) => {
    const session = await readSessionToken(getCookie(c, SESSION_COOKIE), env.SESSION_SECRET);
    if (!session) return c.json({ error: "ต้อง login ก่อน" }, 401);
    const [u] = await db.select().from(users).where(eq(users.id, session.userId));
    if (!u || u.disabled) return c.json({ error: "ต้อง login ก่อน" }, 401);
    if (!roles.includes(u.role)) return c.json({ error: "ไม่มีสิทธิ์" }, 403);
    c.set("user", { id: u.id, username: u.username, role: u.role });
    await next();
  };
}
