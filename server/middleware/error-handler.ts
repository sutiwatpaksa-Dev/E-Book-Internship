import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

// service โยนรหัสข้อผิดพลาด (ไม่รู้จัก HTTP) ตรงนี้แปลงรหัสเป็น status + ข้อความที่ผู้ใช้อ่าน
const KNOWN: Record<string, [ContentfulStatusCode, string]> = {
  INVALID_LOGIN: [401, "username หรือ PIN ไม่ถูกต้อง หรือบัญชีถูกล็อกชั่วคราว ลองใหม่ภายหลังหรือติดต่อพี่เลี้ยง"],
  TOO_MANY_ATTEMPTS: [429, "ลองผิดหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่"],
  USERNAME_TAKEN: [409, "มี username นี้แล้ว"],
  NOT_FOUND: [404, "ไม่พบบัญชี"],
  CANNOT_CHANGE_SELF: [400, "ปิดหรือลดสิทธิ์บัญชีตัวเองไม่ได้"],
  FILE_SIZE: [413, "ไฟล์ต้องไม่ว่างและไม่เกิน 4 MB"],
  NOT_PDF: [415, "ไฟล์นี้ไม่ใช่ PDF"],
  TOO_MANY_OPEN_THREADS: [429, "มีเรื่องที่ยังไม่จบครบ 10 เรื่องแล้ว คุยต่อในเรื่องเดิม หรือรอพี่เลี้ยงปิดเรื่องก่อน"],
  THREAD_NOT_FOUND: [404, "ไม่พบเรื่องนี้"],
  INVALID_STATUS: [400, "สถานะนี้ใช้กับเรื่องประเภทนี้ไม่ได้"],
  NOTE_REQUIRED: [400, "ถ้าไม่ทำ ให้เขียนเหตุผลบอกน้องด้วย"],
};

export function errorHandler(err: Error, c: Context) {
  // ด่าน csrf ตอบ 403 โดยไม่มีข้อความ เติมให้อ่านรู้เรื่อง
  if (err instanceof HTTPException) return c.json({ error: err.message || "คำขอนี้ไม่ได้มาจากหน้าเว็บของเรา" }, err.status);
  const known = KNOWN[err.message];
  if (known) return c.json({ error: known[1] }, known[0]);
  console.error(err);
  return c.json({ error: "ระบบขัดข้อง" }, 500);
}
