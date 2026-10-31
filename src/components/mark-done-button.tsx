"use client";

import { Check } from "lucide-react";
import { useProgress } from "@/hooks/use-progress";

// ปุ่มใต้ชื่อบท: ติ๊กว่าผ่านบทนี้แล้ว (ค่าเดียวกับติ๊กบนหน้าแรกและป้ายใน sidebar)
export function MarkDoneButton({ link, label = "ผ่านบทนี้แล้ว", size = "md" }: { link: string; label?: string; size?: "md" | "lg" }) {
  const { done, toggle } = useProgress();
  const isDone = done.has(link);
  return (
    <button
      type="button"
      aria-pressed={isDone}
      title={isDone ? "ยกเลิกการติ๊ก" : "กดเมื่ออ่านบทนี้จบและทำแบบฝึกหัดแล้ว ความคืบหน้าจะถูกบันทึกกับบัญชี"}
      onClick={() => toggle(link)}
      className={`not-prose inline-flex w-fit items-center gap-2 border border-fd-primary font-medium transition-colors ${size === "lg" ? "min-h-12 rounded-xl px-6 text-base" : "h-10 rounded-lg px-4 text-sm"} ${
        isDone ? "bg-fd-primary text-fd-primary-foreground hover:brightness-110" : "text-fd-primary hover:bg-fd-primary/10"
      }`}
    >
      <Check className="size-4" strokeWidth={2.5} />
      {isDone ? `${label} (กดอีกครั้งเพื่อยกเลิก)` : label}
    </button>
  );
}
