// กฎของช่องติดต่อในโปรไฟล์พี่เลี้ยง ใช้ทั้งฟอร์ม (บอกผิดทันทีใต้ช่อง) และ server (ด่านจริง ยิง API ตรงก็ผ่านไม่ได้)
// คืนข้อความที่ผิด หรือ null ถ้าถูก/ว่าง (ทุกช่องไม่บังคับ)

// เบอร์ไทย 0 นำหน้า 9–10 หลัก (บ้าน 02-xxx-xxxx = 9 หลัก, มือถือ 08x = 10 หลัก)
// หรือเบอร์สากล + ตามด้วย 10–15 หลัก (เช่น +66 81 234 5678) · ขีด ช่องว่าง วงเล็บ ใส่ได้ ไม่นับเป็นหลัก
export function phoneProblem(v: string | null | undefined) {
  if (!v) return null;
  if (!/^\+?[\d\s()-]+$/.test(v)) return "เบอร์โทรใส่ได้แค่ตัวเลข ขีด ช่องว่าง และ + นำหน้า";
  const digits = v.replace(/\D/g, "");
  if (v.trim().startsWith("+")) return digits.length >= 10 && digits.length <= 15 ? null : "เบอร์สากล (+) ต้องมี 10–15 หลัก";
  return /^0\d{8,9}$/.test(digits) ? null : "เบอร์ไทยขึ้นต้นด้วย 0 และมี 9–10 หลัก เช่น 081-234-5678";
}

// อีเมล: ชื่อ@โดเมน.นามสกุล ตัวอังกฤษ ตัวเลข . _ % + - (แบบที่ผู้ให้บริการอีเมลทั่วไปรับ) ยาวไม่เกิน 254 ตัว (เพดานของมาตรฐานอีเมล RFC 5321)
// ไม่รับภาษาไทย: อีเมลไทยมีในมาตรฐานแต่ระบบส่วนใหญ่ส่งไม่ถึง ใส่ไว้แล้วพี่เลี้ยงติดต่อไม่ได้
export function emailProblem(v: string | null | undefined) {
  if (!v) return null;
  if (v.length > 254) return "อีเมลยาวไม่เกิน 254 ตัว";
  return /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(v) ? null : "อีเมลต้องเป็นแบบ ชื่อ@โดเมน เช่น somchai@gmail.com (ตัวอังกฤษเท่านั้น)";
}

// LINE ID: ตัวอังกฤษพิมพ์เล็ก ตัวเลข . _ - ยาว 4–20 (กติกาของ LINE เอง ภาษาไทยตั้งเป็น ID ไม่ได้)
export function lineProblem(v: string | null | undefined) {
  if (!v) return null;
  return /^[a-z0-9._-]{4,20}$/i.test(v) ? null : "LINE ID ใช้ได้แค่ตัวอังกฤษ ตัวเลข . _ - ยาว 4–20 ตัว";
}

// Instagram: ตัวอังกฤษ ตัวเลข . _ ไม่เกิน 30 ตัว (@ นำหน้าใส่ได้)
export function instagramProblem(v: string | null | undefined) {
  if (!v) return null;
  return /^@?[a-z0-9._]{1,30}$/i.test(v) ? null : "Instagram ใช้ได้แค่ตัวอังกฤษ ตัวเลข . _ ไม่เกิน 30 ตัว";
}

// Facebook: ลิงก์ facebook.com/... หรือชื่อผู้ใช้ภาษาอังกฤษ (ตัวอังกฤษ ตัวเลข จุด อย่างน้อย 5 ตัว)
export function facebookProblem(v: string | null | undefined) {
  if (!v) return null;
  if (/^(https?:\/\/)?(www\.|m\.)?(facebook|fb)\.com\/\S+$/i.test(v)) return null;
  return /^[a-z0-9.]{5,50}$/i.test(v) ? null : "Facebook ใส่ลิงก์ facebook.com/... หรือชื่อผู้ใช้ภาษาอังกฤษ";
}

// LINE · IG · Facebook ต่อกันบรรทัดเดียว (ข้ามช่องที่ว่าง) ใช้ทั้งการ์ดพี่เลี้ยงและหน้าน้องรายคนในหลังบ้าน
type Socials = { lineId?: string | null; instagram?: string | null; facebook?: string | null };
export const socialOf = (m: Socials) =>
  [m.lineId && `LINE: ${m.lineId}`, m.instagram && `IG: ${m.instagram}`, m.facebook && `Facebook: ${m.facebook}`].filter(Boolean).join(" · ");

export const CONTACT_RULES = { phone: phoneProblem, email: emailProblem, lineId: lineProblem, instagram: instagramProblem, facebook: facebookProblem } as const;
