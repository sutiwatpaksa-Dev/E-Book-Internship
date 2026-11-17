import { describe, expect, test } from "bun:test";
import { editAttendanceSchema, holidaySchema, workRuleSchema } from "./attendance.validator";

const ok = { userId: 3, workDate: "2026-11-14", checkIn: "08:58", checkOut: "18:00", reason: "เน็ตหลุดตอนกดเช็คอิน" };

describe("editAttendanceSchema", () => {
  test("รับข้อมูลครบ และเวลาออกเป็น null ได้", () => {
    expect(editAttendanceSchema.safeParse(ok).success).toBe(true);
    expect(editAttendanceSchema.safeParse({ ...ok, checkOut: null }).success).toBe(true);
  });
  test("เหตุผลสั้นเกินหรือว่าง = ไม่ผ่าน (บังคับ)", () => {
    expect(editAttendanceSchema.safeParse({ ...ok, reason: "  ลืม " }).success).toBe(false);
    expect(editAttendanceSchema.safeParse({ ...ok, reason: "" }).success).toBe(false);
  });
  test("เวลาผิดรูปแบบหรือวันที่ผิด = ไม่ผ่าน", () => {
    expect(editAttendanceSchema.safeParse({ ...ok, checkIn: "9:00" }).success).toBe(false);
    expect(editAttendanceSchema.safeParse({ ...ok, checkOut: "25:00" }).success).toBe(false);
    expect(editAttendanceSchema.safeParse({ ...ok, workDate: "14/11/2026" }).success).toBe(false);
  });
});

describe("holidaySchema", () => {
  test("ชื่อวันหยุดว่างได้ แต่ไม่เกิน 80 ตัว", () => {
    expect(holidaySchema.parse({ cohortId: 1, date: "2026-12-05" }).note).toBe("");
    expect(holidaySchema.safeParse({ cohortId: 1, date: "2026-12-05", note: "ก".repeat(81) }).success).toBe(false);
  });
});

describe("workRuleSchema", () => {
  const rule = { cohortId: 1, effectiveFrom: "2026-12-01", workStart: "10:00", workEnd: "19:00", lateGraceMinutes: 10 };
  test("รับกติกาที่ถูกต้อง", () => {
    expect(workRuleSchema.safeParse(rule).success).toBe(true);
  });
  test("ผ่อนผันนอก 0–120 หรือเวลาผิดรูปแบบ = ไม่ผ่าน", () => {
    expect(workRuleSchema.safeParse({ ...rule, lateGraceMinutes: 121 }).success).toBe(false);
    expect(workRuleSchema.safeParse({ ...rule, lateGraceMinutes: -1 }).success).toBe(false);
    expect(workRuleSchema.safeParse({ ...rule, workStart: "9:00" }).success).toBe(false);
  });
});
