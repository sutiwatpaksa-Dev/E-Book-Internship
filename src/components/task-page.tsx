"use client";

import { ArrowLeft, ExternalLink, GitCommitHorizontal, Link2, Send } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { submissionsApi } from "@/api/submissions.api";
import { useMyWork } from "@/hooks/use-my-work";
import { thaiDayMonth } from "@/lib/cohort";
import { percentOf } from "@/lib/rubric";
import { commitsUrl, treeUrl, VERDICT_LABEL } from "@/lib/submission";
import { timeAgo } from "@/lib/thread-labels";
import { dueLabel } from "@/lib/work-plan";
import { ErrorText } from "./error-text";
import { MarkdownBody } from "./markdown-body";
import { VerdictBadge, WorkBadge } from "./status-badge";
import { TaskThread } from "./task-thread";

const fmt = (d: string) => new Date(d).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
const SUBMIT_LINK = "/starter/submission#ส่งงานของคุณ";

// หน้างาน 1 ชิ้น (โจทย์ + รอบ) แบบ timeline: กำหนดส่ง → ที่ส่งไปทุกครั้ง → ผลตรวจและคะแนน → ความเห็น
// ความเห็นเห็นได้เฉพาะเรากับพี่เลี้ยง
export function TaskPage({ assignment, round }: { assignment: string; round: string }) {
  const work = useMyWork("intern");
  const load = useCallback(() => submissionsApi.comments(assignment, round), [assignment, round]);
  const send = useCallback((input: { body: string }) => submissionsApi.comment(assignment, round, input), [assignment, round]);

  const item = work.plan.find((p) => p.assignment === assignment && p.round.id === round);
  // ส่งรอบเดิมซ้ำได้ แสดงเก่า→ใหม่ให้อ่านเป็นเรื่องเล่า
  const subs = (work.data?.items ?? []).filter((s) => s.assignment === assignment && s.round === round).reverse();
  const repo = work.data?.items.find((s) => s.assignment === assignment)?.repoUrl ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/work" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-fd-primary hover:underline">
        <ArrowLeft className="size-4" /> กระดานงาน
      </Link>

      {work.loading ? (
        <p className="text-fd-muted-foreground">กำลังโหลดงาน…</p>
      ) : work.failed ? (
        <ErrorText>โหลดงานไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง</ErrorText>
      ) : !item ? (
        <p>ไม่พบงานนี้ในโจทย์ของคุณ กลับไปเลือกที่กระดานงาน</p>
      ) : (
        <>
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold sm:text-3xl">{item.round.label}</h1>
              <WorkBadge state={item.state} daysLeft={item.daysLeft} />
              {item.lateDays > 0 && <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:text-orange-300">ส่งช้า {item.lateDays} วัน</span>}
            </div>
            <p className="text-fd-muted-foreground">
              {item.assignmentName} · {item.round.what}
            </p>
            <p className="tabular-nums">
              {item.dueOn ? `กำหนดส่ง ${thaiDayMonth(item.dueOn)}` : `กำหนดส่ง วันที่ ${item.round.day} ของรุ่น`}
              {dueLabel(item.daysLeft) && (item.state === "todo" || item.state === "revise") && item.daysLeft! >= 0 && <span className="text-fd-muted-foreground"> · {dueLabel(item.daysLeft)}</span>}
            </p>
            {!work.data?.locked && (
              <Link href={SUBMIT_LINK} className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-xl bg-fd-primary px-4 text-sm font-semibold text-fd-primary-foreground hover:brightness-110">
                <Send className="size-4" /> {subs.length ? "ส่งงานอีกครั้ง" : "ส่งงาน"}
              </Link>
            )}
          </header>

          {(!!item.round.body || !!item.round.links?.length) && (
            <section aria-labelledby="brief-title" className="flex flex-col gap-3 rounded-2xl border border-fd-border bg-fd-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="brief-title" className="text-lg font-bold">
                  คำสั่งงาน
                </h2>
                {item.round.postedBy && (
                  <span className="text-xs text-fd-muted-foreground">
                    {item.round.postedBy} โพสต์{item.round.postedAt ? ` ${timeAgo(item.round.postedAt)}` : ""}
                    {item.round.editedAt ? " · แก้ไขแล้ว" : ""}
                  </span>
                )}
              </div>
              {item.round.body && <MarkdownBody md={item.round.body} className="text-sm" />}
              {item.round.links && item.round.links.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {item.round.links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-fd-border px-3 text-sm text-fd-primary hover:bg-fd-accent">
                        <Link2 className="size-4" /> {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section aria-labelledby="timeline-title" className="flex flex-col gap-3">
            <h2 id="timeline-title" className="text-lg font-bold">
              ที่ส่งไปแล้ว
            </h2>
            {subs.length === 0 ? (
              <p className="text-fd-muted-foreground">ยังไม่ได้ส่งงานรอบนี้ ส่งเป็น tag บน GitHub แล้วกรอกที่หน้าการส่งงาน</p>
            ) : (
              <ol className="relative flex flex-col gap-4 ps-6 before:absolute before:start-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-fd-border">
                {subs.map((s) => (
                  <li key={s.id} className="relative flex flex-col gap-2 rounded-xl border border-fd-border bg-fd-card p-4 text-sm">
                    <span aria-hidden className="absolute -start-[22px] top-5 size-3.5 rounded-full border-2 border-fd-primary bg-fd-card" />
                    <div className="flex flex-wrap items-center gap-2">
                      <a className="inline-flex items-center gap-1 font-mono font-semibold text-fd-primary underline" href={treeUrl(s.repoUrl, s.ref)} target="_blank" rel="noopener noreferrer">
                        <GitCommitHorizontal className="size-4" /> {s.ref} <ExternalLink className="size-3" />
                      </a>
                      <span className="text-xs text-fd-muted-foreground">ส่ง {fmt(s.createdAt)}</span>
                      <span className="ms-auto">
                        <VerdictBadge verdict={s.verdict} />
                      </span>
                    </div>
                    {s.deployUrl && (
                      <a className="break-all text-fd-primary underline" href={s.deployUrl} target="_blank" rel="noopener noreferrer">
                        เว็บที่ deploy: {s.deployUrl.replace("https://", "")}
                      </a>
                    )}
                    {s.note && <p className="whitespace-pre-wrap">ข้อความของฉัน: {s.note}</p>}
                    {s.reviewedAt && (
                      <div className="flex flex-col gap-2 rounded-lg bg-fd-muted px-3 py-2">
                        <p className="whitespace-pre-wrap">
                          <span className="font-semibold">{s.reviewer ?? "พี่เลี้ยง"}:</span> {s.review || VERDICT_LABEL[s.verdict!]} <span className="text-xs text-fd-muted-foreground">· {fmt(s.reviewedAt)}</span>
                        </p>
                        {s.scores && (
                          <div className="flex flex-col gap-1">
                            <p className="font-semibold">
                              คะแนน {s.scores.total}/{s.scores.max} <span className="font-normal text-fd-muted-foreground">({percentOf(s.scores)}%)</span>
                            </p>
                            <ul className="grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
                              {s.scores.items.map((i) => (
                                <li key={i.id} className="flex justify-between gap-2">
                                  <span>{i.label}</span>
                                  <span className="tabular-nums text-fd-muted-foreground">
                                    {i.score}/{i.max}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {repo && (
              <a className="inline-flex min-h-11 w-fit items-center gap-1 text-sm text-fd-primary underline" href={commitsUrl(repo)} target="_blank" rel="noopener noreferrer">
                <GitCommitHorizontal className="size-4" /> ดู commit ทั้งหมดบน GitHub
              </a>
            )}
          </section>

          <section aria-labelledby="talk-title" className="flex flex-col gap-3">
            <h2 id="talk-title" className="text-lg font-bold">
              ความเห็น
            </h2>
            <p className="text-sm text-fd-muted-foreground">เห็นแค่คุณกับพี่เลี้ยง เขียนถามหรือเล่าความคืบหน้าของงานนี้ได้ เรื่องนอกงานใช้ &quot;ถามพี่เลี้ยง&quot;</p>
            <TaskThread load={load} send={send} />
          </section>
        </>
      )}
    </div>
  );
}
