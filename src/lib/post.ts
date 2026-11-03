import { workdayDate } from "./cohort";
import { linksProblem, type TaskLink } from "./submission";

// โพสต์ในฟีด: งาน (ส่งได้) · ประกาศ · แหล่งเรียนรู้ · ผลรีวิว (ผลตรวจงานที่ให้เพื่อนทั้งรุ่นอ่านได้) · ทุกแบบมีปุ่ม "รับทราบ"
// งานที่ผูกโจทย์ใหญ่ (assignmentId) = งานย่อยของโจทย์นั้น กำหนดส่งเป็นวันทำงานที่ N ของรุ่น (dueDay)
// โพสต์ที่ไม่ผูกโจทย์ใช้วันที่จริง (dueAt) · ใช้กฎชุดนี้ทั้งฟอร์มหลังบ้านและ server
export const POST_KINDS = ["task", "announcement", "resource", "review"] as const;
export type PostKind = (typeof POST_KINDS)[number];
export const POST_KIND_LABEL: Record<PostKind, string> = { task: "งาน", announcement: "ประกาศ", resource: "แหล่งเรียนรู้", review: "ผลรีวิว" };

// ช่องที่น้องต้องส่งในงาน (ใช้จริงในเฟส B) · required = บังคับกรอก
export const REQUIRE_FIELDS = ["repo", "ref", "deploy", "link", "file", "text"] as const;
export type RequireField = (typeof REQUIRE_FIELDS)[number];
export type Requirement = { field: RequireField; required: boolean };

export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const DUE_DAY_MAX = 120;
// โพสต์ยาวกว่าคำสั่งงาน (BODY_MAX 8,000) เพราะผลรีวิวทั้งฉบับ (ตาราง + โค้ด) ยาวราว 10,000 ตัวอักษร
export const POST_BODY_MAX = 20000;

export type PostInput = {
  kind: PostKind;
  assignmentId: number | null;
  title: string;
  body: string;
  links: TaskLink[];
  allCohorts: boolean;
  cohortIds: number[];
  dueDay: number | null;
  dueAt: string | null; // YYYY-MM-DD (เวลาไทย)
  pinned: boolean;
};

// คืนข้อความผิดข้อแรก หรือ null เมื่อผ่าน
export function postInputProblem(p: PostInput): string | null {
  const title = p.title.trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) return `หัวข้อ ${TITLE_MIN}–${TITLE_MAX} ตัวอักษร`;
  if (p.body.length > POST_BODY_MAX) return `รายละเอียดไม่เกิน ${POST_BODY_MAX.toLocaleString()} ตัวอักษร`;
  const linkErr = linksProblem(p.links);
  if (linkErr) return linkErr;
  // ต้องเลือกรุ่นเสมอ ไม่มีค่าเริ่มที่ทำให้โพสต์หลุดไปถึงรุ่นที่ไม่ได้ตั้งใจ
  if (!p.allCohorts && p.cohortIds.length === 0) return "เลือกรุ่นที่จะเห็นโพสต์นี้ (หรือติ๊กทุกรุ่น)";
  if (p.kind !== "task") {
    if (p.assignmentId !== null) return "ผูกโจทย์ใหญ่ได้เฉพาะโพสต์งาน";
    if (p.dueDay !== null || p.dueAt !== null) return "มีกำหนดส่งได้เฉพาะโพสต์งาน";
    return null;
  }
  if (p.assignmentId !== null) {
    if (p.dueAt !== null) return "งานย่อยของโจทย์ใช้กำหนดส่งเป็นวันทำงานที่ N ของรุ่น";
    if (p.dueDay === null || !Number.isInteger(p.dueDay) || p.dueDay < 1 || p.dueDay > DUE_DAY_MAX) return `กำหนดส่งเป็นวันทำงานที่ 1–${DUE_DAY_MAX} ของรุ่น`;
    return null;
  }
  if (p.dueDay !== null) return "งานที่ไม่ผูกโจทย์ใช้กำหนดส่งเป็นวันที่";
  if (p.dueAt !== null && !/^\d{4}-\d{2}-\d{2}$/.test(p.dueAt)) return "วันที่กำหนดส่งไม่ถูกรูปแบบ";
  return null;
}

// น้องรุ่นนี้เห็นโพสต์นี้ไหม · ไม่มีรุ่น = เห็นแค่โพสต์ "ทุกรุ่น" (ไม่ตกไปเห็นโจทย์ของรุ่นใด)
export const visibleTo = (post: { allCohorts: boolean; cohortIds: readonly number[] }, cohortId: number | null) =>
  post.allCohorts || (cohortId !== null && post.cohortIds.includes(cohortId));

// กำหนดส่งเป็นวันที่ของรุ่นนี้ (YYYY-MM-DD) · ไม่มีกำหนด หรือไม่รู้วันเริ่มรุ่น = null
export function dueDateFor(post: { dueDay: number | null; dueAt: string | null }, startsOn: string | null): string | null {
  if (post.dueAt) return post.dueAt;
  if (post.dueDay !== null && startsOn) return workdayDate(startsOn, post.dueDay);
  return null;
}

// ลำดับฟีด: ปักหมุด → งานที่ยังไม่รับทราบ/ยังเปิดอยู่ เรียงกำหนดส่งใกล้สุด → ที่เหลือใหม่สุดก่อน
// done = งานที่จบแล้วสำหรับน้องคนนี้ (เฟส A ยังไม่มีการส่งงาน ใช้ false)
export type FeedItem = { id: number; kind: PostKind; pinned: boolean; due: string | null; createdAt: string; done?: boolean };
export function feedOrder<T extends FeedItem>(items: readonly T[]): T[] {
  const rank = (p: T) => (p.pinned ? 0 : p.kind === "task" && !p.done && p.due ? 1 : 2);
  return [...items].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    if (rank(a) === 1 && a.due !== b.due) return a.due! < b.due! ? -1 : 1;
    return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.id - a.id;
  });
}
