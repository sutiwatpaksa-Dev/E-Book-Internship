import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { attendanceRecords, cohortHolidays } from "../db/schema";

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
};
