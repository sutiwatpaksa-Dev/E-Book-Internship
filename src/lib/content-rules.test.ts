import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// กติกาของไฟล์เนื้อหาที่ build ไม่จับ แต่ทำให้หน้าเว็บพังตอนเปิด
const ROOT = join(import.meta.dir, "../../content/docs");
const mdxFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? mdxFiles(join(dir, e.name)) : e.name.endsWith(".mdx") ? [join(dir, e.name)] : []));

// บรรทัดหัวข้อ (# ...) นอก code block · ใน ``` บรรทัดที่ขึ้นด้วย # คือ comment ของ shell ไม่ใช่หัวข้อ
function headings(text: string) {
  let inCode = false;
  return text.split("\n").flatMap((line, i) => {
    if (line.trimStart().startsWith("```")) inCode = !inCode;
    return !inCode && /^#{1,6} /.test(line) ? [{ line: i + 1, text: line }] : [];
  });
}

describe("ไฟล์เนื้อหา", () => {
  // Fumadocs ห่อทุกหัวข้อด้วย <a href="#..."> (กดหัวข้อเพื่อคัดลอกลิงก์) ลิงก์ในหัวข้อจึงกลายเป็น <a> ซ้อน <a>
  // ซึ่ง HTML ไม่อนุญาต React ขึ้น hydration error ทุกครั้งที่เปิดหน้า · ย้ายลิงก์ไปไว้ในประโยคใต้หัวข้อแทน
  test("หัวข้อไม่มีลิงก์", () => {
    const bad = mdxFiles(ROOT).flatMap((f) =>
      headings(readFileSync(f, "utf8"))
        .filter((h) => /\]\(/.test(h.text))
        .map((h) => `${f.slice(ROOT.length + 1)}:${h.line}  ${h.text}`),
    );
    expect(bad).toEqual([]);
  });
});
