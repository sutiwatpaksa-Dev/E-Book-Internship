import type * as PageTree from "fumadocs-core/page-tree";

// แปลงสารบัญจาก content/docs/meta.json (page tree ของ Fumadocs) เป็นโครงที่ headbar และ sidebar ใช้
// ด่านมาจากตัวคั่น "---ด่าน N · ชื่อ---" · ชื่อบทมาจาก navTitle ในไฟล์ .mdx จึงแก้ชื่อบทที่เดียว เมนูเปลี่ยนตาม
// เป็นข้อมูลล้วน (ไม่มี React) ส่งจาก server ไปหน้าเว็บได้ และเขียนเทสต์ได้ง่าย

export type NavItem = {
  url: string;
  // เลขบนป้าย เช่น "03" (หน้า STARTER ใช้ลำดับ 1, 2, 3 …) · null = ไม่มีเลข
  num: string | null;
  title: string;
};

export type NavStage = {
  id: string;
  // "ด่าน 2"
  kicker: string;
  // "ภาษาและ API"
  name: string;
  items: NavItem[];
};

export type NavSection = "roadmap" | "learn" | "project" | "ref" | "path";

export type NavModel = {
  home: NavItem | null;
  stages: NavStage[];
  extras: NavItem[];
  refs: NavItem[];
};

const REF_SEPARATOR = "อ้างอิง";
const PROJECT_URL = "/starter";

const text = (name: unknown) => (typeof name === "string" ? name : "");
// ตัดอีโมจิหน้าชื่อ ("📖 ศัพท์ที่ต้องรู้") และ 🔒 ท้ายชื่อ เมนูใช้ไอคอนของตัวเองแทน
const clean = (s: string) =>
  s
    .replace(/^\p{Extended_Pictographic}️?\s*/u, "")
    .replace(/\s*🔒$/u, "")
    .trim();

// "03 · Runtime & Package Manager" → { num: "03", title: "Runtime & Package Manager" } (บทแทรกอย่าง "08b" ก็นับเป็นเลขบท)
// "บทเสริม · จัดโครงสร้างโปรเจกต์" → { num: null, title: "จัดโครงสร้างโปรเจกต์" }
function splitTitle(name: string): Pick<NavItem, "num" | "title"> {
  const m = name.match(/^(\S+)\s+·\s+(.+)$/);
  if (!m) return { num: null, title: clean(name) };
  return /^\d+[a-z]?$/.test(m[1]) ? { num: m[1], title: m[2] } : { num: null, title: m[2] };
}

function pageItem(node: PageTree.Item): NavItem {
  return { url: node.url, ...splitTitle(text(node.name)) };
}

// โฟลเดอร์ (เช่น STARTER): หน้า index + หน้าในโฟลเดอร์ เรียงเลข 1, 2, 3 …
function folderItems(folder: PageTree.Folder): NavItem[] {
  const pages = [folder.index, ...folder.children.filter((n): n is PageTree.Item => n.type === "page")].filter(
    (n): n is PageTree.Item => !!n,
  );
  return pages.map((p, i) => ({ url: p.url, num: String(i + 1), title: splitTitle(text(p.name)).title }));
}

export function buildNav(tree: PageTree.Root, extraLinks: string[]): NavModel {
  const extras = new Set(extraLinks);
  const model: NavModel = { home: null, stages: [], extras: [], refs: [] };
  let current: NavStage | null = null;
  let inRefs = false;

  for (const node of tree.children) {
    if (node.type === "separator") {
      const name = text(node.name);
      inRefs = name === REF_SEPARATOR;
      const [kicker, ...rest] = name.split(" · ");
      current = inRefs ? null : { id: `stage-${model.stages.length + 1}`, kicker, name: rest.join(" · ") || kicker, items: [] };
      if (current) model.stages.push(current);
      continue;
    }

    const items = node.type === "folder" ? folderItems(node) : [pageItem(node)];
    for (const item of items) {
      if (!current && !inRefs) model.home ??= { ...item, title: "หน้าแรก · Roadmap" };
      else if (inRefs) model.refs.push(item);
      else if (extras.has(item.url)) model.extras.push(item);
      else current?.items.push(item);
    }
  }
  return model;
}

// หน้านี้อยู่หมวดไหนของเมนูบน (ใช้ไฮไลต์ลิงก์ใน headbar)
export function sectionOf(model: NavModel, url: string): NavSection | null {
  if (url === model.home?.url) return "roadmap";
  if (url === "/learn" || url.startsWith("/learn/")) return "path";
  if (url === PROJECT_URL || url.startsWith(`${PROJECT_URL}/`)) return "project";
  if (model.refs.some((r) => r.url === url)) return "ref";
  if (model.extras.some((x) => x.url === url) || model.stages.some((s) => s.items.some((i) => i.url === url))) return "learn";
  return null;
}

export const stageOf = (model: NavModel, url: string) => model.stages.find((s) => s.items.some((i) => i.url === url)) ?? null;
