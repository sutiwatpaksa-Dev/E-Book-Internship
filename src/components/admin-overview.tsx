"use client";

import { ChevronRight, FilePlus2, NotebookPen, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import { daysSince, isLockedNow, type AdminState } from "@/hooks/use-admin";
import { mentorCardUrl } from "@/data/learn";
import type { ContentAdminState } from "@/hooks/use-content-admin";
import { useUnread } from "@/hooks/use-unread";
import { cardEntries, cardSummary, dailyCounts, loginBuckets, shortDay, stepProgress } from "@/lib/admin-stats";
import { inCohort, type CohortFilter } from "@/lib/cohort";
import { BLUE, ORANGE, RED, timeAgo } from "@/lib/thread-labels";
import { internHref } from "@/lib/admin-links";
import { buildPlan, REVIEW_WAIT_DAYS, workSummary } from "@/lib/work-plan";
import { RowLink } from "./row-link";
import { useSubmissions } from "./admin-submissions";
import { ChartCard, ColumnChart, Figure, ProgressRows, SegmentBar } from "./admin-charts";
import type { AdminNav } from "./admin-panel";
import { Skeleton, SkeletonList } from "./skeleton";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("th-TH") : "ยังไม่เคยเข้า");
// ฝึกงานสั้น หายไป 3 วันก็ตามงานไม่ทันแล้ว (เดิม 7 วัน รู้ตัวช้าไป)
const STALE_DAYS = 3;
const HOT_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

// แท็บภาพรวม: ตัวเลข 4 กล่อง (กดแล้วไปที่นั่น) → "ต้องทำวันนี้" → ความคืบหน้าของน้องทุกคน
// ข้างขวา: หน้าที่ถูกถามบ่อย ถามซ้ำแปลว่าเนื้อหาตรงนั้นยังไม่พอ ปุ่มเพิ่มโน้ต/การ์ดอยู่ตรงนั้นเลย
// ตัวเลขทั้งหมดคำนวณจากข้อมูลที่โหลดมาแล้ว (ไม่มีข้อมูลตัวอย่าง และไม่ต้องมีตารางใหม่)
type Props = { admin: AdminState; content: ContentAdminState; nav: AdminNav; titles: Record<string, string> };

