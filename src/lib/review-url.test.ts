import { describe, expect, test } from "bun:test";
import { countOfStatus, defaultReviewCohort, offsetOf, pagesOf, rangeText, readReviewUrl, reviewHref, visibleStatuses } from "./review-url";

const read = (qs: string, fallback: number | null = null) => readReviewUrl(new URLSearchParams(qs), fallback);

describe("อ่าน URL หน้าตรวจงาน", () => {
  test("ไม่มีอะไร = ชั้น งาน ใช้รุ่นที่แนะนำ ค่าเริ่ม รอตรวจ/เก่าสุด/หน้า 1", () => {
    expect(read("tab=submissions", 22)).toEqual({ cohort: 22, assignment: null, round: null, status: "waiting", sort: "oldest", q: "", page: 1 });
  });
  test("รุ่นใน URL ชนะรุ่นที่แนะนำ", () => {
    expect(read("cohort=7", 22).cohort).toBe(7);
  });
  test("ต้องมีทั้งโจทย์และรอบถึงเป็นชั้น คน", () => {
    expect(read("assignment=starter").assignment).toBeNull();
    expect(read("round=review-1").round).toBeNull();
    const u = read("assignment=starter&round=review-1&status=all&sort=name&q=%20สม%20&page=3");
    expect(u).toMatchObject({ assignment: "starter", round: "review-1", status: "all", sort: "name", q: "สม", page: 3 });
  });
  test("ค่าที่ใช้ไม่ได้กลับค่าเริ่ม ไม่ส่งต่อให้ server", () => {
    const u = read("cohort=abc&assignment=A%20B&round=x&status=done&sort=random&page=-2&q=" + "x".repeat(99), 5);
    expect(u).toMatchObject({ cohort: 5, assignment: null, round: null, status: "waiting", sort: "oldest", page: 1 });
    expect(u.q.length).toBe(60);
    expect(read("page=0").page).toBe(1);
    expect(read("page=1e3").page).toBe(1);
  });
});

describe("ลิงก์หน้าตรวจงาน", () => {
  const base = { cohort: 22, assignment: null, round: null, status: "waiting", sort: "oldest", q: "", page: 1 } as const;
  test("ไม่ใส่ค่าเริ่ม", () => {
    expect(reviewHref(base)).toBe("/dev/admin?tab=submissions&cohort=22");
    expect(reviewHref({ ...base, assignment: "starter", round: "review-1" })).toBe("/dev/admin?tab=submissions&cohort=22&assignment=starter&round=review-1");
  });
  test("ชั้น งาน ไม่พกตัวกรองของชั้น คน", () => {
    expect(reviewHref({ ...base, status: "all", q: "สม", page: 4 })).toBe("/dev/admin?tab=submissions&cohort=22");
  });
  test("อ่านกลับได้เท่าเดิม (round trip)", () => {
    const u = { cohort: 22, assignment: "starter", round: "final", status: "reviewed", sort: "name", q: "ลต 1", page: 2 } as const;
    const qs = reviewHref(u).split("?")[1];
    expect(read(qs)).toEqual(u);
  });
});

describe("หน้าและป้าย", () => {
  test("ช่วงที่แสดง", () => {
    expect(rangeText(0, 1)).toBe("0 รายการ");
    expect(rangeText(834, 1)).toBe("1–20 จาก 834");
    expect(rangeText(834, 42)).toBe("821–834 จาก 834");
    expect(offsetOf(3)).toBe(40);
    expect(pagesOf(0)).toBe(1);
    expect(pagesOf(20)).toBe(1);
    expect(pagesOf(21)).toBe(2);
  });
  test("แท็บที่ได้ 0 ซ่อน ยกเว้นทั้งหมดและตัวที่เลือกอยู่", () => {
    expect(visibleStatuses({ waiting: 0, reviewed: 0 }, "waiting")).toEqual(["waiting", "all"]);
    expect(visibleStatuses({ waiting: 2, reviewed: 0 }, "waiting")).toEqual(["waiting", "all"]);
    expect(visibleStatuses({ waiting: 0, reviewed: 3 }, "all")).toEqual(["reviewed", "all"]);
    expect(visibleStatuses({ waiting: 0, reviewed: 0 }, "reviewed")).toEqual(["reviewed", "all"]);
    expect(countOfStatus({ waiting: 2, reviewed: 3 }, "all")).toBe(5);
  });
  test("รุ่นที่เปิดให้เมื่อ URL ไม่ระบุ", () => {
    const cohorts = [{ id: 1, endedAt: "2026-01-01" }, { id: 22 }, { id: 24 }];
    expect(defaultReviewCohort(24, [22], cohorts)).toBe(24);
    expect(defaultReviewCohort("all", [22], cohorts)).toBe(22);
    expect(defaultReviewCohort("all", [], cohorts)).toBe(24);
    expect(defaultReviewCohort(99, [], cohorts)).toBe(24);
    expect(defaultReviewCohort("all", [], [{ id: 1, endedAt: "x" }, { id: 2, endedAt: "x" }])).toBe(2);
    expect(defaultReviewCohort("all", [], [])).toBeNull();
  });
});
