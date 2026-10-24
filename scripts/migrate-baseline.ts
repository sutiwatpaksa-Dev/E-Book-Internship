// แก้ migrate ล้มด้วย 42P07 (ตารางมีอยู่แล้ว แต่สมุดจด migration ไม่ได้จดไว้)
// มักเกิดเมื่อมีคนใช้ `drizzle-kit push` กับฐานที่ใช้ร่วมกัน ตารางถูกสร้างแต่ไม่มีบันทึก
//
// เทียบตารางในฐานกับ snapshot ของไฟล์ migration ทุกจุด ตรงครบถึงจะเติมบันทึกให้ได้
// ไม่ตรงแม้จุดเดียว = ไม่เขียนอะไร เพราะการเติมบันทึกจะกลบความต่างไว้ แล้วไปพังทีหลังแบบหาสาเหตุยาก
//
// scripts/migrate.ts เรียกตัวนี้เองตอน build preview ของ branch dev (production ไม่เรียก)
// รันมือก็ได้ ค่าเริ่มต้นอ่านอย่างเดียว ใส่ --apply ถึงจะเขียน:
//   bun --env-file=.env.preview scripts/migrate-baseline.ts [--apply]
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "pg";

const DIR = "./server/db/migrations";

type Entry = { idx: number; when: number; tag: string };
type Snapshot = {
  tables: Record<
    string,
    {
      name: string;
      columns: Record<string, { name: string; type: string; notNull: boolean }>;
      indexes: Record<string, unknown>;
      foreignKeys: Record<string, unknown>;
      compositePrimaryKeys: Record<string, unknown>;
      uniqueConstraints: Record<string, unknown>;
    }
  >;
};

