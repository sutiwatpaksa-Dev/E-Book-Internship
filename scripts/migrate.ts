// ใช้แทน `drizzle-kit migrate` ตอน build บน Vercel
// drizzle-kit ซ่อน error จริงไว้หลัง spinner ใน build log เห็นแค่ "exited with 1"
// สคริปต์นี้ทำงานเหมือนกัน แต่พิมพ์ข้อความ error ของ Postgres ออกมาให้อ่านได้
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// ต่อฐานเดียวกับ drizzle.config.ts: ตัด "-pooler" ออก เพราะคำสั่งสร้าง/แก้ตารางไม่ควรผ่าน pgbouncer
const url = new URL(process.env.DATABASE_URL!);
url.hostname = url.hostname.replace("-pooler.", ".");
console.log(`migrate → ${url.host}${url.pathname}`);

const db = drizzle(url.toString());

try {
  await migrate(db, { migrationsFolder: "./server/db/migrations" });
  console.log("✅ migrate เสร็จ");
  process.exit(0);
} catch (err) {
  // error ของ Postgres มักห่ออยู่ใน cause: code / detail บอกว่าพังที่ตารางหรือคำสั่งไหน
  const cause = (err as { cause?: { code?: string; message?: string; detail?: string } }).cause;
  console.error("❌ migrate ไม่สำเร็จ:", err instanceof Error ? err.message : err);
  if (cause) console.error("   Postgres:", cause.code, cause.message, cause.detail ?? "");
  process.exit(1);
}
