"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { attendanceApi } from "@/api/attendance.api";
import type { HistoryView } from "@/lib/attendance";

// ประวัติเข้างานของน้อง ทีละเดือน · เปลี่ยนเดือนเร็วๆ คำตอบของเดือนเก่าที่มาช้ากว่าต้องไม่ทับของใหม่ (เช็คด้วย seq)
export function useHistory(month: string) {
  const [view, setView] = useState<HistoryView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const v = await attendanceApi.history(month);
      if (mine !== seq.current) return;
      setView(v);
      setError(null);
    } catch (e) {
      if (mine === seq.current) setError((e as Error).message);
    }
  }, [month]);

  useEffect(() => {
    setView(null);
    load();
  }, [load]);

  return { view, error, reload: load };
}
