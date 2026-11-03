import { describe, expect, test } from "bun:test";
import { dueDateFor, feedOrder, POST_BODY_MAX, postInputProblem, visibleTo, type PostInput } from "./post";

const base: PostInput = { kind: "announcement", assignmentId: null, title: "ประชุมรวมศุกร์นี้", body: "", links: [], allCohorts: false, cohortIds: [22], dueDay: null, dueAt: null, pinned: false };

describe("ใครเห็นโพสต์ไหน (โจทย์ไม่ปนกันระหว่างรุ่น)", () => {
  test("โพสต์ของรุ่น A รุ่น B ไม่เห็น", () => {
    expect(visibleTo({ allCohorts: false, cohortIds: [1] }, 1)).toBe(true);
    expect(visibleTo({ allCohorts: false, cohortIds: [1] }, 2)).toBe(false);
  });
  test("โพสต์หลายรุ่น เห็นเฉพาะรุ่นที่เลือก", () => {
    expect(visibleTo({ allCohorts: false, cohortIds: [1, 3] }, 3)).toBe(true);
    expect(visibleTo({ allCohorts: false, cohortIds: [1, 3] }, 2)).toBe(false);
  });
  test("น้องไม่มีรุ่นเห็นแค่โพสต์ทุกรุ่น ไม่ตกไปเห็นโจทย์ของใคร", () => {
    expect(visibleTo({ allCohorts: true, cohortIds: [] }, null)).toBe(true);
    expect(visibleTo({ allCohorts: false, cohortIds: [1] }, null)).toBe(false);
  });
  test("ไม่ติ๊กทุกรุ่นและไม่เลือกรุ่น = ไม่มีใครเห็น และฟอร์มไม่ยอมให้โพสต์", () => {
    expect(visibleTo({ allCohorts: false, cohortIds: [] }, 1)).toBe(false);
    expect(postInputProblem({ ...base, cohortIds: [] })).not.toBeNull();
  });
});

describe("กฎของโพสต์", () => {
  test("ประกาศ/แหล่งเรียนรู้ไม่มีกำหนดส่งและไม่ผูกโจทย์", () => {
    expect(postInputProblem(base)).toBeNull();
    expect(postInputProblem({ ...base, dueAt: "2026-11-07" })).not.toBeNull();
    expect(postInputProblem({ ...base, kind: "resource", assignmentId: 1 })).not.toBeNull();
  });
  test("ผลรีวิวเป็นโพสต์ให้อ่าน ไม่มีกำหนดส่งและไม่ผูกโจทย์ ยาวได้ถึง POST_BODY_MAX", () => {
    const review = { ...base, kind: "review" as const, title: "ผลรีวิว deploy Vercel: web-com" };
    expect(postInputProblem({ ...review, body: "ก".repeat(10_000) })).toBeNull();
    expect(postInputProblem({ ...review, body: "ก".repeat(POST_BODY_MAX + 1) })).not.toBeNull();
    expect(postInputProblem({ ...review, dueAt: "2026-11-07" })).not.toBeNull();
    expect(postInputProblem({ ...review, assignmentId: 1 })).not.toBeNull();
  });
  test("งานย่อยของโจทย์ใช้วันทำงานที่ N", () => {
    const task = { ...base, kind: "task" as const, assignmentId: 1 };
    expect(postInputProblem({ ...task, dueDay: 5 })).toBeNull();
    expect(postInputProblem({ ...task, dueDay: null })).not.toBeNull();
    expect(postInputProblem({ ...task, dueDay: 0 })).not.toBeNull();
    expect(postInputProblem({ ...task, dueAt: "2026-11-07" })).not.toBeNull();
  });
  test("งานเดี่ยวใช้วันที่จริงหรือไม่มีกำหนด", () => {
    const task = { ...base, kind: "task" as const };
    expect(postInputProblem({ ...task, dueAt: "2026-11-07" })).toBeNull();
    expect(postInputProblem(task)).toBeNull();
    expect(postInputProblem({ ...task, dueDay: 3 })).not.toBeNull();
    expect(postInputProblem({ ...task, dueAt: "7/11/2569" })).not.toBeNull();
  });
  test("หัวข้อสั้น/ยาวเกิน และลิงก์ไม่ใช่ https ไม่ผ่าน", () => {
    expect(postInputProblem({ ...base, title: "ab" })).not.toBeNull();
    expect(postInputProblem({ ...base, title: "x".repeat(121) })).not.toBeNull();
    expect(postInputProblem({ ...base, links: [{ label: "repo", url: "http://x.com" }] })).not.toBeNull();
  });
});

describe("กำหนดส่งของแต่ละรุ่น", () => {
  test("วันทำงานที่ N แปลงตามวันเริ่มของรุ่นนั้น (โจทย์เดียวใช้ได้หลายรุ่น)", () => {
    // จันทร์ 2 พ.ย. 2569: วันทำงานที่ 5 = ศุกร์ 6 พ.ย. · เริ่มพุธ 4 พ.ย.: วันที่ 5 = อังคาร 10 พ.ย.
    expect(dueDateFor({ dueDay: 5, dueAt: null }, "2026-11-02")).toBe("2026-11-06");
    expect(dueDateFor({ dueDay: 5, dueAt: null }, "2026-11-04")).toBe("2026-11-10");
  });
  test("วันที่จริงใช้ตามนั้น · ไม่มีกำหนด = null", () => {
    expect(dueDateFor({ dueDay: null, dueAt: "2026-11-20" }, "2026-11-02")).toBe("2026-11-20");
    expect(dueDateFor({ dueDay: null, dueAt: null }, "2026-11-02")).toBeNull();
    expect(dueDateFor({ dueDay: 5, dueAt: null }, null)).toBeNull();
  });
});

describe("ลำดับฟีด", () => {
  test("ปักหมุด → งานใกล้กำหนด → ที่เหลือใหม่สุดก่อน", () => {
    const items = [
      { id: 1, kind: "announcement" as const, pinned: false, due: null, createdAt: "2026-11-02T10:00:00Z" },
      { id: 2, kind: "task" as const, pinned: false, due: "2026-11-10", createdAt: "2026-11-01T10:00:00Z" },
      { id: 3, kind: "task" as const, pinned: false, due: "2026-11-06", createdAt: "2026-10-30T10:00:00Z" },
      { id: 4, kind: "resource" as const, pinned: true, due: null, createdAt: "2026-10-01T10:00:00Z" },
      { id: 5, kind: "task" as const, pinned: false, due: "2026-11-05", createdAt: "2026-10-29T10:00:00Z", done: true },
      { id: 6, kind: "resource" as const, pinned: false, due: null, createdAt: "2026-11-03T10:00:00Z" },
    ];
    expect(feedOrder(items).map((i) => i.id)).toEqual([4, 3, 2, 6, 1, 5]);
  });
});
