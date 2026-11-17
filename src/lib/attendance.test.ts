import { describe, expect, test } from "bun:test";
import { atThai, effectiveCheckOut, isLate, isWeekend, minutesWorked, todayState, type AttendanceRules } from "./attendance";

const rules: AttendanceRules = { workStart: "09:00:00", workEnd: "18:00:00", lateGraceMinutes: 5 };
const cohort = { startsOn: "2026-11-02", endsOn: "2026-12-30", endedAt: null };
// จันทร์ 17 พ.ย. 2569 (ค.ศ. 2026) เวลาไทย
const at = (hm: string, date = "2026-11-17") => atThai(date, hm);

describe("isLate", () => {
  test("ผ่อนผัน 5 นาที: 09:05:00 ยังไม่สาย", () => {
    expect(isLate(at("09:05:00"), "2026-11-17", rules)).toBe(false);
  });
  test("09:05:01 สาย", () => {
    expect(isLate(at("09:05:01"), "2026-11-17", rules)).toBe(true);
  });
  test("เช้ากว่าเวลาเริ่ม ไม่สาย", () => {
    expect(isLate(at("08:41:00"), "2026-11-17", rules)).toBe(false);
  });
  test("ผ่อนผัน 0 นาที: 09:00:01 สาย", () => {
    expect(isLate(at("09:00:01"), "2026-11-17", { ...rules, lateGraceMinutes: 0 })).toBe(true);
  });
});

describe("isWeekend", () => {
  test("เสาร์-อาทิตย์", () => {
    expect(isWeekend("2026-11-21")).toBe(true);
    expect(isWeekend("2026-11-22")).toBe(true);
  });
  test("จันทร์-ศุกร์", () => {
    expect(isWeekend("2026-11-17")).toBe(false);
    expect(isWeekend("2026-11-20")).toBe(false);
  });
});

describe("effectiveCheckOut", () => {
  const rec = { workDate: "2026-11-17", checkOutAt: null };
  test("น้องกดเอง ใช้เวลานั้น ไม่ใช่อัตโนมัติ", () => {
    const out = at("17:30:00");
    expect(effectiveCheckOut({ ...rec, checkOutAt: out }, rules, at("20:00:00"))).toEqual({ at: out, auto: false });
  });
  test("ยังไม่ถึงเวลาเลิกงานและยังไม่กด → ยังไม่มี", () => {
    expect(effectiveCheckOut(rec, rules, at("17:59:59"))).toBeNull();
  });
  test("ถึงเวลาเลิกงานแล้วไม่ได้กด → นับ 18:00 และติดป้ายอัตโนมัติ", () => {
    expect(effectiveCheckOut(rec, rules, at("18:00:00"))).toEqual({ at: at("18:00:00"), auto: true });
  });
  test("วันก่อนๆ ที่ลืมกด → นับ 18:00 ของวันนั้น", () => {
    expect(effectiveCheckOut(rec, rules, at("09:00:00", "2026-11-18"))).toEqual({ at: at("18:00:00"), auto: true });
  });
});

describe("minutesWorked", () => {
  test("08:52 ถึง 18:04 = 9 ชม. 12 นาที", () => {
    expect(minutesWorked(at("08:52:00"), at("18:04:00"))).toBe(552);
  });
  test("ออกก่อนเข้า ไม่ติดลบ", () => {
    expect(minutesWorked(at("19:00:00"), at("18:00:00"))).toBe(0);
  });
});

describe("todayState", () => {
  const base = { cohort, rules, holiday: false, record: null };
  test("ไม่มีรุ่น", () => {
    expect(todayState({ ...base, cohort: null, now: at("09:00:00") })).toBe("no_cohort");
  });
  test("รุ่นยังไม่เริ่ม", () => {
    expect(todayState({ ...base, cohort: { ...cohort, startsOn: "2026-12-01" }, now: at("09:00:00") })).toBe("not_started");
  });
  test("รุ่นจบแล้ว", () => {
    expect(todayState({ ...base, cohort: { ...cohort, endedAt: new Date("2026-11-10T00:00:00Z") }, now: at("09:00:00") })).toBe("cohort_ended");
  });
  test("เลยวันจบรุ่น นับว่าจบ", () => {
    expect(todayState({ ...base, cohort: { ...cohort, endsOn: "2026-11-10" }, now: at("09:00:00") })).toBe("cohort_ended");
  });
  test("วันเสาร์ หยุด", () => {
    expect(todayState({ ...base, now: at("09:00:00", "2026-11-21") })).toBe("off_day");
  });
  test("วันหยุดที่พี่เลี้ยงประกาศ", () => {
    expect(todayState({ ...base, holiday: true, now: at("09:00:00") })).toBe("holiday");
  });
  test("วันทำงานก่อนเลิกงาน เช็คอินได้", () => {
    expect(todayState({ ...base, now: at("08:45:00") })).toBe("ready");
  });
  test("เลยเวลาเลิกงานแล้วยังไม่ได้เช็คอิน ปิด", () => {
    expect(todayState({ ...base, now: at("18:00:00") })).toBe("closed");
  });
  test("เช็คอินแล้วยังไม่เลิกงาน = กำลังทำงาน", () => {
    const record = { workDate: "2026-11-17", checkInAt: at("08:52:00"), checkOutAt: null };
    expect(todayState({ ...base, record, now: at("12:00:00") })).toBe("working");
  });
  test("กดเช็คเอาต์แล้ว = เลิกงานแล้ว", () => {
    const record = { workDate: "2026-11-17", checkInAt: at("08:52:00"), checkOutAt: at("17:30:00") };
    expect(todayState({ ...base, record, now: at("17:31:00") })).toBe("done");
  });
  test("ลืมกดเช็คเอาต์ พอถึง 18:00 = เลิกงานแล้ว", () => {
    const record = { workDate: "2026-11-17", checkInAt: at("08:52:00"), checkOutAt: null };
    expect(todayState({ ...base, record, now: at("18:01:00") })).toBe("done");
  });
  test("มีแถวเช็คอินอยู่แล้ว แสดงของจริงแม้เป็นวันหยุดที่เพิ่งประกาศ", () => {
    const record = { workDate: "2026-11-17", checkInAt: at("08:52:00"), checkOutAt: null };
    expect(todayState({ ...base, holiday: true, record, now: at("12:00:00") })).toBe("working");
  });
});
