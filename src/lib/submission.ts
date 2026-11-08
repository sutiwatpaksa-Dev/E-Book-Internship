// กฎของการส่งงาน ใช้ทั้งฟอร์มของน้อง (บอกผิดทันทีใต้ช่อง) และ server (ด่านจริง)
// โค้ดของน้องอยู่บน GitHub ที่เดียว เว็บนี้เก็บแค่ "ลิงก์ repo + จุดที่ส่ง (tag หรือ commit)" ไม่เก็บไฟล์

import type { Criterion } from "./rubric";

// รอบส่งเป็นข้อมูลของโจทย์ (assignments.rubric.rounds) แก้ได้จากหลังบ้าน · นี่คือแม่แบบเริ่มต้น (แผน 10 วันของ STARTER)
// ส่งซ้ำรอบเดิมได้ เก็บทุกครั้งไว้เป็นประวัติ · id ของรอบถูกเก็บไว้ในงานที่ส่งแล้ว จึงเปลี่ยนไม่ได้หลังสร้าง
// body/links/postedBy/postedAt/editedAt = ส่วนของ "โพสต์งาน" (คำสั่งงานแบบ Markdown, ลิงก์แนบ, ใครโพสต์เมื่อไร) ไม่บังคับ รอบเก่าที่ไม่มีก็ใช้ได้เหมือนเดิม
export type TaskLink = { label: string; url: string };
// โพสต์งาน 1 ชิ้น = 1 รอบ (6 พ.ย. 2569: เหลือแค่โพสต์งาน) · ค่าที่ไม่ตั้งใช้ของกล่องงาน (assignments) แทน โพสต์เก่าจึงทำงานเหมือนเดิม
// deploy = รอบนี้ต้องส่งลิงก์เว็บ · pdf: shared = PDF ของกล่องงาน, own = ไฟล์ของโพสต์นี้, none = ไม่แนบ
// criteria: ไม่ตั้ง = เกณฑ์ของกล่องงาน, [] = ไม่ให้คะแนน · weight = % ของคะแนนงาน (ไม่ตั้ง = ค่าตายตัวเดิม ดู DEFAULT_WEIGHT)
export type PostPdf = "shared" | "own" | "none";
export type RoundDef = { id: string; label: string; day: number; what: string; deploy: boolean; body?: string; links?: TaskLink[]; postedBy?: string; postedAt?: string; editedAt?: string; pdf?: PostPdf; criteria?: Criterion[]; overview?: string; weight?: number };
// % เดิมก่อนตั้งในโพสต์ได้: รอบ 1 = 20, รอบ 2 = 30, ส่งงานจริง = 50 · รอบอื่นไม่นับ
export const DEFAULT_WEIGHT: Record<string, number> = { "review-1": 20, "review-2": 30, final: 50 };
export const weightOf = (r: Pick<RoundDef, "id" | "weight">) => r.weight ?? DEFAULT_WEIGHT[r.id] ?? 0;
export const weightTotal = (rounds: Pick<RoundDef, "id" | "weight">[]) => rounds.reduce((n, r) => n + weightOf(r), 0);
// เกณฑ์ที่ใช้ตรวจโพสต์นี้
export const criteriaOf = (r: Pick<RoundDef, "criteria"> | undefined, fallback: Criterion[]) => r?.criteria ?? fallback;
export const BODY_MAX = 8000;
// ภาพรวมโจทย์ (Markdown ในหลังบ้าน) ที่น้องอ่านบนหน้าโจทย์
export const OVERVIEW_MAX = 20_000;
export const LINKS_MAX = 6;
export const DEFAULT_ROUNDS: RoundDef[] = [
  { id: "review-1", label: "ตรวจรอบ 1", day: 5, what: "ตาราง + API", deploy: false },
  { id: "review-2", label: "ตรวจรอบ 2", day: 9, what: "ทั้งระบบ", deploy: true },
  { id: "final", label: "ส่งงานจริง", day: 10, what: "งานครบ + README", deploy: true },
];

// วันที่ 1: ส่งแค่ลิงก์ repo ให้พี่เลี้ยงตามดูโค้ดได้ทุกวัน · ไม่มีผลตรวจ (ไม่นับเป็นรอตรวจ)
// เก็บเป็นแถวในตารางเดียวกัน ref = HEAD (GitHub พาไป branch หลักของ repo เอง ไม่ต้องรู้ว่าชื่อ main หรือ master)
export const START_ROUND = "start";
export const START_REF = "HEAD";
export const isReviewable = (round: string) => round !== START_ROUND;
export const roundLabel = (id: string, rounds: RoundDef[]) => (id === START_ROUND ? "ลงทะเบียน repo" : (rounds.find((r) => r.id === id)?.label ?? id));
export const hasRound = (rounds: RoundDef[], id: string) => id === START_ROUND || rounds.some((r) => r.id === id);

