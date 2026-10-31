"use client";

import { ArrowRight, CalendarDays, Check, FileText, FolderGit2, LifeBuoy, LogIn, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authApi } from "@/api/auth.api";
import { progressApi } from "@/api/progress.api";
import { cardUrl, cardsOf, nextUp, steps, stepUrl, type LearnCard, type LearnStep } from "@/data/learn";
import { useCatalog } from "@/hooks/use-catalog";
import { useProgress } from "@/hooks/use-progress";
import { useSession } from "@/hooks/use-session";
import { useMyWork, type Cohort, type Work } from "@/hooks/use-my-work";
import { useUnread } from "@/hooks/use-unread";
import { dailyCounts, shortDay } from "@/lib/admin-stats";
import { COHORT_STATUS_LABEL, cohortDay, cohortRange, cohortStatus, thaiDayMonth } from "@/lib/cohort";
import { buildPlan, dueLabel, nextWork, type PlanItem } from "@/lib/work-plan";
import type { ProgressEntry } from "@/types";
import { ChartCard, ColumnChart, Figure } from "./admin-charts";
import { AnnouncementBanner } from "./announcement-banner";
import { WorkBadge } from "./status-badge";
import { taskHref } from "./work-board";

// หน้าแรกของน้อง (/dashboard): ภาพรวมงานและความคืบหน้า ไม่ใช่หน้าเรียน
// น้องต้องรู้ภายใน 5 วินาทีว่า ฉันอยู่ตรงไหน / ต้องส่งอะไรเมื่อไร / พี่เลี้ยงมีอะไรบอก · คู่มือเนื้อหาอยู่ท้ายหน้าเป็นตัวเลือกเสริม
const box = "rounded-2xl border border-fd-border bg-fd-card p-5 sm:p-6";
const SUBMIT_LINK = "/starter/submission#ส่งงานของคุณ";

export function Dashboard() {
  const { done, ready } = useProgress();
  const { role } = useSession();
  const username = useUsername(role);
  // นับและเลือกการ์ดจากรายการที่ผ่านหลังบ้านแล้ว: ใบที่ซ่อนไม่ถูกเลือกเป็น "ทำต่อ" และไม่นับในตัวหาร
  const { cards } = useCatalog();
  const up = nextUp(done, cards);
  const count = cards.filter((c) => done.has(cardUrl(c.slug))).length;
  const work = useMyWork(role);
  // render แรกบน server/ตอน hydrate ยังไม่รู้ว่า login อยู่ไหม: อย่าเพิ่งโชว์ "login เพื่อดูงาน"
  const mounted = useMounted();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{username ? `สวัสดี ${username}` : "สวัสดี"}</h1>
        <p className="text-fd-muted-foreground">{work.cohort ? cohortLine(work.cohort) : role === "intern" ? "ภาพรวมงานและความคืบหน้าฝึกงานของคุณ" : "ภาพรวมการเรียนรู้"}</p>
      </header>

      <AnnouncementBanner />

      {role === "intern" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <MyTasks work={work} />
          <div className="flex flex-col gap-4 lg:col-span-4">
            <Where count={ready ? count : null} total={cards.length} step={up.step} cohort={work.cohort} />
            <FromMentor work={work} />
            <Schedule work={work} />
          </div>
          <MyCharts done={done} cards={cards} />
        </div>
      )}
      {role === "dev" && (
        <section className={`${box} flex flex-wrap items-center justify-between gap-3`}>
          <p>บัญชีพี่เลี้ยงดูภาพรวมของน้องทุกคนที่หลังบ้าน</p>
          <Link href="/dev/admin" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-fd-primary px-4 text-sm font-semibold text-fd-primary-foreground hover:brightness-110">
            ไปหลังบ้าน <ArrowRight className="size-4" />
          </Link>
        </section>
      )}
      {mounted && !role && (
        <section className={`${box} flex flex-wrap items-center justify-between gap-3`}>
          <p>login เพื่อดูงานที่ต้องส่ง กำหนดส่ง ผลตรวจ และเก็บความคืบหน้าข้ามเครื่อง</p>
          <Link href="/login?next=/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-fd-primary px-4 text-sm font-semibold text-fd-primary-foreground hover:brightness-110">
            <LogIn className="size-4" /> เข้าสู่ระบบ
          </Link>
        </section>
      )}

      {/* คู่มือเนื้อหาเป็นตัวเลือกเสริม: อ่านเมื่ออยากรู้เพิ่ม ไม่บังคับลำดับ */}
      <section aria-labelledby="manual-title" className="flex flex-col gap-4 border-t border-fd-border pt-6">
        <div className="flex flex-col gap-1">
          <h2 id="manual-title" className="text-xl font-bold">
            คู่มือเนื้อหา
          </h2>
          <p className="text-fd-muted-foreground">ตัวเลือกเสริมเมื่ออยากหาความรู้เอง ค้นหาจากช่องค้นหาด้านบนได้ทุกหน้า หรือเปิดอ่านต่อจากที่ค้างไว้</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <ContinueBox up={up} done={done} cards={cards} />
          <Stuck role={role} />
          <UpNext done={done} skip={up.card} cards={cards} />
          <StepStrip done={done} current={up.step} cards={cards} />
          <StarterTask step={up.step} />
        </div>
      </section>
    </div>
  );
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
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

