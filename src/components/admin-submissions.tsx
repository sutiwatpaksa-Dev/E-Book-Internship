"use client";

import { ExternalLink, FolderGit2, GitCommitHorizontal } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { submissionsApi } from "@/api/submissions.api";
import type { AdminState } from "@/hooks/use-admin";
import { toast } from "@/hooks/use-toast";
import { commitsUrl, isReviewable, latestOnly, repoOf, roundLabel, treeUrl, VERDICT_LABEL, waitingOf, type Verdict } from "@/lib/submission";
import type { AdminSubmission } from "@/types";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { ErrorText } from "./error-text";
import { inputClass } from "./field";
import { VerdictBadge } from "./status-badge";

const fmt = (d: string) => new Date(d).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
const card = "flex flex-col gap-2 rounded-xl border border-fd-border bg-fd-card p-4 text-sm";

// โหลดงานที่ส่งทั้งหมดครั้งเดียว ใช้ทั้งแท็บ "งานที่ส่ง" และหน้าน้องรายคน
export function useSubmissions() {
  const [items, setItems] = useState<AdminSubmission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = () =>
    submissionsApi
      .all()
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message));
  useEffect(() => {
    reload();
  }, []);
  return { items, error, reload };
}

// แท็บงานที่ส่ง: ค่าเริ่มต้นโชว์แค่ที่รอตรวจ (ครั้งล่าสุดของแต่ละรอบ) · สลับดูทั้งหมดได้
export function AdminSubmissions({ admin, onChange }: { admin: AdminState; onChange: () => void }) {
  const { items, error, reload } = useSubmissions();
  const [show, setShow] = useState<"waiting" | "latest">("waiting");
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!items) return <p className="text-sm text-fd-muted-foreground">กำลังโหลด…</p>;
  const cohortName = (id: number | null) => admin.cohorts.find((c) => c.id === id)?.name ?? "ไม่มีรุ่น";
  const list = show === "waiting" ? waitingOf(items) : latestOnly(items).filter((s) => isReviewable(s.round));
  const after = () => {
    reload();
    onChange();
  };

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <RepoList admin={admin} items={items} />
      <h2 className="text-base font-semibold">งานที่ส่งตรวจ</h2>
      <p className="text-sm text-fd-muted-foreground">น้องส่ง tag บน GitHub กดลิงก์เพื่อดูโค้ด ณ จุดที่ส่ง · ส่งซ้ำรอบเดิม = ตรวจแค่ครั้งล่าสุด</p>
      <div role="group" aria-label="แสดง" className="flex gap-2">
        {(["waiting", "latest"] as const).map((k) => (
          <Button key={k} variant={show === k ? "primary" : "ghost"} aria-pressed={show === k} onClick={() => setShow(k)} className="min-h-11">
            {k === "waiting" ? `รอตรวจ (${waitingOf(items).length})` : "ทั้งหมด (ครั้งล่าสุดของแต่ละรอบ)"}
          </Button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={FolderGit2} title={show === "waiting" ? "ไม่มีงานรอตรวจ" : "ยังไม่มีใครส่งงาน"}>
          น้องส่งงานได้ที่หน้า "การส่งงาน + เกณฑ์" แล้วจะขึ้นที่นี่พร้อมแจ้งเตือน
        </EmptyState>
      ) : (
        list.map((s) => (
          <SubmissionCard key={s.id} s={s} who={`${s.username}${s.nickname ? ` (${s.nickname})` : ""} · ${cohortName(s.cohortId)}`} history={items.filter((x) => x.userId === s.userId && x.round === s.round && x.assignment === s.assignment).length} onReviewed={after} />
        ))
      )}
    </div>
  );
}

