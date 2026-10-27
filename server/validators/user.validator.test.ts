import { describe, expect, test } from "bun:test";
import { updateUserSchema } from "./user.validator";

describe("user validator", () => {
  test("แก้บัญชีต้องมีอย่างน้อย 1 ช่องที่รู้จัก · superAdmin ส่งมาทาง API ไม่ได้", () => {
    expect(updateUserSchema.safeParse({ disabled: true }).success).toBe(true);
    expect(updateUserSchema.safeParse({}).success).toBe(false);
    expect(updateUserSchema.safeParse({ superAdmin: true }).success).toBe(false);
  });
});
