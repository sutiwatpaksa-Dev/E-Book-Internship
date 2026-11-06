"use client";

import { CalendarDays, Link2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import type { AdminState } from "@/hooks/use-admin";
import { toast } from "@/hooks/use-toast";
import { dayOfDate, isWeekend, thaiDayMonth, workdayDate } from "@/lib/cohort";
import { timeAgo } from "@/lib/thread-labels";
import { BODY_MAX, latestOnly, LINKS_MAX, linksProblem, OVERVIEW_MAX, criteriaOf, weightOf, weightTotal, type PostPdf, type RoundDef, type TaskLink } from "@/lib/submission";
import type { AdminAssignment, Cohort, PostSend } from "@/types";
import { criteriaProblem, type Criterion } from "@/lib/rubric";
import { CriteriaEditor } from "./criteria-editor";
import { MarkdownEditor } from "./markdown-editor";
import { inCohort, type CohortFilter } from "@/lib/cohort";
import type { AdminNav } from "./admin-panel";
import { useSubmissions } from "./admin-submissions";
import { Button } from "./button";
import { ConfirmBox } from "./confirm-box";
import { EmptyState } from "./empty-state";
import { inputClass } from "./field";
import { MarkdownBody } from "./markdown-body";

// แท็บ "โพสต์งาน": ตั้งงานให้น้องแบบโพสต์ (ช่องเขียนด้านบนเหมือนโพสต์ Facebook) · ชื่อ คำสั่งงาน กำหนดส่ง ลิงก์แนบ แบบ Classroom
// คำสั่งงานเขียนเป็น Markdown แบบ GitHub (หัวข้อ checklist โค้ด ตาราง) มีแท็บดูตัวอย่างก่อนโพสต์
// โพสต์ 1 ชิ้นคือ 1 รอบของโจทย์ (assignments.rubric.rounds) น้องส่งงานเป็น tag บน GitHub ผ่านระบบส่งงานเดิม
const STARTER_BODY = `## เป้าหมาย
งานนี้ต้องได้อะไร (เขียน 1–2 ประโยค)

## ต้องส่งอะไร
- [ ] tag \`review-1\` บน GitHub
- [ ] README บอกวิธีรัน

## พี่จะดูอะไร
- ทำงานได้ตามโจทย์
- commit เป็นช่วง ข้อความชัด
`;

// โจทย์เป็นของรุ่นเดียว (0023) แต่ละรุ่นมีสำเนาของตัวเอง หน้านี้จึงแสดงตามรุ่นที่เลือกในแถบเลือกรุ่นด้านบน
const ownerOf = (a: AdminAssignment) => a.cohortIds[0] ?? null;

export function AdminBoard({ admin, nav, cohort, mine }: { admin: AdminState; nav: AdminNav; cohort: CohortFilter; mine: readonly number[] }) {
  const { items: subs } = useSubmissions();
  const [editing, setEditing] = useState<{ a: AdminAssignment; r: RoundDef } | "new" | null>(null);
  const [removing, setRemoving] = useState<{ a: AdminAssignment; r: RoundDef } | null>(null);

  // ทุกโพสต์ของรุ่นที่เลือก เรียงตามวันส่ง (ลำดับเดียวกับที่น้องเห็นในหน้างานที่ต้องส่ง)
  const scoped = useMemo(() => admin.assignments.filter((a) => inCohort(ownerOf(a), cohort, mine)), [admin.assignments, cohort, mine]);
  const posts = useMemo(
    () =>
      scoped
        .flatMap((a) => a.rounds.map((r) => ({ a, r })))
        .sort((x, y) => x.r.day - y.r.day || x.a.id - y.a.id),
    [scoped],
  );

  // แถบ % คะแนน: เห็นได้เมื่อเลือกรุ่นเดียว (แต่ละรุ่นมีชุดโพสต์ของตัวเอง)
  const single = scoped.length > 0 && new Set(scoped.map(ownerOf)).size === 1 ? scoped : null;
  const weighted = single ? single.flatMap((a) => a.rounds).filter((r) => weightOf(r) > 0).sort((x, y) => x.day - y.day) : [];
  const sum = weighted.reduce((n, r) => n + weightOf(r), 0);
  const locked = !!single && (subs ?? []).some((s) => s.reviewedAt && single.some((a) => s.assignment === a.slug && s.cohortId === ownerOf(a)));

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {single && (
        <section aria-labelledby="weight-title" className="flex flex-col gap-2 rounded-2xl border border-fd-border bg-fd-card p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="weight-title" className="font-semibold">
              คะแนนงานของรุ่นนี้มาจากโพสต์ไหนบ้าง
            </h2>
            <span className={`ms-auto font-semibold ${locked ? "text-fd-muted-foreground" : sum === 100 ? "text-green-800 dark:text-green-400" : "text-amber-800 dark:text-amber-300"}`}>
              {locked ? "ล็อกแล้ว (ตรวจงานไปแล้ว)" : sum === 100 ? "ครบ 100%" : `ยังขาด ${100 - sum}%`}
            </span>
          </div>
          <div className="flex h-8 overflow-hidden rounded-lg bg-fd-muted" aria-hidden>
            {weighted.map((r, i) => (
              <span key={r.id} className={`flex items-center justify-center overflow-hidden whitespace-nowrap border-e-2 border-fd-card px-1 text-xs font-semibold text-white last:border-e-0 ${["bg-sky-700", "bg-sky-800", "bg-blue-900", "bg-indigo-900"][i % 4]}`} style={{ width: `${weightOf(r)}%` }}>
                <span className="hidden truncate sm:inline">{r.label} ·&nbsp;</span>
                {weightOf(r)}%
              </span>
            ))}
          </div>
          <p className="text-fd-muted-foreground">
            {weighted.map((r) => `${r.label} ${weightOf(r)}%`).join(" · ") || "ยังไม่มีโพสต์ที่นับคะแนน"} · {locked ? "แก้ % ไม่ได้แล้ว ให้น้องทุกคนคิดคะแนนแบบเดียวกัน" : "แก้ % ได้ในโพสต์แต่ละชิ้น จนกว่าจะตรวจงานชิ้นแรก"}
          </p>
        </section>
      )}
      {editing ? (
        <PostComposer
          key={editing === "new" ? "new" : `${editing.a.id}/${editing.r.id}`}
          admin={admin}
          scoped={scoped}
          edit={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-fd-border bg-fd-card px-4 text-start text-fd-muted-foreground hover:bg-fd-accent/40"
        >
          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground">
            <Plus className="size-5" />
          </span>
          โพสต์งานใหม่ให้น้อง…
        </button>
      )}

      {removing && (
        <ConfirmBox
          title={`ลบโพสต์ "${removing.r.label}"?`}
          confirmLabel="ลบโพสต์"
          danger
          onCancel={() => setRemoving(null)}
          onConfirm={async () => {
            if (await admin.removePost(removing.a.id, removing.r.id)) setRemoving(null);
          }}
        >
          โพสต์หายจากหน้าของน้องทันที · ถ้ามีน้องส่งงานรอบนี้แล้ว ระบบจะไม่ให้ลบ (แก้ชื่อหรือวันแทนได้)
        </ConfirmBox>
      )}

      {posts.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="ยังไม่มีโพสต์งาน"
          action={
            scoped.length === 0 ? <Button onClick={() => nav.goTab("cohorts")}>ไปที่หน้ารุ่น</Button> : undefined
          }
        >
          {scoped.length === 0 ? "รุ่นที่เลือกยังไม่มีกล่องงาน รุ่นใหม่ได้สำเนาจากรุ่นล่าสุดตอนสร้างรุ่น · ถ้าเลือก \"ทุกรุ่น\" อยู่ ลองเลือกรุ่นเดียว" : "กดช่องด้านบนเพื่อโพสต์งานแรก"}
        </EmptyState>
      ) : (
        posts.map(({ a, r }) => (
          <PostCard key={`${a.id}/${r.id}`} admin={admin} a={a} r={r} subs={subs} onEdit={() => (setEditing({ a, r }), window.scrollTo({ top: 0, behavior: "smooth" }))} onRemove={() => setRemoving({ a, r })} onSubs={() => nav.goTab("submissions")} />
        ))
      )}
    </div>
  );
}

