import { describe, expect, test } from "bun:test";
import { submitSchema } from "../../server/validators/submission.validator";
import { deployProblem, normalizeDeploy, normalizeRepo, refProblem, repoOf, repoProblem, DEFAULT_ROUNDS, hasRound, roundLabel, roundsProblem, takesDeploy, treeUrl, waitingOf } from "./submission";

describe("ลิงก์ repo", () => {
  test("แบบที่คนคัดลอกมาจริง จัดเป็นแบบเดียว", () => {
    expect(normalizeRepo("https://github.com/somchai/starter")).toBe("https://github.com/somchai/starter");
    expect(normalizeRepo("github.com/somchai/starter")).toBe("https://github.com/somchai/starter");
    expect(normalizeRepo("https://www.github.com/somchai/starter/")).toBe("https://github.com/somchai/starter");
    expect(normalizeRepo(" http://github.com/Som-Chai/my.starter_web.git ")).toBe("https://github.com/Som-Chai/my.starter_web");
  });
  test("ไม่ใช่ repo บน GitHub = ผิด", () => {
    for (const v of [
      "https://gitlab.com/somchai/starter",
      "https://github.com/somchai",
      "https://github.com/somchai/starter/tree/main",
      "https://github.com.evil.com/somchai/starter",
      "https://github.com/-somchai/starter",
      "https://github.com/สมชาย/starter",
      "javascript:alert(1)",
      "https://github.com/somchai/..",
    ])
      expect(repoProblem(v)).not.toBeNull();
    expect(repoProblem("")).toBe("ใส่ลิงก์ repo บน GitHub");
  });
});

describe("tag หรือ commit ที่ส่ง", () => {
  test("ชื่อ tag และ SHA ที่ถูก", () => {
    for (const v of ["review-1", "review-1-fix1", "v1.0.0", "a1b2c3d", "release/day-10"]) expect(refProblem(v)).toBeNull();
  });
  test("ชื่อที่ Git ไม่รับ หรือมีช่องว่าง/ภาษาไทย", () => {
    for (const v of ["", "review 1", "รอบ1", "-review", "a..b", ".hidden", "x.lock", "x/", "a".repeat(101)]) expect(refProblem(v)).not.toBeNull();
  });
  test("ลิงก์ไปหน้าโค้ด ณ จุดที่ส่ง", () => {
    expect(treeUrl("https://github.com/a/b", "review-1")).toBe("https://github.com/a/b/tree/review-1");
    expect(treeUrl("https://github.com/a/b", "release/day-10")).toBe("https://github.com/a/b/tree/release/day-10");
  });
});

describe("รอตรวจ", () => {
  const r = (id: number, userId: number, round: string, reviewedAt: string | null = null) => ({ id, userId, assignment: "starter", round, reviewedAt });
  test("ส่งซ้ำรอบเดิม ตรวจแค่ครั้งล่าสุด", () => {
    const rows = [r(3, 1, "review-1"), r(2, 1, "review-1"), r(1, 2, "review-1", "2026-10-30")];
    expect(waitingOf(rows).map((x) => x.id)).toEqual([3]);
  });
  test("ตรวจครั้งล่าสุดแล้ว = ไม่ค้าง แม้ครั้งก่อนยังไม่ได้ตรวจ", () => {
    expect(waitingOf([r(2, 1, "review-1", "2026-10-30"), r(1, 1, "review-1")])).toEqual([]);
  });
  test("คนละรอบ นับแยกกัน", () => {
    expect(waitingOf([r(2, 1, "review-2"), r(1, 1, "review-1")]).length).toBe(2);
  });
});

