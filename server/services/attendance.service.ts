import { describeDay, effectiveCheckOut, eachDate, isLate, minutesWorked, monthRange, rulesOn, todayState, type AttendanceRules, type HistoryRow, type HistoryView, type TodayView } from "../../src/lib/attendance";
import { todayTH } from "../../src/lib/cohort";
import { attendanceRepository } from "../repositories/attendance.repository";
import { cohortRepository } from "../repositories/cohort.repository";
import { userRepository } from "../repositories/user.repository";

// ถ้าเช็คอินไม่ได้ บอกเหตุผลเป็นรหัส (ข้อความไทยอยู่ที่ error-handler)
const BLOCKED: Partial<Record<TodayView["state"], string>> = {
  no_cohort: "NO_COHORT",
  not_started: "COHORT_NOT_ACTIVE",
  cohort_ended: "COHORT_NOT_ACTIVE",
  off_day: "NOT_WORKDAY",
  holiday: "NOT_WORKDAY",
  closed: "CHECKIN_CLOSED",
};

// ประกอบหน้า "วันนี้" ของน้องจากข้อมูลดิบ · เวลาทุกอย่างมาจาก server (new Date() ที่นี่) ไม่รับเวลาจากเครื่องน้อง
async function load(userId: number): Promise<TodayView> {
  const now = new Date();
  const workDate = todayTH(now);
  const user = await userRepository.findById(userId);
  const cohort = user?.cohortId ? await cohortRepository.findById(user.cohortId) : undefined;
  const record = (await attendanceRepository.findByDate(userId, workDate)) ?? null;
  if (!cohort) return { now: now.toISOString(), workDate, state: "no_cohort", workStart: null, workEnd: null, lateGraceMinutes: null, checkInAt: null, checkOutAt: null, checkOutAuto: false, late: false, minutes: null, nextRule: null };

  // กติกาของ "วันนี้" (พี่เลี้ยงตั้งกติกาใหม่ล่วงหน้าได้ วันที่เริ่มมีผลถึงแล้วจึงเปลี่ยนเอง)
  const base: AttendanceRules = { workStart: cohort.workStart, workEnd: cohort.workEnd, lateGraceMinutes: cohort.lateGraceMinutes };
  const ruleList = await attendanceRepository.workRules(cohort.id);
  const rules = rulesOn(workDate, base, ruleList);
  // กติกาถัดไปที่ตั้งไว้ล่วงหน้า (ใกล้สุด) บอกน้องก่อนถึงวันเปลี่ยน
  const next = ruleList.find((r) => r.effectiveFrom > workDate);
  const holiday = await attendanceRepository.isHoliday(cohort.id, workDate);
  const state = todayState({ cohort, rules, holiday, record, now });
  const out = record ? effectiveCheckOut(record, rules, now) : null;
  return {
    now: now.toISOString(),
    workDate,
    state,
    workStart: rules.workStart,
    workEnd: rules.workEnd,
    lateGraceMinutes: rules.lateGraceMinutes,
    checkInAt: record ? record.checkInAt.toISOString() : null,
    checkOutAt: out ? out.at.toISOString() : null,
    checkOutAuto: out?.auto ?? false,
    late: record ? isLate(record.checkInAt, workDate, rules) : false,
    minutes: record && out ? minutesWorked(record.checkInAt, out.at) : null,
    nextRule: next ? { effectiveFrom: next.effectiveFrom, workStart: next.workStart, workEnd: next.workEnd, lateGraceMinutes: next.lateGraceMinutes } : null,
  };
}

const monthOf = (date: string) => date.slice(0, 7);

