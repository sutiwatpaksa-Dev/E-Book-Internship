"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminLeaveApi } from "@/api/admin-leave.api";
import type { LeaveAdminRow, LeaveStatus } from "@/lib/attendance";
import { toast } from "./use-toast";

// ใบลาของน้องทั้งรุ่น · เปลี่ยนรุ่น/ตัวกรองเร็วๆ คำตอบเก่าที่มาช้ากว่าต้องไม่ทับของใหม่ (seq)
export function useAdminLeave(cohortId: number | null, status: LeaveStatus | null, onChanged?: () => void) {
  const [items, setItems] = useState<LeaveAdminRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!cohortId) return;
    const mine = ++seq.current;
    try {
      const r = await adminLeaveApi.list(cohortId, status);
      if (mine !== seq.current) return;
      setItems(r);
      setError(null);
    } catch (e) {
      if (mine === seq.current) setError((e as Error).message);
    }
  }, [cohortId, status]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  const decide = async (id: number, verdict: "approved" | "rejected", note: string) => {
    setBusy(true);
    try {
      await adminLeaveApi.decide(id, verdict, note);
      toast.success(verdict === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติแล้ว น้องจะเห็นเหตุผล");
      await load();
      onChanged?.();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      await load(); // ใบอาจถูกพี่เลี้ยงอีกคนตัดสินไปแล้ว ดึงใหม่ให้ตรงความจริง
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { items, error, busy, reload: load, decide };
}
