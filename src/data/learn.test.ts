import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { setProgressSchema } from "../../server/validators/progress.validator";
import { cardByUrl, cards, learnLinks, legacy, neighbors, steps, stepOfUrl } from "./learn";

describe("โครง 7 ขั้น", () => {
  test("ทุกขั้นและทุกการ์ดมีไฟล์เนื้อหาจริง (ลืมสร้างไฟล์ = ลิงก์ไปหน้า 404)", () => {
    for (const s of steps) expect(existsSync(`content/docs/learn/${s.slug}.mdx`)).toBe(true);
    for (const c of cards) expect(existsSync(`content/docs/learn/cards/${c.slug}.mdx`)).toBe(true);
  });

  test("ลิงก์การ์ดผ่านด่านตรวจของ API ติ๊กผ่าน (ไม่งั้นกด 'เข้าใจแล้ว' แล้วบันทึกไม่ได้)", () => {
    for (const link of learnLinks) expect(setProgressSchema.safeParse({ link, done: true }).success).toBe(true);
  });

  test("การ์ดที่อยู่ในช่วงย่อย ต้องเป็นช่วงที่ขั้นนั้นประกาศไว้", () => {
    for (const c of [...cards, ...legacy]) {
      const step = steps.find((s) => s.slug === c.step)!;
      if (c.part) expect(step.parts).toContain(c.part);
    }
  });

  test("หาขั้นจาก URL ได้ทั้งหน้าขั้นและหน้าการ์ด", () => {
    expect(stepOfUrl("/learn/coding")).toBe("coding");
    expect(stepOfUrl("/learn/cards/migration")).toBe("coding");
    expect(stepOfUrl("/learn")).toBeNull();
  });

  test("การ์ดก่อน/ถัดไปอยู่ในขั้นเดียวกัน และหัวท้ายไม่มีต่อ", () => {
    const first = cardByUrl("/learn/cards/sql-basics")!;
    const last = cardByUrl("/learn/cards/migration")!;
    expect(neighbors(first).prev).toBeNull();
    expect(neighbors(first).next?.slug).toBe("postgres");
    expect(neighbors(last).next).toBeNull();
  });
});
