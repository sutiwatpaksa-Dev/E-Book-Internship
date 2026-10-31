// เกณฑ์ให้คะแนนและ template ความเห็น: เป็นข้อมูลของโจทย์ (assignments.rubric) แก้จากหลังบ้านได้ ไม่ต้องแก้โค้ด
// คะแนนที่ตรวจแล้วเก็บสำเนาชื่อและคะแนนเต็ม ณ ตอนตรวจ (submissions.scores) แก้เกณฑ์ทีหลังคะแนนเก่าจึงไม่เปลี่ยน

export type Criterion = { id: string; label: string; max: number };

export const COMMENT_KINDS = ["review", "commit", "card", "extra"] as const;
export type CommentKind = (typeof COMMENT_KINDS)[number];
export const COMMENT_KIND_LABEL: Record<CommentKind, string> = { review: "ความเห็นงาน", commit: "ความเห็น commit", card: "แนะนำการ์ด", extra: "เนื้อหาเพิ่มเติม" };

export type CommentTemplate = { id: string; kind: CommentKind; title: string; body: string };

// เกณฑ์เริ่มต้นของโจทย์ใหม่ (พี่เลี้ยงแก้ได้): รวม 100 คะแนน
export const DEFAULT_CRITERIA: Criterion[] = [
  { id: "works", label: "ทำงานได้ตามโจทย์", max: 40 },
  { id: "code", label: "โค้ดอ่านง่าย แยกชั้นตามที่สอน", max: 30 },
  { id: "git", label: "ใช้ Git: commit เป็นช่วง ข้อความชัด", max: 20 },
  { id: "readme", label: "README และการอธิบายงาน", max: 10 },
];

// สัดส่วนคะแนนที่ระบบแนะนำว่า "ผ่าน" (พี่เลี้ยงกดเปลี่ยนเองได้เสมอ)
export const PASS_PERCENT = 60;

const ID = /^[a-z0-9-]{1,30}$/;

export function criteriaProblem(list: Criterion[]): string | null {
  if (list.length > 10) return "เกณฑ์ไม่เกิน 10 ข้อ";
  const seen = new Set<string>();
  for (const [i, c] of list.entries()) {
    const at = `ข้อที่ ${i + 1}`;
    if (!ID.test(c.id) || seen.has(c.id)) return `${at}: รหัสไม่ถูกต้องหรือซ้ำ`;
    seen.add(c.id);
    if (!c.label.trim() || c.label.trim().length > 80) return `${at}: ชื่อเกณฑ์ 1–80 ตัวอักษร`;
    if (!Number.isInteger(c.max) || c.max < 1 || c.max > 100) return `${at}: คะแนนเต็มเป็นเลข 1–100`;
  }
  return null;
}

export function templatesProblem(list: CommentTemplate[]): string | null {
  if (list.length > 40) return "template ไม่เกิน 40 อัน";
  const seen = new Set<string>();
  for (const [i, t] of list.entries()) {
    const at = `template ที่ ${i + 1}`;
    if (!ID.test(t.id) || seen.has(t.id)) return `${at}: รหัสไม่ถูกต้องหรือซ้ำ`;
    seen.add(t.id);
    if (!COMMENT_KINDS.includes(t.kind)) return `${at}: ประเภทไม่ถูกต้อง`;
    if (!t.title.trim() || t.title.trim().length > 60) return `${at}: ชื่อ 1–60 ตัวอักษร`;
    if (!t.body.trim() || t.body.length > 1000) return `${at}: ข้อความ 1–1,000 ตัวอักษร`;
  }
  return null;
}

// คะแนนที่ตรวจแล้ว: สำเนา ณ ตอนตรวจ
export type ScoreItem = { id: string; label: string; max: number; score: number };
export type Scores = { items: ScoreItem[]; total: number; max: number };

// รวมคะแนนจากเกณฑ์ปัจจุบัน + คะแนนที่พี่เลี้ยงกรอก · คืน null ถ้าคะแนนไม่ถูกต้อง (ไม่ครบ ติดลบ เกินเต็ม ไม่ใช่จำนวนเต็ม)
export function buildScores(criteria: Criterion[], given: Record<string, number>): Scores | null {
  if (criteria.length === 0) return null;
  const items: ScoreItem[] = [];
  for (const c of criteria) {
    const v = given[c.id];
    if (!Number.isInteger(v) || v < 0 || v > c.max) return null;
    items.push({ id: c.id, label: c.label, max: c.max, score: v });
  }
  return { items, total: items.reduce((n, i) => n + i.score, 0), max: items.reduce((n, i) => n + i.max, 0) };
}

export const percentOf = (s: Pick<Scores, "total" | "max">) => (s.max ? Math.round((s.total / s.max) * 100) : 0);

// ระบบแนะนำผล: ถึงเกณฑ์ = ผ่าน ไม่ถึง = แก้ · พี่เลี้ยงเปลี่ยนเองได้
export const suggestVerdict = (s: Pick<Scores, "total" | "max">): "pass" | "revise" => (percentOf(s) >= PASS_PERCENT ? "pass" : "revise");

// แทนที่ช่อง {ชื่อ} ใน template · ช่องที่ไม่รู้จักคงไว้ตามเดิมให้พี่เลี้ยงเห็นแล้วแก้เอง
export function fillTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{([^{}\s]{1,20})\}/g, (m, k: string) => vars[k] ?? m);
}
export const TEMPLATE_FIELDS = ["ชื่อน้อง", "รอบ", "ref", "การ์ด"] as const;
