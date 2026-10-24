"use client";

import { Check } from "lucide-react";
import { useProgress } from "@/hooks/use-progress";

// ปุ่มใต้ชื่อบท: ติ๊กว่าผ่านบทนี้แล้ว (ค่าเดียวกับติ๊กบนหน้าแรกและป้ายใน sidebar)
export function MarkDoneButton({ link, label = "ผ่านบทนี้แล้ว" }: { link: string; label?: string }) {
  const { done, toggle } = useProgress();
  const isDone = done.has(link);
  return (
    <button
      type="button"
      aria-pressed={isDone}
      onClick={() => toggle(link)}
      className={`not-prose inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-fd-primary px-4 text-sm font-medium transition-colors ${
        isDone ? "bg-fd-primary text-fd-primary-foreground hover:opacity-90" : "text-fd-primary hover:bg-fd-primary/10"
      }`}
    >
      <Check className="size-4" strokeWidth={2.5} />
      {isDone ? `${label} (กดอีกครั้งเพื่อยกเลิก)` : label}
    </button>
  );
}
