import { and, asc, eq, gte, isNull, lte } from "drizzle-orm";
import { db } from "../db/client";
import { attendanceRecords, cohortHolidays, users } from "../db/schema";

export const attendanceRepository = {
  async findByDate(userId: number, workDate: string) {
    const [row] = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.workDate, workDate)));
    return row;
  },
  // กดซ้ำหรือเปิดสองแท็บพร้อมกันไม่ error และไม่เปลี่ยนเวลาแรก (unique user_id + work_date กันไว้ที่ DB)
  async checkIn(userId: number, workDate: string, at: Date) {
    await db.insert(attendanceRecords).values({ userId, workDate, checkInAt: at }).onConflictDoNothing();
  },
  // ตั้งเวลาออกได้ครั้งเดียว (ที่ยังว่างเท่านั้น) กดซ้ำจึงไม่ทับเวลาเดิม
  async checkOut(userId: number, workDate: string, at: Date) {
    await db
      .update(attendanceRecords)
      .set({ checkOutAt: at })
      .where(and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.workDate, workDate), isNull(attendanceRecords.checkOutAt)));
  },
  async isHoliday(cohortId: number, date: string) {
    const [row] = await db
      .select({ id: cohortHolidays.id })
      .from(cohortHolidays)
      .where(and(eq(cohortHolidays.cohortId, cohortId), eq(cohortHolidays.holidayDate, date)));
    return !!row;
  },

  // ---- ฝั่งพี่เลี้ยง ----
  internsOfCohort: (cohortId: number) =>
    db
      .select({ id: users.id, username: users.username, fullName: users.fullName, nickname: users.nickname })
      .from(users)
      .where(and(eq(users.cohortId, cohortId), eq(users.role, "intern"), eq(users.disabled, false)))
      .orderBy(asc(users.username)),
  // น้อง 1 คน (ต้องเป็น intern ที่อยู่ในรุ่น) · ไม่ใช่ intern หรือไม่มีรุ่น = undefined
  async internsOfCohortByUser(userId: number) {
    const [row] = await db.select({ username: users.username, cohortId: users.cohortId, role: users.role }).from(users).where(eq(users.id, userId));
    return row && row.role === "intern" && row.cohortId ? { username: row.username, cohortId: row.cohortId } : undefined;
  },
  // แถวเช็คอินของน้องในรุ่นนี้ ช่วงวันที่ที่ขอ (รวมสองฝั่ง)
  recordsOfCohort: (cohortId: number, from: string, to: string) =>
    db
      .select({ record: attendanceRecords })
      .from(attendanceRecords)
      .innerJoin(users, eq(users.id, attendanceRecords.userId))
      .where(and(eq(users.cohortId, cohortId), gte(attendanceRecords.workDate, from), lte(attendanceRecords.workDate, to)))
      .then((rows) => rows.map((r) => r.record)),
  // พี่เลี้ยงแก้เวลา: มีแถวอยู่แล้วแก้ทับ ไม่มี (น้องลืมเช็คอินทั้งวัน) สร้างให้ · ทุกครั้งบันทึกว่าใครแก้และเพราะอะไร
  async saveEdit(v: { userId: number; workDate: string; checkInAt: Date; checkOutAt: Date | null; editedBy: number; reason: string }) {
    const edit = { checkInAt: v.checkInAt, checkOutAt: v.checkOutAt, editedBy: v.editedBy, editedAt: new Date(), editReason: v.reason };
    await db
      .insert(attendanceRecords)
      .values({ userId: v.userId, workDate: v.workDate, ...edit })
      .onConflictDoUpdate({ target: [attendanceRecords.userId, attendanceRecords.workDate], set: edit });
  },
  holidays: (cohortId: number) => db.select().from(cohortHolidays).where(eq(cohortHolidays.cohortId, cohortId)).orderBy(asc(cohortHolidays.holidayDate)),
  holidayDates: (cohortId: number, from: string, to: string) =>
    db
      .select({ date: cohortHolidays.holidayDate })
      .from(cohortHolidays)
      .where(and(eq(cohortHolidays.cohortId, cohortId), gte(cohortHolidays.holidayDate, from), lte(cohortHolidays.holidayDate, to)))
      .then((rows) => new Set(rows.map((r) => r.date))),
  async addHoliday(cohortId: number, date: string, note: string) {
    const rows = await db.insert(cohortHolidays).values({ cohortId, holidayDate: date, note }).onConflictDoNothing().returning({ id: cohortHolidays.id });
    return rows[0]?.id;
  },
  async findHoliday(id: number) {
    const [row] = await db.select().from(cohortHolidays).where(eq(cohortHolidays.id, id));
    return row;
  },
  async removeHoliday(id: number) {
    await db.delete(cohortHolidays).where(eq(cohortHolidays.id, id));
  },
};
