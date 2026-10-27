import { describe, expect, test } from "bun:test";
import { cohortAssignSchema, cohortSchema } from "./cohort.validator";

describe("cohort validator", () => {
  test("วันที่ต้องเป็น YYYY-MM-DD ที่มีจริง", () => {
    expect(cohortSchema.safeParse({ name: "รุ่น 2", startsOn: "2026-11-02", endsOn: "2026-12-25" }).success).toBe(true);
    expect(cohortSchema.safeParse({ name: "รุ่น 2", startsOn: "2/11/2026", endsOn: "2026-12-25" }).success).toBe(false);
    expect(cohortSchema.safeParse({ name: "รุ่น 2", startsOn: "2026-02-30", endsOn: "2026-12-25" }).success).toBe(false);
  });
  test("ย้ายเข้ารุ่น: cohortId เป็น null ได้ (เอาออกจากรุ่น) แต่ต้องมีบัญชีอย่างน้อย 1", () => {
    expect(cohortAssignSchema.safeParse({ userIds: [1], cohortId: null }).success).toBe(true);
    expect(cohortAssignSchema.safeParse({ userIds: [], cohortId: 1 }).success).toBe(false);
  });
});
