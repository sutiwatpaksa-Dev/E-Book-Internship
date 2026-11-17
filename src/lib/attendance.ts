import { cohortStatus, todayTH } from "./cohort";

// กติกาเช็คอินของน้อง คิดจากข้อมูลดิบ (เวลาเข้า-ออก + เวลางานของรุ่น) ทุกครั้งที่เปิดหน้า
// ไม่เก็บ "สาย" หรือ "ชั่วโมง" ลง DB: พี่เลี้ยงเปลี่ยนเวลาเริ่มงานทีหลังได้ ถ้าเก็บผลที่คิดแล้วไว้ ข้อมูลเก่ากับกฎใหม่จะขัดกันเอง
// ใช้ได้ทั้งฝั่ง server (ตัดสินว่าเช็คอินได้ไหม) และหน้าเว็บ (แสดงข้อความ) จึงอยู่ที่ src/lib เป็นฟังก์ชันล้วน ไม่แตะ DB

export type AttendanceRules = {
  // "09:00" หรือ "09:00:00" (คอลัมน์ time ของ Postgres ส่งแบบมีวินาที)
  workStart: string;
  workEnd: string;
  lateGraceMinutes: number;
};

// ประเทศไทยไม่มีเวลาออมแสง (+07:00 ตลอดปี) แปลง "วันที่ + เวลาไทย" เป็นเวลาจริงได้ตรงๆ
const THAI_OFFSET = "+07:00";
const withSeconds = (t: string) => (t.length === 5 ? `${t}:00` : t);
export const atThai = (date: string, time: string) => new Date(`${date}T${withSeconds(time)}${THAI_OFFSET}`);

// "09:00:00" → "09:00" ไว้แสดง
export const hhmm = (t: string) => t.slice(0, 5);

// เสาร์-อาทิตย์เป็นวันหยุดมาตรฐาน · วันหยุดอื่นที่พี่เลี้ยงประกาศส่งเข้ามาเป็น holiday
export function isWeekend(date: string) {
  const w = new Date(`${date}T00:00:00Z`).getUTCDay();
  return w === 0 || w === 6;
}

// สาย = เข้างานหลังเวลาเริ่ม + เวลาผ่อนผัน (09:05:00 พอดียังไม่สาย 09:05:01 สาย)
export function isLate(checkInAt: Date, workDate: string, rules: AttendanceRules) {
  const cutoff = atThai(workDate, rules.workStart).getTime() + rules.lateGraceMinutes * 60_000;
  return checkInAt.getTime() > cutoff;
}

// เวลาออกที่ใช้คิดจริง: ที่น้องกดเอง ไม่มีก็ถึงเวลาเลิกงานแล้วให้นับเป็นเวลาเลิกงานของรุ่น (ติดป้าย "อัตโนมัติ") ยังไม่ถึงก็ยังไม่มี
export function effectiveCheckOut(rec: { workDate: string; checkOutAt: Date | null }, rules: AttendanceRules, now: Date) {
  if (rec.checkOutAt) return { at: rec.checkOutAt, auto: false };
  const end = atThai(rec.workDate, rules.workEnd);
  return now >= end ? { at: end, auto: true } : null;
}

// ชั่วโมงทำงานเป็นนาที (ติดลบไม่ได้ เช่นเช็คอินหลังเวลาเลิกงานที่พี่เลี้ยงแก้ให้)
export const minutesWorked = (checkInAt: Date, checkOutAt: Date) => Math.max(0, Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60_000));

export type TodayState =
  | "no_cohort" // ยังไม่อยู่รุ่นไหน
  | "not_started" // รุ่นยังไม่เริ่ม
  | "cohort_ended" // รุ่นจบแล้ว (หรือเลยวันจบ)
  | "off_day" // เสาร์-อาทิตย์
  | "holiday" // วันหยุดที่พี่เลี้ยงประกาศ
  | "closed" // เลยเวลาเลิกงานแล้วแต่ยังไม่ได้เช็คอิน
  | "ready" // เช็คอินได้
  | "working" // เช็คอินแล้ว ยังไม่เลิกงาน
  | "done"; // เลิกงานแล้ว (กดเอง หรือระบบนับให้ตอนเลิกงาน)

