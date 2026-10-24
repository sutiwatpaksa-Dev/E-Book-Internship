"use client";

import { ChevronDown, Lightbulb, Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";

// คำใบ้ในส่วน "ลองเอง" ของการ์ดและโจทย์ STARTER: เปิดได้ทีละระดับ (1 ชี้ทิศ → 2 บอกเครื่องมือ → 3 โครงคร่าวๆ)
// ระดับ 2 เปิดได้หลังเปิดระดับ 1 แล้วเท่านั้น กันการกดข้ามไปดูตัวที่ใกล้เฉลยที่สุดทันที
// ไม่มีเฉลยเต็ม ติดจริงหลังระดับ 3 ค่อยถามพี่เลี้ยง
//
// จำไว้ในเบราว์เซอร์ว่าหน้านี้เปิดถึงระดับไหน (กลับมาอ่านต่อไม่ต้องเปิดใหม่) · เป็นแค่ความสะดวก อ่าน/เขียนไม่ได้ก็ทำงานต่อ
const KEY = "bt-hints";
const listeners = new Set<() => void>();
let cache: Record<string, number> | null = null;

function read(): Record<string, number> {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    cache = {};
  }
  return cache!;
}

function open(path: string, level: number) {
  const all = { ...read(), [path]: Math.max(read()[path] ?? 0, level) };
  cache = all;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // โหมดส่วนตัวหรือบล็อกพื้นที่เก็บ: จำได้แค่ระหว่างเปิดหน้านี้อยู่
  }
  listeners.forEach((l) => l());
}

function useOpened(path: string) {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => read()[path] ?? 0,
    () => 0,
  );
}

export function Hint({ level, children }: { level: 1 | 2 | 3; children: ReactNode }) {
  const path = usePathname();
  const opened = useOpened(path);
  const isOpen = level <= opened;
  const canOpen = level === opened + 1;

  if (isOpen) {
    return (
      <div className="not-prose my-2 rounded-xl bg-fd-primary/5 px-4 py-3">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-fd-primary">
          <Lightbulb className="size-4" aria-hidden />
          คำใบ้ {level}
        </p>
        <div className="text-[15px] leading-relaxed [&_code]:rounded [&_code]:bg-fd-muted [&_code]:px-1 [&_p]:my-1">{children}</div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={!canOpen}
      onClick={() => open(path, level)}
      className={`not-prose my-2 flex min-h-12 w-full items-center gap-2 rounded-xl border border-dashed px-4 text-left text-sm ${
        canOpen ? "border-fd-primary font-semibold text-fd-primary hover:bg-fd-primary/5" : "cursor-not-allowed border-fd-border text-fd-muted-foreground"
      }`}
    >
      {canOpen ? <ChevronDown className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
      {canOpen ? `เปิดคำใบ้ ${level}` : `คำใบ้ ${level} (เปิดข้อก่อนหน้าก่อน)`}
    </button>
  );
}
