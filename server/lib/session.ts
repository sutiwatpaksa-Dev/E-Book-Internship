import { sign, verify } from "hono/jwt";
import type { Role } from "../db/schema";

// ไฟล์นี้ใช้ทั้งใน API (Hono) และด่านตรวจหน้าเว็บ (src/lib/require-page-access.ts) จึงรับ secret เป็นพารามิเตอร์ ไม่ import env ทั้งก้อน
export const SESSION_COOKIE = "bt_session";
// cookie ที่ JavaScript อ่านได้ บอกหน้าเว็บแค่ว่า login เป็น role อะไร (ใช้แสดงปุ่ม ไม่ได้ใช้ตัดสินสิทธิ์)
export const ROLE_HINT_COOKIE = "bt_role";
export const SESSION_SECONDS = 12 * 60 * 60;

// ver = เลขรอบของบัตร (ต้องตรงกับ users.session_version ใน DB) · tmp = login ด้วย PIN ชั่วคราว ต้องตั้งรหัสผ่านก่อน
export type Session = { userId: number; username: string; role: Role; ver: number; tmp: boolean };

export function createSessionToken(s: Session, secret: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return sign({ sub: String(s.userId), username: s.username, role: s.role, ver: s.ver, tmp: s.tmp, exp }, secret, "HS256");
}

export async function readSessionToken(token: string | undefined, secret: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const p = await verify(token, secret, "HS256"); // ตรวจลายเซ็น + exp
    if (p.role !== "intern" && p.role !== "dev") return null;
    // บัตรที่ออกก่อนมี ver/tmp: ถือเป็นรอบ 0 (ค่าเริ่มของคอลัมน์) ไม่ต้องให้ทุกคน login ใหม่ตอนอัปเดต
    return { userId: Number(p.sub), username: String(p.username), role: p.role, ver: Number(p.ver ?? 0), tmp: p.tmp === true };
  } catch {
    return null;
  }
}
