import { thaiDayMonth } from "@/lib/cohort";
import { dueLabel, type PlanItem } from "@/lib/work-plan";

// "งานถัดไป: ตรวจรอบ 1 · ตาราง + API · กำหนดส่ง พฤ. 6 พ.ย. (เหลือ 2 วัน)" ใช้ทั้งแถบสถานะและการ์ดในรายการโจทย์
export function nextLine(p: PlanItem) {
  const due = p.dueOn ? `กำหนดส่ง ${thaiDayMonth(p.dueOn)}` : `กำหนดส่ง วันที่ ${p.round.day} ของรุ่น`;
  const left = dueLabel(p.daysLeft);
  return `งานถัดไป: ${p.round.label} · ${p.round.what} · ${due}${left ? ` (${left})` : ""}`;
}
