import { describe, expect, test } from "bun:test";
import { reviewListQuerySchema, reviewSummaryQuerySchema, submitSchema } from "../../server/validators/submission.validator";
import { deployProblem, normalizeDeploy, normalizeRepo, refProblem, repoOf, repoProblem, DEFAULT_ROUNDS, hasRound, roundLabel, roundsProblem, takesDeploy, treeUrl, waitingOf, weightOf, weightTotal, criteriaOf, repoChanged, repoShort, hasLink, hasRepo, linkProblem, linkShort, normalizeLink, normalizeSubmit, submitProblem, textProblem } from "./submission";

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
    // ลิงก์จัดรูปที่ submission.service ตามชนิดงาน (ดู normalizeSubmit) ไม่ใช่ที่ schema แล้ว
    expect(normalizeSubmit("repo", v.repoUrl)).toBe("https://github.com/ton/starter");
  });
  test("รอบตรวจไม่ต้องมี tag แล้ว (6 พ.ย. 2569) ว่าง = HEAD · ใส่มาต้องถูกรูปแบบ", () => {
    expect(submitSchema.parse({ ...base, round: "review-1" }).ref).toBe("HEAD");
    expect(submitSchema.parse({ ...base, round: "review-1", ref: "review-1" }).ref).toBe("review-1");
    expect(submitSchema.safeParse({ ...base, round: "review-1", ref: "a b" }).success).toBe(false);
  });
  test("% คะแนนของโพสต์: ไม่ตั้ง = ค่าเดิม 20/30/50 · ตั้งแล้วใช้ค่าที่ตั้ง", () => {
    expect(weightTotal(DEFAULT_ROUNDS)).toBe(100);
    expect(weightOf({ id: "p1" })).toBe(0);
    expect(weightOf({ id: "final", weight: 40 })).toBe(40);
    expect(criteriaOf({ criteria: [] }, [{ id: "a", label: "A", max: 10 }])).toEqual([]);
    expect(criteriaOf({}, [{ id: "a", label: "A", max: 10 }])).toHaveLength(1);
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

describe("ตัวกรองหน้าตรวจงานแบบเจาะลง", () => {
  const parse = (q: Record<string, string>) => reviewListQuerySchema.safeParse(q);
  test("ไม่ส่งอะไร = รอตรวจ เก่าสุดก่อน หน้าละ 20", () => {
    const r = parse({});
    expect(r.success && r.data).toMatchObject({ status: "waiting", sort: "oldest", q: "", offset: 0, limit: 20 });
    expect(r.success && r.data.cohort).toBeUndefined();
  });
  test("ค่าที่ถูกแปลงเป็นตัวเลข/ตัดช่องว่าง", () => {
    const r = parse({ cohort: "7", assignment: "starter", round: "review-1", status: "all", sort: "name", q: "  สม ", offset: "40", limit: "50" });
    expect(r.success && r.data).toEqual({ cohort: 7, assignment: "starter", round: "review-1", status: "all", sort: "name", q: "สม", offset: 40, limit: 50 });
  });
  test("ค่าผิดตอบผิด ไม่ทิ้งเงียบ", () => {
    const bads: Record<string, string>[] = [{ cohort: "0" }, { cohort: "-1" }, { cohort: "1e3" }, { cohort: "abc" }, { cohort: "" }, { assignment: "A B" }, { round: "x y" }, { status: "done" }, { sort: "random" }, { offset: "-1" }, { limit: "0" }, { limit: "51" }, { limit: "20; drop" }, { q: "x".repeat(61) }];
    for (const bad of bads) expect(parse(bad).success).toBe(false);
  });
  test("สรุปรายงานใช้แค่รุ่น", () => {
    expect(reviewSummaryQuerySchema.safeParse({ cohort: "3", status: "all" }).data).toEqual({ cohort: 3 });
  });
});

describe("repoChanged (ป้าย เปลี่ยน repo จากครั้งก่อน)", () => {
  test("ครั้งแรก/ไม่มีครั้งก่อน = ไม่นับว่าเปลี่ยน", () => {
    expect(repoChanged(null, "https://github.com/a/b")).toBe(false);
    expect(repoChanged(undefined, "https://github.com/a/b")).toBe(false);
  });
  test("ลิงก์เดียวกันที่เขียนต่างรูป (www, .git, / ท้าย, ตัวพิมพ์) ไม่นับว่าเปลี่ยน", () => {
    expect(repoChanged("https://www.github.com/Somchai/Starter.git", "https://github.com/somchai/starter/")).toBe(false);
  });
  test("คนละ repo = เปลี่ยน", () => {
    expect(repoChanged("https://github.com/somchai/starter", "https://github.com/somchai/starter-v2")).toBe(true);
    expect(repoChanged("https://github.com/somchai/starter", "https://github.com/other/starter")).toBe(true);
  });
  test("repoShort ตัดโดเมนออก", () => {
    expect(repoShort("https://github.com/somchai/starter.git")).toBe("somchai/starter");
  });
});

describe("ชนิดของที่น้องส่ง (repo, ลิงก์ทั่วไป, ข้อความ)", () => {
  test("repo: ใช้กฎ GitHub เดิม จัดรูปลิงก์เหมือนเดิม", () => {
    expect(submitProblem("repo", "https://github.com/a/b", "")).toBeNull();
    expect(submitProblem("repo", "https://figma.com/file/x", "")).not.toBeNull();
    expect(normalizeSubmit("repo", "github.com/a/b.git")).toBe("https://github.com/a/b");
  });
  test("ลิงก์ทั่วไป: รับ https เว็บจริง (Figma, Drive) ไม่รับ http/localhost/เลข IP/javascript:/ช่องว่าง", () => {
    for (const ok of ["https://www.figma.com/file/abc?node-id=1", "https://drive.google.com/file/d/1/view", "https://canva.com"]) expect(linkProblem(ok)).toBeNull();
    for (const bad of ["", "http://figma.com/x", "https://localhost/x", "https://127.0.0.1/x", "javascript:alert(1)", "https://a b.com", "figma.com/x", "https://nodot"]) expect(linkProblem(bad)).not.toBeNull();
  });
  test("ลิงก์ทั่วไป: ตัด / ท้ายเมื่อเป็นแค่ชื่อเว็บ ไม่แตะ path จริง", () => {
    expect(normalizeLink("https://canva.com/")).toBe("https://canva.com");
    expect(normalizeLink("https://www.figma.com/file/abc/")).toBe("https://www.figma.com/file/abc/");
    expect(normalizeLink("https://a.com/x"+"y".repeat(300))).toBeNull();
  });
  test("ข้อความอย่างเดียว: ไม่ต้องมีลิงก์ แต่ต้องเขียนสิ่งที่ทำ (อย่างน้อย 10 ตัว) และเก็บลิงก์เป็นค่าว่าง", () => {
    expect(submitProblem("text", "", "ทำเสร็จแล้วครับ ดูได้เลย")).toBeNull();
    expect(submitProblem("text", "", "สั้น")).not.toBeNull();
    expect(textProblem("   ทำ   ")).not.toBeNull();
    expect(normalizeSubmit("text", "https://github.com/a/b")).toBe("");
  });
  test("เฉพาะงานแบบ repo ที่มีรอบลงทะเบียน repo และ branch/tag", () => {
    expect(hasRepo("repo")).toBe(true);
    expect(hasRepo("link")).toBe(false);
    expect(hasRepo("text")).toBe(false);
    expect(hasLink("text")).toBe(false);
    expect(hasLink("link")).toBe(true);
  });
  test("ชื่อสั้นของลิงก์ที่ส่ง", () => {
    expect(linkShort("repo", "https://github.com/a/b")).toBe("a/b");
    expect(linkShort("link", "https://www.figma.com/file/abc")).toBe("figma.com");
  });
  test("repoOf นับเฉพาะ repo: แถวงานแบบลิงก์ไม่ถูกนับเป็น repo ของน้อง · แถวเก่าไม่มีชนิด = repo", () => {
    const rows = [
      { userId: 1, repoUrl: "https://figma.com/x", submitKind: "link" as const },
      { userId: 1, repoUrl: "https://github.com/a/b" },
      { userId: 2, repoUrl: "", submitKind: "text" as const },
    ];
    expect(repoOf(rows, 1)).toBe("https://github.com/a/b");
    expect(repoOf(rows, 2)).toBeNull();
  });
});
