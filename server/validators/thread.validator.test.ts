import { describe, expect, test } from "bun:test";
import { createThreadSchema, sendMessageSchema } from "./thread.validator";

const ok = { subject: "นัดตรวจงานรอบ 1", body: "พฤหัสนี้ 14:00 ที่ห้องประชุม" };

describe("sendMessageSchema (พี่เลี้ยงส่งข้อความหาน้อง)", () => {
  test("เลือกผู้รับอย่างใดอย่างหนึ่ง: รายชื่อ หรือทั้งรุ่น", () => {
    expect(sendMessageSchema.safeParse({ ...ok, userIds: [1, 2] }).success).toBe(true);
    expect(sendMessageSchema.safeParse({ ...ok, cohortId: 3 }).success).toBe(true);
    expect(sendMessageSchema.safeParse(ok).success).toBe(false);
    expect(sendMessageSchema.safeParse({ ...ok, userIds: [1], cohortId: 3 }).success).toBe(false);
  });
  test("รายชื่อว่างหรือเกิน 100 คนไม่ได้ · หัวข้อและข้อความสั้นเกินไม่ได้", () => {
    expect(sendMessageSchema.safeParse({ ...ok, userIds: [] }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ ...ok, userIds: Array.from({ length: 101 }, (_, i) => i + 1) }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ ...ok, cohortId: 1, subject: "ab" }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ ...ok, cohortId: 1, body: "abcd" }).success).toBe(false);
  });
});

describe("createThreadSchema (ฝั่งน้อง)", () => {
  test("น้องเปิดเรื่องแบบ mentor_message เองไม่ได้", () => {
    const base = { subject: "ถามเรื่อง Hono", body: "ทำ route แล้ว 404 ลองมาแล้วหลายวิธี" };
    expect(createThreadSchema.safeParse({ ...base, kind: "question" }).success).toBe(true);
    expect(createThreadSchema.safeParse({ ...base, kind: "mentor_message" }).success).toBe(false);
  });
});
