"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminAttendanceApi, type EditTimeInput, type NewRuleInput } from "@/api/admin-attendance.api";
import type { DayView, HolidayRow, MonthView, RulesView } from "@/lib/attendance";
import { toast } from "./use-toast";

// แท็บ "เช็คอิน" ของหลังบ้าน: น้องทั้งรุ่นในวันที่เลือก + วันหยุดของรุ่น
// เปลี่ยนรุ่น/วันแล้วคำตอบของคำขอเก่าที่มาช้ากว่า ต้องไม่ทับของใหม่ (เช็คด้วย seq)
export function useAdminAttendance(cohortId: number | null, date: string) {
  const [day, setDay] = useState<DayView | null>(null);
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [rules, setRules] = useState<RulesView | null>(null);
  const [month, setMonth] = useState<MonthView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!cohortId) return;
    const mine = ++seq.current;
    try {
      const [d, h, r, m] = await Promise.all([adminAttendanceApi.day(cohortId, date), adminAttendanceApi.holidays(cohortId), adminAttendanceApi.rules(cohortId), adminAttendanceApi.month(cohortId, date.slice(0, 7))]);
      if (mine !== seq.current) return;
      setDay(d);
      setHolidays(h);
      setRules(r);
      setMonth(m);
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
    rules,
    month,
    error,
    busy,
    reload: load,
    editTime: (input: EditTimeInput) => run(() => adminAttendanceApi.editTime(input), "บันทึกการแก้เวลาแล้ว"),
    addHoliday: (date: string, note: string) => run(() => adminAttendanceApi.addHoliday(cohortId!, date, note), "ประกาศวันหยุดแล้ว"),
    addRule: (input: Omit<NewRuleInput, "cohortId">) => run(() => adminAttendanceApi.addRule({ cohortId: cohortId!, ...input }), "ตั้งเวลางานใหม่แล้ว"),
    removeRule: (id: number) => run(() => adminAttendanceApi.removeRule(id), "ลบกติกาที่ตั้งไว้แล้ว"),
    removeHoliday: (id: number) => run(() => adminAttendanceApi.removeHoliday(id), "ยกเลิกวันหยุดแล้ว"),
  };
}
