import { describe, expect, test } from "bun:test";
import { leaveDecisionSchema, leaveRequestSchema } from "./leave.validator";

describe("leaveRequestSchema", () => {
  const ok = { workDate: "2026-11-18", kind: "leave", reason: "ไปสอบใบขับขี่" };
  test("รับที่ถูกต้อง", () => expect(leaveRequestSchema.safeParse(ok).success).toBe(true));
  test("เหตุผลสั้นไป ชนิดแปลก วันที่ผิด = ไม่ผ่าน", () => {
    expect(leaveRequestSchema.safeParse({ ...ok, reason: "ป่วย" }).success).toBe(false);
    expect(leaveRequestSchema.safeParse({ ...ok, kind: "sick" }).success).toBe(false);
    expect(leaveRequestSchema.safeParse({ ...ok, workDate: "18/11/2026" }).success).toBe(false);
  });
});

describe("leaveDecisionSchema", () => {
  test("อนุมัติไม่ต้องมีเหตุผล", () => expect(leaveDecisionSchema.safeParse({ status: "approved" }).success).toBe(true));
  test("ไม่อนุมัติต้องมีเหตุผลอย่างน้อย 3 ตัวอักษร", () => {
    expect(leaveDecisionSchema.safeParse({ status: "rejected" }).success).toBe(false);
    expect(leaveDecisionSchema.safeParse({ status: "rejected", note: "  " }).success).toBe(false);
    expect(leaveDecisionSchema.safeParse({ status: "rejected", note: "ขอเอกสารประกอบ" }).success).toBe(true);
  });
  test("สถานะ pending ตั้งเองไม่ได้", () => expect(leaveDecisionSchema.safeParse({ status: "pending", note: "xxx" }).success).toBe(false));
});
