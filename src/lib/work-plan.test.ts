import { describe, expect, test } from "bun:test";
import { DEFAULT_ROUNDS } from "./submission";
import { buildPlan, dueLabel, nextWork, workSummary, type PlanSubmission } from "./work-plan";

const assignments = [{ slug: "starter", name: "STARTER", rounds: DEFAULT_ROUNDS }];
const sub = (round: string, over: Partial<PlanSubmission> = {}): PlanSubmission => ({ assignment: "starter", round, createdAt: "2026-11-04T03:00:00Z", verdict: null, reviewedAt: null, ...over });
// รุ่นเริ่มจันทร์ 2 พ.ย.: รอบ 1 = วันที่ 5 = ศ. 6 พ.ย. · รอบ 2 = วันที่ 9 = พฤ. 12 พ.ย. · final = วันที่ 10 = ศ. 13 พ.ย.
const plan = (submissions: PlanSubmission[], today = "2026-11-04") => buildPlan({ assignments, submissions, startsOn: "2026-11-02", today });

describe("แผนงานของน้อง", () => {
  test("กำหนดส่งเป็นวันที่จริง เรียงตามวัน และบอกว่าเหลือกี่วัน", () => {
    const p = plan([]);
    expect(p.map((x) => x.dueOn)).toEqual(["2026-11-06", "2026-11-12", "2026-11-13"]);
    expect(p.map((x) => x.daysLeft)).toEqual([2, 8, 9]);
    expect(p.every((x) => x.state === "todo")).toBe(true);
  });
  test("ไม่ส่งแล้วเลยกำหนด = late · ส่งแล้วไม่เป็น late", () => {
    expect(plan([], "2026-11-09")[0].state).toBe("late");
    expect(plan([sub("review-1")], "2026-11-09")[0].state).toBe("waiting");
  });
  test("สถานะตามผลตรวจของการส่งล่าสุดของรอบนั้น", () => {
    expect(plan([sub("review-1", { verdict: "pass", reviewedAt: "x" })])[0].state).toBe("pass");
    expect(plan([sub("review-1", { verdict: "revise", reviewedAt: "x" })])[0].state).toBe("revise");
    // ส่งซ้ำ (ใหม่สุดมาก่อน) ยังไม่ตรวจ = รอตรวจ แม้ครั้งก่อนให้แก้
    expect(plan([sub("review-1"), sub("review-1", { verdict: "revise", reviewedAt: "x" })])[0].state).toBe("waiting");
  });
  test("ส่งช้ากี่วัน (นับตามเวลาไทย)", () => {
    expect(plan([sub("review-1", { createdAt: "2026-11-09T03:00:00Z" })])[0].lateDays).toBe(3);
    expect(plan([sub("review-1", { createdAt: "2026-11-06T16:30:00Z" })])[0].lateDays).toBe(0); // 23:30 ไทยวันที่ 6 ยังทัน
    expect(plan([sub("review-1", { createdAt: "2026-11-06T17:30:00Z" })])[0].lateDays).toBe(1); // 00:30 ไทยวันที่ 7 ช้า 1 วัน
  });
  test("ไม่มีวันเริ่มรุ่น → ไม่มีวันที่ แต่ยังเรียงตามวันที่ N", () => {
    const p = buildPlan({ assignments, submissions: [], startsOn: null, today: "2026-11-04" });
    expect(p.map((x) => x.dueOn)).toEqual([null, null, null]);
    expect(p.map((x) => x.round.day)).toEqual([5, 9, 10]);
    expect(dueLabel(p[0].daysLeft)).toBeNull();
  });
  test("งานถัดไป: ข้ามที่ผ่านแล้วและที่รอตรวจ · ให้แก้ยังต้องทำ", () => {
    expect(nextWork(plan([sub("review-1", { verdict: "pass", reviewedAt: "x" })]))?.round.id).toBe("review-2");
    expect(nextWork(plan([sub("review-1")]))?.round.id).toBe("review-2");
    expect(nextWork(plan([sub("review-1", { verdict: "revise", reviewedAt: "x" })]))?.round.id).toBe("review-1");
    expect(nextWork(plan(DEFAULT_ROUNDS.map((r) => sub(r.id, { verdict: "pass", reviewedAt: "x" }))))).toBeNull();
  });
  test("ข้อความกำหนดส่ง", () => {
    expect(dueLabel(2)).toBe("เหลือ 2 วัน");
    expect(dueLabel(0)).toBe("ส่งวันนี้");
    expect(dueLabel(-3)).toBe("เลยมา 3 วัน");
  });
});

describe("สรุปงานต่อน้องสำหรับพี่เลี้ยง", () => {
  test("นับเลยกำหนด รอตรวจ (และรอนานเกินเกณฑ์) ให้แก้ ผ่าน", () => {
    const subs = [sub("review-1", { createdAt: "2026-11-03T03:00:00Z" })];
    const p = plan(subs, "2026-11-13");
    const s = workSummary(p, subs.map((x) => ({ ...x })), "2026-11-13");
    expect(s).toEqual({ late: 1, waiting: 1, oldWaiting: 1, revise: 0, passed: 0, total: 3 }) // วันที่ 13 รอบ final กำหนดวันนี้ ยังไม่นับว่าเลย;
  });
  test("เพิ่งส่งยังไม่นับว่ารอนาน", () => {
    const subs = [sub("review-1", { createdAt: "2026-11-04T03:00:00Z" })];
    expect(workSummary(plan(subs), subs, "2026-11-04").oldWaiting).toBe(0);
  });
});

describe("รุ่นจบแล้ว", () => {
  const ended = (subs: PlanSubmission[]) => buildPlan({ assignments, submissions: subs, startsOn: "2026-11-02", ended: true, today: "2026-12-30" });
  test("งานที่ไม่ได้ส่งหรือให้แก้ = closed (ไม่ใช่เลยกำหนด)", () => {
    expect(ended([]).map((p) => p.state)).toEqual(["closed", "closed", "closed"]);
    expect(ended([sub("review-1", { verdict: "revise", reviewedAt: "x" })])[0].state).toBe("closed");
  });
  test("ผ่านแล้วและรอตรวจคงสถานะเดิม · ไม่มีงานถัดไป", () => {
    const p = ended([sub("review-1", { verdict: "pass", reviewedAt: "x" }), sub("review-2")]);
    expect(p.map((x) => x.state)).toEqual(["pass", "waiting", "closed"]);
    expect(nextWork(ended([]))).toBeNull();
  });
});