export type TodayInput = {
  cohort: { startsOn: string; endsOn: string; endedAt: Date | null } | null;
  rules: AttendanceRules;
  holiday: boolean;
  record: { workDate: string; checkInAt: Date; checkOutAt: Date | null } | null;
  now: Date;
};

// หน้า "วันนี้" ของน้องอยู่สถานะไหน · ถ้ามีแถวเช็คอินอยู่แล้วให้แสดงของจริงก่อนเสมอ (แม้เป็นวันหยุดที่พี่เลี้ยงเพิ่งประกาศ)
export function todayState({ cohort, rules, holiday, record, now }: TodayInput): TodayState {
  if (!cohort) return "no_cohort";
  const today = todayTH(now);
  const status = cohortStatus({ startsOn: cohort.startsOn, endsOn: cohort.endsOn, endedAt: cohort.endedAt ? cohort.endedAt.toISOString() : null }, today);
  if (status === "upcoming") return "not_started";
  if (status === "ended" || status === "overdue") return "cohort_ended";
  if (record) return effectiveCheckOut(record, rules, now) ? "done" : "working";
  if (isWeekend(today)) return "off_day";
  if (holiday) return "holiday";
  return now >= atThai(today, rules.workEnd) ? "closed" : "ready";
}

// สิ่งที่ API ส่งให้หน้า "วันนี้" · เวลาเป็น ISO ให้หน้าเว็บแปลงเป็นเวลาไทยเอง
export type TodayView = {
  // เวลาของ server ตอนตอบ หน้าเว็บใช้เป็นนาฬิกา (ไม่ใช้เวลาเครื่องน้อง)
  now: string;
  workDate: string;
  state: TodayState;
  workStart: string | null;
  workEnd: string | null;
  lateGraceMinutes: number | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  // เวลาออกมาจากระบบนับให้ตอนเลิกงาน ไม่ใช่น้องกดเอง
  checkOutAuto: boolean;
  late: boolean;
  minutes: number | null;
};

// ---- มุมมองของพี่เลี้ยง: น้องแต่ละคนในวันที่เลือก ----

export type DayState =
  | "outside" // วันที่อยู่นอกช่วงของรุ่น
  | "off_day" // เสาร์-อาทิตย์
  | "holiday" // วันหยุดที่พี่เลี้ยงประกาศ
  | "waiting" // วันนี้ ยังไม่ถึงเวลาเลิกงาน และยังไม่เช็คอิน
  | "absent" // ไม่มีแถวเช็คอิน และวันนั้นผ่านไป/เลยเวลาเลิกงานแล้ว (ถ้ามีใบลา เฟสถัดไปจะแยกเป็น "ลา")
  | "working"
  | "done";

export type DayInput = {
  date: string;
  cohort: { startsOn: string; endsOn: string };
  rules: AttendanceRules;
  holiday: boolean;
  record: { workDate: string; checkInAt: Date; checkOutAt: Date | null } | null;
  now: Date;
};

// คนละฟังก์ชันกับ todayState: ของน้องดูแค่ "วันนี้" และบล็อกเมื่อรุ่นจบ · ของพี่เลี้ยงดูย้อนหลังได้ รวมรุ่นที่จบแล้ว
// มีแถวเช็คอินแล้วแสดงของจริงก่อนเสมอ (น้องมาทำงานวันหยุดก็ยังเห็นว่ามา)
export function dayState({ date, cohort, rules, holiday, record, now }: DayInput): DayState {
  if (record) return effectiveCheckOut(record, rules, now) ? "done" : "working";
  if (date < cohort.startsOn || date > cohort.endsOn) return "outside";
  if (isWeekend(date)) return "off_day";
  if (holiday) return "holiday";
  return date < todayTH(now) || now >= atThai(date, rules.workEnd) ? "absent" : "waiting";
}

// "HH:MM" (24 ชม.) → ถูกต้องไหม
export const isHHMM = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

export type DayRow = {
  userId: number;
  name: string;
  state: DayState;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkOutAuto: boolean;
  late: boolean;
  minutes: number | null;
  // พี่เลี้ยงแก้เวลาแล้ว (เหตุผลดูได้ในแถว)
  editReason: string | null;
};

export type DayView = {
  cohort: { id: number; name: string; startsOn: string; endsOn: string; workStart: string; workEnd: string; lateGraceMinutes: number };
  date: string;
  today: string;
  rows: DayRow[];
};

export type HolidayRow = { id: number; date: string; note: string };
