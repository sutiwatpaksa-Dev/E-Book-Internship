// ใช้แทน `drizzle-kit migrate` ตอน build บน Vercel
// drizzle-kit ซ่อน error จริงไว้หลัง spinner ใน build log เห็นแค่ "exited with 1"
// สคริปต์นี้ทำงานเหมือนกัน แต่พิมพ์ข้อความ error ของ Postgres ออกมาให้อ่านได้
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { baseline } from "./migrate-baseline";

// ต่อฐานเดียวกับ drizzle.config.ts: ตัด "-pooler" ออก เพราะคำสั่งสร้าง/แก้ตารางไม่ควรผ่าน pgbouncer
const url = new URL(process.env.DATABASE_URL!);
url.hostname = url.hostname.replace("-pooler.", ".");
console.log(`migrate → ${url.host}${url.pathname}`);

// ซ่อมสมุดจด migration เองได้เฉพาะ preview ของ branch dev ซึ่งมีฐานของตัวเอง
// preview branch อื่นใช้ฐานเดียวกับเว็บจริง และ production ต้องให้คนมาดูเองเสมอ
const canHeal = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "dev";

const run = () => migrate(drizzle(url.toString()), { migrationsFolder: "./server/db/migrations" });

try {
  try {
    await run();
  } catch (err) {
    const code = (err as { cause?: { code?: string } }).cause?.code;
    if (code !== "42P07" || !canHeal) throw err;
    // 42P07 = ตารางมีแล้วแต่สมุดไม่ได้จด: ตรวจทุกจุดก่อน ตรงครบถึงเติมบันทึกแล้ว migrate อีกรอบ
    console.log("⚠️  42P07 บน preview ของ dev: ตรวจว่าเติมบันทึก migration ที่ขาดได้ไหม");
    if ((await baseline(url.toString(), true)) !== "applied") throw err;
    await run();
  }
  console.log("✅ migrate เสร็จ");
  process.exit(0);
} catch (err) {
  // error ของ Postgres มักห่ออยู่ใน cause: code / detail บอกว่าพังที่ตารางหรือคำสั่งไหน
  const cause = (err as { cause?: { code?: string; message?: string; detail?: string } }).cause;
  console.error("❌ migrate ไม่สำเร็จ:", err instanceof Error ? err.message : err);
  if (cause) console.error("   Postgres:", cause.code, cause.message, cause.detail ?? "");
  process.exit(1);
}
