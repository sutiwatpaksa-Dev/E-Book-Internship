import { describe, expect, test } from "bun:test";
import { dayOfDate, isWeekend, cohortDay, cohortStatus, cohortQuery, daysBetween, inCohort, resolveCohortFilter, todayTH, workdayDate, workdays } from "./cohort";

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

describe("ตัวกรอง \"รุ่นของฉัน\" ในหลังบ้าน", () => {
  test("รุ่นของฉัน = เฉพาะรุ่นที่เป็นพี่เลี้ยงประจำ น้องที่ไม่มีรุ่นไม่นับ", () => {
    expect(inCohort(2, "mine", [2, 5])).toBe(true);
    expect(inCohort(3, "mine", [2, 5])).toBe(false);
    expect(inCohort(null, "mine", [2])).toBe(false);
  });
  test("ค่าเริ่ม: ดูแลรุ่นอยู่ = รุ่นของฉัน ไม่ได้ดูแล = ทุกรุ่น", () => {
    expect(resolveCohortFilter(null, [2], [1, 2])).toBe("mine");
    expect(resolveCohortFilter(null, [], [1, 2])).toBe("all");
    expect(resolveCohortFilter(null, [], [5])).toBe(5); // ฝึกอยู่รุ่นเดียว = เริ่มที่รุ่นนั้น
  });
  test("รุ่นที่จบแล้วไม่ถูกจำ เปิดหน้าใหม่กลับไปรุ่นที่กำลังฝึก", () => {
    expect(resolveCohortFilter(3, [], [5])).toBe(5); // 3 จบแล้ว (ไม่อยู่ใน running)
    expect(resolveCohortFilter(3, [5], [5, 6])).toBe("mine");
  });
  test("ค่าที่จำไว้ใช้ได้ = ใช้ต่อ (รีเฟรชแล้วไม่หาย) · ใช้ไม่ได้แล้ว = กลับค่าเริ่ม", () => {
    expect(resolveCohortFilter("all", [2], [1, 2])).toBe("all");
    expect(resolveCohortFilter(1, [2], [1, 2])).toBe(1);
    expect(resolveCohortFilter(9, [2], [1, 2])).toBe("mine");
    expect(resolveCohortFilter("mine", [], [1, 2])).toBe("all");
    expect(resolveCohortFilter("none", [], [])).toBe("none");
  });
  test("ส่งให้ server", () => {
    expect(cohortQuery("all", [2])).toBeNull();
    expect(cohortQuery("mine", [2, 5])).toBe("2,5");
    expect(cohortQuery("none", [])).toBe("none");
    expect(cohortQuery(3, [])).toBe("3");
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
