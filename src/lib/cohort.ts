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

// ตัวกรอง "รุ่น" ในหลังบ้าน: id ของรุ่น, ทุกรุ่น, รุ่นที่เราเป็นพี่เลี้ยงประจำ ("mine"), หรือบัญชีที่ไม่มีรุ่น
export type CohortFilter = number | "all" | "mine" | "none";
export const inCohort = (cohortId: number | null, f: CohortFilter, mine: readonly number[] = []) =>
  f === "all" || (f === "none" ? cohortId === null : f === "mine" ? cohortId !== null && mine.includes(cohortId) : cohortId === f);

// ค่าที่ใช้จริงจากค่าที่จำไว้ในเบราว์เซอร์: ค่าเริ่ม = "รุ่นของฉัน" ถ้าดูแลรุ่นที่ยังไม่จบอยู่ ไม่งั้น "ทุกรุ่น"
// ค่าที่จำไว้ใช้ไม่ได้แล้ว (รุ่นถูกลบ, ไม่ได้ดูแลรุ่นไหนแล้ว) กลับไปค่าเริ่ม ไม่ให้หน้าว่างเปล่าโดยไม่รู้สาเหตุ
export function resolveCohortFilter(saved: CohortFilter | null, mine: readonly number[], cohortIds: readonly number[]): CohortFilter {
  const fallback: CohortFilter = mine.length > 0 ? "mine" : "all";
  if (saved === null) return fallback;
  if (saved === "mine") return fallback;
  if (typeof saved === "number") return cohortIds.includes(saved) ? saved : fallback;
  return saved;
}

// ส่งตัวกรองให้ server (นับข้อความยังไม่อ่าน): "1,2" / "none" · null = ไม่กรอง
export function cohortQuery(f: CohortFilter, mine: readonly number[]): string | null {
  if (f === "all") return null;
  if (f === "mine") return mine.join(",");
  return String(f);
}

// วันทำงานที่ n ของรุ่น (n=1 = วันทำงานแรกนับจากวันเริ่ม) เป็น YYYY-MM-DD · นับแบบเดียวกับ workdays() จึงขึ้นกับจันทร์–ศุกร์เท่านั้น
// ไม่รู้วันหยุดราชการ วันที่ที่ได้จึงเป็นค่าประมาณ (หน้าเว็บต้องบอกผู้ใช้) · n < 1 คืน null
export function workdayDate(startsOn: string, n: number): string | null {
  if (!Number.isInteger(n) || n < 1) return null;
  const d = new Date(`${startsOn}T00:00:00Z`);
  let count = 0;
  for (;;) {
    const w = d.getUTCDay();
    if (w !== 0 && w !== 6 && ++count === n) return d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

// ห่างกันกี่วันตามปฏิทิน (to - from) เป็นบวกเมื่อ to อยู่หลัง from
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

// "ศ. 6 พ.ย." ใช้ในกำหนดส่ง
export const thaiDayMonth = (d: string) => new Date(`${d}T00:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" });

// วันที่ปฏิทิน → "วันทำงานที่ N ของรุ่น" (ตรงข้ามกับ workdayDate) · ก่อนวันเริ่มรุ่น = null
// ตรงกับเสาร์-อาทิตย์ = นับเป็นวันทำงานสุดท้ายก่อนหน้า (ศุกร์) ให้ผู้เรียกเตือนผู้ใช้ด้วย isWeekend
export function dayOfDate(startsOn: string, date: string): number | null {
  if (date < startsOn) return null;
  const n = workdays(startsOn, date);
  return n >= 1 ? n : null;
}
export const isWeekend = (date: string) => [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());
