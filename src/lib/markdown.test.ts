import { describe, expect, test } from "bun:test";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  test("HTML ดิบกลายเป็นข้อความ ไม่ถูกรัน", () => {
    const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
  });
  test("ลิงก์ javascript: ถูกตัด", () => expect(renderMarkdown("[x](javascript:alert(1))")).toContain('href=""'));
  test("ตารางแบบ GitHub ใช้ได้", () => expect(renderMarkdown("| a |\n|---|\n| 1 |")).toContain("<table>"));
  test("กล่องเตือน > [!CAUTION] ได้ป้ายเป็นคำ ไม่ใช่แค่สี", () => {
    const html = renderMarkdown("> [!CAUTION]\n> รหัสฐานข้อมูลหลุด reset ก่อน");
    expect(html).toContain('class="md-alert md-alert-caution"');
    expect(html).toContain("ต้องแก้ทันที");
    expect(html).toContain("รหัสฐานข้อมูลหลุด");
    expect(html).not.toContain("[!CAUTION]");
  });
  test("blockquote ธรรมดายังเป็น blockquote", () => expect(renderMarkdown("> ข้อความ")).toBe("<blockquote>\n<p>ข้อความ</p>\n</blockquote>"));
  test("รูปที่อัปโหลดเข้าระบบแสดงได้ (โหลดเมื่อเลื่อนมาถึง)", () => {
    const html = renderMarkdown("![หน้าล็อกอิน](/api/files/img/0123456789abcdef)");
    expect(html).toContain('<img src="/api/files/img/0123456789abcdef" alt="หน้าล็อกอิน" loading="lazy" />');
  });
  test("รูปจากเว็บอื่นไม่แสดง เหลือแต่คำอธิบาย (ไม่ให้รูปภายนอกติดตามผู้อ่าน)", () => {
    for (const src of ["https://evil.example/x.png", "//evil.example/x.png", "/other/path.png", "data:image/png;base64,AAAA"]) {
      const html = renderMarkdown(`![ภาพตัวอย่าง](${src})`);
      expect(html).not.toContain("<img");
      expect(html).toContain("[รูป: ภาพตัวอย่าง]");
    }
  });
  test("ชื่อใต้ prefix ที่พยายามหลุดออกนอก path ก็ยังเป็นรูปของระบบ แต่ไม่มีทางเป็น src ภายนอก", () => {
    const html = renderMarkdown('![x](/api/files/img/a" onerror="alert(1))');
    expect(html).not.toContain('onerror="alert');
  });
  test("ขึ้นบรรทัดเดียวยังอยู่ในข้อความ (หน้าเว็บแสดงด้วย whitespace-pre-line)", () => expect(renderMarkdown("บรรทัด 1\nบรรทัด 2")).toContain("บรรทัด 1\nบรรทัด 2"));
});
