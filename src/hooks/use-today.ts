"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { attendanceApi } from "@/api/attendance.api";
import type { TodayView } from "@/lib/attendance";
import { toast } from "./use-toast";

// หน้า "วันนี้" ของน้อง: ดึงสถานะจาก server แล้วเดินนาฬิกาต่อจาก "เวลาของ server" ไม่ใช่เวลาเครื่องน้อง
// offset = เวลา server − เวลาเครื่อง ตอนที่ได้ข้อมูลมา · นาฬิกาที่โชว์ = เวลาเครื่อง + offset (เครื่องน้องตั้งเวลาผิดก็ยังโชว์ตรง)
const RELOAD_MS = 60_000;

export function useToday() {
  const [view, setView] = useState<TodayView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const offset = useRef(0);

  const apply = useCallback((v: TodayView) => {
    offset.current = Date.parse(v.now) - Date.now();
    setView(v);
    setNow(Date.now() + offset.current);
    setError(null);
  }, []);

  const load = useCallback(() => {
    attendanceApi
      .today()
      .then(apply)
      // รีโหลดเงียบๆ ล้มเหลว (เน็ตหลุดชั่วคราว) ไม่ทับข้อมูลที่แสดงอยู่ · ล้มตอนแรกถึงโชว์ข้อผิดพลาด
      .catch((e: Error) => setView((v) => (v ? v : (setError(e.message), null))));
  }, [apply]);

  useEffect(() => {
    load();
    const tick = setInterval(() => setNow(Date.now() + offset.current), 1000);
    // เปิดแท็บค้างไว้ข้ามเวลาเลิกงาน/ข้ามวัน: ถามสถานะใหม่เป็นระยะ และตอนกลับมาที่แท็บ
    const reload = setInterval(load, RELOAD_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(tick);
      clearInterval(reload);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const run = async (action: () => Promise<TodayView>, ok: string) => {
    setBusy(true);
    try {
      apply(await action());
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
      load(); // สถานะอาจเปลี่ยนไปแล้ว (เช่นเลยเวลาเลิกงาน) ดึงใหม่ให้หน้าตรงกับความจริง
    } finally {
      setBusy(false);
    }
  };

  return {
    view,
    now,
    error,
    busy,
    reload: load,
    checkIn: () => run(attendanceApi.checkIn, "เช็คอินแล้ว"),
    checkOut: () => run(attendanceApi.checkOut, "เช็คเอาต์แล้ว"),
  };
}
