import { atThai, dayState, effectiveCheckOut, isLate, isWeekend, minutesWorked, type AttendanceRules, type DayRow, type DayView, type HolidayRow } from "../../src/lib/attendance";
import { todayTH } from "../../src/lib/cohort";
import { attendanceRepository } from "../repositories/attendance.repository";
import { cohortRepository } from "../repositories/cohort.repository";
import { auditService } from "./audit.service";

const hm = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" });

async function cohortOrThrow(id: number) {
  const cohort = await cohortRepository.findById(id);
  if (!cohort) throw new Error("COHORT_NOT_FOUND");
  return cohort;
}

// งานเช็คอินฝั่งพี่เลี้ยง: ดูน้องทั้งรุ่นในวันที่เลือก · แก้เวลาให้น้อง (เหตุผลบังคับ + audit) · ประกาศวันหยุด
export const attendanceAdminService = {
  async day(cohortId: number, date?: string): Promise<DayView> {
    const now = new Date();
    const today = todayTH(now);
    const cohort = await cohortOrThrow(cohortId);
    const d = date ?? today;
    const rules: AttendanceRules = { workStart: cohort.workStart, workEnd: cohort.workEnd, lateGraceMinutes: cohort.lateGraceMinutes };
    const [interns, records, holidays] = await Promise.all([
      attendanceRepository.internsOfCohort(cohortId),
      attendanceRepository.recordsOfCohort(cohortId, d, d),
      attendanceRepository.holidayDates(cohortId, d, d),
    ]);
    const byUser = new Map(records.map((r) => [r.userId, r]));
    const rows: DayRow[] = interns.map((u) => {
      const rec = byUser.get(u.id) ?? null;
      const out = rec ? effectiveCheckOut(rec, rules, now) : null;
      return {
        userId: u.id,
        name: u.fullName || u.nickname || u.username,
        state: dayState({ date: d, cohort, rules, holiday: holidays.has(d), record: rec, now }),
        checkInAt: rec ? rec.checkInAt.toISOString() : null,
        checkOutAt: out ? out.at.toISOString() : null,
        checkOutAuto: out?.auto ?? false,
        late: rec ? isLate(rec.checkInAt, d, rules) : false,
        minutes: rec && out ? minutesWorked(rec.checkInAt, out.at) : null,
        editReason: rec?.editReason ?? null,
      };
    });
    return {
      cohort: { id: cohort.id, name: cohort.name, startsOn: cohort.startsOn, endsOn: cohort.endsOn, workStart: rules.workStart, workEnd: rules.workEnd, lateGraceMinutes: rules.lateGraceMinutes },
      date: d,
      today,
      rows,
    };
  },

  // แก้เวลา: เวลาเดิมไม่หาย (เก็บในบันทึกการกระทำ) · แก้วันที่ยังไม่มาถึงหรือเวลาในอนาคตไม่ได้
  async edit(actorId: number, input: { userId: number; workDate: string; checkIn: string; checkOut: string | null; reason: string }) {
    const interns = await attendanceRepository.internsOfCohortByUser(input.userId);
    if (!interns) throw new Error("NOT_FOUND");
    const cohort = await cohortOrThrow(interns.cohortId);
    if (input.workDate < cohort.startsOn || input.workDate > cohort.endsOn) throw new Error("DATE_OUT_OF_RANGE");
    const now = new Date();
    const checkInAt = atThai(input.workDate, input.checkIn);
    const checkOutAt = input.checkOut ? atThai(input.workDate, input.checkOut) : null;
    if (checkInAt > now || (checkOutAt && checkOutAt > now)) throw new Error("FUTURE_TIME");
    if (checkOutAt && checkOutAt < checkInAt) throw new Error("INVALID_TIME");

    const before = await attendanceRepository.findByDate(input.userId, input.workDate);
    await attendanceRepository.saveEdit({ userId: input.userId, workDate: input.workDate, checkInAt, checkOutAt, editedBy: actorId, reason: input.reason });
    const was = before ? `เข้า ${hm(before.checkInAt)} ออก ${before.checkOutAt ? hm(before.checkOutAt) : "-"}` : "ไม่มีข้อมูล";
    await auditService.log(actorId, "attendance.edit", `${interns.username} ${input.workDate}`, `${was} → เข้า ${input.checkIn} ออก ${input.checkOut ?? "-"} · ${input.reason}`);
  },

  async holidays(cohortId: number): Promise<HolidayRow[]> {
    await cohortOrThrow(cohortId);
    return (await attendanceRepository.holidays(cohortId)).map((h) => ({ id: h.id, date: h.holidayDate, note: h.note }));
  },

  async addHoliday(actorId: number, input: { cohortId: number; date: string; note: string }) {
    const cohort = await cohortOrThrow(input.cohortId);
    if (input.date < cohort.startsOn || input.date > cohort.endsOn) throw new Error("DATE_OUT_OF_RANGE");
    if (isWeekend(input.date)) throw new Error("HOLIDAY_WEEKEND");
    const id = await attendanceRepository.addHoliday(input.cohortId, input.date, input.note);
    if (!id) throw new Error("HOLIDAY_EXISTS");
    await auditService.log(actorId, "holiday.add", cohort.name, `${input.date}${input.note ? ` ${input.note}` : ""}`);
  },

  async removeHoliday(actorId: number, id: number) {
    const h = await attendanceRepository.findHoliday(id);
    if (!h) throw new Error("HOLIDAY_NOT_FOUND");
    const cohort = await cohortOrThrow(h.cohortId);
    await attendanceRepository.removeHoliday(id);
    await auditService.log(actorId, "holiday.remove", cohort.name, h.holidayDate);
  },
};
