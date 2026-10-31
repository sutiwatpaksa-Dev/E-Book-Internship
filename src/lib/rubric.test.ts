import { describe, expect, test } from "bun:test";
import { buildScores, criteriaProblem, DEFAULT_CRITERIA, fillTemplate, percentOf, suggestVerdict, templatesProblem } from "./rubric";

const full = { works: 40, code: 30, git: 20, readme: 10 };

describe("เกณฑ์และคะแนน", () => {
  test("เกณฑ์เริ่มต้นถูกกฎและรวม 100", () => {
    expect(criteriaProblem(DEFAULT_CRITERIA)).toBeNull();
    expect(DEFAULT_CRITERIA.reduce((n, c) => n + c.max, 0)).toBe(100);
  });
  test("เกณฑ์ที่ผิดกฎ", () => {
    expect(criteriaProblem([{ id: "A b", label: "x", max: 10 }])).toContain("รหัส");
    expect(criteriaProblem([{ id: "a", label: "x", max: 0 }])).toContain("คะแนนเต็ม");
    expect(criteriaProblem([{ id: "a", label: "x", max: 5 }, { id: "a", label: "y", max: 5 }])).toContain("ซ้ำ");
    expect(criteriaProblem([{ id: "a", label: "", max: 5 }])).toContain("ชื่อ");
  });
  test("รวมคะแนนพร้อมสำเนาชื่อและคะแนนเต็ม", () => {
    const s = buildScores(DEFAULT_CRITERIA, { ...full, git: 15 })!;
    expect(s.total).toBe(95);
    expect(s.max).toBe(100);
    expect(s.items[2]).toEqual({ id: "git", label: "ใช้ Git: commit เป็นช่วง ข้อความชัด", max: 20, score: 15 });
  });
  test("คะแนนไม่ถูกต้อง = null", () => {
    expect(buildScores(DEFAULT_CRITERIA, { ...full, git: 21 })).toBeNull();
    expect(buildScores(DEFAULT_CRITERIA, { ...full, git: -1 })).toBeNull();
    expect(buildScores(DEFAULT_CRITERIA, { ...full, git: 1.5 })).toBeNull();
    expect(buildScores(DEFAULT_CRITERIA, { works: 40 })).toBeNull();
    expect(buildScores([], {})).toBeNull();
  });
  test("ระบบแนะนำผลจากสัดส่วน (60% ขึ้นไป = ผ่าน)", () => {
    expect(percentOf({ total: 59, max: 100 })).toBe(59);
    expect(suggestVerdict({ total: 60, max: 100 })).toBe("pass");
    expect(suggestVerdict({ total: 59, max: 100 })).toBe("revise");
    expect(suggestVerdict({ total: 3, max: 5 })).toBe("pass");
  });
});

describe("template", () => {
  test("แทนที่ช่อง · ช่องที่ไม่รู้จักคงไว้", () => {
    expect(fillTemplate("{ชื่อน้อง} ลอง {การ์ด} นะ {อื่น}", { ชื่อน้อง: "ฟ้า", การ์ด: "validation" })).toBe("ฟ้า ลอง validation นะ {อื่น}");
  });
  test("ตรวจกฎของ template", () => {
    expect(templatesProblem([{ id: "t1", kind: "commit", title: "commit ใหญ่", body: "แบ่ง commit" }])).toBeNull();
    expect(templatesProblem([{ id: "t1", kind: "x" as never, title: "a", body: "b" }])).toContain("ประเภท");
    expect(templatesProblem([{ id: "t1", kind: "card", title: "a", body: " " }])).toContain("ข้อความ");
  });
});