function ContinueBox({ up, done, cards }: { up: ReturnType<typeof nextUp>; done: ReadonlySet<string>; cards: readonly LearnCard[] }) {
  const { started, card, step } = up;
  const finished = started && !card;
  const reading = started && card ? card : null;
  const href = reading ? cardUrl(reading.slug) : stepUrl(step.slug);
  // การ์ดในช่วงเดียวกัน (เช่น DB ทั้ง 5 ใบ) ให้เห็นว่าใบนี้อยู่ตรงไหนของช่วง
  const inPart = reading ? cardsOf(reading.step, cards).filter((c) => c.part === reading.part) : [];

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
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${isDone || now ? "bg-fd-primary text-fd-primary-foreground" : "border border-fd-border text-fd-muted-foreground"}`}
                >
                  {isDone ? <Check aria-label="เข้าใจแล้ว" className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={isDone ? "text-fd-muted-foreground" : ""}>{c.title}</span>
                {now && <span className="ms-auto text-sm text-fd-primary">อยู่ตรงนี้</span>}
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
              <span className="text-sm font-bold text-fd-primary tabular-nums">{i + 1}</span>
              <span className="font-semibold">{title}</span>
              <span className="text-sm text-fd-muted-foreground">{text}</span>
            </li>
          ))}
        </ol>
      ) : null}

      <Link
        href={href}
        className="mt-auto inline-flex min-h-13 items-center justify-center gap-2 self-end rounded-xl bg-fd-primary px-7 text-lg font-semibold text-fd-primary-foreground hover:brightness-110 max-sm:self-stretch"
      >
        {reading ? "อ่านต่อ" : "เริ่มเลย"}
        <ArrowRight className="size-5" />
      </Link>
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
function StepStrip({ done, current, cards }: { done: ReadonlySet<string>; current: LearnStep; cards: readonly LearnCard[] }) {
  return (
    <section aria-labelledby="steps-title" className="flex flex-col gap-3 lg:col-span-12">
      <div className="flex items-center justify-between gap-3">
        <h2 id="steps-title" className="font-semibold">
          เส้นทาง 7 ขั้น
        </h2>
        <Link href="/learn" className="inline-flex min-h-11 items-center text-sm font-medium text-fd-primary hover:underline">
          ดูแผนที่ทั้งหมด
        </Link>
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {steps.map((s) => {
          const list = cardsOf(s.slug, cards);
          const complete = list.length > 0 && list.every((c) => done.has(cardUrl(c.slug)));
          const now = s.slug === current.slug;
          return (
            <li key={s.slug}>
              <Link
                href={stepUrl(s.slug)}
                aria-current={now ? "step" : undefined}
                className={`flex h-full min-h-22 flex-col gap-1 rounded-xl border p-3 transition-colors hover:bg-fd-accent ${now ? "border-2 border-fd-primary bg-fd-primary/5" : "border-fd-border bg-fd-card"}`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-sm font-bold tabular-nums ${complete ? "bg-fd-primary text-fd-primary-foreground" : now ? "bg-fd-primary text-fd-primary-foreground" : "bg-fd-muted text-fd-muted-foreground"}`}
                >
                  {complete ? <Check aria-label="ครบแล้ว" className="size-4" strokeWidth={3} /> : s.num}
                </span>
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="text-sm text-fd-muted-foreground">{s.th}</span>
                <span className="mt-auto text-sm tabular-nums text-fd-muted-foreground">{list.length === 0 ? "ยังไม่มีการ์ด" : `${list.filter((c) => done.has(cardUrl(c.slug))).length}/${list.length} ใบ`}</span>
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
    <section aria-labelledby="task-title" className={`${box} flex flex-col gap-3 lg:col-span-12`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="task-title" className="font-semibold">
          โจทย์ฝึกงานของขั้น {step.name}
        </h2>
        <span className="text-sm text-fd-muted-foreground">ไม่มีเฉลย มีคำใบ้ทีละระดับ</span>
      </div>
      <p>{step.task}</p>
      <div className="mt-auto flex flex-wrap gap-2">
        <Link href={stepUrl(step.slug)} className="inline-flex min-h-11 items-center rounded-xl bg-fd-primary px-4 text-sm font-semibold text-fd-primary-foreground hover:brightness-110">
          เปิดโจทย์เต็ม
        </Link>
        <Link href="/starter" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-fd-border px-4 text-sm font-semibold hover:bg-fd-accent">
          <FileText className="size-4" />
          Requirement ของโจทย์
        </Link>
      </div>
    </section>
  );
}

