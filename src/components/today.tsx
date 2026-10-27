"use client";

import { ArrowRight, Check, FileText, LifeBuoy, LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authApi } from "@/api/auth.api";
import { cardUrl, cards, cardsOf, nextUp, steps, stepUrl, type LearnCard, type LearnStep } from "@/data/learn";
import { useProgress } from "@/hooks/use-progress";
import { useSession } from "@/hooks/use-session";

// หน้าแรกหลัง login (/today): น้องต้องรู้ภายใน 5 วินาทีว่าวันนี้ทำอะไรต่อ
// จัดเป็น bento: กล่องใหญ่ = สิ่งเดียวที่ควรทำต่อ · กล่องเล็กรอบๆ = ภาพรวม, โจทย์ของขั้น, ทางออกตอนติด
const box = "rounded-2xl border border-fd-border bg-fd-card p-5 sm:p-6";

export function Today() {
  const { done } = useProgress();
  const { role } = useSession();
  const username = useUsername(role);
  const up = nextUp(done);
  const count = cards.filter((c) => done.has(cardUrl(c.slug))).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{username ? `สวัสดี ${username}` : "สวัสดี"} วันนี้ทำต่อจากตรงนี้</h1>
        <p className="text-fd-muted-foreground">ทำซอฟต์แวร์ 1 ระบบให้ครบ 7 ขั้น ความรู้ที่ต้องใช้อยู่ในการ์ดใบละไม่เกิน 10 นาที</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <ContinueBox up={up} done={done} />
        {/* จอกว้าง: 2 กล่องนี้ซ้อนกันข้างกล่องใหญ่ (กล่องใหญ่สูง 2 แถว) */}
        <Overview count={count} role={role} />
        <Stuck role={role} />
        <StepStrip done={done} current={up.step} />
        <StarterTask step={up.step} />
        <UpNext done={done} skip={up.card} />
      </div>
    </div>
  );
}

// ชื่อผู้ใช้สำหรับคำทักทาย (มีแค่ตอน login อยู่) · ดึงผ่าน src/api ตามกติกาของเว็บ ไม่ fetch ใน component
function useUsername(role: string | null) {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    if (!role) return setName(null);
    authApi
      .me()
      .then((u) => setName(u.username))
      .catch(() => setName(null));
  }, [role]);
  return name;
}

