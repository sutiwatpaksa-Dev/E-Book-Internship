"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cardUrl, neighbors, stepBySlug, stepUrl, type LearnCard } from "@/data/learn";
import { useCatalog } from "@/hooks/use-catalog";

// ปุ่มการ์ดก่อน/ถัดไปในขั้นเดียวกัน สุดทางแล้วพากลับหน้าขั้น
// เป็น client component เพราะต้องข้ามใบที่พี่เลี้ยงซ่อน และใช้ชื่อที่ปรับแล้ว (ค่าจากหลังบ้านมาตอนเปิดหน้า)
export function CardPager({ card }: { card: LearnCard }) {
  const { cards } = useCatalog();
  const { prev, next } = neighbors(card, cards);
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
