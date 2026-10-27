import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

// service โยนรหัสข้อผิดพลาด (ไม่รู้จัก HTTP) ตรงนี้แปลงรหัสเป็น status + ข้อความที่ผู้ใช้อ่าน
const KNOWN: Record<string, [ContentfulStatusCode, string]> = {
  INVALID_LOGIN: [401, "ชื่อผู้ใช้ หรือ PIN/รหัสผ่านไม่ถูกต้อง หรือบัญชีถูกล็อกชั่วคราว ลองใหม่ภายหลังหรือติดต่อพี่เลี้ยง"],
  MUST_SET_PASSWORD: [403, "ตั้งรหัสผ่านของตัวเองก่อนใช้งาน (PIN ใช้ได้แค่ครั้งแรก)"],
  WRONG_PASSWORD: [400, "รหัสผ่านเดิมไม่ถูกต้อง"],
  SAME_PASSWORD: [400, "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม"],
  WEAK_PASSWORD: [400, "รหัสผ่านนี้ใช้ไม่ได้"],
  TOO_MANY_ATTEMPTS: [429, "ลองผิดหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่"],
  USERNAME_TAKEN: [409, "มี username นี้แล้ว"],
  NOT_FOUND: [404, "ไม่พบบัญชี"],
  CANNOT_CHANGE_SELF: [400, "ปิดหรือลดสิทธิ์บัญชีตัวเองไม่ได้"],
  SUPER_ADMIN_ONLY: [403, "บัญชีพี่เลี้ยงจัดการได้เฉพาะ Super admin (สร้าง เปลี่ยนบทบาท ปิด หรือออก PIN ใหม่)"],
  FILE_SIZE: [413, "ไฟล์ต้องไม่ว่างและไม่เกิน 4 MB"],
  NOT_PDF: [415, "ไฟล์นี้ไม่ใช่ PDF"],
  TOO_MANY_OPEN_THREADS: [429, "มีเรื่องที่ยังไม่จบครบ 10 เรื่องแล้ว คุยต่อในเรื่องเดิม หรือรอพี่เลี้ยงปิดเรื่องก่อน"],
  THREAD_NOT_FOUND: [404, "ไม่พบเรื่องนี้"],
  INVALID_STATUS: [400, "สถานะนี้ใช้กับเรื่องประเภทนี้ไม่ได้"],
  NOTE_REQUIRED: [400, "ถ้าไม่ทำ ให้เขียนเหตุผลบอกน้องด้วย"],
  UNKNOWN_CHAPTER: [400, "ไม่มีบทนี้ในแผนการเรียน"],
  CARD_NOT_FOUND: [404, "ไม่พบการ์ดนี้"],
  SLUG_TAKEN: [409, "มีการ์ดที่ใช้ชื่อใน URL นี้แล้ว ลองชื่ออื่น"],
  UNKNOWN_NEED: [400, "การ์ด \"อ่านก่อน\" บางใบไม่มีในระบบ หรือชี้กลับมาที่การ์ดนี้เอง"],
  NOTE_NOT_FOUND: [404, "ไม่พบโน้ตนี้"],
  ANNOUNCEMENT_NOT_FOUND: [404, "ไม่พบประกาศนี้"],
  INVALID_PERIOD: [400, "เวลาจบต้องอยู่หลังเวลาเริ่ม"],
  COHORT_NOT_FOUND: [404, "ไม่พบรุ่นนี้"],
  NOT_A_MENTOR: [400, "เลือกได้เฉพาะบัญชีพี่เลี้ยงที่ยังเปิดใช้"],
  COHORT_ENDED: [403, "รุ่นของคุณจบแล้ว ยังอ่านคู่มือได้ แต่เปิดเรื่องถามใหม่ไม่ได้ ติดต่อพี่เลี้ยงทางกลุ่มแทน"],
};

export function errorHandler(err: Error, c: Context) {
  // ด่าน csrf ตอบ 403 โดยไม่มีข้อความ เติมให้อ่านรู้เรื่อง
  if (err instanceof HTTPException) return c.json({ error: err.message || "คำขอนี้ไม่ได้มาจากหน้าเว็บของเรา" }, err.status);
  const known = KNOWN[err.message];
  // detail = เหตุผลเฉพาะเรื่องที่ service แนบมา (เช่น รหัสผ่านสั้นไป) ต่อท้ายให้รู้ว่าต้องแก้อะไร
  const detail = (err as Error & { detail?: string }).detail;
  if (known) return c.json({ error: detail ? `${known[1]}: ${detail}` : known[1] }, known[0]);
  console.error(err);
  return c.json({ error: "ระบบขัดข้อง" }, 500);
}
