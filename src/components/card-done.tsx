"use client";

import { Check } from "lucide-react";
import { useProgress } from "@/hooks/use-progress";
import { AskLink } from "./ask-link";
import { MarkDoneButton } from "./mark-done-button";

// ป้ายบนหัวการ์ด: กลับมาอ่านซ้ำจะรู้ทันทีว่าเคยกดเข้าใจแล้ว
export function CardStatus({ link }: { link: string }) {
  const { done } = useProgress();
  if (!done.has(link)) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-fd-primary/10 px-2.5 py-0.5 text-xs font-semibold text-fd-primary">
      <Check className="size-3.5" strokeWidth={3} aria-hidden />
      เข้าใจแล้ว
    </span>
  );
}

// ท้ายการ์ด: กดเข้าใจแล้วหลังอ่านจบและลองโจทย์ ไม่ใช่ก่อนอ่าน (ปุ่มเดิมอยู่บนสุดจึงถูกกดก่อนอ่าน)
export function CardDone({ link }: { link: string }) {
  return (
    <section aria-labelledby="card-done-title" className="not-prose mt-10 flex flex-col gap-3 border-t border-fd-border pt-6">
      <h2 id="card-done-title" className="text-lg font-semibold">
        อธิบายเรื่องนี้ให้เพื่อนฟังด้วยคำของตัวเองได้ไหม
      </h2>
      <p className="text-sm text-fd-muted-foreground">ได้แล้วค่อยกด ปุ่ม &quot;ทำต่อ&quot; บนหน้าวันนี้จะพาไปการ์ดถัดไปให้</p>
      <div className="flex flex-wrap items-center gap-3">
        <MarkDoneButton link={link} label="เข้าใจการ์ดนี้แล้ว" size="lg" />
        <AskLink className="inline-flex min-h-12 items-center rounded-xl border border-fd-border px-5 text-sm font-semibold hover:bg-fd-accent">ยังไม่เข้าใจ ถามพี่เลี้ยง</AskLink>
      </div>
    </section>
  );
}
