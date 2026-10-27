import { z } from "zod";

// อ่านค่าตั้งค่าครั้งเดียวตอนเริ่ม ขาดตัวไหนให้ล้มตั้งแต่ต้น ดีกว่าไปพังกลางคำขอของผู้ใช้
const schema = z.object({
  DATABASE_URL: z.string().url(),
  // ใช้เซ็นบัตรผ่าน (JWT) ยาวอย่างน้อย 32 ตัว สร้างด้วย: openssl rand -base64 48
  SESSION_SECRET: z.string().min(32),
  // หน้าเว็บของเราเอง ด่าน CSRF ยอมเฉพาะคำขอจาก origin นี้
  APP_ORIGIN: z.string().url(),
  // repo ตัวอย่างระบบจริง แสดงหลัง login (เก็บใน env ไม่ใส่ใน repo สาธารณะ) ยังไม่ตั้งก็ได้
  EXAMPLE_REPO_URL: z.string().url().optional(),
  // บัญชี Dev คนแรก: ระบบสร้างให้เองตอนมีคน login ครั้งแรก ถ้ายังไม่มี Dev สักคน (ไม่ต้องต่อ DB จากเครื่องเรา)
  // มี Dev แล้วค่านี้ไม่ถูกใช้อีก ลบออกจาก env ได้ · PIN ตั้งเป็น Sensitive ใน Vercel
  FIRST_DEV_USERNAME: z.string().min(1).optional(),
  FIRST_DEV_PIN: z.string().regex(/^\d{6}$/).optional(),
  // Super admin คนแรกของฐานที่มีพี่เลี้ยงอยู่แล้ว (เช่นหลัง migration 0008): ใส่ชื่อบัญชีพี่เลี้ยงที่มีอยู่
  // ใช้ได้เฉพาะตอนฐานยังไม่มี Super admin สักคน มีแล้วค่านี้ไม่ถูกใช้อีก ลบออกจาก env ได้
  FIRST_SUPER_ADMIN: z.string().min(1).optional(),
});

// บอก "รูปร่าง" ของค่าที่ผิด ไม่บอกค่าจริง (อาจเป็นความลับ): พอให้รู้ว่าว่าง ติดอะไรมาหัวท้าย หรือมีอักขระแปลก
// บอกต้นค่าเฉพาะ scheme ของ URL (เช่น "postgres") · ค่าที่ไม่มี "://" (PIN, secret) ไม่บอกสักตัว
// เพราะ PIN 6 หลักทั้งค่าสั้นกว่า 15 ตัว ถ้าตัดหัวมาโชว์ก็คือโชว์ PIN ทั้งหมด
function describe(value: string | undefined) {
  if (value === undefined) return "ไม่ได้ตั้ง";
  if (value === "") return "ค่าว่าง";
  const head = value.includes("://") ? `ขึ้นต้น "${value.split("://")[0].slice(0, 15)}://"` : "";
  const odd = [
    /\s/.test(value) && "มีช่องว่าง/ขึ้นบรรทัด",
    /['"]/.test(value) && "มีเครื่องหมายคำพูด",
    /[^\x20-\x7e]/.test(value) && "มีอักขระที่มองไม่เห็นหรือไม่ใช่ ASCII",
  ].filter(Boolean);
  return [`ยาว ${value.length} ตัว`, head, ...odd].filter(Boolean).join(" · ");
}

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const keys = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
  const detail = keys.map((k) => `${k} (${describe(process.env[k])})`);
  throw new Error(`ENV_INVALID: ${detail.join(", ")}`);
}
export const env = parsed.data;
