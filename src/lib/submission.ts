// กฎของการส่งงาน ใช้ทั้งฟอร์มของน้อง (บอกผิดทันทีใต้ช่อง) และ server (ด่านจริง)
// โค้ดของน้องอยู่บน GitHub ที่เดียว เว็บนี้เก็บแค่ "ลิงก์ repo + จุดที่ส่ง (tag หรือ commit)" ไม่เก็บไฟล์

// รอบส่งเป็นข้อมูลของโจทย์ (assignments.rubric.rounds) แก้ได้จากหลังบ้าน · นี่คือแม่แบบเริ่มต้น (แผน 10 วันของ STARTER)
// ส่งซ้ำรอบเดิมได้ เก็บทุกครั้งไว้เป็นประวัติ · id ของรอบถูกเก็บไว้ในงานที่ส่งแล้ว จึงเปลี่ยนไม่ได้หลังสร้าง
// body/links/postedBy/postedAt/editedAt = ส่วนของ "โพสต์งาน" (คำสั่งงานแบบ Markdown, ลิงก์แนบ, ใครโพสต์เมื่อไร) ไม่บังคับ รอบเก่าที่ไม่มีก็ใช้ได้เหมือนเดิม
export type TaskLink = { label: string; url: string };
export type RoundDef = { id: string; label: string; day: number; what: string; deploy: boolean; body?: string; links?: TaskLink[]; postedBy?: string; postedAt?: string; editedAt?: string };
export const BODY_MAX = 8000;
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
export function repoProblem(v: string) {
  if (!v.trim()) return "ใส่ลิงก์ repo บน GitHub";
  return normalizeRepo(v) ? null : "ลิงก์ต้องเป็น repo บน GitHub เช่น https://github.com/somchai/starter (เปิด repo แล้วคัดลอกจากแถบที่อยู่)";
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
export function repoOf<T extends { userId: number; repoUrl: string }>(rows: T[], userId: number) {
  return rows.find((r) => r.userId === userId)?.repoUrl ?? null;
}