// ลิงก์แนบของโพสต์งาน: https เท่านั้น (พี่เลี้ยงแนบ repo ต้นแบบ, เอกสาร, วิดีโอ) ไม่รับ javascript: หรือ http ธรรมดา
export function linksProblem(links: TaskLink[]): string | null {
  if (links.length > LINKS_MAX) return `แนบลิงก์ได้ไม่เกิน ${LINKS_MAX} ลิงก์`;
  for (const l of links) {
    if (!l.label.trim() || l.label.trim().length > 60) return "ชื่อลิงก์ 1–60 ตัวอักษร";
    if (l.url.length > 300 || !/^https:\/\/[^\s]+\.[^\s]+$/i.test(l.url.trim())) return `ลิงก์ "${l.label.trim()}" ต้องขึ้นต้นด้วย https://`;
  }
  return null;
}

// กฎของรายการรอบ ใช้ทั้งฟอร์มหลังบ้านและ server · คืนข้อความผิด หรือ null เมื่อผ่าน
export const ROUND_ID = /^[a-z0-9-]{1,30}$/;
export function roundsProblem(rounds: RoundDef[]): string | null {
  if (rounds.length < 1 || rounds.length > 10) return "ต้องมี 1–10 รอบ";
  const seen = new Set<string>();
  for (const [i, r] of rounds.entries()) {
    const at = `รอบที่ ${i + 1}`;
    if (!ROUND_ID.test(r.id) || r.id === START_ROUND || seen.has(r.id)) return `${at}: รหัสรอบไม่ถูกต้องหรือซ้ำ`;
    seen.add(r.id);
    if (!r.label.trim() || r.label.trim().length > 40) return `${at}: ชื่อรอบ 1–40 ตัวอักษร`;
    if (!Number.isInteger(r.day) || r.day < 1 || r.day > 60) return `${at}: วันที่ต้องเป็นเลข 1–60`;
    if (r.what.length > 60) return `${at}: คำอธิบายไม่เกิน 60 ตัวอักษร`;
    if ((r.body ?? "").length > BODY_MAX) return `${at}: คำสั่งงานยาวเกิน ${BODY_MAX} ตัวอักษร`;
    const bad = linksProblem(r.links ?? []);
    if (bad) return `${at}: ${bad}`;
  }
  return null;
}

// ผลตรวจของพี่เลี้ยง: ผ่านรอบนี้ หรือ แก้แล้วส่งใหม่
export const VERDICTS = ["pass", "revise"] as const;
export type Verdict = (typeof VERDICTS)[number];
export const VERDICT_LABEL: Record<Verdict, string> = { pass: "ผ่านรอบนี้", revise: "แก้แล้วส่งใหม่" };

