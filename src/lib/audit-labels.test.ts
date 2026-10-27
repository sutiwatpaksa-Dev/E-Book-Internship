import { describe, expect, test } from "bun:test";
import { AUDIT_LABEL, auditGroupOf } from "./audit-labels";

describe("audit labels", () => {
  test("ทุกรหัสที่ server บันทึกได้มีคำอ่าน (กันเพิ่ม action ใหม่แล้วลืมใส่ ซึ่งจะโชว์เป็นรหัสดิบ)", async () => {
    const src = await Bun.file(new URL("../../server/services/audit.service.ts", import.meta.url)).text();
    const actions = [...src.matchAll(/\|\s*"([a-z_]+\.[a-z_]+)"/g)].map((m) => m[1]);
    expect(actions.length).toBeGreaterThan(10);
    for (const a of actions) expect(AUDIT_LABEL[a]).toBeDefined();
  });
  test("แบ่งกลุ่มจากคำหน้าจุด", () => {
    expect(auditGroupOf("user.reset_pin")).toBe("user");
    expect(auditGroupOf("announcement.end")).toBe("content");
    expect(auditGroupOf("thread.status")).toBe("thread");
    expect(auditGroupOf("x.y")).toBeNull();
  });
});
