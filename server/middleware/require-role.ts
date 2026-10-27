import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { env } from "../config/env";
import type { Role } from "../db/schema";
import { readSessionToken, SESSION_COOKIE } from "../lib/session";
import { authService } from "../services/auth.service";

export type AuthVars = { Variables: { user: { id: number; username: string; role: Role; superAdmin: boolean } } };

// บัตรผ่านอายุ 12 ชม. แต่ API ยังเช็กกับ DB ทุกครั้ง ปิดบัญชีแล้วเรียก API ไม่ได้ทันที
// (หน้าเว็บที่ middleware.ts ล็อกเช็กแค่บัตร จะเปิดได้จนบัตรหมดอายุ)
export function requireRole(...roles: Role[]) {
  return async (c: Context<AuthVars>, next: Next) => {
    const session = await readSessionToken(getCookie(c, SESSION_COOKIE), env.SESSION_SECRET);
    const user = session && (await authService.activeUser(session.userId, session.ver));
    if (!user) return c.json({ error: "ต้อง login ก่อน" }, 401);
    // ยังใช้ PIN ชั่วคราวอยู่: ทำอะไรไม่ได้จนกว่าจะตั้งรหัสผ่าน (หน้า /set-password เรียก /auth/password ซึ่งไม่ผ่านด่านนี้)
    if (user.mustSetPassword) return c.json({ error: "ตั้งรหัสผ่านของตัวเองก่อนใช้งาน (PIN ใช้ได้แค่ครั้งแรก)", code: "MUST_SET_PASSWORD" }, 403);
    if (!roles.includes(user.role)) return c.json({ error: "ไม่มีสิทธิ์" }, 403);
    c.set("user", { id: user.id, username: user.username, role: user.role, superAdmin: user.superAdmin });
    await next();
  };
}
