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
  // กติกาเวลาที่พี่เลี้ยงตั้งไว้ล่วงหน้าและยังไม่ถึงวัน (บอกน้องก่อนเปลี่ยน) · ไม่มี = null
  nextRule: { effectiveFrom: string; workStart: string; workEnd: string; lateGraceMinutes: number } | null;
};

// ---- มุมมองของพี่เลี้ยง: น้องแต่ละคนในวันที่เลือก ----

export type DayState =
  | "outside" // วันที่อยู่นอกช่วงของรุ่น
  | "untracked" // ก่อนที่ใครในรุ่นจะเริ่มเช็คอินในระบบ (ระบบยังไม่ได้เริ่มใช้) ไม่นับเป็นขาด
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
  // วันแรกที่มีการเช็คอินในรุ่นนี้ (ใครก็ได้) = วันที่เริ่มใช้ระบบ · วันก่อนหน้านั้นไม่ใช่ "ขาด" เพราะยังไม่มีระบบให้เช็คอิน
  // null = รุ่นนี้ยังไม่มีใครเช็คอินเลย · ไม่ส่ง (undefined) = ไม่ใช้กฎนี้
  trackingStart?: string | null;
};

// คนละฟังก์ชันกับ todayState: ของน้องดูแค่ "วันนี้" และบล็อกเมื่อรุ่นจบ · ของพี่เลี้ยงดูย้อนหลังได้ รวมรุ่นที่จบแล้ว
// มีแถวเช็คอินแล้วแสดงของจริงก่อนเสมอ (น้องมาทำงานวันหยุดก็ยังเห็นว่ามา)
export function dayState({ date, cohort, rules, holiday, record, now, trackingStart }: DayInput): DayState {
  if (record) return effectiveCheckOut(record, rules, now) ? "done" : "working";
  if (date < cohort.startsOn || date > cohort.endsOn) return "outside";
  if (trackingStart !== undefined && date < todayTH(now) && (trackingStart === null || date < trackingStart)) return "untracked";
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

// ---- กติกาเวลาที่เปลี่ยนตามวันที่เริ่มมีผล ----

export type WorkRule = AttendanceRules & { effectiveFrom: string };

// กติกาของวัน D = กติกาที่ effective_from ล่าสุดที่ไม่เกิน D · ไม่มีเลย (หรือ D ก่อนกติกาแรก) ใช้ค่าตั้งต้นของรุ่น
// ฟังก์ชันล้วน: ผลสาย/ชั่วโมงของวันที่ผ่านมาจึงไม่เปลี่ยน ตราบใดที่ไม่มีใครตั้งกติกาย้อนหลัง (service ห้ามไว้)
export function rulesOn(date: string, base: AttendanceRules, list: readonly WorkRule[]): AttendanceRules {
  let best: WorkRule | null = null;
  for (const r of list) if (r.effectiveFrom <= date && (!best || r.effectiveFrom > best.effectiveFrom)) best = r;
  return best ? { workStart: best.workStart, workEnd: best.workEnd, lateGraceMinutes: best.lateGraceMinutes } : base;
}

export type WorkRuleRow = { id: number; effectiveFrom: string; workStart: string; workEnd: string; lateGraceMinutes: number };

// กติกาเวลาของรุ่น: ตั้งต้น (ใช้กับวันก่อนกติกาแรก) + กติกาที่ตั้งไว้ล่วงหน้า/มีผลแล้ว
export type RulesView = { today: string; base: AttendanceRules; rules: WorkRuleRow[] };

// ---- วัน/เดือน และรายละเอียดของแต่ละวัน (ใช้ทั้งหน้าประวัติของน้อง และไฟล์ส่งออกของพี่เลี้ยง) ----

// "2026-11" → วันแรกและวันสุดท้ายของเดือน
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { from: `${month}-01`, to: `${y}-${mm}-${String(last).padStart(2, "0")}` };
}

export const isMonth = (v: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

// วันที่จาก from ถึง to (รวมสองวัน) เป็น YYYY-MM-DD
export function eachDate(from: string, to: string) {
  const out: string[] = [];
  for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d = new Date(d.getTime() + 86_400_000)) out.push(d.toISOString().slice(0, 10));
  return out;
}

export type DayDetail = { state: DayState; checkInAt: Date | null; checkOutAt: Date | null; checkOutAuto: boolean; late: boolean; minutes: number | null };

// สถานะ + เวลาเข้า-ออก + สาย + ชั่วโมงของ 1 วัน จากข้อมูลดิบและกติกาของวันนั้น
export function describeDay(input: DayInput): DayDetail {
  const { record, rules, now, date } = input;
  const out = record ? effectiveCheckOut(record, rules, now) : null;
  return {
    state: dayState(input),
    checkInAt: record ? record.checkInAt : null,
    checkOutAt: out ? out.at : null,
    checkOutAuto: out?.auto ?? false,
    late: record ? isLate(record.checkInAt, date, rules) : false,
    minutes: record && out ? minutesWorked(record.checkInAt, out.at) : null,
  };
}

// ---- หน้า "ประวัติเข้างานของฉัน" ----

export type HistoryRow = {
  date: string;
  state: DayState;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkOutAuto: boolean;
  late: boolean;
  minutes: number | null;
  // พี่เลี้ยงแก้เวลาวันนี้: เหตุผลที่พี่เลี้ยงบันทึกไว้ (น้องเห็นได้)
  editReason: string | null;
  // ชื่อวันหยุดที่พี่เลี้ยงประกาศ (ถ้า state = holiday)
  holidayNote: string | null;
};

// ข้อเท็จจริงของเดือน (จำนวนวัน/ชั่วโมง) ไม่คิดเป็นเปอร์เซ็นต์หรือคะแนน · ตัวคะแนนรวมมาทีหลังสุดตามคำแนะนำของกรรมการ
export type HistoryView = {
  month: string;
  today: string;
  hasPrev: boolean;
  hasNext: boolean;
  rows: HistoryRow[];
  summary: { workedDays: number; lateDays: number; noCheckInDays: number; minutes: number };
};
