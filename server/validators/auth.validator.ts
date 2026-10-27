import { z } from "zod";

// ช่องเดียวรับได้ทั้ง PIN ชั่วคราว 6 หลัก และรหัสผ่านที่ตั้งเอง (10 ตัวขึ้นไป)
// รับชื่อเก่า "pin" ด้วย: แท็บที่เปิดค้างไว้ก่อนอัปเดตยังส่งชื่อนี้มา จะได้ไม่ login พังกลางทาง
export const loginSchema = z
  .object({
    username: z.string().trim().toLowerCase().min(1).max(64),
    secret: z.string().max(128).optional(),
    pin: z.string().max(128).optional(),
  })
  .transform((v) => ({ username: v.username, secret: v.secret ?? v.pin ?? "" }))
  .refine((v) => /^\d{6}$/.test(v.secret) || v.secret.length >= PASSWORD_MIN);

export const PASSWORD_MIN = 10;

// กติการหัสผ่าน: ยาว 10–128 · ห้ามมีชื่อผู้ใช้อยู่ในนั้น · ห้ามเป็นตัวเดียวซ้ำทั้งหมด (เช่น aaaaaaaaaa)
// ไม่บังคับตัวพิมพ์ใหญ่/สัญลักษณ์: ยาวช่วยได้มากกว่า และคนจำวลียาวๆ ได้ง่ายกว่ารหัสสั้นที่ซับซ้อน
export function passwordProblem(password: string, username: string) {
  if (password.length < PASSWORD_MIN) return `ยาวอย่างน้อย ${PASSWORD_MIN} ตัวอักษร`;
  if (password.length > 128) return "ยาวไม่เกิน 128 ตัวอักษร";
  if (/^(.)\1+$/.test(password)) return "ห้ามเป็นตัวเดียวซ้ำทั้งหมด";
  if (password.toLowerCase().includes(username.toLowerCase())) return "ห้ามมีชื่อผู้ใช้อยู่ในรหัสผ่าน";
  return null;
}

// current ว่างได้เฉพาะตอนเปลี่ยนจาก PIN ชั่วคราว (service ตัดสินจากชนิดรหัสใน DB ไม่เชื่อที่หน้าเว็บส่งมา)
export const setPasswordSchema = z.object({
  current: z.string().max(128).optional(),
  password: z.string().min(1).max(128),
});
