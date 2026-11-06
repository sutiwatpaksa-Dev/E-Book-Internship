"use client";

import { ArrowRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMyWork } from "@/hooks/use-my-work";
import { thaiDayMonth } from "@/lib/cohort";
import { weightOf } from "@/lib/submission";
import { timeAgo } from "@/lib/thread-labels";
import { dueLabel, nextWork, WORK_STATE_LABEL, type PlanItem, type WorkState } from "@/lib/work-plan";
import { EmptyState } from "./empty-state";
import { WorkBadge } from "./status-badge";

// งานที่ต้องส่ง (เดิม "กระดานงาน"): งานทุกรอบของฉันเรียงตามกำหนดส่ง กรองตามสถานะได้ · กดแล้วเข้าหน้างาน (ประวัติส่ง ผลตรวจ คะแนน ความเห็น)
type Filter = "all" | "open" | WorkState;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "open", label: "ต้องทำ" },
  { id: "waiting", label: WORK_STATE_LABEL.waiting },
  { id: "pass", label: WORK_STATE_LABEL.pass },
];
const isOpen = (s: WorkState) => s === "todo" || s === "late" || s === "revise";

export const taskHref = (p: Pick<PlanItem, "assignment" | "round">) => `/work/${p.assignment}/${p.round.id}`;

export function WorkBoard() {
  const work = useMyWork("intern");
  const [filter, setFilter] = useState<Filter>("all");
  const next = nextWork(work.plan);
  const matches = (p: PlanItem, f: Filter) => f === "all" || (f === "open" ? isOpen(p.state) : p.state === f);
  // เลยกำหนดขึ้นก่อน แล้วที่เหลือเรียงตามกำหนดส่งเดิม (sort เสถียร)
  const shown = work.plan.filter((p) => matches(p, filter)).sort((a, b) => Number(b.state === "late") - Number(a.state === "late"));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">งานที่ต้องส่ง</h1>
        <p className="text-fd-muted-foreground">งานทุกชิ้นของรุ่นคุณเรียงตามวันส่ง กดงานเพื่ออ่านคำสั่งและส่งงาน</p>
        <Link href="/projects" className="inline-flex min-h-11 w-fit items-center text-sm font-medium text-fd-primary hover:underline">
          เอกสารโจทย์ STARTER (หน้าที่ต้องมี เกณฑ์ แผน 10 วัน)
        </Link>
      </header>

      {next && isOpen(next.state) && (
        <section aria-label="ต้องทำต่อ" className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-fd-primary bg-fd-card p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-fd-muted-foreground">ต้องทำต่อ</p>
            <p className="text-lg font-bold">{next.round.label}</p>
            <p className="text-sm">
              {WORK_STATE_LABEL[next.state]}
              {next.dueOn ? ` · กำหนดส่ง ${thaiDayMonth(next.dueOn)}` : ""}
            </p>
          </div>
          <Link href={taskHref(next)} className="inline-flex min-h-12 items-center gap-1.5 rounded-xl bg-fd-primary px-5 font-semibold text-fd-primary-foreground hover:brightness-110">
            {next.state === "revise" ? "ดูสิ่งที่ต้องแก้" : "เปิดงานและส่ง"} <ArrowRight className="size-4" />
          </Link>
        </section>
      )}

      <div role="group" aria-label="กรองงาน" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`min-h-11 rounded-lg px-3 text-sm font-medium ${filter === f.id ? "bg-fd-primary text-fd-primary-foreground" : "border border-fd-border hover:bg-fd-accent"}`}
          >
            {f.label} <span className="tabular-nums opacity-80">{work.plan.filter((p) => matches(p, f.id)).length}</span>
          </button>
        ))}
      </div>

      {work.loading ? (
        <p className="text-fd-muted-foreground">กำลังโหลดงาน…</p>
      ) : work.failed ? (
        <p role="alert" className="text-red-700 dark:text-red-400">
          โหลดงานไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง
        </p>
      ) : shown.length === 0 ? (
        <EmptyState icon={ClipboardList} title={work.plan.length === 0 ? "ยังไม่มีงาน" : "ไม่มีงานในหมวดนี้"}>
          {work.plan.length === 0 ? "เมื่อพี่เลี้ยงเพิ่มโจทย์ให้รุ่นของคุณ งานและกำหนดส่งจะขึ้นที่นี่" : "ลองเลือกหมวดอื่น"}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((p) => {
            const due = dueLabel(p.daysLeft);
            return (
              <li key={`${p.assignment}/${p.round.id}`}>
                <Link href={taskHref(p)} className={`flex flex-col gap-1.5 rounded-2xl border bg-fd-card p-4 hover:bg-fd-accent/50 ${next === p ? "border-2 border-fd-primary" : "border-fd-border"}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-lg font-semibold">{p.round.label}</span>
                    <WorkBadge state={p.state} daysLeft={p.daysLeft} />
                    {p.lateDays > 0 && <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">ส่งช้า {p.lateDays} วัน</span>}
                    {next === p && <span className="sr-only">งานถัดไป</span>}
                    <ArrowRight className="ms-auto size-4 text-fd-muted-foreground" aria-hidden />
                  </div>
                  <p className="text-sm text-fd-muted-foreground">
                    {[p.round.what, weightOf(p.round) ? `นับ ${weightOf(p.round)}% ของคะแนนงาน` : "ไม่นับคะแนน", p.round.deploy ? "ต้องส่งลิงก์เว็บ" : ""].filter(Boolean).join(" · ")}
                  </p>
                  {p.round.postedBy && (
                    <p className="text-xs text-fd-muted-foreground">
                      {p.round.postedBy} โพสต์{p.round.postedAt ? ` ${timeAgo(p.round.postedAt)}` : ""}
                    </p>
                  )}
                  <p className="text-sm tabular-nums">{p.dueOn ? `กำหนดส่ง ${thaiDayMonth(p.dueOn)}${due && (p.state === "todo" || p.state === "revise") && p.daysLeft! >= 0 ? ` · ${due}` : ""}` : `วันที่ ${p.round.day} ของรุ่น`}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
