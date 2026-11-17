import { effectiveCheckOut, isLate, minutesWorked, rulesOn, todayState, type AttendanceRules, type TodayView } from "../../src/lib/attendance";
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
  if (!cohort) return { now: now.toISOString(), workDate, state: "no_cohort", workStart: null, workEnd: null, lateGraceMinutes: null, checkInAt: null, checkOutAt: null, checkOutAuto: false, late: false, minutes: null };

  // กติกาของ "วันนี้" (พี่เลี้ยงตั้งกติกาใหม่ล่วงหน้าได้ วันที่เริ่มมีผลถึงแล้วจึงเปลี่ยนเอง)
  const base: AttendanceRules = { workStart: cohort.workStart, workEnd: cohort.workEnd, lateGraceMinutes: cohort.lateGraceMinutes };
  const rules = rulesOn(workDate, base, await attendanceRepository.workRules(cohort.id));
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
  };
}

export const attendanceService = {
  today: load,

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
