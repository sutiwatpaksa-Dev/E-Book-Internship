"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { cardUrl, cardsOf, legacyOf, stepBySlug, type StepSlug } from "@/data/learn";
import { useProgress } from "@/hooks/use-progress";

// รายการการ์ดในหน้าขั้น จัดกลุ่มตามช่วง (ขั้น Coding: DB → Backend → API → Frontend)
// บทเดิมที่ยังไม่ได้แปลงเป็นการ์ดแสดงต่อท้ายพร้อมป้าย "บทเดิม" น้องจะได้ไม่หลุดเนื้อหา
export function StepCards({ step }: { step: StepSlug }) {
  const { done } = useProgress();
  const s = stepBySlug(step);
  const groups = s.parts ?? [undefined];

  return (
    <div className="not-prose my-6 flex flex-col gap-5">
      {groups.map((part) => {
        const list = cardsOf(step).filter((c) => c.part === part);
        const old = legacyOf(step).filter((l) => l.part === part);
        if (list.length === 0 && old.length === 0) return null;
        return (
          <section key={part ?? "all"} className="flex flex-col gap-2">
            {part && <h3 className="text-sm font-semibold text-fd-muted-foreground">{part}</h3>}
            <ul className="flex flex-col gap-2">
              {list.map((c) => {
                const isDone = done.has(cardUrl(c.slug));
                return (
                  <li key={c.slug}>
                    <Link href={cardUrl(c.slug)} className="flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 hover:bg-fd-accent">
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${isDone ? "border-fd-primary bg-fd-primary text-fd-primary-foreground" : "border-fd-border"}`}
                      >
                        {isDone && <Check aria-label="เข้าใจแล้ว" className="size-3" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 text-sm font-medium">{c.title}</span>
                      <span className="text-xs text-fd-muted-foreground tabular-nums">{c.minutes} นาที</span>
                    </Link>
                  </li>
                );
              })}
              {old.map((l) => (
                <li key={l.link}>
                  <Link href={l.link} className="flex min-h-12 items-center gap-3 rounded-lg border border-dashed px-3 py-2 hover:bg-fd-accent">
                    <span className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground">บทเดิม</span>
                    <span className="flex-1 text-sm">{l.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
