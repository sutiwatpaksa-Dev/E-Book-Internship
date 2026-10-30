import { describe, expect, test } from "bun:test";
import { pickAssignment, visibleAssignments } from "./assignment-access";

const all = ["starter", "clinic", "rental"];

describe("โจทย์ที่แต่ละคนได้", () => {
  test("น้องรุ่น A ได้โจทย์ของรุ่น A รุ่น B ได้ของรุ่น B", () => {
    expect(pickAssignment("intern", ["starter"], all)).toBe("starter");
    expect(pickAssignment("intern", ["clinic"], all)).toBe("clinic");
  });
  test("รุ่นที่เพิ่มโจทย์หลายชิ้น: ไม่ระบุ = ชิ้นใหม่สุด ระบุ = ชิ้นนั้น", () => {
    expect(pickAssignment("intern", ["rental", "clinic"], all)).toBe("rental");
    expect(pickAssignment("intern", ["rental", "clinic"], all, "clinic")).toBe("clinic");
  });
  test("ไม่มีรุ่น = STARTER (บัญชีก่อนมีระบบรุ่นต้องเปิดได้เหมือนเดิม)", () => {
    expect(pickAssignment("intern", null, all)).toBe("starter");
    expect(visibleAssignments("intern", null, all)).toEqual(["starter"]);
  });
  test("ขอโจทย์ของรุ่นอื่น = ไม่พบ", () => {
    expect(pickAssignment("intern", ["clinic"], all, "rental")).toBeNull();
    expect(pickAssignment("intern", null, all, "clinic")).toBeNull();
  });
  test("รุ่นที่ยังไม่มีโจทย์ = ไม่พบ", () => {
    expect(pickAssignment("intern", [], all)).toBeNull();
  });
  test("พี่เลี้ยงเปิดได้ทุกโจทย์ ไม่ระบุ = STARTER", () => {
    expect(pickAssignment("dev", null, all, "rental")).toBe("rental");
    expect(pickAssignment("dev", null, all)).toBe("starter");
  });
});
