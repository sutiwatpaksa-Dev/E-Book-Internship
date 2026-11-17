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


// ---- วินิจฉัยชั่วคราว (อ่านอย่างเดียว ลบออกหลังใช้) ----
// พิมพ์ว่า build นี้ต่อฐานไหน (เฉพาะชื่อ endpoint แรกของ host และชื่อฐาน ไม่มีรหัสผ่าน) และสรุปข้อมูลโจทย์/งานที่ส่ง
try {
  const pg = await import("pg");
  const client = new pg.default.Client({ connectionString: url.toString() });
  await client.connect();
  const q = async (label: string, sql: string) => {
    try {
      const r = await client.query(sql);
      console.log(`DIAG ${label}:`, JSON.stringify(r.rows));
    } catch (e) {
      console.log(`DIAG ${label}: error`, (e as Error).message);
    }
  };
  console.log("DIAG endpoint:", url.hostname.split(".")[0], "| db:", url.pathname.slice(1));
  await q("assignments", "SELECT id, slug, archived_at FROM assignments ORDER BY id");
  await q("submissions_by_assignment", "SELECT assignment_id, count(*)::int AS n FROM submissions GROUP BY assignment_id ORDER BY 1");
  await q("cohort_assignments", "SELECT cohort_id, assignment_id FROM cohort_assignments ORDER BY 1, 2");
  await q("users", "SELECT count(*)::int AS total, count(*) FILTER (WHERE username IN ('poom','ohm'))::int AS poom_ohm FROM users");
  await q("applied_migrations", "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations");
  await client.end();
} catch (e) {
  console.log("DIAG failed:", (e as Error).message);
}
// ---- จบวินิจฉัย ----

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