export function AdminOverview({ admin, content, nav, titles }: Props) {
  const unread = useUnread();
  const [saved, setCohort] = useCohortFilter();
  // ช่วงเวลาของกราฟรายวัน (ฝึกงานสั้น 14 วันเห็นภาพพอ · 30 วันไว้ดูทั้งรุ่น)
  const [days, setDays] = useState<14 | 30>(14);
  // รุ่นที่จำไว้ถูกลบไปแล้ว (หรือรายการยังโหลดไม่เสร็จ) ให้ดูทุกรุ่นแทน
  const cohort: CohortFilter = typeof saved === "number" && !admin.cohorts.some((c) => c.id === saved) ? "all" : saved;
  const ended = new Set(admin.cohorts.filter((c) => c.endedAt).map((c) => c.id));
  // "ทุกรุ่น" ไม่นับน้องของรุ่นที่จบแล้ว (ไม่ต้องตามว่าใครหายไป) · เลือกรุ่นที่จบแล้วตรงๆ ยังดูได้
  const interns = admin.users.filter(
    (u) => u.role === "intern" && !u.disabled && inCohort(u.cohortId, cohort) && (cohort !== "all" || u.cohortId === null || !ended.has(u.cohortId)),
  );
  // เรื่องในแชทผูกกับชื่อเจ้าของ: กรองตามรุ่น = เอาเฉพาะเรื่องของน้องในรุ่นนั้น
  const owners = new Set(admin.users.filter((u) => u.role === "intern" && inCohort(u.cohortId, cohort)).map((u) => u.username));
  const threads = cohort === "all" ? admin.threads : admin.threads.filter((t) => !!t.owner && owners.has(t.owner));
  const locked = admin.users.filter(isLockedNow);
  // ทุกบัญชี (รวมพี่เลี้ยง) ไม่กรองตามรุ่น: คนที่ขอรีเซ็ตเข้าระบบไม่ได้จนกว่าจะมีคนออก PIN ให้
  const resets = admin.users.filter((u) => u.resetRequestedAt && !u.disabled);
  // แยกสองกลุ่มเพราะต้องทำคนละอย่าง: ยังไม่เคยเข้า = อาจยังไม่ได้รับ PIN (ตามส่ง PIN)
  // เคยเข้าแต่หายไปเกิน 7 วัน = อาจติดอะไรอยู่ (ทักไปถามความคืบหน้า)
  const neverIn = interns.filter((u) => !u.lastLoginAt);
  const stale = interns.filter((u) => (daysSince(u.lastLoginAt) ?? 0) > STALE_DAYS);
  // งานที่ส่ง: เลยกำหนด / รอตรวจนาน ต่อน้อง (โจทย์ของรุ่น + วันเริ่มรุ่น) · โหลดไม่ได้หรือยังไม่เสร็จ = ไม่แสดงธง
  const { items: subs } = useSubmissions();
  const workOf = new Map(
    interns.map((u) => {
      const c = admin.cohorts.find((x) => x.id === u.cohortId);
      const mine = (subs ?? []).filter((x) => x.userId === u.id);
      const assignments = admin.assignments.filter((a) => u.cohortId !== null && a.cohortIds.includes(u.cohortId)).map(({ slug, name, rounds }) => ({ slug, name, rounds }));
      return [u.id, workSummary(buildPlan({ assignments, submissions: mine, startsOn: c?.startsOn ?? null, ended: !!c?.endedAt }), mine)] as const;
    }),
  );
  const lateInterns = interns.filter((u) => (workOf.get(u.id)?.late ?? 0) > 0);
  const oldWaitingInterns = interns.filter((u) => (workOf.get(u.id)?.oldWaiting ?? 0) > 0);
  const toInterns = () => document.getElementById("interns")?.scrollIntoView({ behavior: "smooth" });
  const newRequests = threads.filter((t) => t.status === "new").length;
  const waitingList = threads.filter((t) => t.status === "waiting");
  const waiting = waitingList.length;
  // เรื่องที่รอนานสุด: lastMessageAt ของเรื่องที่ "รอตอบ" คือตอนที่น้องพิมพ์ล่าสุด
  const oldest = waitingList.map((t) => t.lastMessageAt).sort()[0];
  const now = Date.now();
  const activeAnn = content.announcements.filter((a) => new Date(a.startsAt).getTime() <= now && (!a.endsAt || new Date(a.endsAt).getTime() > now));
  const soonestEnd = activeAnn
    .map((a) => a.endsAt)
    .filter((d): d is string => !!d)
    .sort()[0];
  const hot = hotPages(threads, now);
  // การ์ดของพี่เลี้ยงไม่มีไฟล์ MDX จึงไม่อยู่ใน titles หาชื่อจากรายการการ์ดแทน
  const titleOf = (url: string) => titles[url] ?? content.cards.find((c) => mentorCardUrl(c.slug) === url)?.title ?? url;

  // เรียงตามความเร่ง: คนรอคำตอบอยู่ก่อน แล้วค่อยเรื่องบัญชีและไฟล์
  const todo = [
    { show: unread > 0, text: `ข้อความใหม่ที่ยังไม่มีใครเปิดอ่าน ${unread} เรื่อง`, go: () => nav.goTab("questions") },
    { show: waiting > 0, text: `คำถามที่รอพี่เลี้ยงตอบ ${waiting} เรื่อง`, go: () => nav.goTab("questions") },
    { show: newRequests > 0, text: `คำขอเนื้อหาที่ยังไม่รับเรื่อง ${newRequests} เรื่อง`, go: () => nav.goTab("requests") },
    { show: resets.length > 0, text: `ขอรีเซ็ตรหัสผ่าน ${resets.length} คน (${resets.map((u) => u.username).join(", ")}) ออก PIN ใหม่ให้ที่แท็บบัญชี`, go: () => nav.goTab("users") },
    { show: locked.length > 0, text: `บัญชีถูกล็อก ${locked.length} บัญชี (ใส่รหัสผิด 5 ครั้ง ล็อก 15 นาที)`, go: () => nav.goTab("users") },
    { show: oldWaitingInterns.length > 0, text: `งานที่ส่งแล้วรอตรวจเกิน ${REVIEW_WAIT_DAYS} วัน ของน้อง ${oldWaitingInterns.length} คน`, go: () => nav.goTab("submissions") },
    { show: lateInterns.length > 0, text: `น้อง ${lateInterns.length} คนมีงานเลยกำหนดส่ง (${lateInterns.map((u) => u.username).join(", ")}) ลองทักไปถาม`, go: toInterns },
    { show: neverIn.length > 0, text: `น้องยังไม่เคย login ${neverIn.length} คน ส่ง PIN ให้แล้วหรือยัง`, go: toInterns },
    { show: stale.length > 0, text: `น้องไม่ได้เข้ามาเกิน ${STALE_DAYS} วัน ${stale.length} คน ลองทักไปถาม`, go: toInterns },
    ...admin.assignments
      .filter((a) => !a.pdf && a.cohortIds.length > 0)
      .map((a) => ({ show: true, text: `โจทย์ ${a.name} มีรุ่นใช้อยู่แต่ยังไม่มี PDF ให้น้องเปิด`, go: () => nav.goTab("files") })),
  ].filter((t) => t.show);

  const kpis = [
    { n: waiting, label: "คำถามรอตอบ", hint: oldest ? `เก่าสุด ${timeAgo(oldest)}` : "ไม่มีค้าง", urgent: waiting > 0, go: () => nav.goTab("questions") },
    { n: newRequests, label: "คำขอเนื้อหาใหม่", hint: newRequests ? "ยังไม่รับเรื่อง" : "ไม่มีค้าง", urgent: newRequests > 0, go: () => nav.goTab("requests") },
    {
      n: stale.length,
      label: `น้องไม่ได้เข้า ${STALE_DAYS} วันขึ้นไป`,
      hint: stale.length
        ? stale
            .slice(0, 2)
            .map((u) => u.username)
            .join(", ") + (stale.length > 2 ? " …" : "")
        : "ทุกคนเข้ามาสม่ำเสมอ",
      // หายไปหลายวัน = ควรทักไปถาม เป็นงานที่ต้องทำเหมือนคำถามค้าง จึงขึ้นสีเตือนด้วย
      urgent: stale.length > 0,
      go: toInterns,
    },
    {
      n: activeAnn.length,
      label: "ประกาศที่แสดงอยู่",
      hint: soonestEnd ? `หายเอง ${new Date(soonestEnd).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}` : activeAnn.length ? "แสดงจนกว่าจะปิด" : "ไม่มี",
      urgent: false,
      go: () => nav.goTab("announcements"),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ตัวกรองแถวเดียวด้านบน มีผลกับทุกอย่างข้างล่าง (ตัวเลข กราฟ ตาราง) ตัวเลขจึงตรงกันเสมอ */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {admin.cohorts.length > 0 && (
          <label className="flex flex-wrap items-center gap-2 text-sm font-medium">
            ดูเฉพาะรุ่น
            <select
              className="min-h-11 rounded-lg border border-fd-border bg-fd-background px-3"
              value={String(cohort)}
              onChange={(e) => setCohort(e.target.value === "all" || e.target.value === "none" ? e.target.value : Number(e.target.value))}
            >
              <option value="all">ทุกรุ่นที่ยังไม่จบ</option>
              {admin.cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.endedAt ? " (จบแล้ว)" : ""}
                </option>
              ))}
              <option value="none">ไม่มีรุ่น</option>
            </select>
          </label>
        )}
        <div role="group" aria-label="ช่วงเวลาของกราฟ" className="flex items-center gap-1 text-sm">
          {([14, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days === d}
              onClick={() => setDays(d)}
              className={`min-h-11 rounded-lg px-3 font-medium ${days === d ? "bg-fd-primary text-fd-primary-foreground" : "border border-fd-border hover:bg-fd-accent"}`}
            >
              {d} วัน
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={k.go}
            className="flex min-h-24 flex-col items-start gap-0.5 rounded-xl border border-fd-border bg-fd-card px-4 py-3 text-start hover:border-fd-primary/50 hover:bg-fd-accent"
          >
            <span className={`text-3xl leading-tight font-bold tabular-nums ${k.urgent ? "text-red-700 dark:text-red-400" : ""}`}>{admin.loading ? <Skeleton className="h-8 w-10" /> : k.n}</span>
            <span className="text-sm font-semibold">{k.label}</span>
            <span className="line-clamp-1 text-xs text-fd-muted-foreground">{k.hint}</span>
          </button>
        ))}
      </div>

      <OverviewCharts admin={admin} interns={interns} threads={threads} days={days} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <section aria-labelledby="todo-title" className="flex flex-col gap-2">
            <h2 id="todo-title" className="text-base font-semibold">
              งานวันนี้
            </h2>
            {admin.loading ? (
              <SkeletonList rows={3} />
            ) : todo.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl border border-fd-border bg-fd-card px-4 py-3 text-sm">
                <PartyPopper className="size-4 text-green-600" /> ไม่มีงานค้าง ทุกเรื่องได้รับการดูแลแล้ว
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-fd-border overflow-hidden rounded-xl border border-fd-border bg-fd-card">
                {todo.map((t) => (
                  <li key={t.text}>
                    <button type="button" onClick={t.go} className="flex w-full items-center gap-3 px-4 py-3 text-start text-sm hover:bg-fd-accent">
                      <span className="size-2 shrink-0 rounded-full bg-orange-500" />
                      <span className="flex-1">{t.text}</span>
                      <ChevronRight className="size-4 text-fd-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="interns" aria-labelledby="interns-title" className="flex flex-col gap-2">
            <h2 id="interns-title" className="text-base font-semibold">
              น้องแต่ละคน {admin.loading ? "" : `(${interns.length})`}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-fd-border">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-fd-muted text-left">
                  <tr>
                    <th className="px-3 py-2">ชื่อผู้ใช้</th>
                    <th className="px-3 py-2">อยู่ขั้น</th>
                    <th className="px-3 py-2">งานที่ส่ง</th>
                    <th className="px-3 py-2">การ์ดที่ผ่าน</th>
                    <th className="px-3 py-2">ผ่านล่าสุด</th>
                    <th className="px-3 py-2">เข้าล่าสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {interns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-fd-muted-foreground">
                        {admin.loading ? <Skeleton className="h-4 w-40" /> : "ยังไม่มีบัญชีน้อง สร้างได้ในแท็บบัญชีผู้ใช้"}
                      </td>
                    </tr>
                  )}
                  {interns.map((u) => {
                    const s = cardSummary(admin.progress[u.id]);
                    const isStale = !u.lastLoginAt || (daysSince(u.lastLoginAt) ?? 0) > STALE_DAYS;
                    return (
                      <tr key={u.id} className="relative border-t border-fd-border hover:bg-fd-accent/50">
                        <td className="px-3 py-2">
                          <RowLink href={internHref(u.id)} onGo={() => nav.openIntern(u.id)}>
                            {u.username}
                          </RowLink>
                          {isLockedNow(u) && <span className="ms-2 text-xs text-orange-700 dark:text-orange-400">ล็อกอยู่</span>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{s.where}</td>
                        <td className="px-3 py-2">
                          <WorkCell w={workOf.get(u.id)} ready={subs !== null} />
                        </td>
                        <td className="px-3 py-2">
                          {/* shrink-0: แถบมี overflow-hidden ทำให้ flex บีบมันได้ถึง 0 จอแคบจึงเหลือแค่จุด */}
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-(--chart-track)">
                              <span className="block h-full bg-fd-primary" style={{ width: `${(s.doneCount / s.total) * 100}%` }} />
                            </span>
                            <span className="whitespace-nowrap tabular-nums">
                              {s.doneCount}/{s.total}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">{s.last ? `${s.last.title} · ${timeAgo(s.last.at)}` : <span className="text-fd-muted-foreground">ยังไม่ติ๊ก</span>}</td>
                        <td className={`px-3 py-2 whitespace-nowrap ${isStale ? "text-orange-700 dark:text-orange-400" : ""}`}>{fmt(u.lastLoginAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-fd-muted-foreground">
              นับเฉพาะการ์ดใน 7 ขั้น (ตัวเดียวกับกราฟด้านบน) · ความคืบหน้ามาจากปุ่ม &quot;เข้าใจแล้ว&quot; ที่น้องติ๊กเองตอน login อยู่ (ติ๊กก่อน login จะย้ายขึ้นบัญชีเมื่อ login ครั้งถัดไป) ใช้ดูว่าใครติดตรงไหน ไม่ใช่คะแนน
            </p>
          </section>
        </div>

        <aside aria-labelledby="hot-title" className="flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-4 lg:w-80 lg:shrink-0">
          <div>
            <h2 id="hot-title" className="text-base font-semibold">
              หน้าที่ถูกถามบ่อย {HOT_DAYS} วัน
            </h2>
            <p className="text-xs text-fd-muted-foreground">ถามซ้ำ = ตรงนั้นควรมีโน้ตหรือการ์ดเพิ่ม</p>
          </div>
          {hot.length === 0 ? (
            <p className="text-sm text-fd-muted-foreground">ยังไม่มีคำถามที่ถามจากหน้าใดในช่วงนี้</p>
          ) : (
            <ol className="flex flex-col divide-y divide-fd-border">
              {hot.map((h) => (
                <li key={h.url} className="flex flex-col gap-2 py-3 first:pt-0">
                  <span className="flex items-start justify-between gap-2 text-sm">
                    <a href={h.url} className="font-medium text-fd-primary hover:underline">
                      {titleOf(h.url)}
                    </a>
                    <span className="shrink-0 text-fd-muted-foreground tabular-nums">{h.count} คำถาม</span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => nav.openNote(h.url)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-fd-border px-3 text-xs font-semibold hover:bg-fd-accent"
                    >
                      <NotebookPen className="size-3.5" /> โน้ตท้ายหน้า
                    </button>
                    <button
                      type="button"
                      onClick={() => nav.goTab("cards")}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-fd-border px-3 text-xs font-semibold hover:bg-fd-accent"
                    >
                      <FilePlus2 className="size-3.5" /> การ์ดใหม่
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}

// กราฟ 4 ใบ: ทำงานแค่ไหน (การ์ดที่ผ่านรายวัน) · ติดแค่ไหน (คำถามรายวัน) · ไปถึงไหน (แต่ละขั้น) · ยังเข้ามาไหม (การเข้าใช้งาน)
// ใช้น้องชุดเดียวกับตารางด้านล่าง (ตามรุ่นที่เลือก) ตัวเลขในกราฟกับตารางจึงตรงกัน
function OverviewCharts({ admin, interns, threads, days }: { admin: AdminState; interns: AdminState["users"]; threads: AdminState["threads"]; days: number }) {
  const ticks = interns.flatMap((u) => cardEntries(admin.progress[u.id]).map((e) => e.doneAt));
  const done = dailyCounts(ticks, days).map((d) => ({ key: d.day, label: shortDay(d.day), value: d.value }));
  const asked = dailyCounts(
    threads.map((t) => t.createdAt),
    days,
  ).map((d) => ({ key: d.day, label: shortDay(d.day), value: d.value }));
  const steps = stepProgress(interns.map((u) => admin.progress[u.id] ?? []));
  const logins = loginBuckets(interns.map((u) => u.lastLoginAt));
  const sum = (xs: { value: number }[]) => xs.reduce((s, x) => s + x.value, 0);

  if (admin.loading) return null;
  return (
    <section aria-label="กราฟภาพรวม" className="grid gap-3 lg:grid-cols-2 lg:items-start">
      <ChartCard
        title="การ์ดที่น้องติ๊กผ่าน"
        sub={`ต่อวัน ${days} วันล่าสุด · วันที่แท่งหายไปหลายวันติดกัน = ลองทักไปถาม`}
        figure={<Figure value={sum(done)} label={`ใบ ใน ${days} วัน`} />}
        table={{ head: ["วัน", "การ์ดที่ผ่าน"], rows: done.map((d) => [d.label, d.value]) }}
      >
        <ColumnChart data={done} unit="ใบ" />
      </ChartCard>
      <ChartCard
        title="คำถามและคำขอเนื้อหาใหม่"
        sub={`ต่อวัน ${days} วันล่าสุด · พุ่งขึ้นวันไหน ดูว่าวันนั้นน้องอยู่การ์ดไหน`}
        figure={<Figure value={sum(asked)} label={`เรื่อง ใน ${days} วัน`} />}
        table={{ head: ["วัน", "เรื่องใหม่"], rows: asked.map((d) => [d.label, d.value]) }}
      >
        <ColumnChart data={asked} unit="เรื่อง" />
      </ChartCard>
      <ChartCard
        title="ความคืบหน้าแต่ละขั้น"
        sub={`ผ่านการ์ดในขั้นนั้นเฉลี่ยกี่ % (${interns.length} คน) · "อยู่ขั้นนี้" = ขั้นแรกที่ยังมีการ์ดไม่ผ่าน · ขั้นที่ยังไม่มีการ์ด (Deploy, Maintenance) ไม่แสดง`}
        figure={<Figure value={steps.finished} label="คน ผ่านครบทุกการ์ด" />}
        table={{ head: ["ขั้น", "การ์ด", "ผ่านเฉลี่ย", "อยู่ขั้นนี้"], rows: steps.rows.map((r) => [`${r.num}. ${r.name}`, r.cards, `${r.pct}%`, r.here]) }}
      >
        <ProgressRows rows={steps.rows.map((r) => ({ key: r.slug, label: `${r.num}. ${r.name} · ${r.th}`, pct: r.pct, note: `อยู่ขั้นนี้ ${r.here} คน` }))} />
      </ChartCard>
      <ChartCard
        title="การเข้าใช้งาน"
        sub={`น้อง ${interns.length} คน แบ่งตามครั้งล่าสุดที่ login`}
        table={{ head: ["กลุ่ม", "คน"], rows: logins.map((b) => [b.label, b.value]) }}
      >
        <SegmentBar parts={logins} unit="คน" />
      </ChartCard>
    </section>
  );
}

// นับคำถามที่น้องกดถามจากหน้าไหน (pageUrl ติดมากับเรื่องอัตโนมัติจากกล่องท้ายหน้า) ในช่วง HOT_DAYS วันล่าสุด
// รุ่นที่เลือกดูจำไว้ในเบราว์เซอร์ของพี่เลี้ยงคนนั้น (เปิดหลังบ้านครั้งหน้าไม่ต้องเลือกใหม่)
// อ่านหลัง mount เท่านั้น ให้ render แรกตรงกับ server · localStorage ใช้ไม่ได้ (โหมดส่วนตัว) ก็แค่ไม่จำ
const COHORT_KEY = "admin.cohort";
function useCohortFilter() {
  const [f, setF] = useState<CohortFilter>("all");
  useEffect(() => {
    try {
      const v = localStorage.getItem(COHORT_KEY);
      if (v) setF(v === "all" || v === "none" ? v : Number(v));
    } catch {}
  }, []);
  const set = (v: CohortFilter) => {
    setF(v);
    try {
      localStorage.setItem(COHORT_KEY, String(v));
    } catch {}
  };
  return [f, set] as const;
}

function hotPages(threads: AdminState["threads"], now: number) {
  const counts = new Map<string, number>();
  for (const t of threads) {
    if (t.kind !== "question" || !t.pageUrl || now - new Date(t.createdAt).getTime() > HOT_DAYS * DAY) continue;
    counts.set(t.pageUrl, (counts.get(t.pageUrl) ?? 0) + 1);
  }
  return [...counts]
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// ช่อง "งานที่ส่ง" ในตารางน้อง: ผ่าน/ทั้งหมด + ป้ายเตือนเฉพาะที่ต้องทำอะไรต่อ (ไม่มีโจทย์ในรุ่น = ขีด)
function WorkCell({ w, ready }: { w: ReturnType<typeof workSummary> | undefined; ready: boolean }) {
  if (!ready) return <span className="text-fd-muted-foreground">…</span>;
  if (!w || w.total === 0) return <span className="text-fd-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap items-center gap-1.5 whitespace-nowrap">
      <span className="tabular-nums">
        {w.passed}/{w.total}
      </span>
      {w.late > 0 && <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${RED}`}>เลยกำหนด {w.late}</span>}
      {w.oldWaiting > 0 && <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ORANGE}`}>รอตรวจนาน {w.oldWaiting}</span>}
      {w.revise > 0 && <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${BLUE}`}>รอน้องแก้ {w.revise}</span>}
    </div>
  );
}
