// หน้าตรวจงานแบบเจาะลง (รุ่น → งาน → คน): ตำแหน่งที่เปิดอยู่เก็บใน URL ที่เดียว
// รีเฟรชแล้วอยู่ที่เดิม · ปุ่ม Back ใช้ได้ · ส่งลิงก์ให้พี่เลี้ยงอีกคนได้ · server ใช้ค่าคงที่ชุดเดียวกันตรวจ query

export const REVIEW_STATUSES = ["waiting", "reviewed", "all"] as const;
export const REVIEW_SORTS = ["oldest", "newest", "name"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type ReviewSort = (typeof REVIEW_SORTS)[number];
export const REVIEW_PAGE_SIZE = 20;
export const REVIEW_PAGE_MAX = 50;

export const STATUS_LABEL: Record<ReviewStatus, string> = { waiting: "รอตรวจ", reviewed: "ตรวจแล้ว", all: "ทั้งหมด" };
export const SORT_LABEL: Record<ReviewSort, string> = { oldest: "รอนานสุดก่อน", newest: "ส่งล่าสุดก่อน", name: "ชื่อ ก–ฮ / A–Z" };

export type ReviewUrl = {
  cohort: number | null;
  // งาน (โพสต์) = โจทย์ + รอบ · ไม่มี = อยู่ชั้น "งาน"
  assignment: string | null;
  round: string | null;
  status: ReviewStatus;
  sort: ReviewSort;
  q: string;
  page: number;
};

const SLUG = /^[a-z0-9-]{1,40}$/;
const positive = (v: string | null) => {
  if (v === null || !/^\d{1,9}$/.test(v)) return null;
  const n = Number(v);
  return n > 0 ? n : null;
};
const oneOf = <T extends string>(list: readonly T[], v: string | null, fallback: T) => (list.includes(v as T) ? (v as T) : fallback);

// ค่าใน URL มาจากคนพิมพ์/ลิงก์เก่าได้ ค่าที่ใช้ไม่ได้ถูกทิ้งกลับค่าเริ่ม (ไม่ส่งต่อไปถึง server)
// รุ่นไม่มีใน URL = ใช้รุ่นที่หลังบ้านแนะนำ (fallbackCohort)
export function readReviewUrl(p: URLSearchParams, fallbackCohort: number | null): ReviewUrl {
  const assignment = p.get("assignment");
  const round = p.get("round");
  const post = assignment && round && SLUG.test(assignment) && SLUG.test(round);
  return {
    cohort: positive(p.get("cohort")) ?? fallbackCohort,
    assignment: post ? assignment : null,
    round: post ? round : null,
    status: oneOf(REVIEW_STATUSES, p.get("status"), "waiting"),
    sort: oneOf(REVIEW_SORTS, p.get("sort"), "oldest"),
    q: (p.get("q") ?? "").trim().slice(0, 60),
    page: positive(p.get("page")) ?? 1,
  };
}

// ลิงก์หน้าตรวจงาน · ไม่ใส่ค่าที่เป็นค่าเริ่ม URL จะสั้นและอ่านออก · ชั้น "งาน" ไม่พกตัวกรองของชั้น "คน" ไปด้วย
export function reviewHref(u: ReviewUrl): string {
  const p = new URLSearchParams({ tab: "submissions" });
  if (u.cohort) p.set("cohort", String(u.cohort));
  if (u.assignment && u.round) {
    p.set("assignment", u.assignment);
    p.set("round", u.round);
    if (u.status !== "waiting") p.set("status", u.status);
    if (u.sort !== "oldest") p.set("sort", u.sort);
    if (u.q) p.set("q", u.q);
    if (u.page > 1) p.set("page", String(u.page));
  }
  return `/dev/admin?${p}`;
}

export const offsetOf = (page: number, size = REVIEW_PAGE_SIZE) => (page - 1) * size;
export const pagesOf = (total: number, size = REVIEW_PAGE_SIZE) => Math.max(1, Math.ceil(total / size));
// "21–40 จาก 834" · total 0 = ว่าง
export function rangeText(total: number, page: number, size = REVIEW_PAGE_SIZE) {
  if (total === 0) return "0 รายการ";
  const from = offsetOf(page, size) + 1;
  return `${from}–${Math.min(total, from + size - 1)} จาก ${total}`;
}

// ป้ายแท็บ: ตัวที่ได้ 0 รายการซ่อน (ยกเว้น "ทั้งหมด" กับตัวที่เลือกอยู่) · กฎข้อ 4 ของ ux-ui-design
export function visibleStatuses(counts: { waiting: number; reviewed: number }, current: ReviewStatus): ReviewStatus[] {
  return REVIEW_STATUSES.filter((s) => s === "all" || s === current || (s === "waiting" ? counts.waiting : counts.reviewed) > 0);
}
export const countOfStatus = (counts: { waiting: number; reviewed: number }, s: ReviewStatus) => (s === "waiting" ? counts.waiting : s === "reviewed" ? counts.reviewed : counts.waiting + counts.reviewed);

// รุ่นที่เปิดให้เมื่อ URL ไม่ระบุ: รุ่นที่ตัวกรองกลางเลือกอยู่ → รุ่นที่เราดูแลและยังฝึกอยู่ → รุ่นที่ยังฝึกอยู่ล่าสุด → รุ่นล่าสุด
export function defaultReviewCohort(filter: number | string, mine: readonly number[], cohorts: { id: number; endedAt?: string | null }[]): number | null {
  if (typeof filter === "number" && cohorts.some((c) => c.id === filter)) return filter;
  if (mine[0] !== undefined) return mine[0];
  const newest = (list: { id: number }[]) => list.reduce<number | null>((m, c) => (m === null || c.id > m ? c.id : m), null);
  return newest(cohorts.filter((c) => !c.endedAt)) ?? newest(cohorts);
}
