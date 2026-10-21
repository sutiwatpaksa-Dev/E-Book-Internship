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
});

export const env = schema.parse(process.env);
