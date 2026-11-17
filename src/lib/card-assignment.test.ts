import { describe, expect, test } from "bun:test";
import type { CardAssignment } from "@/types";
import { hasCardAssignment, pickCardAssignment } from "./card-assignment";

const a = (slug: string, bound: boolean): CardAssignment => ({ slug, name: slug, brief: "", bound, note: bound ? "ใช้ตอนวันที่ 3" : "" });

describe("กล่องโจทย์ในหัวการ์ด", () => {
  test("เลือกโจทย์ที่น้องเลือกไว้ครั้งก่อนก่อน ถ้ายังอยู่ในรายการ", () => {
    expect(pickCardAssignment([a("starter", true), a("shop", false)], "shop")?.slug).toBe("shop");
  });
  test("โจทย์ที่เลือกไว้หายไปแล้ว (เปลี่ยนรุ่น) = โจทย์แรกที่ผูกการ์ดนี้", () => {
    expect(pickCardAssignment([a("x", false), a("starter", true)], "gone")?.slug).toBe("starter");
  });
  test("ไม่มีโจทย์ไหนผูก = โจทย์แรกในรายการ · รายการว่าง = null", () => {
    expect(pickCardAssignment([a("x", false), a("y", false)], null)?.slug).toBe("x");
    expect(pickCardAssignment([], null)).toBeNull();
  });
  test("ซ่อนกล่องเมื่อไม่มีโจทย์ไหนผูกการ์ดนี้เลย", () => {
    expect(hasCardAssignment([a("x", false)])).toBe(false);
    expect(hasCardAssignment([])).toBe(false);
    expect(hasCardAssignment([a("x", false), a("y", true)])).toBe(true);
  });
});
