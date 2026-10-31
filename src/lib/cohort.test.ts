import { describe, expect, test } from "bun:test";
import { dayOfDate, isWeekend, cohortDay, cohortStatus, daysBetween, inCohort, todayTH, workdayDate, workdays } from "./cohort";

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

describe("วันที่จริงของวันทำงานที่ N", () => {
  test("วันทำงานที่ 1 คือวันเริ่ม · ข้ามเสาร์-อาทิตย์", () => {
    expect(workdayDate("2026-11-02", 1)).toBe("2026-11-02"); // จันทร์
    expect(workdayDate("2026-11-02", 5)).toBe("2026-11-06"); // ศุกร์
    expect(workdayDate("2026-11-02", 6)).toBe("2026-11-09"); // ข้ามเสาร์-อาทิตย์ ไปจันทร์
    expect(workdayDate("2026-11-02", 10)).toBe("2026-11-13");
  });
  test("วันเริ่มเป็นเสาร์ → นับจากจันทร์ถัดไป · ตรงกับ workdays()", () => {
    expect(workdayDate("2026-11-07", 1)).toBe("2026-11-09");
    for (let n = 1; n <= 12; n++) expect(workdays("2026-11-07", workdayDate("2026-11-07", n)!)).toBe(n);
  });
  test("n ที่ใช้ไม่ได้ = null", () => {
    expect(workdayDate("2026-11-02", 0)).toBeNull();
    expect(workdayDate("2026-11-02", 1.5)).toBeNull();
  });
  test("ห่างกันกี่วันตามปฏิทิน", () => {
    expect(daysBetween("2026-11-04", "2026-11-06")).toBe(2);
    expect(daysBetween("2026-11-06", "2026-11-04")).toBe(-2);
  });
});

describe("วันที่ปฏิทินเป็นวันทำงานที่ N", () => {
  test("ตรงข้ามกับ workdayDate", () => {
    for (let n = 1; n <= 15; n++) expect(dayOfDate("2026-11-02", workdayDate("2026-11-02", n)!)).toBe(n);
  });
  test("เสาร์-อาทิตย์นับเป็นศุกร์ก่อนหน้า · ก่อนวันเริ่ม = null", () => {
    expect(dayOfDate("2026-11-02", "2026-11-07")).toBe(5);
    expect(isWeekend("2026-11-07")).toBe(true);
    expect(isWeekend("2026-11-06")).toBe(false);
    expect(dayOfDate("2026-11-02", "2026-10-30")).toBeNull();
  });
});
