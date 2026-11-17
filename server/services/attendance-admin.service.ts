import { toCsv } from "../../src/lib/csv";
import { atThai, dayState, describeDay, eachDate, monthRange, effectiveCheckOut, isLate, isWeekend, minutesWorked, rulesOn, type AttendanceRules, type DayRow, type DayView, type HolidayRow, type RulesView } from "../../src/lib/attendance";
import { todayTH } from "../../src/lib/cohort";
import { attendanceRepository } from "../repositories/attendance.repository";
import { leaveRepository } from "../repositories/leave.repository";
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
    // กติกาของ "วันที่ดู" (วันเก่าใช้กติกาเก่า) ไม่ใช่กติกาปัจจุบัน
    const base: AttendanceRules = { workStart: cohort.workStart, workEnd: cohort.workEnd, lateGraceMinutes: cohort.lateGraceMinutes };
    const rules = rulesOn(d, base, await attendanceRepository.workRules(cohortId));
    const [interns, records, holidays, trackingStart, leaves] = await Promise.all([
      attendanceRepository.internsOfCohort(cohortId),
      attendanceRepository.recordsOfCohort(cohortId, d, d),
      attendanceRepository.holidayDates(cohortId, d, d),
      attendanceRepository.firstRecordDate(cohortId),
      leaveRepository.approvedOfCohort(cohortId, d, d),
    ]);
    // ถ้าน้องมีทั้งลาและแจ้งสายวันเดียวกัน "ลา" มาก่อน
    const leaveBy = new Map<number, "leave" | "late">();
    for (const l of leaves) if (!leaveBy.has(l.userId) || l.kind === "leave") leaveBy.set(l.userId, l.kind);
    const byUser = new Map(records.map((r) => [r.userId, r]));
    const rows: DayRow[] = interns.map((u) => {
      const rec = byUser.get(u.id) ?? null;
      const out = rec ? effectiveCheckOut(rec, rules, now) : null;
      const leave = leaveBy.get(u.id) ?? null;
      return {
        userId: u.id,
        name: u.fullName || u.nickname || u.username,
        state: dayState({ date: d, cohort, rules, holiday: holidays.has(d), record: rec, now, trackingStart, leave }),
        checkInAt: rec ? rec.checkInAt.toISOString() : null,
        checkOutAt: out ? out.at.toISOString() : null,
        checkOutAuto: out?.auto ?? false,
        late: rec ? isLate(rec.checkInAt, d, rules) && leave !== "late" : false,
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

  async rules(cohortId: number): Promise<RulesView> {
    const cohort = await cohortOrThrow(cohortId);
    const list = await attendanceRepository.workRules(cohortId);
    return {
      today: todayTH(),
      base: { workStart: cohort.workStart, workEnd: cohort.workEnd, lateGraceMinutes: cohort.lateGraceMinutes },
      rules: list.map((r) => ({ id: r.id, effectiveFrom: r.effectiveFrom, workStart: r.workStart, workEnd: r.workEnd, lateGraceMinutes: r.lateGraceMinutes })),
    };
  },

  // ตั้งกติกาเวลาใหม่: เริ่มมีผลพรุ่งนี้เป็นต้นไปเท่านั้น (ย้อนหลังและวันนี้ไม่ได้ ไม่งั้นผลสายของคนที่เช็คอินไปแล้วจะเปลี่ยน)
  async addRule(actorId: number, input: { cohortId: number; effectiveFrom: string; workStart: string; workEnd: string; lateGraceMinutes: number }) {
    const cohort = await cohortOrThrow(input.cohortId);
    if (input.effectiveFrom <= todayTH()) throw new Error("RULE_NOT_FUTURE");
    if (input.workEnd <= input.workStart) throw new Error("RULE_ORDER");
    const id = await attendanceRepository.addWorkRule({ ...input, createdBy: actorId });
    if (!id) throw new Error("RULE_EXISTS");
    await auditService.log(actorId, "workrule.add", cohort.name, `มีผล ${input.effectiveFrom} · ${input.workStart}-${input.workEnd} · ผ่อนผัน ${input.lateGraceMinutes} นาที`);
  },

  // ลบได้เฉพาะกติกาที่ยังไม่ถึงวันเริ่มมีผล (ที่มีผลแล้วถูกใช้คิดผลของวันที่ผ่านมา ลบแล้วประวัติจะเปลี่ยน)
  async removeRule(actorId: number, id: number) {
    const r = await attendanceRepository.findWorkRule(id);
    if (!r) throw new Error("RULE_NOT_FOUND");
    if (r.effectiveFrom <= todayTH()) throw new Error("RULE_IN_EFFECT");
    const cohort = await cohortOrThrow(r.cohortId);
    await attendanceRepository.removeWorkRule(id);
    await auditService.log(actorId, "workrule.remove", cohort.name, `มีผล ${r.effectiveFrom}`);
  },

  // ส่งออกเช็คอินทั้งรุ่นของ 1 เดือนเป็น CSV (ข้อมูลไม่ผูกกับระบบ เปิดใน Excel ได้) · เฉพาะวันที่ผ่านมาแล้วและอยู่ในช่วงรุ่น
  async exportMonth(actorId: number, cohortId: number, month: string) {
    const cohort = await cohortOrThrow(cohortId);
    const now = new Date();
    const today = todayTH(now);
    const { from, to } = monthRange(month);
    const lo = from > cohort.startsOn ? from : cohort.startsOn;
    const hiCap = to < today ? to : today;
    const hi = hiCap < cohort.endsOn ? hiCap : cohort.endsOn;
    const base: AttendanceRules = { workStart: cohort.workStart, workEnd: cohort.workEnd, lateGraceMinutes: cohort.lateGraceMinutes };
    const header = ["ชื่อผู้ใช้", "ชื่อ", "วันที่", "สถานะ", "เวลาเข้า", "เวลาออก", "ออกโดยระบบนับให้", "ชั่วโมงทำงาน", "เข้างานหลังเวลา", "พี่เลี้ยงแก้เวลา", "เหตุผลที่แก้"];
    const rows: (string | number | boolean | null)[][] = [header];
    if (lo <= hi) {
      const [interns, records, ruleList, holidayList, trackingStart, leaves] = await Promise.all([
        attendanceRepository.internsOfCohort(cohortId),
        attendanceRepository.recordsOfCohort(cohortId, lo, hi),
        attendanceRepository.workRules(cohortId),
        attendanceRepository.holidays(cohortId),
        attendanceRepository.firstRecordDate(cohortId),
        leaveRepository.approvedOfCohort(cohortId, lo, hi),
      ]);
      const leaveBy = new Map<string, "leave" | "late">();
      for (const l of leaves) {
        const k = `${l.userId}|${l.workDate}`;
        if (!leaveBy.has(k) || l.kind === "leave") leaveBy.set(k, l.kind);
      }
      const holidays = new Set(holidayList.map((h) => h.holidayDate));
      const byKey = new Map(records.map((r) => [`${r.userId}|${r.workDate}`, r]));
      const STATE: Record<string, string> = { holiday: "วันหยุดของรุ่น", leave: "ลา (อนุมัติแล้ว)", absent: "ไม่มีเช็คอิน", working: "กำลังทำงาน", waiting: "ยังไม่เช็คอิน", done: "เช็คอินแล้ว" };
      for (const u of interns) {
        for (const date of eachDate(lo, hi)) {
          const rec = byKey.get(`${u.id}|${date}`) ?? null;
          const d = describeDay({ date, cohort, rules: rulesOn(date, base, ruleList), holiday: holidays.has(date), record: rec, now, trackingStart, leave: leaveBy.get(`${u.id}|${date}`) ?? null });
          if (d.state === "off_day" || d.state === "outside" || d.state === "untracked") continue;
          rows.push([
            u.username,
            u.fullName || u.nickname || "",
            date,
            STATE[d.state] ?? d.state,
            d.checkInAt ? hm(d.checkInAt) : "",
            d.checkOutAt ? hm(d.checkOutAt) : "",
            d.checkOutAuto ? "ใช่" : "",
            d.minutes !== null ? Math.round((d.minutes / 60) * 100) / 100 : "",
            d.late ? "ใช่" : "",
            rec?.editReason ? "ใช่" : "",
            rec?.editReason ?? "",
          ]);
        }
      }
    }
    await auditService.log(actorId, "attendance.export", cohort.name, `${month} · ${rows.length - 1} แถว`);
    return toCsv(rows);
  },
};
