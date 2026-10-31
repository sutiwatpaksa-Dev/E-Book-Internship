import { describe, expect, test } from "bun:test";
import type * as PageTree from "fumadocs-core/page-tree";
import { buildNav, sectionOf, stageOf } from "./nav-tree";

const page = (url: string, name: string): PageTree.Item => ({ type: "page", url, name });

// หน้าตาเดียวกับ page tree ที่ได้จาก meta.json (ย่อให้เหลือไม่กี่บท)
const tree: PageTree.Root = {
  name: "docs",
  children: [
    page("/", "🏠 หน้าแรก"),
    { type: "separator", name: "ภาค 2 · ภาษาและ API" },
    page("/03-node-yarn-bun", "03 · Runtime & Package Manager"),
    page("/08b-db-to-backend", "08b · จากแบบฐานข้อมูลสู่ Backend"),
    page("/react-language", "บทเสริม · ภาษาและคำสั่งที่ใช้เขียน React"),
    { type: "separator", name: "ภาค 6 · Mini Project" },
    {
      type: "folder",
      name: "เว็บไซต์ STARTER 🔒",
      index: page("/starter", "Requirement + สรุปร้าน"),
      children: [page("/starter/timeline", "แผน 10 วัน")],
    },
    { type: "separator", name: "อ้างอิง" },
    page("/glossary", "📖 ศัพท์ที่ต้องรู้"),
  ],
};

const nav = buildNav(tree, ["/react-language"]);

describe("buildNav", () => {
  test("ตัวคั่นกลายเป็นด่าน แยกเลขบทออกจากชื่อ", () => {
    expect(nav.stages.map((s) => [s.kicker, s.name])).toEqual([
      ["ภาค 2", "ภาษาและ API"],
      ["ภาค 6", "Mini Project"],
    ]);
    expect(nav.stages[0].items).toEqual([
      { url: "/03-node-yarn-bun", num: "03", title: "Runtime & Package Manager" },
      { url: "/08b-db-to-backend", num: "08b", title: "จากแบบฐานข้อมูลสู่ Backend" },
    ]);
  });
  test("บทเสริมแยกออกจากด่าน", () => {
    expect(nav.extras).toEqual([{ url: "/react-language", num: null, title: "ภาษาและคำสั่งที่ใช้เขียน React" }]);
  });
  test("หน้าในโฟลเดอร์เรียงเลข 1, 2 …", () => {
    expect(nav.stages[1].items.map((i) => [i.num, i.url])).toEqual([
      ["1", "/starter"],
      ["2", "/starter/timeline"],
    ]);
  });
  test("หมวดอ้างอิงตัดอีโมจิหน้าชื่อ", () => {
    expect(nav.refs).toEqual([{ url: "/glossary", num: null, title: "ศัพท์ที่ต้องรู้" }]);
    expect(nav.home?.url).toBe("/");
  });
});

describe("sectionOf / stageOf", () => {
  test("บอกหมวดของหน้าได้ถูก", () => {
    expect(sectionOf(nav, "/dashboard")).toBe("dashboard");
    expect(sectionOf(nav, "/learn")).toBe("path");
    expect(sectionOf(nav, "/learn/coding")).toBe("path");
    expect(sectionOf(nav, "/learn/cards")).toBe("cards");
    expect(sectionOf(nav, "/learn/cards/migration")).toBe("cards");
    expect(sectionOf(nav, "/03-node-yarn-bun")).toBe("cards");
    expect(sectionOf(nav, "/react-language")).toBe("cards");
    expect(sectionOf(nav, "/starter/timeline")).toBe("project");
    expect(sectionOf(nav, "/glossary")).toBe("cards");
    expect(sectionOf(nav, "/login")).toBeNull();
  });
  test("หาด่านของหน้า", () => {
    expect(stageOf(nav, "/starter/timeline")?.kicker).toBe("ภาค 6");
    expect(stageOf(nav, "/glossary")).toBeNull();
  });
});
