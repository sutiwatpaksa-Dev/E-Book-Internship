"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cardUrl, cardsOf, steps, stepUrl, type LearnStep } from "@/data/learn";
import { useProgress } from "@/hooks/use-progress";
import { AskLink } from "./ask-link";

// หัวหน้าขั้น: อยู่ขั้นไหนจาก 7, ต้องได้อะไร, การ์ดในขั้นนี้เข้าใจไปกี่ใบ
export function StepHeader({ step }: { step: LearnStep }) {
  const { done } = useProgress();
  const list = cardsOf(step.slug);
  const count = list.filter((c) => done.has(cardUrl(c.slug))).length;
  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-fd-primary px-3 py-1 font-semibold text-fd-primary-foreground tabular-nums">ขั้น {step.num} จาก 7</span>
        {list.length > 0 ? (
          <span className="rounded-full bg-fd-muted px-3 py-1 text-fd-muted-foreground tabular-nums">
            การ์ดในขั้นนี้ เข้าใจแล้ว {count}/{list.length}
          </span>
        ) : (
          <span className="rounded-full bg-fd-muted px-3 py-1 text-fd-muted-foreground">ขั้นนี้ยังใช้บทเดิม กำลังแปลงเป็นการ์ด</span>
        )}
      </div>
      <p className="rounded-xl border border-fd-border bg-fd-card px-4 py-3 text-[15px]">
        <span className="font-semibold">จบขั้นนี้ต้องได้: </span>
        {step.output}
      </p>
    </div>
  );
}

// ขั้นก่อน/ถัดไป ท้ายหน้าขั้น (ขั้น 7 วนกลับขั้น 1 เพราะงานจริงเป็นวงรอบ)
export function StepPager({ step }: { step: LearnStep }) {
  const prev = steps[step.num - 2] ?? null;
  const next = steps[step.num] ?? steps[0];
  return (
    <nav aria-label="ขั้นก่อนหน้าและถัดไป" className="not-prose mt-10 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link href={stepUrl(prev.slug)} className="flex min-h-16 items-center gap-3 rounded-xl border border-fd-border px-4 py-2 hover:bg-fd-accent">
          <ArrowLeft className="size-4 shrink-0" />
          <span>
            <span className="block text-xs text-fd-muted-foreground">ขั้น {prev.num}</span>
            {prev.name} · {prev.th}
          </span>
        </Link>
      ) : (
        <span className="max-sm:hidden" />
      )}
      <Link href={stepUrl(next.slug)} className="flex min-h-16 items-center justify-end gap-3 rounded-xl border border-fd-border px-4 py-2 text-right hover:bg-fd-accent">
        <span>
          <span className="block text-xs text-fd-muted-foreground">{next.num === 1 ? "วนกลับขั้น 1 (ปัญหาใหม่จาก feedback)" : `ขั้น ${next.num}`}</span>
          {next.name} · {next.th}
        </span>
        <ArrowRight className="size-4 shrink-0" />
      </Link>
    </nav>
  );
}

// กล่องโจทย์ STARTER ในหน้าขั้น: เด่นกว่าเนื้อหาอื่น เพราะเป็นงานที่ต้องลงมือจริง
export function Task({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 rounded-2xl border-2 border-fd-primary/40 bg-fd-primary/5 px-5 py-1">
      {children}
      <p className="not-prose mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fd-muted-foreground">
        ไม่มีเฉลย ลองเองก่อนอย่างน้อย 20 นาที แล้วค่อยเปิดคำใบ้ทีละระดับ
        <AskLink className="inline-flex min-h-11 items-center font-semibold text-fd-primary hover:underline">ติดอยู่? ถามพี่เลี้ยง</AskLink>
      </p>
    </div>
  );
}
