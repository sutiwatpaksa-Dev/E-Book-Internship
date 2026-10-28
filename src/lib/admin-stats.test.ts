import { describe, expect, test } from "bun:test";
import { cardUrl, cards, cardsOf } from "@/data/learn";
import { cardSummary, dailyCounts, loginBuckets, stepProgress } from "./admin-stats";

// 28 ต.ค. 2026 10:00 เวลาไทย
const NOW = new Date("2026-10-28T10:00:00+07:00").getTime();

describe("นับรายวัน", () => {
  test("มีครบทุกวัน วันที่ไม่มีอะไร = 0 และใช้วันตามเวลาไทย", () => {
    // 06:00 เวลาไทย = 23:00 UTC ของเมื่อวาน ต้องนับเป็นวันนี้
    const r = dailyCounts(["2026-10-27T23:00:00Z", "2026-10-28T02:00:00Z", "2026-10-26T05:00:00Z"], 3, NOW);
    expect(r).toEqual([
      { day: "2026-10-26", value: 1 },
      { day: "2026-10-27", value: 0 },
      { day: "2026-10-28", value: 2 },
    ]);
  });
});

describe("ความคืบหน้าแต่ละขั้น", () => {
  const problem = cardsOf("problem").map((c) => ({ link: cardUrl(c.slug), doneAt: "2026-10-27T00:00:00Z" }));
  test("ผ่านขั้น 1 ครบ 1 คน ยังไม่เริ่ม 1 คน", () => {
    const { rows } = stepProgress([problem, []]);
    expect(rows[0]).toMatchObject({ slug: "problem", pct: 50, here: 1 });
    expect(rows[1]).toMatchObject({ slug: "design", pct: 0, here: 1 });
  });
  test("ไม่แสดงขั้นที่ยังไม่มีการ์ด และนับคนที่ผ่านครบ", () => {
    const all = cards.map((c) => ({ link: cardUrl(c.slug), doneAt: "2026-10-27T00:00:00Z" }));
    const r = stepProgress([all]);
    expect(r.rows.every((x) => x.cards > 0)).toBe(true);
    expect(r.finished).toBe(1);
  });
  test("ไม่มีน้อง = 0% ไม่ใช่ NaN", () => {
    expect(stepProgress([]).rows[0].pct).toBe(0);
  });
});

describe("สรุปน้องรายคน", () => {
  test("นับการ์ด ไม่นับบทเก่า และบอกขั้นถัดไป", () => {
    const s = cardSummary([
      { link: cardUrl(cards[0].slug), doneAt: "2026-10-27T00:00:00Z" },
      { link: "/05-backend-api", doneAt: "2026-10-28T00:00:00Z" },
    ]);
    expect(s).toMatchObject({ doneCount: 1, total: cards.length, where: "1. Problem", last: { title: cards[0].title } });
    expect(cardSummary([]).where).toBe("ยังไม่เริ่ม");
  });
});

describe("กลุ่มการเข้าใช้งาน", () => {
  test("แบ่ง 4 กลุ่มตามวันไทย", () => {
    const r = loginBuckets(["2026-10-28T01:00:00+07:00", "2026-10-26T10:00:00+07:00", "2026-10-20T10:00:00+07:00", null], NOW);
    expect(r.map((b) => b.value)).toEqual([1, 1, 1, 1]);
  });
});
