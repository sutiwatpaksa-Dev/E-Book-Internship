"use client";

import { useEffect, useRef } from "react";

// เรียก fn ซ้ำทุก ms มิลลิวินาที เฉพาะตอนที่แท็บนี้เปิดดูอยู่ และเรียกทันทีเมื่อกลับมาที่แท็บ
// ใช้แทนการต่อสายค้างไว้ (WebSocket) เพราะ function บน Vercel เปิดค้างนานไม่ได้
// background = ถามต่อแม้แท็บถูกซ่อน (ใช้กับกระดิ่ง: เสียงแจ้งเตือนมีไว้ตอนเราไปทำแท็บอื่น)
// เบราว์เซอร์ชะลอ timer ของแท็บที่ซ่อนเหลือราวนาทีละครั้ง จึงใช้กับงานที่ถามทุก 1 นาทีอยู่แล้วเท่านั้น
export function usePolling(fn: () => void, ms: number, enabled = true, background = false) {
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (background || document.visibilityState === "visible") latest.current();
    };
    const id = setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [ms, enabled, background]);
}
