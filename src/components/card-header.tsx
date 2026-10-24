import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { cardUrl, neighbors, stepBySlug, stepUrl, type LearnCard } from "@/data/learn";

// หัวการ์ด: อยู่ขั้นไหน › ช่วงไหน, เวลาอ่าน, และขั้นอื่นที่ใช้การ์ดนี้ด้วย
export function CardHeader({ card }: { card: LearnCard }) {
  const step = stepBySlug(card.step);
  return (
    <div className="not-prose flex flex-col gap-1.5 text-sm text-fd-muted-foreground">
      <nav aria-label="ตำแหน่งของการ์ด" className="flex flex-wrap items-center gap-1">
        <Link href="/learn" className="hover:text-fd-primary">
          7 ขั้น
        </Link>
        <span aria-hidden>›</span>
        <Link href={stepUrl(step.slug)} className="hover:text-fd-primary">
          {step.num} · {step.name}
        </Link>
        {card.part && (
          <>
            <span aria-hidden>›</span>
            <span>{card.part}</span>
          </>
        )}
      </nav>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> อ่านประมาณ {card.minutes} นาที
        </span>
        {card.alsoIn && <span>ใช้ในขั้น: {[card.step, ...card.alsoIn].map((s) => stepBySlug(s).name).join(", ")}</span>}
      </p>
    </div>
  );
}

// ปุ่มการ์ดก่อน/ถัดไปในขั้นเดียวกัน สุดทางแล้วพากลับหน้าขั้น
export function CardPager({ card }: { card: LearnCard }) {
  const { prev, next } = neighbors(card);
  const step = stepBySlug(card.step);
  const back = { href: stepUrl(step.slug), title: `กลับหน้าขั้น ${step.name}` };
  const left = prev ? { href: cardUrl(prev.slug), title: prev.title } : back;
  const right = next ? { href: cardUrl(next.slug), title: next.title } : back;
  return (
    <nav aria-label="การ์ดก่อนหน้าและถัดไป" className="not-prose mt-8 grid gap-3 sm:grid-cols-2">
      <Link href={left.href} className="flex min-h-14 items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-fd-accent">
        <ArrowLeft className="size-4 shrink-0" />
        <span>
          <span className="block text-xs text-fd-muted-foreground">ก่อนหน้า</span>
          {left.title}
        </span>
      </Link>
      <Link href={right.href} className="flex min-h-14 items-center justify-end gap-2 rounded-lg border px-4 py-2 text-right text-sm hover:bg-fd-accent">
        <span>
          <span className="block text-xs text-fd-muted-foreground">ถัดไป</span>
          {right.title}
        </span>
        <ArrowRight className="size-4 shrink-0" />
      </Link>
    </nav>
  );
}
