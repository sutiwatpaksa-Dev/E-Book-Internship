import { describe, expect, test } from "bun:test";
import { mentorName, mentorNames, sendToLine } from "./mentors";

const m = (username: string, nickname: string | null = null, fullName: string | null = null) => ({ username, nickname, fullName });

describe("ชื่อพี่เลี้ยงที่น้องเห็น", () => {
  test("ใช้ชื่อเล่นก่อน แล้วชื่อจริง แล้วชื่อบัญชี", () => {
    expect(mentorName(m("arm", "อาร์ม", "สุทธิวัฒน์"))).toBe("พี่อาร์ม");
    expect(mentorName(m("arm", null, "สุทธิวัฒน์"))).toBe("พี่สุทธิวัฒน์");
    expect(mentorName(m("arm"))).toBe("พี่arm");
  });
  test("ชื่อที่มี พี่ อยู่แล้วไม่เติมซ้ำ", () => expect(mentorName(m("x", "พี่บี"))).toBe("พี่บี"));
  test("ต่อหลายชื่อแบบภาษาไทย", () => {
    expect(mentorNames([m("a", "เอ")])).toBe("พี่เอ");
    expect(mentorNames([m("a", "เอ"), m("b", "บี")])).toBe("พี่เอ และ พี่บี");
    expect(mentorNames([m("a", "เอ"), m("b", "บี"), m("c", "ซี")])).toBe("พี่เอ, พี่บี และ พี่ซี");
    expect(mentorNames([])).toBeNull();
  });
});

describe("บอกน้องว่าเรื่องถึงใคร", () => {
  test("มีพี่เลี้ยงประจำรุ่น = บอกชื่อ", () => expect(sendToLine([m("a", "เอ")])).toBe("ส่งถึง พี่เอ"));
  test("ไม่มีพี่เลี้ยงประจำ = ถึงพี่เลี้ยงทุกคน", () => expect(sendToLine([])).toBe("ส่งถึงพี่เลี้ยงทุกคน"));
  test("ยังโหลดไม่เสร็จ = ยังไม่บอก", () => expect(sendToLine(undefined)).toBeNull());
});
