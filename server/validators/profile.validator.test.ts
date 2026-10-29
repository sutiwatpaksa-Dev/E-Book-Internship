import { describe, expect, test } from "bun:test";
import { INTERN_FIELDS, MENTOR_FIELDS, profileSchema } from "./profile.validator";

describe("ช่องโปรไฟล์ตามบทบาท", () => {
  test("น้องกรอกช่องติดต่อและด้านที่สนใจได้ (พี่เลี้ยงเห็นในหน้าน้องรายคน)", () => {
    for (const k of ["phone", "expertise", "lineId", "instagram", "facebook"] as const) expect(INTERN_FIELDS).toContain(k);
  });
  test("น้องตั้งตำแหน่งงานไม่ได้ (เป็นข้อมูลของพี่เลี้ยง)", () => {
    expect(INTERN_FIELDS).not.toContain("jobTitle" as never);
    expect(MENTOR_FIELDS).toContain("jobTitle");
  });
  test("ช่องติดต่อของน้องใช้กฎเดียวกับพี่เลี้ยง", () => {
    expect(profileSchema.safeParse({ phone: "34342442342342423242" }).success).toBe(false);
    expect(profileSchema.safeParse({ lineId: "กหกห" }).success).toBe(false);
    expect(profileSchema.safeParse({ phone: "081-234-5678", lineId: "somchai.j" }).success).toBe(true);
  });
});
