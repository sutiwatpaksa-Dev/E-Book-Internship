import { describe, expect, test } from "bun:test";
import { isOnline, presenceLabel } from "./presence";

const now = Date.parse("2026-10-31T10:00:00Z");
const ago = (ms: number) => new Date(now - ms).toISOString();

describe("presence", () => {
  test("ออนไลน์ถ้าเห็นไม่เกิน 3 นาที", () => {
    expect(isOnline(ago(2 * 60000), now)).toBe(true);
    expect(isOnline(ago(4 * 60000), now)).toBe(false);
    expect(isOnline(null, now)).toBe(false);
  });
  test("ข้อความ", () => {
    expect(presenceLabel(ago(30000), now)).toBe("ออนไลน์");
    expect(presenceLabel(ago(20 * 60000), now)).toBe("เห็นล่าสุด 20 นาทีก่อน");
    expect(presenceLabel(ago(5 * 3600000), now)).toBe("เห็นล่าสุด 5 ชม.ก่อน");
    expect(presenceLabel(ago(3 * 86400000), now)).toBe("เห็นล่าสุด 3 วันก่อน");
    expect(presenceLabel(null, now)).toBeNull();
  });
});
