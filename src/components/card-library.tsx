"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Check, ClipboardList, Database, LayoutTemplate, Monitor, Plug, Search, ShieldCheck, TestTube, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cardUrl, cards, steps, topics, type LearnCard, type StepSlug, type TopicSlug } from "@/data/learn";
import { useProgress } from "@/hooks/use-progress";
import { useSite } from "./nav-provider";

const topicIcon: Record<TopicSlug, LucideIcon> = { plan: ClipboardList, ux: LayoutTemplate, db: Database, api: Plug, auth: ShieldCheck, web: Monitor, test: TestTube };

// คลังการ์ด (/learn/cards): หยิบอ่านเรื่องที่ต้องใช้ ไม่ต้องเรียง
// กรอง 3 ทางพร้อมกัน: ชื่อการ์ด, ขั้น (ใช้ตอนไหน), หมวด (เรื่องอะไร) · ผลแบ่งหัวข้อตามหมวด
// หาในเนื้อหาทั้งเว็บ (เช่นวาง error) ใช้ช่องค้นหาของ Fumadocs · ท้ายหน้าเก็บบทเรียนฉบับเต็มแบบเดิมไว้
export function CardLibrary() {
  const { done } = useProgress();
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<StepSlug | "all">("all");
  const [topic, setTopic] = useState<TopicSlug | "all">("all");
  const q = query.trim().toLowerCase();
  // ตัวเลขบนปุ่มหมวด นับจากชื่อและขั้นที่เลือกอยู่ กดแล้วจะได้จำนวนนั้นพอดี
  const inStep = cards.filter((c) => (step === "all" || c.step === step || c.alsoIn?.includes(step)) && (!q || c.title.toLowerCase().includes(q)));
  const list = inStep.filter((c) => topic === "all" || c.topic === topic);
  const groups = topics.map((t) => ({ ...t, cards: list.filter((c) => c.topic === t.slug) })).filter((g) => g.cards.length > 0);

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

      <FilterRow label="ขั้น">
        {[{ slug: "all" as const, label: "ทั้งหมด" }, ...steps.map((s) => ({ slug: s.slug, label: `${s.num} ${s.name}` }))].map((f) => (
          <Chip key={f.slug} on={f.slug === step} onClick={() => setStep(f.slug)}>
            {f.label}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label="หมวด">
        <Chip on={topic === "all"} onClick={() => setTopic("all")}>
          ทั้งหมด
        </Chip>
        {topics.map((t) => {
          const Icon = topicIcon[t.slug];
          const n = inStep.filter((c) => c.topic === t.slug).length;
          return (
            <Chip key={t.slug} on={t.slug === topic} dim={n === 0} onClick={() => setTopic(t.slug)}>
              <Icon className="size-4" aria-hidden />
              {t.name}
              <span className="tabular-nums opacity-70">{n}</span>
            </Chip>
          );
        })}
      </FilterRow>

      <p className="text-sm text-fd-muted-foreground" aria-live="polite">
        {list.length} การ์ด
      </p>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-fd-border p-6 text-center text-fd-muted-foreground">
          {q ? `ยังไม่มีการ์ดชื่อ "${query.trim()}" ลองค้นในเนื้อหาทั้งเว็บด้วยปุ่มด้านบน` : "ยังไม่มีการ์ดตรงกับที่เลือก กำลังทยอยเพิ่ม ระหว่างนี้ดูบทเรียนฉบับเต็มด้านล่าง"}
        </p>
      ) : (
        groups.map((g) => {
          const Icon = topicIcon[g.slug];
          return (
            <section key={g.slug} aria-labelledby={`topic-${g.slug}`} className="flex flex-col gap-3">
              <h2 id={`topic-${g.slug}`} className="flex items-center gap-2 text-base font-semibold">
                <Icon className="size-5 text-fd-primary" aria-hidden />
                {g.name}
                <span className="text-sm font-normal text-fd-muted-foreground tabular-nums">{g.cards.length}</span>
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.cards.map((c) => (
                  <CardTile key={c.slug} card={c} done={done.has(cardUrl(c.slug))} />
                ))}
              </ul>
            </section>
          );
        })
      )}

      <FullChapters />
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={`กรองตาม${label}`} className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-fd-muted-foreground">{label}</span>
      {/* มือถือเลื่อนแนวนอนแถวเดียว ไม่ดันการ์ดลงไปไกล · จอกว้างขึ้นตัดบรรทัดตามปกติ */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">{children}</div>
    </div>
  );
}

function Chip({ on, dim = false, onClick, children }: { on: boolean; dim?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap ${on ? "border-fd-primary bg-fd-primary text-fd-primary-foreground" : `border-fd-border hover:bg-fd-accent ${dim ? "text-fd-muted-foreground" : ""}`}`}
    >
      {children}
    </button>
  );
}

function CardTile({ card: c, done }: { card: LearnCard; done: boolean }) {
  const s = steps.find((x) => x.slug === c.step)!;
  return (
    <li>
      <Link href={cardUrl(c.slug)} className="flex h-full min-h-32 flex-col gap-1.5 rounded-xl border border-fd-border bg-fd-card p-4 hover:border-fd-primary/50 hover:bg-fd-accent">
        <span className="flex items-center justify-between gap-2 text-xs">
          <span className="rounded-full bg-fd-primary/10 px-2.5 py-0.5 font-semibold text-fd-primary">
            {s.name}
            {c.part ? ` › ${c.part}` : ""}
          </span>
          {done && (
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