// การ์ดถัดจากใบที่ทำต่อ (ไม่ซ้ำกับกล่องใหญ่) · อ่านจบครบแล้วชวนไปคลังการ์ด
function UpNext({ done, skip, cards }: { done: ReadonlySet<string>; skip: LearnCard | null; cards: readonly LearnCard[] }) {
  const list = cards.filter((c) => c !== skip && !done.has(cardUrl(c.slug))).slice(0, 3);
  return (
    <section aria-labelledby="next-title" className={`${box} flex flex-col gap-3 lg:col-span-4`}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="next-title" className="font-semibold">
          การ์ดถัดไป
        </h2>
        <Link href="/learn/cards" className="inline-flex min-h-11 items-center text-sm font-medium text-fd-primary hover:underline">
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
                <span className="shrink-0 text-sm text-fd-muted-foreground tabular-nums">{c.minutes} นาที</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// "รุ่น 3-2569 · วันที่ 4 จาก 40" หรือสถานะของรุ่นถ้ายังไม่เริ่ม/จบแล้ว
function cohortLine(c: Cohort) {
  const d = cohortDay(c);
  return d ? `${c.name} · วันที่ ${d.day} จาก ${d.total}` : `${c.name} · ${COHORT_STATUS_LABEL[cohortStatus(c)]} (${cohortRange(c)})`;
}

// ใกล้กำหนด (เหลือ ≤ 2 วัน) เน้นสีส้ม · เลยกำหนดไม่เน้นที่นี่ เพราะป้ายสถานะ "เลยกำหนด N วัน" บอกอยู่แล้ว
const DUE_TONE = (daysLeft: number | null, state: PlanItem["state"]) =>
  (state === "todo" || state === "revise") && daysLeft !== null && daysLeft >= 0 && daysLeft <= 2 ? "font-semibold text-orange-700 dark:text-orange-400" : "text-fd-muted-foreground";

// งานของฉัน: รอบส่งของโจทย์เรียงตามกำหนดส่ง พร้อมสถานะ · ตัวเต็ม (ฟอร์มส่งงาน) อยู่ในหน้าการส่งงาน
function MyTasks({ work }: { work: Work }) {
  const { data, plan, cohort, loading, failed } = work;
  const next = nextWork(plan);
  const repo = data?.items[0]?.repoUrl ?? null;
  const deploy = data?.items.find((s) => s.deployUrl)?.deployUrl ?? null;
  const dated = plan.some((p) => p.dueOn);

  return (
    <section aria-labelledby="tasks-title" className={`${box} flex flex-col gap-4 lg:col-span-8 lg:self-start`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="tasks-title" className="flex items-center gap-2 text-lg font-bold">
          <FolderGit2 className="size-5 text-fd-primary" /> งานของฉัน
        </h2>
        <Link href="/work" className="inline-flex min-h-11 items-center text-sm font-medium text-fd-primary hover:underline">
          กระดานงาน
        </Link>
        {!data?.locked && (
          <Link href={SUBMIT_LINK} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-fd-primary px-4 text-sm font-semibold text-fd-primary-foreground hover:brightness-110">
            {repo ? "ส่งงาน / ดูผลตรวจ" : "ส่งลิงก์ repo"} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-fd-muted-foreground">กำลังโหลดงาน…</p>
      ) : failed ? (
        <p role="alert" className="text-red-700 dark:text-red-400">
          โหลดงานไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง
        </p>
      ) : plan.length === 0 ? (
        <p className="text-fd-muted-foreground">ยังไม่มีโจทย์ในรุ่นของคุณ พี่เลี้ยงจะเพิ่มให้ เมื่อมีแล้วกำหนดส่งจะขึ้นที่นี่</p>
      ) : (
        <>
          {!cohort && <p className="text-sm text-fd-muted-foreground">คุณยังไม่ได้อยู่ในรุ่นใด จึงยังไม่มีวันที่กำหนดส่ง บอกพี่เลี้ยงให้ใส่รุ่นให้</p>}
          {!repo && !data?.locked && <p className="rounded-lg bg-fd-muted px-3 py-2 text-sm">ยังไม่ได้ส่งลิงก์ repo · สร้าง repo แล้ว push ครั้งแรก จากนั้นส่งลิงก์ให้พี่เลี้ยงตามดูโค้ดได้ทุกวัน</p>}
          <ul className="flex flex-col gap-2">
            {plan.map((p) => {
              const isNext = next === p;
              const due = dueLabel(p.daysLeft);
              return (
                <li key={`${p.assignment}/${p.round.id}`} className={`relative flex flex-col gap-1.5 rounded-xl border p-3 hover:bg-fd-accent/40 ${isNext ? "border-2 border-fd-primary bg-fd-primary/5" : "border-fd-border"}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link href={taskHref(p)} className="font-semibold after:absolute after:inset-0 after:content-['']">
                      {p.round.label}
                    </Link>
                    <WorkBadge state={p.state} daysLeft={p.daysLeft} />
                    {p.lateDays > 0 && <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-sm font-semibold text-orange-800 dark:text-orange-300">ส่งช้า {p.lateDays} วัน</span>}
                    {isNext && <span className="sr-only">งานถัดไป</span>}
                    <span className={`ms-auto text-sm tabular-nums ${DUE_TONE(p.daysLeft, p.state)}`}>
                      {p.dueOn ? `กำหนดส่ง ${thaiDayMonth(p.dueOn)}${due && (p.state === "todo" || p.state === "revise") && p.daysLeft! >= 0 ? ` · ${due}` : ""}` : `วันที่ ${p.round.day} ของรุ่น`}
                    </span>
                  </div>
                  <p className="text-sm text-fd-muted-foreground">
                    {p.assignmentName} · {p.round.what}
                  </p>
                  {p.state === "revise" && p.review && <p className="line-clamp-2 rounded-lg bg-fd-muted px-3 py-2 text-sm">พี่เลี้ยง: {p.review}</p>}
                </li>
              );
            })}
          </ul>
          {dated && <p className="text-sm text-fd-muted-foreground">วันที่คำนวณจากวันเริ่มรุ่นและวันจันทร์–ศุกร์ ไม่รวมวันหยุดราชการ จึงเป็นค่าประมาณ ถ้าพี่เลี้ยงนัดวันอื่น ให้ยึดตามพี่เลี้ยง</p>}
          {data?.locked && <p className="text-sm text-fd-muted-foreground">รุ่นนี้จบแล้ว ดูประวัติการส่งได้ แต่ส่งเพิ่มไม่ได้</p>}
        </>
      )}

      {(repo || deploy) && (
        <div className="flex flex-col gap-1 border-t border-fd-border pt-3 text-sm">
          {repo && (
            <a className="break-all font-mono text-fd-primary underline" href={repo} target="_blank" rel="noopener noreferrer">
              Repo ของโปรเจกต์: {repo.replace("https://", "")}
            </a>
          )}
          {deploy && (
            <a className="break-all text-fd-primary underline" href={deploy} target="_blank" rel="noopener noreferrer">
              เว็บที่ deploy: {deploy.replace("https://", "")}
            </a>
          )}
        </div>
      )}
    </section>
  );
}

// ฉันอยู่ตรงไหน: วันที่ของรุ่น + ขั้นปัจจุบัน · จำนวนการ์ดที่อ่านเป็นตัวเสริม (งานที่ส่งสำคัญกว่าจำนวนที่อ่าน)
function Where({ count, total, step, cohort }: { count: number | null; total: number; step: LearnStep; cohort: Cohort | null }) {
  const day = cohort ? cohortDay(cohort) : null;
  const pct = day ? Math.round((day.day / day.total) * 100) : 0;
  return (
    <section aria-labelledby="where-title" className={`${box} flex flex-col gap-3`}>
      <h2 id="where-title" className="text-sm font-semibold text-fd-muted-foreground">
        ฉันอยู่ตรงไหน
      </h2>
      {day ? (
        <>
          <p className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums">{day.day}</span>
            <span className="text-fd-muted-foreground">จาก {day.total} วันทำงานของรุ่น</span>
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-fd-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="วันที่ผ่านไปของรุ่น">
            <div className="h-full rounded-full bg-fd-primary" style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : (
        <p className="text-fd-muted-foreground">{cohort ? `รุ่น${COHORT_STATUS_LABEL[cohortStatus(cohort)]}` : "ยังไม่ได้อยู่ในรุ่น"}</p>
      )}
      <p className="text-sm text-fd-muted-foreground">
        ขั้นที่อ่านอยู่: {step.num}. {step.name} · อ่านการ์ดแล้ว {count === null ? "…" : count}/{total} ใบ
      </p>
    </section>
  );
}

// จากพี่เลี้ยง: ข้อความที่ยังไม่อ่าน + ความเห็นล่าสุดในผลตรวจ (ประกาศอยู่แถบด้านบนของหน้า)
function FromMentor({ work }: { work: Work }) {
  const unread = useUnread();
  const latest = work.data?.items.find((s) => s.reviewedAt && s.review);
  return (
    <section aria-labelledby="mentor-title" className={`${box} flex flex-col gap-3`}>
      <h2 id="mentor-title" className="flex items-center gap-2 font-semibold">
        <MessageCircle className="size-5 text-fd-primary" /> จากพี่เลี้ยง
      </h2>
      {latest && (
        <p className="line-clamp-3 rounded-lg bg-fd-muted px-3 py-2 text-sm">
          <span className="font-semibold">{latest.reviewer ?? "พี่เลี้ยง"}</span> ตรวจ {latest.roundLabel}: {latest.review}
        </p>
      )}
      <Link href="/questions" className="inline-flex min-h-11 items-center justify-between gap-2 rounded-xl border border-fd-border px-4 text-sm font-semibold hover:bg-fd-accent">
        <span>{unread > 0 ? `ข้อความใหม่ ${unread} เรื่อง` : "ข้อความกับพี่เลี้ยง"}</span>
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}

// กำหนดการของรุ่น: เส้นเวลาของรอบส่งทั้งหมด บอกว่าผ่านแล้ว ถึงแล้ว หรือยังไม่ถึง
function Schedule({ work }: { work: Work }) {
  const { plan, cohort } = work;
  if (plan.length === 0) return null;
  return (
    <section aria-labelledby="schedule-title" className={`${box} flex flex-col gap-3`}>
      <h2 id="schedule-title" className="flex items-center gap-2 font-semibold">
        <CalendarDays className="size-5 text-fd-primary" /> กำหนดการของรุ่น
      </h2>
      <ol className="flex flex-col">
        {plan.map((p, i) => (
          <li key={`${p.assignment}/${p.round.id}`} className="relative flex gap-3 pb-3 last:pb-0">
            {i < plan.length - 1 && <span aria-hidden className="absolute start-[7px] top-5 bottom-0 w-0.5 bg-fd-border" />}
            <span aria-hidden className={`mt-1.5 size-4 shrink-0 rounded-full border-2 ${p.state === "pass" ? "border-fd-primary bg-fd-primary" : p.state === "todo" || p.state === "late" || p.state === "revise" ? "border-fd-primary bg-fd-card" : "border-fd-border bg-fd-card"}`} />
            <div className="min-w-0 text-sm">
              <div className="font-semibold">{p.dueOn ? thaiDayMonth(p.dueOn) : `วันที่ ${p.round.day}`}</div>
              <Link href={taskHref(p)} className="inline-flex min-h-11 items-center text-fd-muted-foreground hover:text-fd-foreground hover:underline">
                {p.round.label} · {p.assignmentName}
              </Link>
            </div>
          </li>
        ))}
      </ol>
      {cohort && <p className="text-sm text-fd-muted-foreground">รุ่นจบ {thaiDayMonth(cohort.endsOn)}</p>}
    </section>
  );
}
// กราฟความคืบหน้าของตัวเอง: การ์ดที่ผ่านต่อวัน (14 วัน) + ความคืบหน้าแต่ละขั้น · ใช้กราฟชุดเดียวกับหลังบ้าน (admin-charts)
const DAYS = 14;
function MyCharts({ done, cards }: { done: ReadonlySet<string>; cards: readonly LearnCard[] }) {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  useEffect(() => {
    progressApi
      .list()
      .then(setEntries)
      .catch(() => {});
    // ติ๊กใหม่แล้วกราฟต้องเปลี่ยนตาม: done เปลี่ยนเมื่อไรก็โหลดเวลาที่ผ่านใหม่
  }, [done.size]);

  const days = dailyCounts(
    entries.filter((e) => cards.some((c) => e.link === cardUrl(c.slug))).map((e) => e.doneAt),
    DAYS,
  ).map((d) => ({ key: d.day, label: shortDay(d.day), value: d.value }));
  const total = days.reduce((n, d) => n + d.value, 0);

  return (
    <section aria-label="ความคืบหน้าของฉัน" className="lg:col-span-12">
      <ChartCard
        title="การ์ดที่ผ่านต่อวัน"
        sub={`${DAYS} วันล่าสุด`}
        figure={<Figure value={total} label={`ใบใน ${DAYS} วัน`} />}
        table={{ head: ["วัน", "การ์ดที่ผ่าน (ใบ)"], rows: days.map((d) => [d.label, d.value]) }}
      >
        <ColumnChart data={days} unit="ใบ" />
      </ChartCard>
    </section>
  );
}
