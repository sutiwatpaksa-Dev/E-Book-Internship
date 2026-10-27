import { createHash, randomInt } from "node:crypto";

// ตัดตัวที่อ่านสับสนออก (0/O, 1/I/L) คนพิมพ์ตามจากแชทจะได้ไม่ผิด
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// รหัสรุ่น 8 ตัว เช่น "K7QM-3XPA" (31^8 ≈ 8.5 แสนล้านแบบ) · randomInt มาจากตัวสุ่มที่ใช้กับงานความปลอดภัยได้
export function newInviteCode() {
  const c = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

// คนพิมพ์ตัวเล็ก เว้นวรรค หรือไม่ใส่ขีด ก็ยังเป็นรหัสเดียวกัน
export const normalizeInvite = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

// ใช้ SHA-256 ไม่ใช่ Bun.password แบบ PIN: รหัสนี้ระบบสุ่มเอง (เดายากมาก ไม่ใช่คำที่คนคิด)
// hash แบบเร็วจึงพอ และได้ค่าเดิมทุกครั้ง ค้นรุ่นจาก hash ได้ตรงๆ (bcrypt/argon2 ใส่เกลือ ค้นแบบนี้ไม่ได้)
export const hashInvite = (code: string) => createHash("sha256").update(normalizeInvite(code)).digest("hex");
