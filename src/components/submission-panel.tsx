"use client";

import { ExternalLink, GitCommitHorizontal, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { submissionsApi } from "@/api/submissions.api";
import { useSession } from "@/hooks/use-session";
import { toast } from "@/hooks/use-toast";
import { commitsUrl, isReviewable, latestOnly, refProblem, repoProblem, roundLabel, START_ROUND, SUBMISSION_ROUNDS, treeUrl } from "@/lib/submission";
import type { MySubmissions, Submission } from "@/types";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";
import { VerdictBadge } from "./status-badge";

const fmt = (d: string) => new Date(d).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
const box = "not-prose flex flex-col gap-3 rounded-2xl border border-fd-border bg-fd-card p-4 text-sm";

// ส่งงานของน้องในหน้า "การส่งงาน + เกณฑ์": โค้ดอยู่บน GitHub แล้ว ที่นี่แค่บอกพี่เลี้ยงว่า "ตรวจ tag นี้"
// พี่เลี้ยงที่เปิดหน้านี้ได้ลิงก์ไปหลังบ้านแทนฟอร์ม
export function SubmissionPanel() {
  const { role } = useSession();
  if (role === "dev")
    return (
      <p className={box}>
        พี่เลี้ยงตรวจงานที่น้องส่งได้ที่{" "}
        <Link className="font-semibold text-fd-primary underline" href="/dev/admin?tab=submissions">
          หลังบ้าน → งานที่ส่ง
        </Link>
      </p>
    );
  // หน้านี้ต้อง login อยู่แล้ว (server ตรวจก่อนส่งหน้า) ตอน render ฝั่ง server ยังไม่รู้ role จึงให้ API ตัดสิน ไม่ขึ้น "login ก่อน" หลอก
  return <InternSubmission />;
}

function InternSubmission() {
  const [data, setData] = useState<MySubmissions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () =>
    submissionsApi
      .mine()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <p className={box}>กำลังโหลด…</p>;
  if (data.assignments.length === 0) return <p className={box}>รุ่นของคุณยังไม่มีโจทย์ ส่งงานไม่ได้ ติดต่อพี่เลี้ยงประจำรุ่น</p>;
  return <SubmissionView data={data} reload={load} />;
}

function SubmissionView({ data, reload }: { data: MySubmissions; reload: () => void }) {
  const [assignment, setAssignment] = useState(data.assignments[0].slug);
  const items = data.items.filter((s) => s.assignment === assignment);
  const latest = latestOnly(items.map((s) => ({ ...s, userId: 0 })));
  const ofRound = (id: string) => latest.find((s) => s.round === id);
  // ลิงก์ repo ล่าสุดของโจทย์นี้ (จากการส่งครั้งไหนก็ได้) · ยังไม่มี = ยังไม่ได้ลงทะเบียน
  const repo = items[0]?.repoUrl ?? null;

  return (
    <div className="not-prose flex flex-col gap-4">
      {data.assignments.length > 1 && (
        <Field label="โจทย์ที่ส่ง">
          <select className={inputClass} value={assignment} onChange={(e) => setAssignment(e.target.value)}>
            {data.assignments.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <RepoBox assignment={assignment} repo={repo} locked={data.locked} onSent={reload} />

      <ol className="flex flex-col gap-2">
        {SUBMISSION_ROUNDS.map((r) => {
          const s = ofRound(r.id);
          return (
            <li key={r.id} className={box}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">
                  {r.label} <span className="font-normal text-fd-muted-foreground">· วันที่ {r.day} · {r.what}</span>
                </span>
                {s ? <VerdictBadge verdict={s.verdict} /> : <span className="text-xs text-fd-muted-foreground">ยังไม่ส่ง</span>}
              </div>
              {s && <SentLine s={s} />}
            </li>
          );
        })}
      </ol>

      {data.locked ? (
        <p className={box}>รุ่นของคุณจบแล้ว ส่งงานเพิ่มไม่ได้ ประวัติการส่งด้านบนยังดูได้ตามเดิม</p>
      ) : !repo ? (
        <p className={box}>ส่งลิงก์ repo ด้านบนก่อน แล้วฟอร์มส่งงานตรวจจะขึ้นตรงนี้</p>
      ) : (
        <SubmitForm
          assignment={assignment}
          // รอบที่ควรส่งต่อ: รอบแรกที่ยังไม่ผ่าน
          defaultRound={SUBMISSION_ROUNDS.find((r) => ofRound(r.id)?.verdict !== "pass")?.id ?? "final"}
          // ใส่ลิงก์ repo ครั้งเดียว ครั้งต่อไปเติมให้จากที่ส่งล่าสุด
          lastRepo={repo ?? data.items[0]?.repoUrl ?? ""}
          onSent={reload}
        />
      )}

      {items.length > latest.length && (
        <details className={box}>
          <summary className="cursor-pointer font-semibold">ประวัติการส่งทั้งหมด ({items.length} ครั้ง)</summary>
          <ul className="flex flex-col gap-3">
            {items.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 border-t border-fd-border pt-2">
                <span className="flex flex-wrap items-center gap-2">
                  {roundLabel(s.round)} {isReviewable(s.round) && <VerdictBadge verdict={s.verdict} />}
                </span>
                <SentLine s={s} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

// วันที่ 1: ส่งลิงก์ repo ครั้งเดียว พี่เลี้ยงตามดูโค้ดได้ทุกวันโดยไม่ต้องรอวันตรวจ · เปลี่ยน repo ได้ (ส่งใหม่ = แถวใหม่)
function RepoBox({ assignment, repo, locked, onSent }: { assignment: string; repo: string | null; locked: boolean; onSent: () => void }) {
  const [editing, setEditing] = useState(false);
  const [repoUrl, setRepoUrl] = useState(repo ?? "");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const err = touched || repoUrl ? repoProblem(repoUrl) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (repoProblem(repoUrl)) return;
    setSending(true);
    setError(null);
    try {
      await submissionsApi.submit({ assignment, round: START_ROUND, repoUrl, ref: "", note: "" });
      toast.success("ส่งลิงก์ repo แล้ว พี่เลี้ยงตามดูโค้ดได้เลย");
      setEditing(false);
      onSent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (repo && !editing)
    return (
      <div className={box}>
        <span className="font-semibold">repo ของฉันบน GitHub</span>
        <a className="inline-flex items-center gap-1 break-all font-mono text-fd-primary underline" href={repo} target="_blank" rel="noopener noreferrer">
          {repo.replace("https://", "")}
          <ExternalLink className="size-3 shrink-0" />
        </a>
        <p className="text-fd-muted-foreground">พี่เลี้ยงเปิดดูโค้ดได้ตลอด push ทุกวันแม้งานยังไม่เสร็จ</p>
        <div className="flex flex-wrap gap-2">
          <a className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-fd-border px-4 font-semibold hover:bg-fd-accent" href={commitsUrl(repo)} target="_blank" rel="noopener noreferrer">
            <GitCommitHorizontal className="size-4" /> ดู commit ล่าสุด
          </a>
          {!locked && (
            <Button variant="ghost" className="min-h-11" onClick={() => setEditing(true)}>
              เปลี่ยน repo
            </Button>
          )}
        </div>
      </div>
    );
  if (locked) return null;
  return (
    <form onSubmit={submit} aria-label="ส่งลิงก์ repo" className={`${box} border-2 border-fd-primary/40`}>
      <h3 className="text-base font-semibold">{repo ? "เปลี่ยน repo" : "ขั้นแรก: ส่งลิงก์ repo (วันที่ 1)"}</h3>
      <p className="text-fd-muted-foreground">ส่งครั้งเดียวหลัง push ครั้งแรก พี่เลี้ยงจะตามดูโค้ดได้ทุกวัน ไม่ต้องรอวันตรวจ ยังไม่ต้องติด tag</p>
      <Field label="ลิงก์ repo บน GitHub" hint="repo แบบ private ต้องเชิญพี่เลี้ยงเป็น collaborator ก่อน">
        <Input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/somchai/starter"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={300}
          aria-invalid={!!err}
        />
      </Field>
      {err && <p role="alert" className="-mt-2 text-sm text-red-700 dark:text-red-400">{err}</p>}
      {error && <ErrorText>{error}</ErrorText>}
      <div className="flex flex-wrap gap-2">
        {repo && (
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => (setEditing(false), setRepoUrl(repo))}>
            ยกเลิก
          </Button>
        )}
        <Button type="submit" disabled={sending} className="min-h-11 w-fit">
          <Send className="size-4" /> {sending ? "กำลังส่ง…" : "ส่งลิงก์ repo"}
        </Button>
      </div>
    </form>
  );
}

// ส่งอะไรไป เมื่อไร + ผลตรวจของพี่เลี้ยง
function SentLine({ s }: { s: Submission }) {
  if (s.round === START_ROUND)
    return (
      <span className="break-all text-fd-muted-foreground">
        {s.repoUrl.replace("https://", "")} · {fmt(s.createdAt)}
      </span>
    );
  return (
    <div className="flex flex-col gap-1">
      <span className="text-fd-muted-foreground">
        ส่ง{" "}
        <a className="inline-flex items-center gap-1 font-mono text-fd-primary underline" href={treeUrl(s.repoUrl, s.ref)} target="_blank" rel="noopener noreferrer">
          {s.ref}
          <ExternalLink className="size-3" />
        </a>{" "}
        เมื่อ {fmt(s.createdAt)}
      </span>
      {s.note && <p className="whitespace-pre-wrap">ถึงพี่เลี้ยง: {s.note}</p>}
      {s.reviewedAt && (
        <p className="whitespace-pre-wrap rounded-lg bg-fd-muted px-3 py-2">
          <span className="font-semibold">พี่เลี้ยง{s.reviewer ? ` (${s.reviewer})` : ""}:</span> {s.review || "ผ่านรอบนี้"}
        </p>
      )}
    </div>
  );
}

function SubmitForm({ assignment, defaultRound, lastRepo, onSent }: { assignment: string; defaultRound: string; lastRepo: string; onSent: () => void }) {
  const [round, setRound] = useState(defaultRound);
  const [repoUrl, setRepoUrl] = useState(lastRepo);
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setRound(defaultRound), [defaultRound]);

  // บอกผิดใต้ช่องเมื่อพิมพ์แล้ว (ช่องว่างตอนเพิ่งเปิดหน้ายังไม่ขึ้นแดง)
  const repoErr = touched || repoUrl ? repoProblem(repoUrl) : null;
  const refErr = touched || ref ? refProblem(ref) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (repoProblem(repoUrl) || refProblem(ref)) return;
    setSending(true);
    setError(null);
    try {
      await submissionsApi.submit({ assignment, round, repoUrl, ref, note });
      toast.success("ส่งงานแล้ว พี่เลี้ยงได้รับแจ้งเตือน");
      setRef("");
      setNote("");
      setTouched(false);
      onSent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label="ส่งงาน" className={`${box} border-2 border-fd-primary/40`}>
      <h3 className="text-base font-semibold">ส่งงาน / ส่งงานที่แก้แล้ว</h3>
      <Field label="รอบ">
        <select className={inputClass} value={round} onChange={(e) => setRound(e.target.value)}>
          {SUBMISSION_ROUNDS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label} (วันที่ {r.day})
            </option>
          ))}
        </select>
      </Field>
      <Field label="ลิงก์ repo บน GitHub" hint="ใส่ครั้งเดียว ครั้งต่อไประบบเติมให้ · repo แบบ private ต้องเชิญพี่เลี้ยงเป็น collaborator ก่อน">
        <Input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/somchai/starter"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={300}
          aria-invalid={!!repoErr}
        />
      </Field>
      {repoErr && <p role="alert" className="-mt-2 text-sm text-red-700 dark:text-red-400">{repoErr}</p>}
      <Field label="tag หรือ commit ที่ส่ง" hint={<>push tag ขึ้น GitHub ก่อน เช่น <code>git tag review-1</code> แล้ว <code>git push origin review-1</code> · ส่งใหม่ใช้ชื่อใหม่ เช่น review-1-fix1</>}>
        <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="review-1" autoCapitalize="none" spellCheck={false} maxLength={100} aria-invalid={!!refErr} />
      </Field>
      {refErr && <p role="alert" className="-mt-2 text-sm text-red-700 dark:text-red-400">{refErr}</p>}
      <Field label="ข้อความถึงพี่เลี้ยง (ไม่บังคับ)" hint="รอบนี้ทำอะไรเสร็จ ยังค้างอะไร หรืออยากให้ดูตรงไหนเป็นพิเศษ">
        <textarea className={`${inputClass} min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
      <p className="text-xs text-fd-muted-foreground">เว็บนี้ไม่ได้เปิดดูโค้ดให้ พี่เลี้ยงกดลิงก์ไปดูบน GitHub เอง ลองกดลิงก์ของตัวเองหลังส่งว่าเปิดได้</p>
      <Button type="submit" disabled={sending} className="min-h-11 w-fit">
        <Send className="size-4" /> {sending ? "กำลังส่ง…" : "ส่งงาน"}
      </Button>
    </form>
  );
}
