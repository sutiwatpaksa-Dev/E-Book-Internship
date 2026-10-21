import { describe, expect, test } from "bun:test";
import { gate, isPageRequest } from "./gate";

describe("gate", () => {
  test("หน้าทั่วไปเปิดได้ทุกคน", () => {
    expect(gate("/", null)).toBe("allow");
    expect(gate("/14-hono-api", null)).toBe("allow");
    expect(gate("/assets/14-hono-api.md.abc.js", null)).toBe("allow");
    expect(gate("/starterkit", null)).toBe("allow");
    expect(gate("/developer", null)).toBe("allow");
  });
  test("หน้า STARTER ต้อง login", () => {
    expect(gate("/starter/", null)).toBe("login");
    expect(gate("/starter", null)).toBe("login");
    expect(gate("/starter/timeline", null)).toBe("login");
    expect(gate("/assets/starter_index.md.DN3Nsq4E.js", null)).toBe("login");
    expect(gate("/starter/timeline", "intern")).toBe("allow");
    expect(gate("/starter/timeline", "dev")).toBe("allow");
  });
  test("หน้า Dev เฉพาะพี่เลี้ยง", () => {
    expect(gate("/dev/admin", null)).toBe("login");
    expect(gate("/dev/admin", "intern")).toBe("forbidden");
    expect(gate("/assets/dev_admin.md.x.lean.js", "intern")).toBe("forbidden");
    expect(gate("/dev/admin", "dev")).toBe("allow");
  });
  test("แยกหน้าเว็บกับไฟล์ประกอบ", () => {
    expect(isPageRequest("/starter/timeline")).toBe(true);
    expect(isPageRequest("/starter/timeline.html")).toBe(true);
    expect(isPageRequest("/assets/starter_index.md.x.js")).toBe(false);
  });
});
