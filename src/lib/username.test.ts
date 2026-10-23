import { describe, expect, test } from "bun:test";
import { parseUsernameList, usernameProblem } from "./username";

describe("usernameProblem", () => {
  test("ชื่อที่ถูกรูปแบบ", () => expect(usernameProblem("somchai.j")).toBeNull());
  test("บอกเหตุผลที่ผิด", () => {
    expect(usernameProblem("ab")).toBe("สั้นกว่า 3 ตัว");
    expect(usernameProblem("somchai j")).toBe("มีช่องว่าง");
    expect(usernameProblem("สมชาย")).toContain("ตัวอักษรที่ใช้ไม่ได้");
  });
});

describe("parseUsernameList", () => {
  test("ช่องว่างในบรรทัดไม่แตกเป็นสองชื่อ แต่ถูกชี้ว่าผิด", () => {
    const r = parseUsernameList("somchai.j\nsomying k\n");
    expect(r.valid).toEqual(["somchai.j"]);
    expect(r.invalid).toEqual([{ username: "somying k", error: "มีช่องว่าง" }]);
  });
  test("แยกด้วยจุลภาค/แท็บได้ ตัดซ้ำ และแปลงเป็นตัวพิมพ์เล็ก", () => {
    expect(parseUsernameList(" A.b , a.b\tc_d ").valid).toEqual(["a.b", "c_d"]);
  });
});
