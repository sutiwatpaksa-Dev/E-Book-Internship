import { z } from "zod";
import { isHHMM } from "../../src/lib/attendance";

const day = z.iso.date();
const hhmm = z.string().refine(isHHMM, "เวลาเป็น HH:MM แบบ 24 ชม.");

// แก้เวลาให้น้อง: เหตุผลบังคับ (บันทึกลง audit) · เวลาออกว่างได้ = ยังไม่เช็คเอาต์ (ระบบนับตามเวลาเลิกงานเมื่อวันผ่านไป)
export const editAttendanceSchema = z.object({
  userId: z.number().int().positive(),
  workDate: day,
  checkIn: hhmm,
  checkOut: hhmm.nullable(),
  reason: z.string().trim().min(5).max(300),
});

export const holidaySchema = z.object({
  cohortId: z.number().int().positive(),
  date: day,
  note: z.string().trim().max(80).default(""),
});
