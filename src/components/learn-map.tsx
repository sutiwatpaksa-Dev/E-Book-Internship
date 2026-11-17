"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cardUrl, cardsOf, nextUp, steps, stepUrl, type LearnCard } from "@/data/learn";
import { useCatalog } from "@/hooks/use-catalog";
import { useProgress } from "@/hooks/use-progress";

// แผนที่ 7 ขั้น (หน้า /learn): ปุ่ม "ทำต่อ" + ขั้นทั้ง 7 พร้อมความคืบหน้า + ทางไปคลังการ์ด
// น้องควรรู้ภายใน 5 วินาทีว่าอยู่ตรงไหนและต้องทำอะไรต่อ จึงวางปุ่มทำต่อไว้บนสุด
export function LearnMap() {
  const { done } = useProgress();
  // ใช้รายการเดียวกับ /dashboard (ตัดใบที่พี่เลี้ยงซ่อน) ปุ่ม "ทำต่อ" ของสองหน้าจึงตรงกัน
  const { cards } = useCatalog();
  const { started, card: next } = nextUp(done, cards);

  return (
    <div className="not-prose my-6 flex flex-col gap-8">
      <ContinueBox next={started ? next : null} finished={started && !next} />

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s) => {
          const list = cardsOf(s.slug, cards);
          const count = list.filter((c) => done.has(cardUrl(c.slug))).length;
          // ยังไม่เริ่ม = ขั้น 1 (ตรงกับปุ่ม "เริ่มที่ขั้น 1") · เริ่มแล้ว = ขั้นของการ์ดที่ต้องอ่านต่อ
          const current = started ? next?.step === s.slug : s.slug === "problem";
          return (
            <li key={s.slug}>
              <Link
                href={stepUrl(s.slug)}
                aria-current={current ? "step" : undefined}
                className={`flex h-full flex-col gap-1.5 rounded-xl border p-4 transition-colors hover:bg-fd-accent ${current ? "border-fd-primary bg-fd-primary/5" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fd-primary text-sm font-semibold text-fd-primary-foreground tabular-nums">{s.num}</span>
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-sm text-fd-muted-foreground">· {s.th}</span>
                </span>
                <span className="text-sm text-fd-muted-foreground">ได้: {s.output}</span>
                <span className="mt-auto pt-1 text-xs font-medium tabular-nums text-fd-primary">
                  {list.length > 0 ? `การ์ด ${count} / ${list.length}` : "ยังเป็นบทเดิม (กำลังแปลงเป็นการ์ด)"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <Link href="/learn/cards" className="inline-flex min-h-11 items-center gap-1.5 self-start font-medium text-fd-primary hover:underline">
        เปิดคลังการ์ดทั้งหมด (ไม่ต้องอ่านเรียง ต้องใช้เรื่องไหนเปิดเรื่องนั้น)
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function ContinueBox({ next, finished }: { next: LearnCard | null; finished: boolean }) {
  const href = next ? cardUrl(next.slug) : stepUrl("problem");
  const label = finished ? "อ่านการ์ดที่มีครบแล้ว ทบทวนขั้น 1 อีกรอบ" : next ? `ทำต่อ: ${next.title}` : "เริ่มที่ขั้น 1 · Problem";
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-fd-primary px-5 py-3 font-semibold text-fd-primary-foreground hover:brightness-110"
    >
      {label}
      <ArrowRight className="size-5 shrink-0" />
    </Link>
  );
}
