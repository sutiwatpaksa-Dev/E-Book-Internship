import { describe, expect, test } from "bun:test";
import { mentorRecipients } from "./mentor-recipients";

const all = [1, 2, 3, 4];

describe("แจ้งเตือนเรื่องของน้องไปหาใคร", () => {
  test("รุ่นมีพี่เลี้ยงประจำ = แจ้งเฉพาะพี่เลี้ยงประจำรุ่น พี่เลี้ยงรุ่นอื่นไม่ได้", () => {
    expect(mentorRecipients([2], all)).toEqual([2]);
    expect(mentorRecipients([2, 3], all)).toEqual([2, 3]);
  });
  test("รุ่นไม่มีพี่เลี้ยงประจำ หรือน้องไม่มีรุ่น = แจ้งพี่เลี้ยงทุกคน", () => {
    expect(mentorRecipients([], all)).toEqual(all);
  });
  test("ไม่แจ้งคนที่ทำเรื่องนั้นเอง และไม่ซ้ำ", () => {
    expect(mentorRecipients([2, 2, 9], all, 9)).toEqual([2]);
    expect(mentorRecipients([], all, 1)).toEqual([2, 3, 4]);
  });
  test("ไม่มีพี่เลี้ยงเลย = ไม่มีผู้รับ (ไม่ error)", () => {
    expect(mentorRecipients([], [])).toEqual([]);
  });
});