// ประวัติเข้างานของน้องเอง ทีละเดือน (ใหม่สุดอยู่บน) · เสาร์-อาทิตย์ที่ไม่มีเช็คอินไม่แสดง
async function history(userId: number, month: string): Promise<HistoryView> {
  const now = new Date();
  const today = todayTH(now);
  const empty: HistoryView = { month, today, hasPrev: false, hasNext: false, rows: [], summary: { workedDays: 0, lateDays: 0, noCheckInDays: 0, minutes: 0 } };
  const user = await userRepository.findById(userId);
  const cohort = user?.cohortId ? await cohortRepository.findById(user.cohortId) : undefined;
  if (!cohort) return empty;

  const { from, to } = monthRange(month);
  const lo = from > cohort.startsOn ? from : cohort.startsOn;
  const hiCap = to < today ? to : today;
  const hi = hiCap < cohort.endsOn ? hiCap : cohort.endsOn;
  const hasPrev = monthOf(cohort.startsOn) < month;
  const hasNext = month < monthOf(today < cohort.endsOn ? today : cohort.endsOn);
  if (lo > hi) return { ...empty, hasPrev, hasNext };

  const base: AttendanceRules = { workStart: cohort.workStart, workEnd: cohort.workEnd, lateGraceMinutes: cohort.lateGraceMinutes };
  const [records, ruleList, holidayList, trackingStart] = await Promise.all([attendanceRepository.recordsOfUser(userId, lo, hi), attendanceRepository.workRules(cohort.id), attendanceRepository.holidays(cohort.id), attendanceRepository.firstRecordDate(cohort.id)]);
  const byDate = new Map(records.map((r) => [r.workDate, r]));
  const notes = new Map(holidayList.map((h) => [h.holidayDate, h.note]));

  const rows: HistoryRow[] = [];
  for (const date of eachDate(lo, hi).reverse()) {
    const record = byDate.get(date) ?? null;
    const d = describeDay({ date, cohort, rules: rulesOn(date, base, ruleList), holiday: notes.has(date), record, now, trackingStart });
    // เสาร์-อาทิตย์ที่ไม่มีเช็คอิน และวันก่อนเริ่มใช้ระบบ ไม่แสดง
    if (d.state === "off_day" || d.state === "untracked") continue;
    rows.push({
      date,
      state: d.state,
      checkInAt: d.checkInAt ? d.checkInAt.toISOString() : null,
      checkOutAt: d.checkOutAt ? d.checkOutAt.toISOString() : null,
      checkOutAuto: d.checkOutAuto,
      late: d.late,
      minutes: d.minutes,
      editReason: record?.editReason ?? null,
      holidayNote: d.state === "holiday" ? (notes.get(date) ?? "") : null,
    });
  }
  const summary = {
    workedDays: rows.filter((r) => r.checkInAt).length,
    lateDays: rows.filter((r) => r.late).length,
    noCheckInDays: rows.filter((r) => r.state === "absent").length,
    minutes: rows.reduce((n, r) => n + (r.minutes ?? 0), 0),
  };
  return { month, today, hasPrev, hasNext, rows, summary };
}

export const attendanceService = {
  today: load,
  history,

  // เช็คอิน: กดซ้ำได้ผลเหมือนเดิม (ไม่ error ไม่เปลี่ยนเวลาแรก) เพราะเน็ตช้าแล้วน้องมักกดซ้ำ
  async checkIn(userId: number) {
    const view = await load(userId);
    if (view.state === "working" || view.state === "done") return view;
    const blocked = BLOCKED[view.state];
    if (blocked) throw new Error(blocked);
    await attendanceRepository.checkIn(userId, view.workDate, new Date());
    return load(userId);
  },

  // เช็คเอาต์: ทำได้เฉพาะที่เช็คอินแล้วและยังไม่เลิกงาน · เลิกงานแล้ว (กดเองหรือระบบนับให้ตอนเลิกงาน) กดซ้ำไม่ทับเวลา
  async checkOut(userId: number) {
    const view = await load(userId);
    if (view.state === "done") return view;
    if (view.state !== "working") throw new Error("NOT_CHECKED_IN");
    await attendanceRepository.checkOut(userId, view.workDate, new Date());
    return load(userId);
  },
};