const usingCohorts = (admin: AdminState, a: AdminAssignment) => admin.cohorts.filter((c) => a.cohortIds.includes(c.id));

// ---------- การ์ดโพสต์ ----------
function PostCard({ admin, a, r, subs, onEdit, onRemove, onSubs }: { admin: AdminState; a: AdminAssignment; r: RoundDef; subs: ReturnType<typeof useSubmissions>["items"]; onEdit: () => void; onRemove: () => void; onSubs: () => void }) {
  const [open, setOpen] = useState(false);
  const [allCohorts, setAllCohorts] = useState(false);
  const cohorts = usingCohorts(admin, a);
  // รุ่นที่ยังไม่จบมาก่อน · เกิน 2 รุ่นย่อเป็นปุ่ม "อีก N รุ่น" กันป้ายยาวหลายแถว
  const live = cohorts.filter((c) => !c.endedAt);
  const shownCohorts = allCohorts ? cohorts : live.slice(0, 2);
  const hiddenCohorts = cohorts.length - shownCohorts.length;
  const interns = admin.users.filter((u) => u.role === "intern" && !u.disabled && u.cohortId !== null && cohorts.some((c) => c.id === u.cohortId && !c.endedAt));
  const mine = latestOnly((subs ?? []).filter((s) => s.assignment === a.slug && s.round === r.id));
  const ofInterns = mine.filter((s) => interns.some((u) => u.id === s.userId));
  const sent = ofInterns.length;
  const waiting = ofInterns.filter((s) => !s.reviewedAt).length;
  const passed = ofInterns.filter((s) => s.verdict === "pass").length;
  const total = criteriaOf(r, a.criteria).reduce((n, c) => n + c.max, 0);
  const who = r.postedBy ?? a.name;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-fd-border bg-fd-card p-4 text-sm sm:p-5">
      <header className="flex items-start gap-3">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fd-primary/15 font-bold text-fd-primary">
          {who.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{who}</span>
          <span className="text-xs text-fd-muted-foreground">
            {r.postedAt ? `โพสต์ ${timeAgo(r.postedAt)}${r.editedAt ? " · แก้ไขแล้ว" : ""} · ` : ""}
            {a.name}
          </span>
        </div>
        <Button variant="ghost" onClick={onEdit} className="min-h-11">
          <Pencil className="size-4" /> แก้ไข
        </Button>
        <Button variant="ghost" onClick={onRemove} aria-label={`ลบโพสต์ ${r.label}`} title="ลบโพสต์ (มีหน้าต่างให้ยืนยันก่อน)" className="ms-3 min-h-11 text-red-700 hover:bg-red-500/10 dark:text-red-400">
          <Trash2 className="size-4" />
        </Button>
      </header>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold">{r.label}</h3>
        {r.what && <p className="text-fd-muted-foreground">{r.what}</p>}
      </div>

      {r.body && (
        <div>
          <div className={open ? "" : "max-h-40 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"}>
            <MarkdownBody md={r.body} className="text-sm" />
          </div>
          <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 min-h-11 text-sm font-medium text-fd-primary hover:underline">
            {open ? "ย่อ" : "ดูคำสั่งงานทั้งหมด"}
          </button>
        </div>
      )}

      {(r.links?.length ?? 0) > 0 && (
        <ul className="flex flex-wrap gap-2">
          {r.links!.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-fd-border px-3 text-fd-primary hover:bg-fd-accent">
                <Link2 className="size-3.5" /> {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {cohorts.length === 0 ? (
          <span className="rounded-md bg-amber-500/15 px-2 py-1 font-semibold text-amber-800 dark:text-amber-300">ยังไม่มีรุ่นใช้โจทย์นี้ น้องจึงยังไม่เห็น</span>
        ) : (
          <>
            {shownCohorts.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-fd-muted px-2 py-1">
                <CalendarDays className="size-3.5" aria-hidden /> {c.name}: ส่ง {thaiDayMonth(workdayDate(c.startsOn, r.day) ?? c.startsOn)}
                {c.endedAt && " (จบแล้ว)"}
              </span>
            ))}
            {(hiddenCohorts > 0 || allCohorts) && (
              <button type="button" onClick={() => setAllCohorts((v) => !v)} aria-expanded={allCohorts} className="inline-flex min-h-8 items-center rounded-md border border-fd-border px-2 text-fd-primary hover:bg-fd-accent">
                {allCohorts ? "ย่อ" : `อีก ${hiddenCohorts} รุ่น`}
              </button>
            )}
          </>
        )}
        <span className="rounded-md bg-fd-muted px-2 py-1">{weightOf(r) ? `นับ ${weightOf(r)}% ของคะแนนงาน` : "ไม่นับคะแนน"}</span>
        <span className="rounded-md bg-fd-muted px-2 py-1">{total ? `เกณฑ์เต็ม ${total}` : "ตรวจ ผ่าน/แก้"}</span>
        {r.pdf !== "none" && (r.pdf === "own" || a.pdf) && <span className="rounded-md bg-fd-muted px-2 py-1">{r.pdf === "own" ? "PDF ของโพสต์นี้" : "PDF ของรุ่น"}</span>}
        {r.deploy && <span className="rounded-md bg-fd-muted px-2 py-1">ต้องส่งลิงก์เว็บ</span>}
      </div>

      {interns.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-fd-border pt-3">
          <div className="h-2 overflow-hidden rounded-full bg-fd-muted" role="progressbar" aria-valuenow={sent} aria-valuemin={0} aria-valuemax={interns.length} aria-label="จำนวนน้องที่ส่งแล้ว">
            <div className="h-full rounded-full bg-fd-primary" style={{ width: `${(sent / interns.length) * 100}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="tabular-nums text-fd-muted-foreground">
              ส่งแล้ว {sent}/{interns.length} คน · รอตรวจ {waiting} · ผ่าน {passed}
            </span>
            <Button variant="ghost" onClick={onSubs} className="min-h-11">
              ดูงานที่ส่ง
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

// ---------- ช่องเขียนโพสต์ (สร้างและแก้ใช้ช่องเดียวกัน) ----------
const TOOLS: { label: string; snippet: string }[] = [
  { label: "หัวข้อ", snippet: "\n## หัวข้อ\n" },
  { label: "รายการ", snippet: "\n- รายการ\n" },
  { label: "ติ๊กได้", snippet: "\n- [ ] สิ่งที่ต้องทำ\n" },
  { label: "โค้ด", snippet: "\n```bash\nคำสั่ง\n```\n" },
  { label: "ตาราง", snippet: "\n| ข้อ | รายละเอียด |\n|---|---|\n| 1 | … |\n" },
];

function PostComposer({ admin, scoped, edit, onClose }: { admin: AdminState; scoped: AdminAssignment[]; edit: { a: AdminAssignment; r: RoundDef } | null; onClose: () => void }) {
  // โพสต์ได้เฉพาะกล่องงานของรุ่นที่ยังไม่จบ ในรุ่นที่เลือกอยู่
  const open = scoped.filter((a) => !admin.cohorts.find((c) => c.id === ownerOf(a))?.endedAt);
  const cohortName = (a: AdminAssignment) => admin.cohorts.find((c) => c.id === ownerOf(a))?.name ?? "ไม่มีรุ่น";
  const firstActive = (a: AdminAssignment) => usingCohorts(admin, a).find((c) => !c.endedAt) ?? usingCohorts(admin, a)[0];
  const [assignmentId, setAssignmentId] = useState<number>(edit?.a.id ?? open[0]?.id ?? 0);
  const asg = admin.assignments.find((a) => a.id === assignmentId);
  const cohorts = asg ? usingCohorts(admin, asg) : [];
  const [cohortId, setCohortId] = useState<number | null>(asg ? (firstActive(asg)?.id ?? null) : null);
  const ref: Cohort | undefined = cohorts.find((c) => c.id === cohortId) ?? cohorts[0];

  const [label, setLabel] = useState(edit?.r.label ?? "");
  const [what, setWhat] = useState(edit?.r.what ?? "");
  const [body, setBody] = useState(edit?.r.body ?? "");
  const [links, setLinks] = useState<TaskLink[]>(edit?.r.links ?? []);
  const [deploy, setDeploy] = useState(edit?.r.deploy ?? false);
  // แนบกับโพสต์ (6 พ.ย. 2569): PDF เกณฑ์ ภาพรวม % คะแนน · ไม่ตั้ง = ใช้ของกล่องงาน (โพสต์เก่าทำงานเหมือนเดิม)
  const [pdfMode, setPdfMode] = useState<PostPdf>(edit?.r.pdf ?? "shared");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [critMode, setCritMode] = useState<"same" | "new" | "none">(edit?.r.criteria === undefined ? "same" : edit.r.criteria.length ? "new" : "none");
  const [criteria, setCriteria] = useState<Criterion[]>(edit?.r.criteria?.length ? edit.r.criteria : (asg?.criteria ?? []));
  const [overview, setOverview] = useState(edit?.r.overview ?? "");
  const [weightText, setWeightText] = useState(edit ? String(weightOf(edit.r)) : "");
  const [preview, setPreview] = useState(false);
  // กำหนดส่ง: เลือกวันที่บนปฏิทินของรุ่นอ้างอิง (ถนัดแบบ Classroom) หรือกรอกเป็น "วันที่ N ของรุ่น" ตรงๆ
  const [date, setDate] = useState(() => (edit && ref ? (workdayDate(ref.startsOn, edit.r.day) ?? "") : ""));
  const [dayText, setDayText] = useState(edit ? String(edit.r.day) : "");
  const [saving, setSaving] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  const fromDate = date && ref ? dayOfDate(ref.startsOn, date) : null;
  const day = date && ref ? fromDate : dayText.trim() ? Number(dayText) : null;
  const dayOk = day !== null && Number.isInteger(day) && day >= 1 && day <= 60;
  const linkErr = linksProblem(links.filter((l) => l.label.trim() || l.url.trim()).map((l) => ({ label: l.label.trim(), url: l.url.trim() })));
  const critErr = critMode === "new" ? (criteria.length ? criteriaProblem(criteria.map((c) => ({ ...c, label: c.label.trim() }))) : "เพิ่มเกณฑ์อย่างน้อย 1 ข้อ หรือเลือก \"ไม่ให้คะแนน\"") : null;
  const weight = critMode === "none" ? 0 : weightText.trim() === "" ? undefined : Number(weightText);
  const others = asg ? weightTotal(asg.rounds.filter((r) => r.id !== edit?.r.id)) : 0;
  const after = others + (weight ?? 0);
  const weightErr = weight !== undefined && (!Number.isInteger(weight) || weight < 0 || weight > 100) ? "% ต้องเป็นจำนวนเต็ม 0–100" : after > 100 ? `รวมทุกโพสต์ได้ ${after}% เกิน 100 ลดลง ${after - 100}%` : null;
  const pdfErr = pdfMode === "own" && !pdfFile && edit?.r.pdf !== "own" ? "เลือกไฟล์ PDF ของโพสต์นี้" : null;
  const canPost = !!asg && label.trim().length > 0 && dayOk && !linkErr && !critErr && !weightErr && !pdfErr && !saving;

  const insert = (snippet: string) => {
    const el = area.current;
    if (!el) return setBody((b) => b + snippet);
    const { selectionStart: a, selectionEnd: b } = el;
    const next = body.slice(0, a) + snippet + body.slice(b);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = a + snippet.length;
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!asg) return void toast.error("เลือกโจทย์ที่จะโพสต์ก่อน");
    if (!label.trim()) return void toast.error("ใส่ชื่องานก่อน");
    if (!dayOk) return void toast.error("เลือกกำหนดส่ง (วันที่บนปฏิทิน หรือวันที่ N ของรุ่น)");
    if (linkErr) return void toast.error(linkErr);
    if (critErr || weightErr || pdfErr) return void toast.error((critErr ?? weightErr ?? pdfErr)!);
    setSaving(true);
    const input: PostSend = {
      label: label.trim(),
      what: what.trim(),
      day: day!,
      deploy,
      body,
      links: links.filter((l) => l.label.trim() || l.url.trim()).map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
      // "own" ตั้งให้ตอนอัปโหลดไฟล์สำเร็จ (server) · ยังไม่มีไฟล์ใช้ของกล่องงานไปก่อน
      pdf: pdfMode === "own" && edit?.r.pdf !== "own" ? "shared" : pdfMode,
      criteria: critMode === "same" ? undefined : critMode === "none" ? [] : criteria.map((c) => ({ ...c, label: c.label.trim() })),
      overview,
      weight,
    };
    const ok = await admin.savePost(asg.id, edit?.r.id ?? null, input, pdfMode === "own" ? pdfFile : null);
    setSaving(false);
    if (ok) onClose();
  };

  const field = "flex flex-col gap-1 text-sm font-medium";
  return (
    <form onSubmit={submit} aria-label={edit ? "แก้โพสต์งาน" : "โพสต์งานใหม่"} className="flex flex-col gap-4 rounded-2xl border border-fd-primary/40 bg-fd-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground">
          <Plus className="size-5" />
        </span>
        <strong>{edit ? "แก้โพสต์งาน" : "โพสต์งานใหม่"}</strong>
        <label className="ms-auto flex items-center gap-2 whitespace-nowrap text-sm">
          ของรุ่น
          <select
            className={`${inputClass} w-auto`}
            value={assignmentId}
            disabled={!!edit}
            onChange={(e) => {
              const next = open.find((a) => a.id === Number(e.target.value));
              setAssignmentId(Number(e.target.value));
              setCohortId(next ? (firstActive(next)?.id ?? null) : null);
              setDate("");
            }}
          >
            {(edit ? [edit.a] : open).map((a) => (
              <option key={a.id} value={a.id}>
                {cohortName(a)}
                {open.filter((x) => ownerOf(x) === ownerOf(a)).length > 1 ? ` · ${a.name}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={field}>
        ชื่องาน
        <input className={`${inputClass} text-base font-semibold`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น ตรวจรอบ 1: ตาราง + API" maxLength={40} required autoFocus />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">คำสั่งงาน</span>
          <div role="tablist" aria-label="เขียนหรือดูตัวอย่าง" className="flex gap-1">
            {[false, true].map((p) => (
              <button key={String(p)} type="button" role="tab" aria-selected={preview === p} onClick={() => setPreview(p)} className={`min-h-11 rounded-lg px-3 text-sm font-medium ${preview === p ? "bg-fd-primary text-fd-primary-foreground" : "border border-fd-border hover:bg-fd-accent"}`}>
                {p ? "ตัวอย่าง" : "เขียน"}
              </button>
            ))}
          </div>
        </div>
        {preview ? (
          <div className="min-h-40 rounded-lg border border-fd-border p-3">{body.trim() ? <MarkdownBody md={body} className="text-sm" /> : <p className="text-sm text-fd-muted-foreground">ยังไม่ได้เขียนอะไร</p>}</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {TOOLS.map((t) => (
                <button key={t.label} type="button" onClick={() => insert(t.snippet)} className="min-h-9 rounded-lg border border-fd-border px-2.5 text-xs font-medium hover:bg-fd-accent">
                  {t.label}
                </button>
              ))}
              {!body.trim() && (
                <button type="button" onClick={() => setBody(STARTER_BODY)} className="min-h-9 rounded-lg border border-fd-primary/50 px-2.5 text-xs font-semibold text-fd-primary hover:bg-fd-accent">
                  ใช้แบบฟอร์มคำสั่งงาน
                </button>
              )}
            </div>
            <textarea ref={area} className={`${inputClass} min-h-48 font-mono text-sm`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={BODY_MAX} aria-label="คำสั่งงาน (Markdown)" placeholder="เขียนว่างานนี้ต้องทำอะไร ส่งอะไร ดูอะไร · ใช้ Markdown แบบ GitHub ได้" />
            <span className="text-xs text-fd-muted-foreground tabular-nums">
              {body.length}/{BODY_MAX}
            </span>
          </>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">แนบลิงก์ (ไม่บังคับ)</legend>
        {links.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[12rem_1fr_auto]">
            <input className={inputClass} value={l.label} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="ชื่อลิงก์ เช่น repo ต้นแบบ" maxLength={60} aria-label={`ชื่อลิงก์ที่ ${i + 1}`} />
            <input className={inputClass} value={l.url} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="https://…" maxLength={300} inputMode="url" aria-label={`ที่อยู่ลิงก์ที่ ${i + 1}`} />
            <Button type="button" variant="ghost" className="min-h-11" aria-label={`ลบลิงก์ที่ ${i + 1}`} onClick={() => setLinks(links.filter((_, j) => j !== i))}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <div>
          <Button type="button" variant="ghost" className="min-h-11" disabled={links.length >= LINKS_MAX} onClick={() => setLinks([...links, { label: "", url: "" }])}>
            <Plus className="size-4" /> เพิ่มลิงก์
          </Button>
        </div>
        {linkErr && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{linkErr}</p>}
      </fieldset>

      <fieldset className="grid gap-3 rounded-xl border border-fd-border p-3 sm:grid-cols-2">
        <legend className="px-1 text-sm font-medium">กำหนดส่ง</legend>
        {cohorts.length > 0 ? (
          <>
            <label className={field}>
              วันที่ส่ง (ตามปฏิทินของรุ่น)
              <input type="date" className={inputClass} value={date} min={ref?.startsOn} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className={field}>
              ใช้ปฏิทินของรุ่น
              <select className={inputClass} value={ref?.id ?? ""} onChange={(e) => setCohortId(Number(e.target.value))}>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (เริ่ม {thaiDayMonth(c.startsOn)})
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <p className="text-sm text-fd-muted-foreground sm:col-span-2">ไม่พบรุ่นของกล่องงานนี้ กรอกเป็นวันที่ N ของรุ่นได้เลย</p>
        )}
        <label className={field}>
          หรือกรอกเป็นวันที่ N ของรุ่น
          <input type="number" inputMode="numeric" min={1} max={60} className={inputClass} value={date ? (fromDate ?? "") : dayText} onChange={(e) => (setDate(""), setDayText(e.target.value))} placeholder="เช่น 5" />
        </label>
        <div className="flex flex-col justify-end gap-1 text-xs text-fd-muted-foreground">
          {day !== null && dayOk ? (
            <>
              <span className="font-semibold text-fd-foreground">= วันที่ {day} ของรุ่น</span>
              {cohorts.map((c) => (
                <span key={c.id}>
                  {c.name}: {thaiDayMonth(workdayDate(c.startsOn, day) ?? c.startsOn)}
                </span>
              ))}
              {date && isWeekend(date) && <span className="text-amber-700 dark:text-amber-400">วันที่เลือกเป็นเสาร์-อาทิตย์ ระบบนับเป็นศุกร์ก่อนหน้า</span>}
            </>
          ) : date ? (
            <span className="text-amber-700 dark:text-amber-400">วันที่ต้องไม่ก่อนวันเริ่มรุ่น</span>
          ) : (
            <span>เลือกวันที่ หรือกรอกวันที่ N</span>
          )}
          <span>วันที่คำนวณจากวันจันทร์–ศุกร์ ไม่รวมวันหยุดราชการ</span>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={deploy} onChange={(e) => setDeploy(e.target.checked)} /> น้องต้องส่งลิงก์เว็บที่ deploy แล้ว (บังคับ)
        </label>
        <label className="flex min-w-0 flex-1 items-center gap-2">
          สรุปสั้น
          <input className={inputClass} value={what} onChange={(e) => setWhat(e.target.value)} maxLength={60} placeholder="เช่น ตาราง + API (ไม่บังคับ)" />
        </label>
      </div>
      <fieldset className="flex flex-col gap-1 rounded-xl border border-fd-border p-3 text-sm">
        <legend className="px-1 font-medium">PDF แนบ</legend>
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="pdf" checked={pdfMode === "shared"} onChange={() => setPdfMode("shared")} />
          ใช้ PDF ของรุ่น{asg?.pdf ? ` (${Math.round(asg.pdf.size / 1024)} KB)` : " (ยังไม่มีไฟล์)"}
        </label>
        <label className="flex min-h-11 flex-wrap items-center gap-2">
          <input type="radio" name="pdf" checked={pdfMode === "own"} onChange={() => setPdfMode("own")} />
          ไฟล์ของโพสต์นี้{edit?.r.pdf === "own" && !pdfFile ? " (มีไฟล์แล้ว เลือกใหม่เพื่อแทนที่)" : ""}
          {pdfMode === "own" && <input type="file" accept="application/pdf" className="text-sm" aria-label="เลือกไฟล์ PDF ของโพสต์นี้" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />}
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="pdf" checked={pdfMode === "none"} onChange={() => setPdfMode("none")} /> ไม่แนบ
        </label>
        {pdfErr && <p role="alert" className="text-red-700 dark:text-red-400">{pdfErr}</p>}
        <span className="text-xs text-fd-muted-foreground">PDF เท่านั้น ไม่เกิน 4 MB</span>
      </fieldset>

      <fieldset className="flex flex-col gap-1 rounded-xl border border-fd-border p-3 text-sm">
        <legend className="px-1 font-medium">เกณฑ์คะแนน</legend>
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="crit" checked={critMode === "same"} onChange={() => setCritMode("same")} />
          ใช้เกณฑ์ของรุ่น{asg?.criteria.length ? ` (${asg.criteria.length} ข้อ รวม ${asg.criteria.reduce((n, c) => n + c.max, 0)})` : " (ยังไม่มี ตรวจแบบ ผ่าน/แก้)"}
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="crit" checked={critMode === "new"} onChange={() => setCritMode("new")} /> ตั้งเกณฑ์ของโพสต์นี้
        </label>
        {critMode === "new" && <CriteriaEditor criteria={criteria} onChange={setCriteria} error={critErr} />}
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="crit" checked={critMode === "none"} onChange={() => setCritMode("none")} /> ไม่ให้คะแนน แค่เช็กว่าส่งแล้ว
        </label>
      </fieldset>

      {critMode !== "none" && (
        <label className={field}>
          นับเป็นกี่ % ของคะแนนงาน
          <span className="flex flex-wrap items-center gap-3">
            <input type="number" inputMode="numeric" min={0} max={100} className={`${inputClass} w-28`} value={weightText} onChange={(e) => setWeightText(e.target.value)} placeholder="0" aria-describedby="weight-after" />
            <span id="weight-after" className={`text-sm font-normal ${weightErr ? "text-red-700 dark:text-red-400" : after === 100 ? "text-green-800 dark:text-green-400" : "text-amber-800 dark:text-amber-300"}`}>
              {weightErr ?? (after === 100 ? "รวมทุกโพสต์ครบ 100%" : `รวมทุกโพสต์ ${after}% ยังขาด ${100 - after}%`)}
            </span>
          </span>
          <span className="text-xs font-normal text-fd-muted-foreground">ว่าง = ไม่นับคะแนน · แก้ได้จนกว่าจะตรวจงานชิ้นแรกของรุ่น หลังจากนั้นล็อก</span>
        </label>
      )}

      <div className="flex flex-col gap-1">
        <MarkdownEditor label="ภาพรวม (ไม่บังคับ)" value={overview} onChange={setOverview} max={OVERVIEW_MAX} minHeight="min-h-24" />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => (toast.info("ยกเลิกแล้ว ยังไม่ได้โพสต์"), onClose())} className="min-h-11">
          ยกเลิก
        </Button>
        <Button type="submit" disabled={!canPost} className="min-h-11">
          {edit ? "บันทึก" : "โพสต์งาน"}
        </Button>
      </div>
    </form>
  );
}