describe("ลงทะเบียน repo วันที่ 1", () => {
  const base = { assignment: "starter", repoUrl: "github.com/ton/starter.git" };
  test("ไม่ต้องมี tag · เก็บ ref เป็น HEAD (branch หลักของ repo)", () => {
    const v = submitSchema.parse({ ...base, round: "start" });
    expect(v.ref).toBe("HEAD");
    expect(v.repoUrl).toBe("https://github.com/ton/starter");
  });
  test("รอบตรวจยังต้องมี tag", () => {
    expect(submitSchema.safeParse({ ...base, round: "review-1" }).success).toBe(false);
  });
  test("ลงทะเบียน repo ไม่นับเป็นรอตรวจ", () => {
    expect(waitingOf([{ id: 1, userId: 1, assignment: "starter", round: "start", reviewedAt: null }])).toEqual([]);
  });
  test("repo ล่าสุดของแต่ละคน", () => {
    const rows = [
      { userId: 1, repoUrl: "https://github.com/a/new" },
      { userId: 1, repoUrl: "https://github.com/a/old" },
    ];
    expect(repoOf(rows, 1)).toBe("https://github.com/a/new");
    expect(repoOf(rows, 2)).toBeNull();
  });
});

describe("ลิงก์เว็บที่ deploy แล้ว", () => {
  test("https เว็บจริงผ่าน และเก็บแบบไม่มี / ท้าย", () => {
    expect(normalizeDeploy("https://starter-somchai.vercel.app/")).toBe("https://starter-somchai.vercel.app");
    expect(normalizeDeploy(" https://shop.example.co.th/menu ")).toBe("https://shop.example.co.th/menu");
  });
  test("http, localhost, IP, มีช่องว่าง = ผิด", () => {
    for (const v of ["http://a.vercel.app", "https://localhost:3000", "https://127.0.0.1", "https://a.vercel.app/x y", "https://user:pw@a.vercel.app", "a.vercel.app", "javascript:alert(1)"]) {
      expect(normalizeDeploy(v)).toBeNull();
    }
  });
  test("ว่างได้ (ไม่บังคับ) · ส่งได้เฉพาะรอบ 2 กับ final", () => {
    expect(deployProblem("")).toBeNull();
    expect(takesDeploy(DEFAULT_ROUNDS, "review-2")).toBe(true);
    expect(takesDeploy(DEFAULT_ROUNDS, "review-1")).toBe(false);
    expect(takesDeploy(DEFAULT_ROUNDS, "nope")).toBe(false);
    const base = { assignment: "starter", repoUrl: "https://github.com/a/b", ref: "review-1", note: "" };
    expect(submitSchema.safeParse({ ...base, round: "review-1", deployUrl: "http://a.vercel.app" }).success).toBe(false);
    const ok = submitSchema.parse({ ...base, round: "final", ref: "final", deployUrl: "https://a.vercel.app/" });
    expect(ok.deployUrl).toBe("https://a.vercel.app");
    expect(submitSchema.parse({ ...base, round: "final", ref: "final" }).deployUrl).toBeNull();
  });
});

describe("รอบส่งงานของโจทย์", () => {
  const ok = DEFAULT_ROUNDS;
  test("แม่แบบเริ่มต้นผ่านกฎ และหารอบ/ชื่อรอบได้", () => {
    expect(roundsProblem(ok)).toBeNull();
    expect(hasRound(ok, "final")).toBe(true);
    expect(hasRound(ok, "start")).toBe(true);
    expect(hasRound(ok, "x")).toBe(false);
    expect(roundLabel("review-1", ok)).toBe("ตรวจรอบ 1");
    expect(roundLabel("start", ok)).toBe("ลงทะเบียน repo");
    expect(roundLabel("gone", ok)).toBe("gone");
  });
  test("ผิด: ว่าง, เกิน 10, id ซ้ำ/ผิด/ชน start, วันนอกช่วง, ชื่อว่าง", () => {
    const r = ok[0];
    expect(roundsProblem([])).not.toBeNull();
    expect(roundsProblem(Array.from({ length: 11 }, (_, i) => ({ ...r, id: `r${i}` })))).not.toBeNull();
    expect(roundsProblem([r, r])).not.toBeNull();
    expect(roundsProblem([{ ...r, id: "start" }])).not.toBeNull();
    expect(roundsProblem([{ ...r, id: "Bad Id" }])).not.toBeNull();
    expect(roundsProblem([{ ...r, day: 0 }])).not.toBeNull();
    expect(roundsProblem([{ ...r, day: 1.5 }])).not.toBeNull();
    expect(roundsProblem([{ ...r, label: "  " }])).not.toBeNull();
  });
});
