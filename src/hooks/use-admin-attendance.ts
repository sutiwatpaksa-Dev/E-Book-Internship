"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminAttendanceApi, type EditTimeInput } from "@/api/admin-attendance.api";
import type { DayView, HolidayRow } from "@/lib/attendance";
import { toast } from "./use-toast";

// แท็บ "เช็คอิน" ของหลังบ้าน: น้องทั้งรุ่นในวันที่เลือก + วันหยุดของรุ่น
// เปลี่ยนรุ่น/วันแล้วคำตอบของคำขอเก่าที่มาช้ากว่า ต้องไม่ทับของใหม่ (เช็คด้วย seq)
export function useAdminAttendance(cohortId: number | null, date: string) {
  const [day, setDay] = useState<DayView | null>(null);
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!cohortId) return;
    const mine = ++seq.current;
    try {
      const [d, h] = await Promise.all([adminAttendanceApi.day(cohortId, date), adminAttendanceApi.holidays(cohortId)]);
      if (mine !== seq.current) return;
      setDay(d);
      setHolidays(h);
      setError(null);
    } catch (e) {
      if (mine === seq.current) setError((e as Error).message);
    }
  }, [cohortId, date]);

  useEffect(() => {
    setDay(null);
    load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(ok);
      await load();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    day,
    holidays,
    error,
    busy,
    reload: load,
    editTime: (input: EditTimeInput) => run(() => adminAttendanceApi.editTime(input), "บันทึกการแก้เวลาแล้ว"),
    addHoliday: (date: string, note: string) => run(() => adminAttendanceApi.addHoliday(cohortId!, date, note), "ประกาศวันหยุดแล้ว"),
    removeHoliday: (id: number) => run(() => adminAttendanceApi.removeHoliday(id), "ยกเลิกวันหยุดแล้ว"),
  };
}