// ลิงก์ repo: ยอมรับแบบที่คนคัดลอกมาจริง (มี www, ลงท้าย .git หรือ /, http) แล้วจัดเป็นแบบเดียว https://github.com/owner/repo
// ชื่อ owner: ตัวอังกฤษ ตัวเลข - ไม่เกิน 39 ตัว ไม่ขึ้นต้นด้วย - (กติกาของ GitHub) · ชื่อ repo: ตัวอังกฤษ ตัวเลข . _ - ไม่เกิน 100 ตัว
const REPO = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-z0-9](?:[a-z0-9-]{0,38}))\/([a-z0-9._-]{1,100}?)(?:\.git)?\/?$/i;
export function normalizeRepo(v: string): string | null {
  const m = v.trim().match(REPO);
  if (!m || m[2] === "." || m[2] === "..") return null;
  return `https://github.com/${m[1]}/${m[2]}`;
}
// น้องเปลี่ยน repo จากครั้งก่อนไหม (เทียบแบบจัดรูปแล้ว: www/.git/ตัวพิมพ์ ไม่นับว่าเปลี่ยน) · ครั้งแรก (ไม่มีครั้งก่อน) = ไม่นับ
export function repoChanged(prev: string | null | undefined, now: string): boolean {
  if (!prev) return false;
  const norm = (v: string) => (normalizeRepo(v) ?? v.trim()).toLowerCase();
  return norm(prev) !== norm(now);
}
export function repoShort(v: string): string {
  return (normalizeRepo(v) ?? v).replace(/^https?:\/\/(?:www\.)?github\.com\//i, "");
}
export function repoProblem(v: string) {
  if (!v.trim()) return "ใส่ลิงก์ repo บน GitHub";
  return normalizeRepo(v) ? null : "ลิงก์ต้องเป็น repo บน GitHub เช่น https://github.com/somchai/starter (เปิด repo แล้วคัดลอกจากแถบที่อยู่)";
}

// ---- ชนิดของที่น้องส่ง (ตั้งที่โจทย์ assignments.submit_kind) ----
// repo = repo GitHub (ค่าเดิม ทุกโจทย์ก่อน v2.2.30) · link = ลิงก์ https ทั่วไป (Figma, Drive, สไลด์) · text = ข้อความอย่างเดียว (ไม่มีลิงก์)
// ลิงก์เก็บในช่องเดียวกับ repo (repoUrl) ทุกชนิด · text เก็บ ""
export const SUBMIT_KINDS = ["repo", "link", "text"] as const;
export type DeliverableKind = (typeof SUBMIT_KINDS)[number];
export const isSubmitKind = (v: unknown): v is DeliverableKind => (SUBMIT_KINDS as readonly string[]).includes(v as string);
export const SUBMIT_KIND_LABEL: Record<DeliverableKind, string> = { repo: "repo บน GitHub", link: "ลิงก์ทั่วไป (Figma, Drive, สไลด์)", text: "ข้อความอย่างเดียว" };
// รอบ "ลงทะเบียน repo" และ branch/tag มีความหมายเฉพาะงานแบบ repo
export const hasRepo = (kind: DeliverableKind) => kind === "repo";
export const hasLink = (kind: DeliverableKind) => kind !== "text";
export const LINK_MAX = 300;
// ลิงก์ทั่วไป: https เท่านั้น มีชื่อเว็บจริง ไม่มีช่องว่าง (ไม่รับ http, javascript:, localhost หรือเลข IP เพราะพี่เลี้ยงเปิดจากเครื่องตัวเองไม่ได้)
export function normalizeLink(v: string): string | null {
  const s = v.trim();
  if (!/^https:\/\//i.test(s) || /\s/.test(s) || s.length > LINK_MAX) return null;
  try {
    const u = new URL(s);
    const h = u.hostname;
    if (!h.includes(".") || h === "localhost" || /^[\d.]+$/.test(h) || h.includes(":")) return null;
    const out = u.toString();
    return u.pathname === "/" && !u.search && !u.hash ? out.replace(/\/$/, "") : out;
  } catch {
    return null;
  }
}
export function linkProblem(v: string) {
  if (!v.trim()) return "ใส่ลิงก์งานที่ส่ง (ขึ้นต้นด้วย https://)";
  return normalizeLink(v) ? null : "ลิงก์ต้องขึ้นต้นด้วย https:// และเป็นเว็บจริง (ไม่รับ http, localhost หรือเลข IP)";
}
// ข้อความถึงพี่เลี้ยงของงานแบบข้อความอย่างเดียว ต้องมีเนื้อหา ไม่งั้นพี่เลี้ยงไม่มีอะไรให้ตรวจ
export const TEXT_MIN = 10;
export function textProblem(note: string) {
  return note.trim().length >= TEXT_MIN ? null : `เขียนสิ่งที่ทำมาในช่องข้อความอย่างน้อย ${TEXT_MIN} ตัวอักษร`;
}
// ด่านเดียวของช่องส่งทุกชนิด: คืนข้อความผิด หรือ null · ใช้ทั้งฟอร์มและ server
export function submitProblem(kind: DeliverableKind, url: string, note: string): string | null {
  if (kind === "repo") return repoProblem(url);
  if (kind === "link") return linkProblem(url);
  return textProblem(note);
}
// ค่าที่เก็บลงฐาน: repo = ลิงก์ GitHub แบบจัดรูป · link = ลิงก์จัดรูป · text = ""
export function normalizeSubmit(kind: DeliverableKind, url: string): string {
  if (kind === "repo") return normalizeRepo(url) ?? url.trim();
  if (kind === "link") return normalizeLink(url) ?? url.trim();
  return "";
}
// ชื่อสั้นของลิงก์ที่ส่ง ไว้แสดงในตาราง: repo = "ผู้ใช้/ชื่อ", link = ชื่อเว็บ
export function linkShort(kind: DeliverableKind, v: string) {
  if (kind === "repo") return repoShort(v);
  try {
    return new URL(v).hostname.replace(/^www\./, "");
  } catch {
    return v;
  }
}

// ลิงก์เว็บที่ deploy แล้ว (Vercel หรือที่อื่น) ไม่บังคับ ส่งได้เฉพาะรอบที่ติ๊ก "รับลิงก์เว็บ"
// ต้องเป็น https และชื่อเว็บจริง (ไม่รับ localhost หรือเลข IP เพราะพี่เลี้ยงเปิดจากเครื่องตัวเองไม่ได้) · เก็บแบบไม่มี / ท้าย
// รอบไหนรับลิงก์ได้ ตั้งที่รอบแต่ละรอบ (rounds[].deploy)
export const takesDeploy = (rounds: RoundDef[], id: string) => rounds.find((r) => r.id === id)?.deploy ?? false;
export function normalizeDeploy(v: string): string | null {
  const s = v.trim();
  if (!/^https:\/\//i.test(s) || /\s/.test(s)) return null;
  try {
    const u = new URL(s);
    const host = u.hostname;
    if (!host.includes(".") || host === "localhost" || host.endsWith(".local") || /^[\d.]+$/.test(host) || host.includes(":") || u.username || u.password) return null;
    return `${u.origin}${u.pathname}${u.search}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}
export function deployProblem(v: string) {
  if (!v.trim()) return null;
  if (v.trim().length > 300) return "ลิงก์ยาวเกินไป";
  return normalizeDeploy(v) ? null : "ลิงก์เว็บต้องขึ้นต้นด้วย https:// และเป็นเว็บจริง เช่น https://starter-somchai.vercel.app (ไม่ใช่ localhost)";
}

// จุดที่ส่ง: ชื่อ tag (เช่น review-1, review-1-fix1) หรือ commit SHA 7–40 ตัว
// ตัวอังกฤษ ตัวเลข . _ - / เท่านั้น ห้ามขึ้นต้นด้วย - หรือ . ห้ามมี .. (กติกาชื่อ ref ของ Git) ยาวไม่เกิน 100
export function refProblem(v: string) {
  const s = v.trim();
  if (!s) return "ใส่ชื่อ tag หรือ commit ที่ส่ง เช่น review-1";
  if (s.length > 100) return "ชื่อ tag ยาวไม่เกิน 100 ตัว";
  if (!/^[a-z0-9._/-]+$/i.test(s)) return "ชื่อ tag ใช้ได้แค่ตัวอังกฤษ ตัวเลข . _ - / (ไม่มีช่องว่าง ไม่มีภาษาไทย)";
  if (/^[-.]|\.\.|\/$|\.lock$/i.test(s)) return "ชื่อนี้ Git ไม่รับเป็น tag ลองแบบ review-1";
  return null;
}

// ลิงก์ไปหน้าโค้ด ณ จุดที่ส่ง · encode ทุกส่วน (ชื่อ tag มี / ได้ จึง encode ทีละท่อน)
// หน้ารายการ commit: พี่เลี้ยงดูว่าน้อง push ล่าสุดเมื่อไร ทำอะไรไปบ้าง
export const commitsUrl = (repo: string) => `${repo}/commits`;
export const treeUrl = (repo: string, ref: string) => `${repo}/tree/${ref.trim().split("/").map(encodeURIComponent).join("/")}`;

// แถวล่าสุดของแต่ละ (คน, โจทย์, รอบ) · รายการต้องเรียงใหม่สุดก่อนอยู่แล้ว (แบบที่ API ส่งมา)
// ส่งซ้ำก่อนพี่เลี้ยงตรวจ = ตรวจแค่ครั้งล่าสุด ครั้งก่อนไม่ต้องค้างเป็น "รอตรวจ"
type Row = { userId: number; assignment: string; round: string; reviewedAt: string | Date | null };
export function latestOnly<T extends Row>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = `${r.userId}|${r.assignment}|${r.round}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
export const waitingOf = <T extends Row>(rows: T[]) => latestOnly(rows).filter((r) => isReviewable(r.round) && !r.reviewedAt);

// repo ล่าสุดของน้องแต่ละคน (จากแถวใหม่สุด ไม่ว่ารอบไหน) · ใช้ทั้งกล่อง repo ของน้องและรายชื่อในหลังบ้าน
// repo ล่าสุดของน้อง: นับเฉพาะงานแบบ repo (งานแบบลิงก์ทั่วไป/ข้อความไม่มี repo) · ไม่มี submitKind = แถวเก่า = repo
export function repoOf<T extends { userId: number; repoUrl: string; submitKind?: DeliverableKind }>(rows: T[], userId: number) {
  return rows.find((r) => r.userId === userId && (r.submitKind ?? "repo") === "repo" && r.repoUrl)?.repoUrl ?? null;
}
