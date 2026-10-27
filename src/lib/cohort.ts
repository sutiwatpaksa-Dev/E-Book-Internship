import type { Cohort } from "@/types";

// สถานะรุ่นคิดจากวันที่ทุกครั้ง ไม่เก็บใน DB (เก็บแล้วต้องมีคนคอยอัปเดตทุกเช้า)
// overdue = เลยวันจบแล้วแต่ยังไม่มีใครกด "จบรุ่น" (น้องยังถามได้ พี่เลี้ยงควรรู้)
export type CohortStatus = "upcoming" | "active" | "overdue" | "ended";

export const COHORT_STATUS_LABEL: Record<CohortStatus, string> = {
  upcoming: "รอเริ่ม",
  active: "กำลังฝึก",
  overdue: "เลยวันจบ",
  ended: "จบแล้ว",
};

// วันนี้ตามเวลาไทย เป็น YYYY-MM-DD (เทียบกับวันที่ของรุ่นเป็นข้อความได้ตรงๆ)
// ใช้ toLocaleDateString ของ sv-SE เพราะให้รูปแบบ YYYY-MM-DD พอดี
export const todayTH = (now = new Date()) => now.toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });

export function cohortStatus(c: Pick<Cohort, "startsOn" | "endsOn" | "endedAt">, today = todayTH()): CohortStatus {
  if (c.endedAt) return "ended";
  if (today < c.startsOn) return "upcoming";
  if (today > c.endsOn) return "overdue";
  return "active";
}

// นับวันทำงาน (จันทร์–ศุกร์) จาก from ถึง to รวมทั้งสองวัน · ไม่รู้วันหยุดราชการ จึงเป็นค่าประมาณ
export function workdays(from: string, to: string) {
  let n = 0;
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end) {
    const w = d.getUTCDay();
    if (w !== 0 && w !== 6) n++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return n;
}

// "วันที่ 12 จาก 40" ของรุ่นที่กำลังฝึก · รุ่นที่ยังไม่เริ่มหรือจบแล้วไม่มีค่า
export function cohortDay(c: Pick<Cohort, "startsOn" | "endsOn" | "endedAt">, today = todayTH()) {
  if (cohortStatus(c, today) !== "active") return null;
  return { day: workdays(c.startsOn, today), total: workdays(c.startsOn, c.endsOn) };
}

const thDate = (d: string, year: boolean) => new Date(`${d}T00:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) });
// "3 พ.ย. – 26 ธ.ค. 2569" (ใส่ปีครั้งเดียวถ้าปีเดียวกัน)
export const cohortRange = (c: Pick<Cohort, "startsOn" | "endsOn">) =>
  `${thDate(c.startsOn, c.startsOn.slice(0, 4) !== c.endsOn.slice(0, 4))} – ${thDate(c.endsOn, true)}`;

// ตัวกรอง "รุ่น" ในหลังบ้าน: id ของรุ่น, ทุกรุ่น, หรือบัญชีที่ไม่มีรุ่น
export type CohortFilter = number | "all" | "none";
export const inCohort = (cohortId: number | null, f: CohortFilter) => f === "all" || (f === "none" ? cohortId === null : cohortId === f);
