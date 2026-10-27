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
});