// "nothing" = ไม่ใช่อาการนี้ · "checked" = ตรวจผ่านแต่ไม่ได้เขียน · "applied" = เติมแล้ว · "mismatch" = ฐานไม่ตรง ห้ามเติม
export async function baseline(connectionString: string, apply: boolean): Promise<"nothing" | "checked" | "applied" | "mismatch"> {
  // hash และเวลา ต้องคำนวณแบบเดียวกับ drizzle-orm/migrator ไม่งั้น migrate จะมองว่ายังไม่ได้รัน
  const journal: Entry[] = JSON.parse(readFileSync(`${DIR}/meta/_journal.json`, "utf8")).entries;
  const files = journal.map((e) => {
    const sql = readFileSync(`${DIR}/${e.tag}.sql`, "utf8");
    return { ...e, sql, hash: createHash("sha256").update(sql).digest("hex") };
  });

  const db = new Client({ connectionString });
  await db.connect();
  const q = async <T>(text: string, values: unknown[] = []) => (await db.query(text, values)).rows as T[];

  try {
    const hasLog = (await q<{ t: string | null }>(`select to_regclass('drizzle.__drizzle_migrations')::text as t`))[0].t;
    const log = hasLog ? await q<{ created_at: string }>(`select created_at from drizzle.__drizzle_migrations order by created_at`) : [];
    const last = log.length ? Number(log[log.length - 1].created_at) : 0;
    const pending = files.filter((f) => f.when > last);

    console.log(`   สมุดจดไว้ ${log.length} ไฟล์ · ไฟล์ที่ migrate ยังจะรัน: ${pending.map((f) => f.tag).join(", ") || "(ไม่มี)"}`);
    if (!pending.length) return "nothing";

    const tables = new Set((await q<{ t: string }>(`select table_name as t from information_schema.tables where table_schema = 'public'`)).map((r) => r.t));

    // เติมบันทึกได้เฉพาะ "ช่วงต้น" ของไฟล์ที่ค้าง ที่ตารางซึ่งไฟล์นั้นสร้างมีอยู่ในฐานครบ
    // ไฟล์หลังจากนั้นปล่อยให้ migrate รันตามปกติ
    const created = (sql: string) => [...sql.matchAll(/CREATE TABLE "([^"]+)"/g)].map((m) => m[1]);
    let k = -1;
    for (const [i, f] of pending.entries()) {
      if (!created(f.sql).every((t) => tables.has(t))) break;
      k = i;
    }
    if (k < 0) return "nothing";
    const todo = pending.slice(0, k + 1);
    const target = todo[todo.length - 1];

    // เทียบฐานกับ snapshot ของไฟล์สุดท้ายที่จะเติม: ตาราง คอลัมน์ ชนิด not null และชื่อ constraint/index
    const snap: Snapshot = JSON.parse(readFileSync(`${DIR}/meta/${String(target.idx).padStart(4, "0")}_snapshot.json`, "utf8"));
    const later = new Set(files.filter((f) => f.when > target.when).flatMap((f) => created(f.sql)));
    const cols = await q<{ table_name: string; column_name: string; type: string; is_nullable: string }>(
      `select c.table_name, c.column_name, format_type(a.atttypid, a.atttypmod) as type, c.is_nullable
         from information_schema.columns c
         join pg_attribute a on a.attrelid = format('public.%I', c.table_name)::regclass and a.attname = c.column_name
        where c.table_schema = 'public'`,
    );
    const names = new Set(
      (
        await q<{ n: string }>(
          `select conname as n from pg_constraint where connamespace = 'public'::regnamespace
           union select indexname from pg_indexes where schemaname = 'public'`,
        )
      ).map((r) => r.n),
    );

    const problems: string[] = [];
    const norm = (t: string) => ({ serial: "integer", bigserial: "bigint", smallserial: "smallint" })[t] ?? t;
    for (const t of Object.values(snap.tables)) {
      if (!tables.has(t.name)) {
        problems.push(`ไม่มีตาราง ${t.name}`);
        continue;
      }
      for (const c of Object.values(t.columns)) {
        const got = cols.find((r) => r.table_name === t.name && r.column_name === c.name);
        if (!got) problems.push(`${t.name}: ไม่มีคอลัมน์ ${c.name}`);
        else if (got.type !== norm(c.type)) problems.push(`${t.name}.${c.name}: ชนิดในฐาน ${got.type} แต่ไฟล์บอก ${c.type}`);
        else if ((got.is_nullable === "NO") !== c.notNull) problems.push(`${t.name}.${c.name}: not null ไม่ตรง`);
      }
      for (const c of cols.filter((r) => r.table_name === t.name)) {
        if (!t.columns[c.column_name]) problems.push(`${t.name}: มีคอลัมน์ ${c.column_name} เกินมา`);
      }
      for (const n of [...Object.keys(t.indexes), ...Object.keys(t.foreignKeys), ...Object.keys(t.compositePrimaryKeys), ...Object.keys(t.uniqueConstraints)]) {
        if (!names.has(n)) problems.push(`${t.name}: ไม่มี ${n}`);
      }
    }
    const expected = new Set(Object.values(snap.tables).map((t) => t.name));
    for (const t of tables) if (!expected.has(t) && !later.has(t)) problems.push(`มีตาราง ${t} เกินมา`);

    console.log(`   จะเติมบันทึก: ${todo.map((f) => f.tag).join(", ")}`);
    if (problems.length) {
      console.error(`❌ ฐานไม่ตรงกับ ${target.tag} ${problems.length} จุด ห้ามเติมบันทึก (จะกลบความต่างไว้):`);
      for (const p of problems) console.error(`   - ${p}`);
      return "mismatch";
    }
    console.log(`✅ ตารางในฐานตรงกับ ${target.tag} ทุกจุด เติมบันทึกได้อย่างปลอดภัย`);
    if (!apply) return "checked";

    // สร้างสมุดแบบเดียวกับที่ drizzle สร้าง (ถ้ายังไม่มี) แล้วเติมทีเดียวทั้งชุด พังกลางทางก็ไม่มีอะไรค้าง
    await db.query("begin");
    await db.query(`create schema if not exists drizzle`);
    await db.query(`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`);
    for (const f of todo) {
      await db.query(`insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)`, [f.hash, f.when]);
    }
    await db.query("commit");
    console.log(`✅ เติมบันทึก ${todo.length} ไฟล์แล้ว`);
    return "applied";
  } finally {
    await db.end();
  }
}

if (import.meta.main) {
  // `vercel env pull` เขียนค่าลับเป็น "[SENSITIVE]" ต้องวาง connection string จริงจาก Neon เอง
  if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "")) {
    console.error("❌ DATABASE_URL ยังไม่ใช่ connection string ของ Postgres (ยังเป็นค่าแทนอยู่หรือเปล่า) ยังไม่ได้ต่อฐานใดๆ");
    process.exit(1);
  }
  const url = new URL(process.env.DATABASE_URL!);
  url.hostname = url.hostname.replace("-pooler.", ".");
  console.log(`ฐานข้อมูล → ${url.host}${url.pathname}  (เช็กว่าเป็นฐาน preview ไม่ใช่เว็บจริง)`);
  const apply = process.argv.includes("--apply");
  const result = await baseline(url.toString(), apply);
  if (result === "checked") console.log("(ยังไม่ได้เขียนอะไร ใส่ --apply เพื่อเติมบันทึกจริง)");
  if (result === "nothing") console.log("✅ ไม่มีอะไรต้องเติม");
  process.exit(result === "mismatch" ? 1 : 0);
}
