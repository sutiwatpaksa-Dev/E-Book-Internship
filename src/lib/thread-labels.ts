import type { ThreadKind, ThreadStatus } from "@/types";

// ป้ายและสีของเรื่อง ใช้ร่วมกันทั้งหน้าน้องและหลังบ้าน
export const KIND_LABEL: Record<ThreadKind, { icon: string; label: string }> = {
  question: { icon: "❓", label: "ถามพี่เลี้ยง" },
  content_request: { icon: "📚", label: "ขอเนื้อหาเพิ่ม" },
};

export const STATUS_LABEL: Record<ThreadStatus, string> = {
  waiting: "รอตอบ",
  answered: "ตอบแล้ว",
  closed: "ปิดเรื่อง",
  new: "เรื่องใหม่",
  accepted: "รับเรื่องแล้ว",
  in_progress: "กำลังทำ",
  done: "ทำเสร็จแล้ว",
  declined: "ไม่ทำ",
};

const ORANGE = "bg-orange-500/15 text-orange-800 dark:text-orange-300";
const GREEN = "bg-green-600/15 text-green-800 dark:text-green-300";
const BLUE = "bg-fd-primary/10 text-fd-primary";
const GRAY = "bg-fd-muted text-fd-muted-foreground";
export const STATUS_TONE: Record<ThreadStatus, string> = {
  waiting: ORANGE,
  new: ORANGE,
  answered: GREEN,
  done: GREEN,
  accepted: BLUE,
  in_progress: BLUE,
  closed: GRAY,
  declined: GRAY,
};

// สถานะที่พี่เลี้ยงเลือกได้ของแต่ละประเภท (ต้องตรงกับ server/db/schema.ts)
export const STATUSES_OF: Record<ThreadKind, ThreadStatus[]> = {
  question: ["waiting", "answered", "closed"],
  content_request: ["new", "accepted", "in_progress", "done", "declined"],
};

export const timeAgo = (d: string) => {
  const min = Math.round((Date.now() - new Date(d).getTime()) / 60_000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาที`;
  if (min < 60 * 24) return `${Math.round(min / 60)} ชม.`;
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};
