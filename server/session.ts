import { sign, verify } from "hono/jwt";
import type { Role } from "./db/schema";

// ไฟล์นี้ใช้ทั้งใน API และ middleware จึงรับ secret เป็นพารามิเตอร์ ไม่ import env ทั้งก้อน
export const SESSION_COOKIE = "bt_session";
// cookie ที่ JavaScript อ่านได้ บอกหน้าเว็บแค่ว่า login เป็น role อะไร (ใช้แสดงปุ่ม ไม่ได้ใช้ตัดสินสิทธิ์)
export const ROLE_HINT_COOKIE = "bt_role";
export const SESSION_SECONDS = 12 * 60 * 60;

export type Session = { userId: number; username: string; role: Role };

export function createSessionToken(s: Session, secret: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return sign({ sub: String(s.userId), username: s.username, role: s.role, exp }, secret, "HS256");
}

export async function readSessionToken(token: string | undefined, secret: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const p = await verify(token, secret, "HS256"); // ตรวจลายเซ็น + exp
    if (p.role !== "intern" && p.role !== "dev") return null;
    return { userId: Number(p.sub), username: String(p.username), role: p.role };
  } catch {
    return null;
  }
}

export function readCookie(header: string | null, name: string) {
  for (const part of (header ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}
