"use client";

import { BookOpen, Check, ChevronRight, LayoutGrid, Map } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef } from "react";
import { cardUrl, cardsOf, LEARN_BASE, legacyOf, mentorCardUrl, steps, stepOfUrl, stepUrl } from "@/data/learn";
import { useCatalog } from "@/hooks/use-catalog";
import { useProgress } from "@/hooks/use-progress";

// sidebar ของโครงใหม่ (/learn): แสดง 7 ขั้น กางเฉพาะขั้นที่เปิดอยู่ ไม่โชว์ทั้งเว็บ ~40 บทเหมือนเดิม
// น้องเห็นแค่ของที่ต้องใช้ตอนนี้ (ราว 10 รายการ) ลดอาการ "เนื้อหาเยอะจนหลง"
// รายการการ์ดมาจาก useCatalog: ใบที่พี่เลี้ยงซ่อนไม่ขึ้น, ชื่อที่ปรับแล้วขึ้นชื่อใหม่, การ์ดของพี่เลี้ยงต่อท้ายขั้นของมัน
export function LearnNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { done, ready } = useProgress();
  const { cards, mentorCards, mentorStepOf } = useCatalog();
  const nav = useRef<HTMLElement>(null);
  // ขั้นที่กางยาว: เลื่อนรายการในเมนูให้บทที่อ่านอยู่โผล่มาให้เห็น (nearest = ไม่ขยับหน้าถ้าเห็นอยู่แล้ว)
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }, [pathname]);
  const current = stepOfUrl(pathname) ?? mentorStepOf(pathname);
  const count = cards.filter((c) => done.has(cardUrl(c.slug))).length;

  return (
    <nav ref={nav} aria-label="7 ขั้นของการทำซอฟต์แวร์" className="flex flex-col gap-0.5 text-sm">
      <Link
        href={LEARN_BASE}
        onClick={onNavigate}
        aria-current={pathname === LEARN_BASE ? "page" : undefined}
        className={`flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 font-medium hover:bg-fd-accent ${pathname === LEARN_BASE ? "bg-fd-primary/10 text-fd-primary" : ""}`}
      >
        <Map className="size-4.5 text-fd-primary" />
        แผนที่ 7 ขั้น
        <span className="ms-auto text-[13px] font-normal tabular-nums text-fd-muted-foreground">
          {ready ? `${count}/${cards.length} การ์ด` : <span aria-label="กำลังโหลด" className="inline-block h-3.5 w-12 animate-pulse rounded bg-fd-muted" />}
        </span>
      </Link>

      {steps.map((s) => {
        const open = s.slug === current;
        const list = cardsOf(s.slug, cards);
        const mine = mentorCards.filter((m) => m.step === s.slug);
        return (
          <div key={s.slug} className="flex flex-col">
            <Link
              href={stepUrl(s.slug)}
              onClick={onNavigate}
              aria-current={pathname === stepUrl(s.slug) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2.5 rounded-lg px-2 hover:bg-fd-accent ${open ? "font-semibold" : ""}`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-md border text-[13px] font-semibold tabular-nums ${open ? "border-fd-primary bg-fd-primary text-fd-primary-foreground" : "border-fd-border text-fd-primary"}`}
              >
                {s.num}
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span>{s.name}</span>
                <span className="text-[13px] font-normal text-fd-muted-foreground">{s.th}</span>
              </span>
              <ChevronRight className={`size-3.5 shrink-0 text-fd-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
            </Link>

            {open && (
              <div className="mt-0.5 mb-2 ms-5.5 flex flex-col gap-px border-s border-fd-border ps-3">
                {/* ขั้นที่มีช่วงย่อย เรียงตามช่วง (การ์ดก่อน บทเดิมตาม) ให้ตรงกับแท็บในหน้าขั้น */}
                {(s.parts ?? [undefined]).map((part) => (
                  <Fragment key={part ?? "all"}>
                    {list
                      .filter((c) => c.part === part)
                      .map((c) => {
                        const url = cardUrl(c.slug);
                        return <NavCard key={c.slug} href={url} title={c.title} active={url === pathname} done={done.has(url)} onNavigate={onNavigate} />;
                      })}
                    {legacyOf(s.slug).filter((l) => l.part === part).map((l) => (
                      <Link key={l.link} href={l.link} onClick={onNavigate} className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1 text-fd-muted-foreground hover:bg-fd-accent">
                        <span className="rounded bg-fd-muted px-1 text-[13px]">เดิม</span>
                        <span className="min-w-0 flex-1 leading-snug">{l.title}</span>
                      </Link>
                    ))}
                  </Fragment>
                ))}
                {mine.map((m) => {
                  const url = mentorCardUrl(m.slug);
                  return (
                    <NavCard key={url} href={url} title={m.title} active={url === pathname} done={done.has(url)} onNavigate={onNavigate} mentor />
                  );
                })}
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
      <Link href="#full" onClick={onNavigate} className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1 text-fd-muted-foreground hover:bg-fd-accent">
        <BookOpen className="size-4" />
        บทเรียนฉบับเต็ม (แบบเดิม)
      </Link>
    </nav>
  );
}

function NavCard({ href, title, active, done, mentor = false, onNavigate }: { href: string; title: string; active: boolean; done: boolean; mentor?: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-9 items-center gap-2 rounded-md px-2 py-1 hover:bg-fd-accent ${active ? "bg-fd-primary/10 font-semibold text-fd-primary" : ""}`}
    >
      <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${done ? "border-fd-primary bg-fd-primary text-fd-primary-foreground" : "border-fd-border"}`}>
        {done && <Check aria-label="เข้าใจแล้ว" className="size-2.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 leading-snug">{title}</span>
      {/* ป้ายเล็กแทน MentorBadge เต็ม: sidebar แคบ ใช้สีเดียวกันให้จำได้ว่าเป็นการ์ดจากพี่เลี้ยง */}
      {mentor && <span className="shrink-0 rounded bg-(--mentor-badge-bg) px-1 text-[13px] font-semibold text-(--mentor-badge-fg)">พี่เลี้ยง</span>}
    </Link>
  );
}