// repo ของน้องทุกคนในรุ่นที่ยังไม่จบ: ตามดูโค้ดได้ตั้งแต่วันที่ 1 ไม่ต้องรอวันตรวจ · คนที่ยังไม่ส่งลิงก์ขึ้นให้เห็นจะได้ทัก
function RepoList({ admin, items }: { admin: AdminState; items: AdminSubmission[] }) {
  const running = new Set(admin.cohorts.filter((c) => !c.endedAt).map((c) => c.id));
  const interns = admin.users.filter((u) => u.role === "intern" && !u.disabled && u.cohortId !== null && running.has(u.cohortId));
  if (interns.length === 0) return null;
  const missing = interns.filter((u) => !repoOf(items, u.id)).length;
  return (
    <section aria-labelledby="repo-list" className={card}>
      <h2 id="repo-list" className="text-base font-semibold">
        repo ของน้อง (รุ่นที่กำลังฝึก){missing > 0 && <span className="font-normal text-fd-muted-foreground"> · ยังไม่ส่งลิงก์ {missing} คน</span>}
      </h2>
      <ul className="flex flex-col">
        {interns.map((u) => {
          const repo = repoOf(items, u.id);
          return (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-x-3 border-t border-fd-border py-1 first:border-t-0">
              <span className="font-medium">
                {u.username}
                {u.nickname ? ` (${u.nickname})` : ""}
              </span>
              {repo ? <RepoLinks repo={repo} /> : <span className="py-3 text-fd-muted-foreground">ยังไม่ส่งลิงก์ repo</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RepoLinks({ repo }: { repo: string }) {
  const link = "inline-flex min-h-11 items-center gap-1 text-fd-primary underline";
  return (
    <span className="flex flex-wrap items-center gap-x-3">
      <a className={`${link} break-all font-mono`} href={repo} target="_blank" rel="noopener noreferrer">
        {repo.replace("https://github.com/", "")}
        <ExternalLink className="size-3 shrink-0" />
      </a>
      <a className={link} href={commitsUrl(repo)} target="_blank" rel="noopener noreferrer">
        <GitCommitHorizontal className="size-4" /> commit
      </a>
    </span>
  );
}

// งานของน้องคนเดียว (หน้าน้องรายคน): repo + ครั้งล่าสุดของแต่ละรอบ
export function InternSubmissions({ userId }: { userId: number }) {
  const { items, error, reload } = useSubmissions();
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!items) return null;
  const repo = repoOf(items, userId);
  const mine = latestOnly(items.filter((s) => s.userId === userId && isReviewable(s.round)));
  return (
    <section aria-labelledby="intern-subs" className="flex flex-col gap-2">
      <h2 id="intern-subs" className="text-base font-semibold">
        งานที่ส่ง
      </h2>
      {repo ? <RepoLinks repo={repo} /> : <p className="text-sm text-fd-muted-foreground">ยังไม่ส่งลิงก์ repo</p>}
      {mine.length === 0 ? <p className="text-sm text-fd-muted-foreground">ยังไม่ได้ส่งตรวจ</p> : mine.map((s) => <SubmissionCard key={s.id} s={s} onReviewed={reload} />)}
    </section>
  );
}

function SubmissionCard({ s, who, history = 1, onReviewed }: { s: AdminSubmission; who?: string; history?: number; onReviewed: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">
          {who && <>{who} · </>}
          {roundLabel(s.round)}
        </span>
        <VerdictBadge verdict={s.verdict} />
      </div>
      <span className="text-fd-muted-foreground">
        {s.assignmentName} ·{" "}
        <a className="inline-flex items-center gap-1 font-mono text-fd-primary underline" href={treeUrl(s.repoUrl, s.ref)} target="_blank" rel="noopener noreferrer">
          {s.ref}
          <ExternalLink className="size-3" />
        </a>{" "}
        · ส่ง {fmt(s.createdAt)}
        {history > 1 && ` · ส่งรอบนี้ ${history} ครั้ง`}
      </span>
      <span className="break-all text-xs text-fd-muted-foreground">{s.repoUrl}</span>
      {s.deployUrl && (
        <a className="inline-flex items-center gap-1 break-all text-fd-primary underline" href={s.deployUrl} target="_blank" rel="noopener noreferrer">
          เว็บที่ deploy: {s.deployUrl.replace("https://", "")}
          <ExternalLink className="size-3 shrink-0" />
        </a>
      )}
      {s.note && <p className="whitespace-pre-wrap">น้อง: {s.note}</p>}
      {s.reviewedAt && (
        <p className="whitespace-pre-wrap rounded-lg bg-fd-muted px-3 py-2">
          <span className="font-semibold">{s.reviewer ?? "พี่เลี้ยง"}:</span> {s.review || VERDICT_LABEL[s.verdict!]} <span className="text-xs text-fd-muted-foreground">· {fmt(s.reviewedAt)}</span>
        </p>
      )}
      {open ? (
        <ReviewForm s={s} onDone={() => (setOpen(false), onReviewed())} onCancel={() => setOpen(false)} />
      ) : (
        <Button variant="ghost" onClick={() => setOpen(true)} className="min-h-11 w-fit">
          {s.reviewedAt ? "แก้ผลตรวจ" : "ตรวจงานนี้"}
        </Button>
      )}
    </article>
  );
}

function ReviewForm({ s, onDone, onCancel }: { s: AdminSubmission; onDone: () => void; onCancel: () => void }) {
  const [verdict, setVerdict] = useState<Verdict>(s.verdict ?? "pass");
  const [review, setReview] = useState(s.review ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // กฎเดียวกับ server: ให้แก้ต้องบอกว่าแก้อะไร
  const missing = verdict === "revise" && !review.trim();
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (missing) return void toast.error("ถ้าให้แก้ เขียนบอกน้องด้วยว่าต้องแก้อะไร");
    setSaving(true);
    try {
      await submissionsApi.review(s.id, verdict, review.trim());
      toast.success(`บันทึกผลตรวจแล้ว ${s.username} ได้รับแจ้งเตือน`);
      onDone();
    } catch (err) {
      setError((err as Error).message);
      toast.error(`บันทึกผลตรวจไม่สำเร็จ: ${(err as Error).message}`);
      setSaving(false);
    }
  };
  return (
    <form onSubmit={save} aria-label="ผลตรวจ" className="flex flex-col gap-3 border-t border-fd-border pt-3">
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-1 font-medium">ผลตรวจ</legend>
        {(["pass", "revise"] as const).map((v) => (
          <label key={v} className="flex min-h-11 items-center gap-2">
            <input type="radio" name={`verdict-${s.id}`} checked={verdict === v} onChange={() => setVerdict(v)} />
            {VERDICT_LABEL[v]}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1 font-medium">
        ความเห็นถึงน้อง {verdict === "pass" && <span className="text-xs font-normal text-fd-muted-foreground">(ไม่บังคับ)</span>}
        <textarea className={`${inputClass} min-h-24`} value={review} onChange={(e) => setReview(e.target.value)} maxLength={2000} aria-invalid={missing} placeholder="เช่น POST /api/contact ยังไม่ตรวจด้วย Zod · README ขาดวิธีรัน seed" />
      </label>
      {missing && <p role="alert" className="text-sm text-red-700 dark:text-red-400">ถ้าให้แก้ เขียนบอกน้องด้วยว่าต้องแก้อะไร</p>}
      {error && <ErrorText>{error}</ErrorText>}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => (toast.info("ยกเลิกแล้ว ยังไม่ได้บันทึกผลตรวจ"), onCancel())} className="min-h-11">
          ยกเลิก
        </Button>
        <Button type="submit" disabled={saving} className="min-h-11">
          บันทึกผลตรวจ
        </Button>
      </div>
    </form>
  );
}
