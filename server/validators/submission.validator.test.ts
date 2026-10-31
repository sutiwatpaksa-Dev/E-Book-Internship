import { describe, expect, test } from "bun:test";
import { commentSchema, reviewSchema } from "./submission.validator";

describe("ผลตรวจ + คะแนน", () => {
  test("ส่งคะแนนรายข้อมาด้วยได้ · ไม่ส่งก็ได้", () => {
    expect(reviewSchema.safeParse({ verdict: "pass", review: "", scores: { works: 40 } }).success).toBe(true);
    expect(reviewSchema.safeParse({ verdict: "pass" }).success).toBe(true);
  });
  test("คะแนนไม่ใช่ตัวเลข = ไม่ผ่าน", () => {
    expect(reviewSchema.safeParse({ verdict: "pass", scores: { works: "40" } }).success).toBe(false);
  });
  test("ให้แก้ต้องเขียนว่าแก้อะไร", () => {
    expect(reviewSchema.safeParse({ verdict: "revise", review: "" }).success).toBe(false);
  });
});

describe("ความเห็นใต้งาน", () => {
  test("ค่าเริ่มต้นคือความเห็นงาน", () => {
    const r = commentSchema.parse({ body: " ดีมาก " });
    expect(r).toEqual({ kind: "review", ref: "", body: "ดีมาก" });
  });
  test("ว่างหรือยาวเกินไม่ผ่าน · ประเภทต้องอยู่ในรายการ", () => {
    expect(commentSchema.safeParse({ body: "  " }).success).toBe(false);
    expect(commentSchema.safeParse({ body: "x".repeat(2001) }).success).toBe(false);
    expect(commentSchema.safeParse({ body: "a", kind: "gossip" }).success).toBe(false);
  });
  test("ref ของ commit ต้องเป็นชื่อ tag/commit ที่ Git รับ", () => {
    expect(commentSchema.safeParse({ body: "a", kind: "commit", ref: "review-1" }).success).toBe(true);
    expect(commentSchema.safeParse({ body: "a", kind: "commit", ref: "ภาษาไทย" }).success).toBe(false);
  });
});
