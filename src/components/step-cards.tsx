"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cardUrl, cardsOf, legacyOf, mentorCardUrl, stepBySlug, type LearnCard, type StepSlug } from "@/data/learn";
import { useCatalog } from "@/hooks/use-catalog";
import { useProgress } from "@/hooks/use-progress";
import { useSession } from "@/hooks/use-session";
import { MentorBadge } from "./card-library";

// การ์ดในหน้าขั้น · ขั้นที่มีหลายช่วง (Coding: DB → Backend → API → Frontend) แยกเป็นแท็บ เห็นทีละช่วง ไม่ยาวจนหลง
// เปิดมาที่ช่วงที่ยังมีการ์ดค้าง · บทเดิมที่ยังไม่ได้แปลงเป็นการ์ดต่อท้ายพร้อมป้าย "บทเดิม"
// การ์ดที่พี่เลี้ยงซ่อนไม่แสดง · การ์ดของพี่เลี้ยงในขั้นนี้แยกเป็นกลุ่มท้ายสุด (ไม่มีช่วง เพราะเขียนเพิ่มทีหลัง)
export function StepCards({ step }: { step: StepSlug }) {
  const { done } = useProgress();
  const { cards, mentorCards } = useCatalog();
  const { role } = useSession();
  const mine = mentorCards.filter((m) => m.step === step);
  const parts = stepBySlug(step).parts;
  const firstOpen = parts?.find((p) => cardsOf(step, cards).some((c) => c.part === p && !done.has(cardUrl(c.slug)))) ?? parts?.[0];
  const [picked, setPicked] = useState<string | null>(null);
  const part = picked ?? firstOpen;

  return (
    <div className="not-prose my-6 flex flex-col gap-4">
      {parts && (
        <div role="tablist" aria-label="ช่วงของขั้นนี้" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-fd-muted p-1">
          {parts.map((p) => {
            const list = cardsOf(step, cards).filter((c) => c.part === p);
            const count = list.filter((c) => done.has(cardUrl(c.slug))).length;
            const on = p === part;
            return (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`part-${p}`}
                onClick={() => setPicked(p)}
                className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold ${on ? "bg-fd-background text-fd-primary shadow-sm" : "text-fd-muted-foreground hover:text-fd-foreground"}`}
              >
                {p}
                {list.length > 0 && (
                  <span className="text-xs font-normal tabular-nums">
                    {count}/{list.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <Part step={step} part={part} done={done} cards={cards} />
      {mine.length > 0 && (
        <section aria-labelledby="mentor-cards" className="flex flex-col gap-2">
          <h3 id="mentor-cards" className="text-sm font-semibold">
            การ์ดจากพี่เลี้ยง
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {mine.map((m) => {
              const isDone = done.has(mentorCardUrl(m.slug));
              return (
                <li key={m.slug}>
                  <Link href={mentorCardUrl(m.slug)} className="flex h-full min-h-16 items-center gap-3 rounded-xl border border-fd-border bg-fd-card px-4 py-3 hover:border-fd-primary/50 hover:bg-fd-accent">
                    <DoneDot done={isDone} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="font-semibold">{m.title}</span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs text-fd-muted-foreground tabular-nums">
                        <MentorBadge />
                        {role ? `${m.minutes} นาที` : `ต้อง login · ${m.minutes} นาที`}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function DoneDot({ done }: { done: boolean }) {
  return (
    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${done ? "border-fd-primary bg-fd-primary text-fd-primary-foreground" : "border-fd-border"}`}>
      {done && <Check aria-label="เข้าใจแล้ว" className="size-3.5" strokeWidth={3} />}
    </span>
  );
}

function Part({ step, part, done, cards }: { step: StepSlug; part: string | undefined; done: ReadonlySet<string>; cards: readonly LearnCard[] }) {
  const list = cardsOf(step, cards).filter((c) => c.part === part);
  const old = legacyOf(step).filter((l) => l.part === part);
  return (
    <div id={part ? `part-${part}` : undefined} role={part ? "tabpanel" : undefined} className="flex flex-col gap-2">
      {list.length === 0 && old.length === 0 && <p className="text-sm text-fd-muted-foreground">ช่วงนี้ยังไม่มีการ์ด กำลังทยอยเพิ่ม</p>}
      <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((c) => {
          const isDone = done.has(cardUrl(c.slug));
          return (
            <li key={c.slug}>
              <Link href={cardUrl(c.slug)} className="flex h-full min-h-16 items-center gap-3 rounded-xl border border-fd-border bg-fd-card px-4 py-3 hover:border-fd-primary/50 hover:bg-fd-accent">
                <DoneDot done={isDone} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{c.title}</span>
                  <span className="text-xs text-fd-muted-foreground tabular-nums">
                    {c.minutes} นาที{isDone ? " · เข้าใจแล้ว" : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
        {old.map((l) => (
          <li key={l.link}>
            <Link href={l.link} className="flex h-full min-h-16 items-center gap-3 rounded-xl border border-dashed border-fd-border px-4 py-3 hover:bg-fd-accent">
              <span className="shrink-0 rounded-full bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground">บทเดิม</span>
              <span className="flex-1 text-sm">{l.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
