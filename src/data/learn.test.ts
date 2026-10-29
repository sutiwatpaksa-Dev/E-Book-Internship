import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { setProgressSchema } from "../../server/validators/progress.validator";
import { cardByUrl, cards, cardsOf, cardUrl, learnLinks, legacy, neighbors, nextUp, steps, stepOfUrl, topics } from "./learn";

describe("โครง 7 ขั้น", () => {
  test("ทุกขั้นและทุกการ์ดมีไฟล์เนื้อหาจริง (ลืมสร้างไฟล์ = ลิงก์ไปหน้า 404)", () => {
    for (const s of steps) expect(existsSync(`content/docs/learn/${s.slug}.mdx`)).toBe(true);
    for (const c of cards) expect(existsSync(`content/docs/learn/cards/${c.slug}.mdx`)).toBe(true);
  });

  test("ลิงก์การ์ดผ่านด่านตรวจของ API ติ๊กผ่าน (ไม่งั้นกด 'เข้าใจแล้ว' แล้วบันทึกไม่ได้)", () => {
    for (const link of learnLinks) expect(setProgressSchema.safeParse({ link, done: true }).success).toBe(true);
  });

  // หมวดว่างไม่ขึ้นเป็นปุ่ม (card-library.tsx) แต่หมวดที่ตั้งไว้ให้การ์ดในโค้ดต้องมีการ์ดจริง กันลืมย้ายการ์ด
  // ai: ตอนนี้มีแต่การ์ดของพี่เลี้ยงใน DB · ใส่การ์ดในโค้ดเมื่อไหร่ เอาออกจากรายการนี้
  const MENTOR_ONLY_TOPICS = ["ai"];
  test("ทุกหมวดมีการ์ด ยกเว้นหมวดที่รอการ์ดของพี่เลี้ยง", () => {
    for (const t of topics) if (!MENTOR_ONLY_TOPICS.includes(t.slug)) expect(cards.some((c) => c.topic === t.slug)).toBe(true);
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

  test("meta.json ของคลังการ์ดเรียงเหมือน learn.ts (หน้าค้นหาและสารบัญของ Fumadocs จะได้ลำดับเดียวกัน)", () => {
    const meta = JSON.parse(readFileSync("content/docs/learn/cards/meta.json", "utf8")) as { pages: string[] };
    expect(meta.pages.filter((p) => p !== "index")).toEqual(cards.map((c) => c.slug));
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

    const some = nextUp(new Set([cardUrl("reading-requirements")]));
    expect(some.started).toBe(true);
    expect(some.card?.slug).toBe("business-brief");
    expect(some.step.slug).toBe("problem");

    // ข้ามมาเริ่มที่ขั้น Coding ก่อน: ทำต่อพากลับไปการ์ดแรกที่ยังไม่เข้าใจ ซึ่งอยู่ขั้น 1
    const skipped = nextUp(new Set([cardUrl("postgres")]));
    expect(skipped.card?.slug).toBe("reading-requirements");
    expect(skipped.step.slug).toBe("problem");

    const all = nextUp(new Set(learnLinks));
    expect(all.card).toBeNull();
  });
});

describe("รายการที่ผ่านหลังบ้านแล้ว (ซ่อน/เปลี่ยนชื่อ)", () => {
  const [first, second] = cards;
  const hidden = cards.filter((c) => c.slug !== first.slug);
  test("ซ่อนการ์ดใบแรก: ทำต่อ = ใบถัดไป", () => {
    expect(nextUp(new Set(), hidden).card?.slug).toBe(second.slug);
  });
  test("ก่อน/ถัดไปข้ามใบที่ซ่อน และใช้ชื่อใหม่", () => {
    const renamed = hidden.map((c) => (c.slug === second.slug ? { ...c, title: "ชื่อใหม่" } : c));
    expect(neighbors(second, renamed).prev).toBeNull();
    const third = renamed.find((c) => c.step === second.step && c.slug !== second.slug)!;
    expect(neighbors(third, renamed).prev?.title).toBe("ชื่อใหม่");
  });
  test("เปิดการ์ดที่ถูกซ่อนจากลิงก์ตรง: ไม่มีก่อน/ถัดไป", () => {
    expect(neighbors(first, hidden)).toEqual({ prev: null, next: null });
  });
});
