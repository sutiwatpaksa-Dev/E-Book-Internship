import { describe, expect, test } from "bun:test";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  test("ค่าธรรมดาไม่ใส่เครื่องหมายคำพูด · ที่มีจุลภาค/ขึ้นบรรทัด/คำพูดถูกครอบและเบิ้ลคำพูด", () => {
    expect(csvCell("สมชาย")).toBe("สมชาย");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('เขาพูดว่า "ดี"')).toBe('"เขาพูดว่า ""ดี"""');
    expect(csvCell("บรรทัด1\nบรรทัด2")).toBe('"บรรทัด1\nบรรทัด2"');
  });
  test("ค่าที่ขึ้นต้นเป็นสูตรถูกทำให้เป็นข้อความ (กัน CSV injection)", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+cmd")).toBe("'+cmd");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });
  test("ตัวเลขติดลบที่เป็นตัวเลขจริงไม่ถูกใส่ ' · null และ boolean", () => {
    expect(csvCell(-5)).toBe("-5");
    expect(csvCell(null)).toBe("");
    expect(csvCell(true)).toBe("true");
  });
  test("toCsv มี BOM และใช้ CRLF", () => {
    const out = toCsv([["a", "b"], [1, 2]]);
    expect(out.startsWith("\uFEFF")).toBe(true);
    expect(out).toBe("\uFEFFa,b\r\n1,2\r\n");
  });
});
