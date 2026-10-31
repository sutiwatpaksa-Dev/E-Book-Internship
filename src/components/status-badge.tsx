import { VERDICT_LABEL } from "@/lib/submission";
import { BLUE, GRAY, GREEN, ORANGE, RED, STATUS_LABEL, STATUS_TONE } from "@/lib/thread-labels";
import { WORK_STATE_LABEL, type WorkState } from "@/lib/work-plan";
import type { ThreadStatus } from "@/types";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): ป้ายสถานะของเรื่อง
export function StatusBadge({ status }: { status: ThreadStatus }) {
  return <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}

// ป้ายผลตรวจงานที่ส่ง: ว่าง = รอตรวจ
export function VerdictBadge({ verdict }: { verdict: "pass" | "revise" | null }) {
  const tone = verdict === "pass" ? GREEN : verdict === "revise" ? ORANGE : BLUE;
  return <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${tone}`}>{verdict ? VERDICT_LABEL[verdict] : "รอตรวจ"}</span>;
}

// ป้ายสถานะงานตามรอบส่ง (Dashboard ของน้อง) · เลยกำหนดใช้สีแดง ที่เหลือใช้ชุดเดียวกับป้ายผลตรวจ
const WORK_TONE: Record<WorkState, string> = { todo: GRAY, late: RED, waiting: BLUE, revise: ORANGE, pass: GREEN, closed: GRAY };
// daysLeft ติดลบ + เลยกำหนด = ใส่จำนวนวันในป้ายเลย (สัญญาณเดียว ไม่ต้องมีข้อความแดงซ้ำข้างๆ)
export function WorkBadge({ state, daysLeft }: { state: WorkState; daysLeft?: number | null }) {
  const late = state === "late" && daysLeft != null && daysLeft < 0;
  return <span className={`shrink-0 rounded-md px-2 py-0.5 text-sm font-semibold ${WORK_TONE[state]}`}>{late ? `เลยกำหนด ${-daysLeft} วัน` : WORK_STATE_LABEL[state]}</span>;
}
