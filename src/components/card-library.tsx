"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Check, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cardUrl, cards, steps, type StepSlug } from "@/data/learn";
import { useProgress } from "@/hooks/use-progress";
import { useSite } from "./nav-provider";

// คลังการ์ด (/learn/cards): หยิบอ่านเรื่องที่ต้องใช้ ไม่ต้องเรียง
// กรองชื่อการ์ดได้ทันทีในหน้านี้ · หาในเนื้อหาทั้งเว็บ (เช่นวาง error) ใช้ช่องค้นหาของ Fumadocs
// ท้ายหน้าเก็บบทเรียนฉบับเต็มแบบเดิมไว้ ใช้ตอนอยากรู้ลึก
export function CardLibrary() {
  const { done } = useProgress();
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<StepSlug | "all">("all");
  const q = query.trim().toLowerCase();
  const list = cards.filter((c) => (step === "all" || c.step === step || c.alsoIn?.includes(step)) && (!q || c.title.toLowerCase().includes(q)));

  return (
    <div className="not-prose my-6 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="flex min-h-13 items-center gap-3 rounded-xl border-2 border-fd-primary bg-fd-background px-4 focus-within:ring-4 focus-within:ring-fd-primary/25">
          <Search className="size-5 text-fd-primary" aria-hidden />
          <span className="sr-only">กรองการ์ดตามชื่อ</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="พิมพ์ชื่อเรื่อง เช่น migration, drizzle"
            className="min-w-0 flex-1 bg-transparent text-base outline-none"
          />
        </label>
        <FullSearchHint />
      </div>

      <div role="group" aria-label="กรองตามขั้น" className="flex flex-wrap gap-2">
        {[{ slug: "all" as const, label: "ทั้งหมด" }, ...steps.map((s) => ({ slug: s.slug, label: `${s.num} ${s.name}` }))].map((f) => {
          const on = f.slug === step;
          return (
            <button
              key={f.slug}
              type="button"
              aria-pressed={on}
              onClick={() => setStep(f.slug)}
              className={`min-h-11 rounded-full border px-4 text-sm font-medium ${on ? "border-fd-primary bg-fd-primary text-fd-primary-foreground" : "border-fd-border hover:bg-fd-accent"}`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-fd-muted-foreground" aria-live="polite">
        {list.length} การ์ด
      </p>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-fd-border p-6 text-center text-fd-muted-foreground">
          {q ? `ยังไม่มีการ์ดชื่อ "${query.trim()}" ลองค้นในเนื้อหาทั้งเว็บด้วยปุ่มด้านบน` : "ขั้นนี้ยังไม่มีการ์ด กำลังทยอยเพิ่ม ระหว่างนี้ดูบทเรียนฉบับเต็มด้านล่าง"}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const s = steps.find((x) => x.slug === c.step)!;
            const isDone = done.has(cardUrl(c.slug));
            return (
              <li key={c.slug}>
                <Link href={cardUrl(c.slug)} className="flex h-full min-h-32 flex-col gap-1.5 rounded-xl border border-fd-border bg-fd-card p-4 hover:border-fd-primary/50 hover:bg-fd-accent">
                  <span className="flex items-center justify-between gap-2 text-xs">
                    <span className="rounded-full bg-fd-primary/10 px-2.5 py-0.5 font-semibold text-fd-primary">
                      {s.name}
                      {c.part ? ` › ${c.part}` : ""}
                    </span>
                    {isDone && (
                      <span className="inline-flex items-center gap-1 font-semibold text-fd-primary">
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                        เข้าใจแล้ว
                      </span>
                    )}
                  </span>
                  <span className="text-lg leading-snug font-bold">{c.title}</span>
                  <span className="mt-auto text-xs text-fd-muted-foreground tabular-nums">{c.minutes} นาที</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <FullChapters />
    </div>
  );
}

function FullSearchHint() {
  const { enabled, setOpenSearch } = useSearchContext();
  if (!enabled) return null;
  return (
    <button type="button" onClick={() => setOpenSearch(true)} className="inline-flex min-h-11 items-center self-start text-sm font-medium text-fd-primary hover:underline">
      ค้นในเนื้อหาทั้งเว็บ (วาง error ที่เจอได้)
    </button>
  );
}

// บทเรียนฉบับเต็มแบบเดิม จัดตามด่านเดิม · ไม่นับด่าน Mini Project (อยู่ที่เมนูโปรเจกต์แล้ว)
function FullChapters() {
  const { nav } = useSite();
  return (
    <section id="full" aria-labelledby="full-title" className="mt-6 flex scroll-mt-24 flex-col gap-3 border-t border-fd-border pt-6">
      <div>
        <h2 id="full-title" className="text-lg font-semibold">
          บทเรียนฉบับเต็ม
        </h2>
        <p className="text-sm text-fd-muted-foreground">บทยาวแบบเดิม ใช้ตอนอยากรู้ลึก ไม่จำเป็นต่อโจทย์ การ์ดแต่ละใบมีลิงก์มาที่บทที่เกี่ยวข้องอยู่แล้ว</p>
      </div>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {nav.stages
          .filter((s) => !s.items.some((i) => i.url.startsWith("/starter")))
          .map((s) => (
            <div key={s.id} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-fd-muted-foreground">
                {s.kicker} · {s.name}
              </span>
              {s.items.map((i) => (
                <Link key={i.url} href={i.url} className="flex min-h-9 items-center text-sm hover:text-fd-primary hover:underline">
                  {i.num ? `${i.num.replace(/^0(?=\d)/, "")}. ` : ""}
                  {i.title}
                </Link>
              ))}
            </div>
          ))}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-fd-muted-foreground">อ้างอิง</span>
          {nav.refs.map((r) => (
            <Link key={r.url} href={r.url} className="flex min-h-9 items-center text-sm hover:text-fd-primary hover:underline">
              {r.title}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
