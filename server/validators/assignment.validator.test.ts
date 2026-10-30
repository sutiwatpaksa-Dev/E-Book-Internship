import { describe, expect, test } from "bun:test";
import { cohortAssignmentsSchema, newAssignmentSchema } from "./assignment.validator";

const ok = { slug: "clinic", name: "คลินิกสัตว์", brief: "", sections: [{ key: "api", label: "API", page: 8 }] };

describe("assignment validator", () => {
  test("slug ใช้ได้เฉพาะ a-z 0-9 -", () => {
    expect(newAssignmentSchema.safeParse(ok).success).toBe(true);
    expect(newAssignmentSchema.safeParse({ ...ok, slug: "Clinic 2" }).success).toBe(false);
  });
  test("key ของหัวข้อห้ามซ้ำ และหน้าต้องเป็นเลขบวก", () => {
    expect(newAssignmentSchema.safeParse({ ...ok, sections: [ok.sections[0], ok.sections[0]] }).success).toBe(false);
    expect(newAssignmentSchema.safeParse({ ...ok, sections: [{ key: "api", label: "API", page: 0 }] }).success).toBe(false);
  });
  test("รุ่นไม่มีโจทย์ได้ (ส่งรายการว่าง)", () => {
    expect(cohortAssignmentsSchema.safeParse({ assignmentIds: [] }).success).toBe(true);
  });
});
