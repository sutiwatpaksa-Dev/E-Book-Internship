import { describe, expect, test } from "bun:test";
import { cohortDay, cohortStatus, inCohort, todayTH, workdays } from "./cohort";

const c = { startsOn: "2026-11-02", endsOn: "2026-12-25", endedAt: null };

describe("รุ่นฝึกงาน", () => {
  test("สถานะคิดจากวันที่ · กดจบรุ่นแล้วเป็น ended เสมอ", () => {
    expect(cohortStatus(c, "2026-11-01")).toBe("upcoming");
    expect(cohortStatus(c, "2026-11-02")).toBe("active");
    expect(cohortStatus(c, "2026-12-25")).toBe("active");
    expect(cohortStatus(c, "2026-12-26")).toBe("overdue");
    expect(cohortStatus({ ...c, endedAt: "2026-12-01T10:00:00Z" }, "2026-11-10")).toBe("ended");
  });
  test("นับวันทำงานจันทร์–ศุกร์ รวมวันแรกและวันสุดท้าย", () => {
    expect(workdays("2026-11-02", "2026-11-06")).toBe(5); // จันทร์–ศุกร์
    expect(workdays("2026-11-02", "2026-11-08")).toBe(5); // เสาร์อาทิตย์ไม่นับ
    expect(cohortDay(c, "2026-11-09")).toEqual({ day: 6, total: 40 });
    expect(cohortDay(c, "2026-10-30")).toBeNull();
  });
  test("วันนี้ใช้เวลาไทย: 23:30 UTC ของวันที่ 1 คือวันที่ 2 ในไทยแล้ว", () => {
    expect(todayTH(new Date("2026-11-01T23:30:00Z"))).toBe("2026-11-02");
  });
  test("ตัวกรองรุ่น", () => {
    expect(inCohort(3, "all")).toBe(true);
    expect(inCohort(null, "none")).toBe(true);
    expect(inCohort(3, "none")).toBe(false);
    expect(inCohort(3, 3)).toBe(true);
  });
});
