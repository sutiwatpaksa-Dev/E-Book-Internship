import { describe, expect, test } from "bun:test";
import { gate, isLocked } from "./page-access";

describe("gate", () => {
  test("หน้าทั่วไปเปิดได้ทุกคน", () => {
    expect(gate("/", null)).toBe("allow");
    expect(gate("/14-hono-api", null)).toBe("allow");
    expect(gate("/starterkit", null)).toBe("allow");
    expect(gate("/developer", null)).toBe("allow");
  });
  test("หน้า STARTER ต้อง login", () => {
    expect(gate("/starter", null)).toBe("login");
    expect(gate("/starter/timeline", null)).toBe("login");
    expect(gate("/starter/timeline", "intern")).toBe("allow");
    expect(gate("/starter/timeline", "dev")).toBe("allow");
  });
  test("หน้า Dev เฉพาะพี่เลี้ยง", () => {
    expect(gate("/dev/admin", null)).toBe("login");
    expect(gate("/dev/admin", "intern")).toBe("forbidden");
    expect(gate("/dev/admin", "dev")).toBe("allow");
  });
  test("isLocked ใช้แสดง 🔒", () => {
    expect(isLocked("/starter")).toBe(true);
    expect(isLocked("/01-git")).toBe(false);
  });
});
