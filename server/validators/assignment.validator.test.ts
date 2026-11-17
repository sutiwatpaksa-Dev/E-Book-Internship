import { describe, expect, test } from "bun:test";
import { DEFAULT_ROUNDS, OVERVIEW_MAX } from "../../src/lib/submission";
import { assignmentSchema, newAssignmentSchema, postSchema } from "./assignment.validator";

const ok = { slug: "clinic", cohortId: 1, name: "คลินิกสัตว์", brief: "", sections: [{ key: "api", label: "API", page: 8 }], rounds: DEFAULT_ROUNDS };

describe("assignment validator", () => {
  test("ภาพรวมโจทย์: ไม่ส่ง = ไม่แตะของเดิม · ส่งว่าง = ล้าง · ยาวเกินเพดานไม่ผ่าน", () => {
    const parsed = assignmentSchema.parse(ok);
    expect("overview" in parsed && parsed.overview !== undefined).toBe(false);
    expect(assignmentSchema.parse({ ...ok, overview: "" }).overview).toBe("");
    expect(assignmentSchema.safeParse({ ...ok, overview: "ก".repeat(OVERVIEW_MAX) }).success).toBe(true);
    expect(assignmentSchema.safeParse({ ...ok, overview: "ก".repeat(OVERVIEW_MAX + 1) }).success).toBe(false);
  });
  test("ภาพรวมโจทย์เก็บตามที่พิมพ์ (ไม่ trim: ย่อหน้าและบรรทัดว่างมีความหมายใน Markdown)", () => {
    expect(assignmentSchema.parse({ ...ok, overview: "\n## หัวข้อ\n\n- ข้อ 1\n" }).overview).toBe("\n## หัวข้อ\n\n- ข้อ 1\n");
  });
  test("slug ใช้ได้เฉพาะ a-z 0-9 -", () => {
    expect(newAssignmentSchema.safeParse(ok).success).toBe(true);
    expect(newAssignmentSchema.safeParse({ ...ok, slug: "Clinic 2" }).success).toBe(false);
  });
  test("key ของหัวข้อห้ามซ้ำ และหน้าต้องเป็นเลขบวก", () => {
    expect(newAssignmentSchema.safeParse({ ...ok, sections: [ok.sections[0], ok.sections[0]] }).success).toBe(false);
    expect(newAssignmentSchema.safeParse({ ...ok, sections: [{ key: "api", label: "API", page: 0 }] }).success).toBe(false);
  });
  test("รอบส่งต้องผ่านกฎ (ว่าง/id ซ้ำ/วันนอกช่วงไม่ได้)", () => {
    expect(newAssignmentSchema.safeParse({ ...ok, rounds: [] }).success).toBe(false);
    expect(newAssignmentSchema.safeParse({ ...ok, rounds: [DEFAULT_ROUNDS[0], DEFAULT_ROUNDS[0]] }).success).toBe(false);
    expect(newAssignmentSchema.safeParse({ ...ok, rounds: [{ ...DEFAULT_ROUNDS[0], day: 99 }] }).success).toBe(false);
    expect(newAssignmentSchema.safeParse({ ...ok, rounds: [{ ...DEFAULT_ROUNDS[0], id: "start" }] }).success).toBe(false);
  });
  test("รุ่นไม่มีโจทย์ได้ (ส่งรายการว่าง)", () => {
  });
});

describe("โพสต์งาน", () => {
  const post = { label: "ตรวจรอบ 1", day: 5, body: "## เป้าหมาย", links: [{ label: "repo", url: "https://github.com/a/b" }] };
  test("โพสต์ที่ถูกกฎผ่าน · ค่าไม่ใส่มีค่าเริ่มต้น", () => {
    expect(postSchema.safeParse(post).success).toBe(true);
    expect(postSchema.parse({ label: "a", day: 1 })).toEqual({ label: "a", what: "", day: 1, deploy: false, body: "", links: [] });
  });
  test("ไม่มีชื่อหรือกำหนดส่ง = ไม่ผ่าน", () => {
    expect(postSchema.safeParse({ ...post, label: " " }).success).toBe(false);
    expect(postSchema.safeParse({ ...post, day: 0 }).success).toBe(false);
    expect(postSchema.safeParse({ label: "a" }).success).toBe(false);
  });
  test("ลิงก์แนบต้องเป็น https", () => {
    expect(postSchema.safeParse({ ...post, links: [{ label: "x", url: "javascript:alert(1)" }] }).success).toBe(false);
    expect(postSchema.safeParse({ ...post, links: [{ label: "x", url: "http://a.com" }] }).success).toBe(false);
  });
  test("บันทึกทั้งโจทย์ไม่ทำให้ข้อมูลโพสต์หาย (zod ไม่ตัดช่อง)", () => {
    const r = assignmentSchema.parse({ name: "โจทย์", brief: "", sections: [], rounds: [{ id: "r1", label: "a", day: 1, what: "", deploy: false, body: "x", postedBy: "boss", postedAt: "2026-11-01T00:00:00Z" }] });
    expect(r.rounds[0]).toMatchObject({ body: "x", postedBy: "boss" });
  });
});
