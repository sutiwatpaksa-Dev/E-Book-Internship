"use client";

import { ArrowRight, Check, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cardUrl, cardsOf, nextUp, partLabel, steps, stepUrl, type LearnCard } from "@/data/learn";
import { useCatalog } from "@/hooks/use-catalog";
import { useProgress } from "@/hooks/use-progress";

// แผนที่ 7 ขั้น (หน้า /learn) ตาม mock-up รีวิวรอบ 1–2 (5 พ.ย. 2569)
// เส้นเวลาแนวตั้ง 7 ขั้น ขั้นที่อยู่กางออก (ช่วงย่อย งานในโจทย์ การ์ดถัดไป) ที่เหลือพับเป็นบรรทัดเดียว
// สีมีหน้าที่เดียว: ปุ่ม/ลิงก์ = primary · ครบแล้ว = เขียว · ขั้นที่อยู่ = วงเข้ม (สีตัวอักษร) ไม่ใช้สีอย่างเดียว มีคำบอกด้วย
// ตัวเลขทุกตัวนับจากรายการการ์ดชุดเดียวกับ /dashboard (useCatalog ตัดใบที่พี่เลี้ยงซ่อน) จึงตรงกันทุกหน้า

export function LearnMap() {
  const { done } = useProgress();
  const { cards } = useCatalog();
  const { started, card: next } = nextUp(done, cards);
  const read = (list: LearnCard[]) => list.filter((c) => done.has(cardUrl(c.slug))).length;
  const total = cards.length;
  const readAll = read(cards);
  // ยังไม่เริ่ม = ขั้น 1 · เริ่มแล้ว = ขั้นของการ์ดที่ต้องอ่านต่อ · อ่านครบ = ไม่มีขั้นที่อยู่
  const currentSlug = !started ? "problem" : (next?.step ?? null);
  const current = steps.find((s) => s.slug === currentSlug);

  return (
    <div className="not-prose my-6 flex flex-col gap-6">
      <p className="text-base">
        อ่านแล้ว <strong className="tabular-nums">{readAll}</strong> จาก <span className="tabular-nums">{total}</span> การ์ด
        {current && (
          <>
            {" "}
            · ตอนนี้อยู่ขั้น {current.num} {current.name}
            {next?.part ? ` ช่วง${partLabel(next.part)}` : ""}
          </>
        )}
      </p>

      <ol className="relative flex flex-col gap-3 before:absolute before:start-[19px] before:top-5 before:bottom-5 before:w-0.5 before:bg-fd-border">
        {steps.map((s) => {
          const list = cardsOf(s.slug, cards);
          const count = read(list);
          const complete = list.length > 0 && count === list.length;
          const isCurrent = s.slug === currentSlug;
          const nextHere = isCurrent && next?.step === s.slug ? next : isCurrent ? (list.find((c) => !done.has(cardUrl(c.slug))) ?? null) : null;
          return (
            <li key={s.slug} className="relative flex gap-4" aria-current={isCurrent ? "step" : undefined}>
              <span
                aria-hidden
                className={`z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-base font-bold tabular-nums ${
                  isCurrent ? "bg-fd-foreground text-fd-background ring-4 ring-fd-foreground/20" : complete ? "bg-green-700 text-white" : "border-2 border-fd-border bg-fd-background text-fd-muted-foreground"
                }`}
              >
                {complete && !isCurrent ? <Check className="size-5" /> : s.num}
              </span>
              {isCurrent ? (
                <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border-2 border-fd-foreground bg-fd-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-fd-muted-foreground">คุณอยู่ขั้นนี้</span>
                    <Link href={stepUrl(s.slug)} className="text-xl font-bold hover:underline">
                      {s.name} · {s.th}
                    </Link>
                    <span className="text-sm tabular-nums text-fd-muted-foreground">
                      อ่านแล้ว {count} จาก {list.length} การ์ด
                    </span>
                  </div>
                  <p className="text-sm">ได้: {s.output}</p>
                  {s.parts && (
                    <ol aria-label="ช่วงย่อยของขั้นนี้ เรียงตามลำดับทำ" className="flex flex-wrap gap-2">
                      {s.parts.map((p) => {
                        const inPart = list.filter((c) => c.part === p);
                        const partDone = inPart.length > 0 && read(inPart) === inPart.length;
                        const here = next?.part === p;
                        return (
                          <li
                            key={p}
                            className={`rounded-lg px-2.5 py-1 text-sm ${here ? "bg-fd-foreground font-semibold text-fd-background" : partDone ? "bg-green-700/10 text-green-800 dark:text-green-300" : "bg-fd-muted text-fd-muted-foreground"}`}
                          >
                            {partDone && <Check aria-label="ครบ" className="me-1 inline size-3.5" />}
                            {partLabel(p)}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  <p className="text-sm text-fd-muted-foreground">งานในโจทย์: {s.task}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {nextHere ? (
                      <Link href={cardUrl(nextHere.slug)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-fd-primary px-5 font-semibold text-fd-primary-foreground hover:brightness-110">
                        <span>
                          {started ? "อ่านการ์ดถัดไป" : "เริ่มที่การ์ดแรก"}: {nextHere.title} <span className="whitespace-nowrap font-normal opacity-90">· {nextHere.minutes} นาที</span>
                        </span>
                        <ArrowRight className="size-4 shrink-0" />
                      </Link>
                    ) : (
                      <Link href={stepUrl(s.slug)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-fd-primary px-5 font-semibold text-fd-primary-foreground hover:brightness-110">
                        เปิดขั้น {s.name} <ArrowRight className="size-4" />
                      </Link>
                    )}
                    <Link href={stepUrl(s.slug)} className="inline-flex min-h-11 items-center text-sm font-medium text-fd-primary hover:underline">
                      ดูการ์ดทั้ง {list.length} ใบของขั้นนี้
                    </Link>
                  </div>
                </div>
              ) : (
                <Link href={stepUrl(s.slug)} className="flex min-h-14 min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-xl px-3 py-2 hover:bg-fd-accent">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-sm text-fd-muted-foreground">{s.th}</span>
                    <span className={`text-sm tabular-nums ${complete ? "font-medium text-green-800 dark:text-green-300" : "text-fd-muted-foreground"}`}>
                      · {list.length === 0 ? "ยังเป็นบทเดิม" : complete ? `ครบ ${list.length} การ์ด` : count > 0 ? `อ่านแล้ว ${count} จาก ${list.length}` : `${list.length} การ์ด`}
                    </span>
                  </span>
                  <span className="text-sm text-fd-muted-foreground">ได้: {s.output}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <p className="flex gap-2 rounded-xl bg-fd-muted px-4 py-3 text-sm">
        <RotateCcw aria-hidden className="mt-0.5 size-4 shrink-0" />
        จบขั้น 7 ไม่ได้แปลว่างานจบ bug และ feedback จากผู้ใช้คือปัญหาใหม่ที่พาวนกลับไปขั้น 1 อีกรอบ
      </p>
      <p className="text-sm text-fd-muted-foreground">
        ไม่ต้องอ่านเรียงก็ได้ รู้แล้วว่าต้องใช้เรื่องไหน ค้นหรือเปิดจาก{" "}
        <Link href="/learn/cards" className="font-medium text-fd-primary underline">
          คลังการ์ด
        </Link>{" "}
        ได้ทันที การ์ดแต่ละใบอ่านจบในราว 10 นาที ติดหรือหาไม่เจอ กด &quot;ถามพี่เลี้ยง&quot; ท้ายการ์ดใบไหนก็ได้
      </p>
    </div>
  );
}
