import { describe, expect, test } from "bun:test";
import { projectStatus } from "./project-status";
import { DEFAULT_ROUNDS } from "./submission";
import { buildPlan, type PlanSubmission } from "./work-plan";

const assignments = [
  { slug: "starter", name: "STARTER", rounds: DEFAULT_ROUNDS },
  { slug: "shop", name: "ร้านค้า", rounds: [] },
];
const sub = (round: string, over: Partial<PlanSubmission> = {}): PlanSubmission => ({ assignment: "starter", round, createdAt: "2026-11-04T03:00:00Z", verdict: null, reviewedAt: null, ...over });
const plan = (submissions: PlanSubmission[], today = "2026-11-04", ended = false) => buildPlan({ assignments, submissions, startsOn: "2026-11-02", today, ended });
const pass = (round: string) => sub(round, { verdict: "pass", reviewedAt: "x" });

describe("สถานะรวมของโจทย์", () => {
  test("โจทย์ที่ไม่มีรอบส่ง = empty และไม่มีงานถัดไป", () => {
    const s = projectStatus(plan([]), "shop");
    expect(s).toMatchObject({ state: "empty", total: 0, passed: 0, sent: 0, next: null });
  });
  test("ยังไม่ส่งสักรอบ = notstarted และงานถัดไปคือรอบแรก", () => {
    const s = projectStatus(plan([]), "starter");
    expect(s.state).toBe("notstarted");
    expect(s.total).toBe(3);
    expect(s.next?.round.id).toBe("review-1");
  });
  test("ส่งรอบ 1 แล้วรอตรวจ = waiting และนับว่าส่งแล้ว 1 รอบ", () => {
    const s = projectStatus(plan([sub("review-1")]), "starter");
    expect(s.state).toBe("waiting");
    expect(s.sent).toBe(1);
    expect(s.passed).toBe(0);
  });
  test("ผ่านรอบ 1 ที่เหลือยังไม่ส่ง = progress", () => {
    expect(projectStatus(plan([pass("review-1")]), "starter").state).toBe("progress");
  });
  test("เลยกำหนด = late ชนะรอตรวจ · ให้แก้ = revise ชนะรอตรวจ", () => {
    expect(projectStatus(plan([sub("review-1")], "2026-11-20"), "starter").state).toBe("late");
    expect(projectStatus(plan([sub("review-1", { verdict: "revise", reviewedAt: "x" }), sub("review-2")]), "starter").state).toBe("revise");
  });
  test("ผ่านครบทุกรอบ = pass และไม่มีงานถัดไป", () => {
    const rounds = DEFAULT_ROUNDS.map((r) => pass(r.id));
    const s = projectStatus(plan(rounds), "starter");
    expect(s).toMatchObject({ state: "pass", total: 3, passed: 3, next: null });
  });
  test("รุ่นจบแล้วและยังไม่ผ่านครบ = closed ไม่ใช่เลยกำหนด", () => {
    expect(projectStatus(plan([], "2026-11-20", true), "starter").state).toBe("closed");
  });
  test("นับเฉพาะโจทย์ที่ขอ ไม่ปนกับโจทย์อื่นในแผนเดียวกัน", () => {
    const both = buildPlan({
      assignments: [
        { slug: "starter", name: "STARTER", rounds: DEFAULT_ROUNDS },
        { slug: "shop", name: "ร้านค้า", rounds: DEFAULT_ROUNDS },
      ],
      submissions: DEFAULT_ROUNDS.map((r) => pass(r.id)),
      startsOn: "2026-11-02",
      today: "2026-11-04",
    });
    expect(projectStatus(both, "starter").state).toBe("pass");
    expect(projectStatus(both, "shop").state).toBe("notstarted");
  });
});
