import { describe, expect, test } from "bun:test";
import { canReadStarterPage, pickAssignment, visibleAssignments } from "./assignment-access";

// รุ่น 1: starter (แถวเดิม id 1) · รุ่น 2: สำเนา starter (id 5) + rental (id 6) · รุ่น 3: clinic (id 7)
const all = [
  { id: 1, slug: "starter", cohortId: 1 },
  { id: 5, slug: "starter", cohortId: 2 },
  { id: 6, slug: "rental", cohortId: 2 },
  { id: 7, slug: "clinic", cohortId: 3 },
];
const ids = (rows: { id: number }[]) => rows.map((r) => r.id);

describe("โจทย์ที่แต่ละคนได้", () => {
  test("น้องได้สำเนาของรุ่นตัวเอง แม้ slug ซ้ำกับรุ่นอื่น", () => {
    expect(pickAssignment("intern", 1, all)?.id).toBe(1);
    expect(pickAssignment("intern", 2, all, null, "starter")?.id).toBe(5);
    expect(pickAssignment("intern", 3, all)?.id).toBe(7);
  });
  test("รุ่นที่มีหลายชิ้น: ไม่ระบุ = ชิ้นใหม่สุด ระบุ = ชิ้นนั้น", () => {
    expect(pickAssignment("intern", 2, all)?.id).toBe(6);
    expect(ids(visibleAssignments("intern", 2, all))).toEqual([6, 5]);
  });
  test("ไม่มีรุ่น = STARTER แถวเดิม (บัญชีก่อนมีระบบรุ่นต้องเปิดได้เหมือนเดิม)", () => {
    expect(ids(visibleAssignments("intern", null, all))).toEqual([1]);
    expect(pickAssignment("intern", null, all)?.id).toBe(1);
  });
  test("ขอโจทย์ของรุ่นอื่น = ไม่พบ", () => {
    expect(pickAssignment("intern", 3, all, null, "rental")).toBeNull();
    expect(pickAssignment("intern", null, all, null, "clinic")).toBeNull();
  });
  test("รุ่นที่ยังไม่มีโจทย์ = ไม่พบ", () => {
    expect(pickAssignment("intern", 9, all)).toBeNull();
  });
  test("พี่เลี้ยงเห็นทุก slug ครั้งเดียว ใช้สำเนาของรุ่นที่กำลังดู", () => {
    expect(ids(visibleAssignments("dev", null, all))).toEqual([1, 6, 7]);
    expect(ids(visibleAssignments("dev", null, all, 2))).toEqual([5, 6, 7]);
    expect(pickAssignment("dev", null, all, 2)?.id).toBe(5);
    expect(pickAssignment("dev", null, all, null, "clinic")?.id).toBe(7);
    expect(pickAssignment("dev", null, all)?.id).toBe(1);
  });
});

describe("หน้าในหมวดโจทย์ฝึกงาน", () => {
  test("รุ่น STARTER อ่านได้ทุกหน้า", () => {
    expect(canReadStarterPage("", ["starter"])).toBe(true);
    expect(canReadStarterPage("database-api", ["clinic", "starter"])).toBe(true);
  });
  test("รุ่นโจทย์อื่นอ่านได้แค่หน้าที่ใช้กับทุกโจทย์", () => {
    expect(canReadStarterPage("timeline", ["clinic"])).toBe(true);
    expect(canReadStarterPage("submission", [])).toBe(true);
    expect(canReadStarterPage("", ["clinic"])).toBe(false);
    expect(canReadStarterPage("requirements", ["clinic"])).toBe(false);
  });
});
