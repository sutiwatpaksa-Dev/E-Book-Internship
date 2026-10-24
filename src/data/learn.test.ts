import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { setProgressSchema } from "../../server/validators/progress.validator";
import { cardByUrl, cards, cardsOf, cardUrl, learnLinks, legacy, neighbors, nextUp, steps, stepOfUrl } from "./learn";

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
      // ขั้นที่แบ่งช่วง ทุกการ์ดและบทเดิมต้องบอกช่วง ไม่งั้นหายจาก sidebar และแท็บ
      if (step.parts) expect(step.parts).toContain(c.part!);
      else expect(c.part).toBeUndefined();
    }
  });

  test("การ์ดที่ต้องอ่านก่อน อยู่ก่อนการ์ดนี้เสมอ (ปุ่ม 'ทำต่อ' จะไม่พาไปเจอเรื่องที่ยังไม่ได้เรียน)", () => {
    cards.forEach((c, i) => {
      for (const need of c.needs ?? []) {
        const at = cards.findIndex((x) => x.slug === need);
        expect(at, `${c.slug} ต้องการ ${need}`).toBeGreaterThanOrEqual(0);
        expect(at, `${need} ต้องมาก่อน ${c.slug}`).toBeLessThan(i);
      }
    });
  });

  test("การ์ดในขั้นเดียวกันเรียงตามลำดับช่วง", () => {
    for (const s of steps.filter((x) => x.parts)) {
      const order = cardsOf(s.slug).map((c) => s.parts!.indexOf(c.part!));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    }
  });

  test("หาขั้นจาก URL ได้ทั้งหน้าขั้นและหน้าการ์ด", () => {
    expect(stepOfUrl("/learn/coding")).toBe("coding");
    expect(stepOfUrl("/learn/cards/migration")).toBe("coding");
    expect(stepOfUrl("/learn")).toBeNull();
  });

  test("การ์ดก่อน/ถัดไปอยู่ในขั้นเดียวกัน และหัวท้ายไม่มีต่อ", () => {
    const first = cardByUrl("/learn/cards/postgres")!;
    const list = cardsOf("coding");
    const last = list[list.length - 1];
    expect(neighbors(first).prev).toBeNull();
    expect(neighbors(first).next?.slug).toBe("sql-basics");
    expect(neighbors(last).next).toBeNull();
  });

  test("ทำต่อ: ยังไม่เริ่ม = ขั้น 1 · เริ่มแล้ว = การ์ดแรกที่ยังไม่เข้าใจ · ครบแล้ว = ไม่มีการ์ด", () => {
    const fresh = nextUp(new Set());
    expect(fresh.started).toBe(false);
    expect(fresh.step.slug).toBe("problem");

    const some = nextUp(new Set([cardUrl("postgres")]));
    expect(some.started).toBe(true);
    expect(some.card?.slug).toBe("sql-basics");
    expect(some.step.slug).toBe("coding");

    const all = nextUp(new Set(learnLinks));
    expect(all.card).toBeNull();
  });
});
