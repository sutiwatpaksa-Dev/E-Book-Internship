import { VERDICT_LABEL } from "@/lib/submission";
import { BLUE, GREEN, ORANGE, STATUS_LABEL, STATUS_TONE } from "@/lib/thread-labels";
import type { ThreadStatus } from "@/types";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): ป้ายสถานะของเรื่อง
export function StatusBadge({ status }: { status: ThreadStatus }) {
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}

// ป้ายผลตรวจงานที่ส่ง: ว่าง = รอตรวจ
export function VerdictBadge({ verdict }: { verdict: "pass" | "revise" | null }) {
  const tone = verdict === "pass" ? GREEN : verdict === "revise" ? ORANGE : BLUE;
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{verdict ? VERDICT_LABEL[verdict] : "รอตรวจ"}</span>;
}
