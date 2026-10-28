"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Check, ClipboardList, Database, LayoutTemplate, Lock, Monitor, Plug, Rocket, Search, ShieldCheck, TestTube, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cardUrl, mentorCardUrl, steps, topics, type LearnCard, type StepSlug, type TopicSlug } from "@/data/learn";
import { useCatalog } from "@/hooks/use-catalog";
import { useProgress } from "@/hooks/use-progress";
import { useSession } from "@/hooks/use-session";

// การ์ด 1 ใบในคลัง: การ์ดในโค้ด (ปรับตามหลังบ้านแล้ว) หรือการ์ดของพี่เลี้ยง (มี author)
type Item = Pick<LearnCard, "slug" | "title" | "step" | "topic" | "minutes" | "part" | "alsoIn"> & { href: string; author?: string };

// รวมการ์ดสองแหล่งเป็นรายการเดียว: ใบที่พี่เลี้ยงซ่อนไม่อยู่ในรายการ · การ์ดของพี่เลี้ยงต่อท้ายในหมวดเดียวกัน
function useLibraryItems(): Item[] {
  const { cards, mentorCards } = useCatalog();
  const builtIn = cards.map((c) => ({ ...c, href: cardUrl(c.slug) }));
  const mentor = mentorCards.map((m) => ({ slug: `m/${m.slug}`, title: m.title, step: m.step as StepSlug, topic: m.topic as TopicSlug, minutes: m.minutes, href: mentorCardUrl(m.slug), author: m.author }));
  return [...builtIn, ...mentor];
}

const topicIcon: Record<TopicSlug, LucideIcon> = { plan: ClipboardList, ux: LayoutTemplate, db: Database, api: Plug, auth: ShieldCheck, web: Monitor, test: TestTube, ops: Rocket };

// คลังการ์ด (/learn/cards): หยิบอ่านเรื่องที่ต้องใช้ ไม่ต้องเรียง
// กรอง 3 ทางพร้อมกัน: ชื่อการ์ด, ขั้น (ใช้ตอนไหน), หมวด (เรื่องอะไร) · ผลแบ่งหัวข้อตามหมวด
// หาในเนื้อหาทั้งเว็บ (เช่นวาง error) ใช้ช่องค้นหาของ Fumadocs · บทเรียนฉบับเต็มแบบเดิมอยู่ใน footer (footer-chapters.tsx)
export function CardLibrary() {
  const { done } = useProgress();
  const { role } = useSession();
  const all = useLibraryItems();
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<StepSlug | "all">("all");
  const [topic, setTopic] = useState<TopicSlug | "all">("all");
  const q = query.trim().toLowerCase();
  // ตัวเลขบนปุ่มหมวด นับจากชื่อและขั้นที่เลือกอยู่ กดแล้วจะได้จำนวนนั้นพอดี
  const inStep = all.filter((c) => (step === "all" || c.step === step || c.alsoIn?.includes(step)) && (!q || c.title.toLowerCase().includes(q)));
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
                  <CardTile key={c.slug} card={c} done={done.has(c.href)} locked={!!c.author && !role} />
                ))}
              </ul>
            </section>
          );
        })
      )}

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

function CardTile({ card: c, done, locked }: { card: Item; done: boolean; locked: boolean }) {
  const s = steps.find((x) => x.slug === c.step)!;
  return (
    <li>
      <Link href={c.href} className="flex h-full min-h-32 flex-col gap-1.5 rounded-xl border border-fd-border bg-fd-card p-4 hover:border-fd-primary/50 hover:bg-fd-accent">
        <span className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-fd-primary/10 px-2.5 py-0.5 font-semibold text-fd-primary">
              {s.name}
              {c.part ? ` › ${c.part}` : ""}
            </span>
            {c.author && <MentorBadge />}
          </span>
          {done && (
            <span className="inline-flex items-center gap-1 font-semibold text-fd-primary">
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
              เข้าใจแล้ว
            </span>
          )}
        </span>
        <span className="text-lg leading-snug font-bold">{c.title}</span>
        <span className="mt-auto inline-flex items-center gap-1 text-xs text-fd-muted-foreground tabular-nums">
          {/* การ์ดของพี่เลี้ยงอาจพูดถึงงานภายใน อ่านได้เมื่อ login (ชื่อการ์ดยังเห็น จะได้รู้ว่ามีเรื่องนี้) */}
          {locked && <Lock className="size-3.5" aria-hidden />}
          {locked ? `ต้อง login · ${c.minutes} นาที` : `${c.minutes} นาที`}
        </span>
      </Link>
    </li>
  );
}

// ป้ายบอกว่าการ์ดนี้พี่เลี้ยงเขียนจากหลังบ้าน (ไม่ใช่เนื้อหาหลักของคู่มือ) ใช้ทั้งในคลัง หน้าขั้น และหัวการ์ด
export function MentorBadge({ author }: { author?: string }) {
  return <span className="rounded-full bg-(--mentor-badge-bg) px-2.5 py-0.5 font-semibold text-(--mentor-badge-fg)">จากพี่เลี้ยง{author ? ` · ${author}` : ""}</span>;
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
