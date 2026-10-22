import { defineConfig } from "drizzle-kit";

// migrate ฐานเดียวกับที่เว็บใช้เสมอ: อ่านจาก DATABASE_URL ตัวเดียว
// (เคยใช้ DATABASE_URL_UNPOOLED แยก แล้ว Preview ได้ DATABASE_URL คนละฐาน ตารางจึงไปอยู่ผิดที่)
// Neon: host ที่มี "-pooler" ผ่าน pgbouncer ไม่เหมาะกับคำสั่งสร้าง/แก้ตาราง ตัด "-pooler" ออกก็คือต่อตรงเข้าฐานเดียวกัน
const url = new URL(process.env.DATABASE_URL!);
url.hostname = url.hostname.replace("-pooler.", ".");
// พิมพ์แค่ host + ชื่อฐาน (ไม่มีรหัสผ่าน) ให้เห็นใน build log ว่า migrate ไปที่ไหน
console.log(`migrate → ${url.host}${url.pathname}`);

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: url.toString() },
});
