import { describe, expect, test } from "bun:test";
import { announcementSchema, cardOverrideSchema, mentorCardSchema, pageNoteSchema } from "./content.validator";

const card = { slug: "docker-wsl", title: "ต่อ Docker ใน WSL", step: "coding", topic: "db", minutes: 6, needs: ["postgres", "m/other-card"], body: "## หัวข้อ" };

describe("mentorCardSchema", () => {
  test("การ์ดครบ ผ่าน", () => expect(mentorCardSchema.safeParse(card).success).toBe(true));
  test("slug ภาษาไทย / ตัวใหญ่ / ขีดซ้อน ไม่ผ่าน", () => {
    for (const slug of ["ด็อกเกอร์", "Docker", "a--b", "-ab", "ab"]) expect(mentorCardSchema.safeParse({ ...card, slug }).success).toBe(false);
  });
  test("ขั้นหรือหมวดที่ไม่มีในคู่มือ ไม่ผ่าน", () => {
    expect(mentorCardSchema.safeParse({ ...card, step: "launch" }).success).toBe(false);
    expect(mentorCardSchema.safeParse({ ...card, topic: "python" }).success).toBe(false);
  });
  test("ไม่ส่ง needs = ว่าง", () => {
    const { needs: _, ...rest } = card;
    expect(mentorCardSchema.parse(rest).needs).toEqual([]);
  });
});

describe("pageNoteSchema", () => {
  test("รับแค่ path ในเว็บ", () => {
    expect(pageNoteSchema.safeParse({ pageUrl: "/learn/cards/migration", body: "x" }).success).toBe(true);
    expect(pageNoteSchema.safeParse({ pageUrl: "https://evil.example", body: "x" }).success).toBe(false);
    expect(pageNoteSchema.safeParse({ pageUrl: "/learn/<script>", body: "x" }).success).toBe(false);
  });
});

describe("announcementSchema", () => {
  test("เวลาต้องเป็น ISO มีเขตเวลา", () => {
    expect(announcementSchema.safeParse({ body: "Review 14:00", audience: "intern", endsAt: "2026-10-30T14:00:00+07:00" }).success).toBe(true);
    expect(announcementSchema.safeParse({ body: "Review 14:00", audience: "intern", endsAt: "พรุ่งนี้" }).success).toBe(false);
  });
});

describe("cardOverrideSchema", () => {
  test("null = ใช้ค่าเดิม", () => expect(cardOverrideSchema.safeParse({ hidden: true, title: null, minutes: null, topic: null }).success).toBe(true));
});
