"use client";

import { useCallback, useEffect, useState } from "react";
import { leaveApi } from "@/api/leave.api";
import type { LeaveKind, LeaveRow } from "@/lib/attendance";
import { toast } from "./use-toast";

// ใบลา/แจ้งสายของน้องเอง: ดูรายการ ขอใหม่ ถอนใบที่ยังรออนุมัติ
export function useLeave() {
  const [items, setItems] = useState<LeaveRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    leaveApi
      .mine()
      .then((r) => {
        setItems(r);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const run = async (action: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(ok);
      load();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    items,
    error,
    busy,
    reload: load,
    request: (input: { workDate: string; kind: LeaveKind; reason: string }) => run(() => leaveApi.request(input), "ส่งใบแล้ว รอพี่เลี้ยงตอบ"),
    withdraw: (id: number) => run(() => leaveApi.withdraw(id), "ถอนใบแล้ว"),
  };
}
