"use client";

import { useEffect, useRef } from "react";

// เรียก fn ซ้ำทุก ms มิลลิวินาที เฉพาะตอนที่แท็บนี้เปิดดูอยู่ และเรียกทันทีเมื่อกลับมาที่แท็บ
// ใช้แทนการต่อสายค้างไว้ (WebSocket) เพราะ function บน Vercel เปิดค้างนานไม่ได้
export function usePolling(fn: () => void, ms: number, enabled = true) {
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible") latest.current();
    };
    const id = setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [ms, enabled]);
}
