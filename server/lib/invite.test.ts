import { describe, expect, test } from "bun:test";
import { hashInvite, newInviteCode, normalizeInvite } from "./invite";

describe("รหัสรุ่น", () => {
  test("รูปแบบ XXXX-XXXX ไม่มีตัวที่อ่านสับสน", () => {
    for (let i = 0; i < 200; i++) expect(newInviteCode()).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
  });
  test("สุ่มไม่ซ้ำกัน", () => {
    expect(new Set(Array.from({ length: 500 }, newInviteCode)).size).toBe(500);
  });
  test("พิมพ์ตัวเล็ก เว้นวรรค ไม่ใส่ขีด ก็เป็นรหัสเดียวกัน", () => {
    expect(normalizeInvite(" k7qm 3xpa ")).toBe("K7QM3XPA");
    expect(hashInvite("k7qm3xpa")).toBe(hashInvite("K7QM-3XPA"));
    expect(hashInvite("K7QM-3XPB")).not.toBe(hashInvite("K7QM-3XPA"));
  });
});
