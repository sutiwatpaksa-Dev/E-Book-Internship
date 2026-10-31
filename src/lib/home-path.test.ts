import { describe, expect, test } from "bun:test";
import { HOME, safeNext } from "./home-path";

describe("safeNext", () => {
  test("ไม่มี next → หน้าแรกของบทบาท", () => {
    expect(safeNext(null, "intern")).toBe(HOME.intern);
    expect(safeNext(undefined, "dev")).toBe("/dev/admin");
  });
  test("path ภายในเว็บ → ไปตามนั้น", () => {
    expect(safeNext("/learn/cards/readme", "intern")).toBe("/learn/cards/readme");
  });
  test("ลิงก์ออกนอกเว็บ → ไม่ยอม กลับหน้าแรก", () => {
    expect(safeNext("https://evil.example", "intern")).toBe("/dashboard");
    expect(safeNext("//evil.example", "intern")).toBe("/dashboard");
  });
});