function ContinueBox({ up, done }: { up: ReturnType<typeof nextUp>; done: ReadonlySet<string> }) {
  const { started, card, step } = up;
  const finished = started && !card;
  const reading = started && card ? card : null;
  const href = reading ? cardUrl(reading.slug) : stepUrl(step.slug);
  // การ์ดในช่วงเดียวกัน (เช่น DB ทั้ง 5 ใบ) ให้เห็นว่าใบนี้อยู่ตรงไหนของช่วง
  const inPart = reading ? cardsOf(reading.step).filter((c) => c.part === reading.part) : [];

  return (
    <section aria-labelledby="continue-title" className={`${box} flex flex-col gap-6 border-fd-primary/40 bg-fd-primary/5 lg:col-span-8 lg:row-span-2`}>
      <div className="flex flex-col gap-2">
        <span className="self-start rounded-full bg-fd-primary/10 px-3 py-1 text-sm font-semibold text-fd-primary">
          {finished ? "ครบทุกการ์ดที่มีแล้ว" : `ขั้น ${step.num} · ${step.name}${reading?.part ? ` › ${reading.part}` : ""}`}
        </span>
        <h2 id="continue-title" className="text-2xl leading-snug font-bold sm:text-3xl">
          {finished ? "ทบทวนขั้น 1 อีกรอบ" : reading ? `การ์ด: ${reading.title}` : `เริ่มที่ขั้น 1 · ${step.th}`}
        </h2>
        <p className="max-w-xl text-fd-muted-foreground">{reading ? `อ่านราว ${reading.minutes} นาที แล้วลองโจทย์ท้ายการ์ด` : `ขั้นนี้ต้องได้: ${step.output}`}</p>
      </div>

      {reading && inPart.length > 1 ? (
        <ol aria-label={`การ์ดในช่วง ${reading.part}`} className="flex flex-col gap-1">
          {inPart.map((c, i) => {
            const isDone = done.has(cardUrl(c.slug));
            const now = c === reading;
            return (
              <li key={c.slug} className={`flex min-h-10 items-center gap-3 rounded-lg px-2 ${now ? "bg-fd-primary/10 font-semibold" : ""}`}>
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${isDone || now ? "bg-fd-primary text-fd-primary-foreground" : "border border-fd-border text-fd-muted-foreground"}`}
                >
                  {isDone ? <Check aria-label="เข้าใจแล้ว" className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={isDone ? "text-fd-muted-foreground" : ""}>{c.title}</span>
                {now && <span className="ms-auto text-xs text-fd-primary">อยู่ตรงนี้</span>}
              </li>
            );
          })}
        </ol>
      ) : !started ? (
        <ol aria-label="ใช้คู่มือนี้ยังไง" className="grid gap-3 sm:grid-cols-3">
          {[
            ["เปิดหน้าขั้น", "อ่านไม่เกิน 5 นาที รู้ว่าขั้นนี้ต้องได้อะไร"],
            ["เปิดการ์ดตอนต้องใช้", "ใบละ 1 เรื่อง ไม่ต้องอ่านทั้งเล่มก่อน"],
            ["ลองเองก่อนดูคำใบ้", "ไม่มีเฉลยเต็ม คำใบ้เปิดทีละระดับ"],
          ].map(([title, text], i) => (
            <li key={title} className="flex flex-col gap-1 rounded-xl bg-fd-background/70 p-3">
              <span className="text-xs font-bold text-fd-primary tabular-nums">{i + 1}</span>
              <span className="font-semibold">{title}</span>
              <span className="text-sm text-fd-muted-foreground">{text}</span>
            </li>
          ))}
        </ol>
      ) : null}

      <Link
        href={href}
        className="mt-auto inline-flex min-h-13 items-center justify-center gap-2 self-end rounded-xl bg-fd-primary px-7 text-lg font-semibold text-fd-primary-foreground hover:opacity-90 max-sm:self-stretch"
      >
        {reading ? "อ่านต่อ" : "เริ่มเลย"}
        <ArrowRight className="size-5" />
      </Link>
    </section>
  );
}

function Overview({ count, role }: { count: number; role: string | null }) {
  const pct = Math.round((count / cards.length) * 100);
  return (
    <section aria-labelledby="overview-title" className={`${box} flex flex-col gap-3 lg:col-span-4`}>
      <h2 id="overview-title" className="text-sm font-semibold text-fd-muted-foreground">
        ความคืบหน้า
      </h2>
      <p className="flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums">{count}</span>
        <span className="text-fd-muted-foreground">จาก {cards.length} การ์ดที่เข้าใจแล้ว</span>
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-fd-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="ความคืบหน้าการ์ด">
        <div className="h-full rounded-full bg-fd-primary" style={{ width: `${pct}%` }} />
      </div>
      {!role && (
        <Link href="/login?next=/today" className="mt-auto inline-flex min-h-11 items-center gap-2 text-sm font-medium text-fd-primary hover:underline">
          <LogIn className="size-4" />
          login เพื่อเก็บความคืบหน้าข้ามเครื่อง
        </Link>
      )}
    </section>
  );
}

function Stuck({ role }: { role: string | null }) {
  return (
    <section aria-labelledby="stuck-title" className={`${box} flex flex-col gap-3 lg:col-span-4`}>
      <h2 id="stuck-title" className="flex items-center gap-2 font-semibold">
        <LifeBuoy className="size-5 text-fd-primary" />
        ติดอยู่?
      </h2>
      <ol className="list-decimal space-y-1 ps-5 text-sm text-fd-muted-foreground">
        <li>อ่าน error บรรทัดแรกให้จบ</li>
        <li>วาง error ในช่องค้นหาด้านบน</li>
        <li>เปิดคำใบ้ของโจทย์ทีละระดับ</li>
      </ol>
      <Link
        href={role ? "/questions" : "/login?next=/questions"}
        className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl border border-fd-border px-4 text-sm font-semibold hover:bg-fd-accent"
      >
        ยังไม่หลุด ถามพี่เลี้ยง
      </Link>
    </section>
  );
}

// แถบ 7 ขั้น: ขั้นปัจจุบันเด่น ขั้นที่การ์ดครบมีเครื่องหมายถูก (ขั้นที่ยังไม่มีการ์ดไม่นับว่าครบ)
function StepStrip({ done, current }: { done: ReadonlySet<string>; current: LearnStep }) {
  return (
    <section aria-labelledby="steps-title" className="flex flex-col gap-3 lg:col-span-12">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="steps-title" className="font-semibold">
          เส้นทาง 7 ขั้น
        </h2>
        <Link href="/learn" className="text-sm font-medium text-fd-primary hover:underline">
          ดูแผนที่ทั้งหมด
        </Link>
      </div>
      <ol className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-7">
        {steps.map((s) => {
          const list = cardsOf(s.slug);
          const complete = list.length > 0 && list.every((c) => done.has(cardUrl(c.slug)));
          const now = s.slug === current.slug;
          return (
            <li key={s.slug} className="w-32 shrink-0 snap-start sm:w-auto">
              <Link
                href={stepUrl(s.slug)}
                aria-current={now ? "step" : undefined}
                className={`flex h-full min-h-22 flex-col gap-1 rounded-xl border p-3 transition-colors hover:bg-fd-accent ${now ? "border-2 border-fd-primary bg-fd-primary/5" : "border-fd-border bg-fd-card"}`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${complete ? "bg-fd-primary text-fd-primary-foreground" : now ? "bg-fd-primary text-fd-primary-foreground" : "bg-fd-muted text-fd-muted-foreground"}`}
                >
                  {complete ? <Check aria-label="ครบแล้ว" className="size-4" strokeWidth={3} /> : s.num}
                </span>
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="text-xs text-fd-muted-foreground">{s.th}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StarterTask({ step }: { step: LearnStep }) {
  return (
    <section aria-labelledby="task-title" className={`${box} flex flex-col gap-3 lg:col-span-7`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="task-title" className="font-semibold">
          โจทย์ STARTER ของขั้น {step.name}
        </h2>
        <span className="text-xs text-fd-muted-foreground">ไม่มีเฉลย มีคำใบ้ทีละระดับ</span>
      </div>
      <p>{step.task}</p>
      <div className="mt-auto flex flex-wrap gap-2">
        <Link href={stepUrl(step.slug)} className="inline-flex min-h-11 items-center rounded-xl bg-fd-primary px-4 text-sm font-semibold text-fd-primary-foreground hover:opacity-90">
          เปิดโจทย์เต็ม
        </Link>
        <Link href="/starter" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-fd-border px-4 text-sm font-semibold hover:bg-fd-accent">
          <FileText className="size-4" />
          Requirement STARTER
        </Link>
      </div>
    </section>
  );
}

// การ์ดถัดจากใบที่ทำต่อ (ไม่ซ้ำกับกล่องใหญ่) · อ่านจบครบแล้วชวนไปคลังการ์ด
function UpNext({ done, skip }: { done: ReadonlySet<string>; skip: LearnCard | null }) {
  const list = cards.filter((c) => c !== skip && !done.has(cardUrl(c.slug))).slice(0, 3);
  return (
    <section aria-labelledby="next-title" className={`${box} flex flex-col gap-3 lg:col-span-5`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="next-title" className="font-semibold">
          การ์ดถัดไป
        </h2>
        <Link href="/learn/cards" className="text-sm font-medium text-fd-primary hover:underline">
          คลังการ์ด
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-fd-muted-foreground">ไม่มีการ์ดค้างแล้ว การ์ดของขั้นอื่นกำลังทยอยเพิ่ม ระหว่างนี้อ่านบทเรียนฉบับเต็มท้ายหน้าได้</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {list.map((c) => (
            <li key={c.slug}>
              <Link href={cardUrl(c.slug)} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 hover:bg-fd-accent">
                <span className="font-medium">{c.title}</span>
                <span className="shrink-0 text-xs text-fd-muted-foreground tabular-nums">{c.minutes} นาที</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
