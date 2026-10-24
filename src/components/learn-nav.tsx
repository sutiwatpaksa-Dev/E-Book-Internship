"use client";

import { BookOpen, Check, ChevronRight, LayoutGrid, Map } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cardUrl, cards, cardsOf, LEARN_BASE, legacyOf, steps, stepOfUrl, stepUrl } from "@/data/learn";
import { useProgress } from "@/hooks/use-progress";

// sidebar ของโครงใหม่ (/learn): แสดง 7 ขั้น กางเฉพาะขั้นที่เปิดอยู่ ไม่โชว์ทั้งเว็บ ~40 บทเหมือนเดิม
// น้องเห็นแค่ของที่ต้องใช้ตอนนี้ (ราว 10 รายการ) ลดอาการ "เนื้อหาเยอะจนหลง"
export function LearnNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { done } = useProgress();
  const current = stepOfUrl(pathname);
  const count = cards.filter((c) => done.has(cardUrl(c.slug))).length;

  return (
    <nav aria-label="7 ขั้นของการทำซอฟต์แวร์" className="flex flex-col gap-0.5 text-sm">
      <Link
        href={LEARN_BASE}
        onClick={onNavigate}
        aria-current={pathname === LEARN_BASE ? "page" : undefined}
        className={`flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 font-medium hover:bg-fd-accent ${pathname === LEARN_BASE ? "bg-fd-primary/10 text-fd-primary" : ""}`}
      >
        <Map className="size-4.5 text-fd-primary" />
        แผนที่ 7 ขั้น
        <span className="ms-auto text-xs font-normal tabular-nums text-fd-muted-foreground">
          {count}/{cards.length} การ์ด
        </span>
      </Link>

      {steps.map((s) => {
        const open = s.slug === current;
        const list = cardsOf(s.slug);
        return (
          <div key={s.slug} className="flex flex-col">
            <Link
              href={stepUrl(s.slug)}
              onClick={onNavigate}
              aria-current={pathname === stepUrl(s.slug) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2.5 rounded-lg px-2 hover:bg-fd-accent ${open ? "font-semibold" : ""}`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tabular-nums ${open ? "border-fd-primary bg-fd-primary text-fd-primary-foreground" : "border-fd-border text-fd-primary"}`}
              >
                {s.num}
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span>{s.name}</span>
                <span className="text-[11px] font-normal text-fd-muted-foreground">{s.th}</span>
              </span>
              <ChevronRight className={`size-3.5 shrink-0 text-fd-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
            </Link>

            {open && (
              <div className="mt-0.5 mb-2 ms-5.5 flex flex-col gap-px border-s border-fd-border ps-3">
                {list.map((c) => {
                  const url = cardUrl(c.slug);
                  const active = url === pathname;
                  const isDone = done.has(url);
                  return (
                    <Link
                      key={c.slug}
                      href={url}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-9 items-center gap-2 rounded-md px-2 py-1 hover:bg-fd-accent ${active ? "bg-fd-primary/10 font-semibold text-fd-primary" : ""}`}
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${isDone ? "border-fd-primary bg-fd-primary text-fd-primary-foreground" : "border-fd-border"}`}
                      >
                        {isDone && <Check aria-label="เข้าใจแล้ว" className="size-2.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">{c.title}</span>
                    </Link>
                  );
                })}
                {legacyOf(s.slug).map((l) => (
                  <Link key={l.link} href={l.link} onClick={onNavigate} className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1 text-fd-muted-foreground hover:bg-fd-accent">
                    <span className="rounded bg-fd-muted px-1 text-[10px]">เดิม</span>
                    <span className="min-w-0 flex-1 leading-snug">{l.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="mx-2 my-2.5 h-px bg-fd-border" />
      <Link href="/learn/cards" onClick={onNavigate} className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1 text-fd-muted-foreground hover:bg-fd-accent">
        <LayoutGrid className="size-4" />
        คลังการ์ด
      </Link>
      <Link href="/learn/cards#full" onClick={onNavigate} className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1 text-fd-muted-foreground hover:bg-fd-accent">
        <BookOpen className="size-4" />
        บทเรียนฉบับเต็ม (แบบเดิม)
      </Link>
    </nav>
  );
}
