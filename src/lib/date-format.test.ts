import { describe, expect, test } from "bun:test";
import { thDateOnly, thDateTime } from "./date-format";

describe("รูปแบบวันที่เดียวทั้งเว็บ", () => {
  test("วันที่ + เวลา เป็นเวลาไทย ปี พ.ศ. เดือนย่อ ไม่มีวินาที", () => expect(thDateTime("2026-11-03T07:05:00Z")).toBe("3 พ.ย. 2569 14:05"));
  test("ข้ามวันตามเวลาไทย (UTC 18:00 = ตีหนึ่งวันถัดไป)", () => expect(thDateOnly("2026-10-26T18:00:00Z")).toBe("27 ต.ค. 2569"));
});
