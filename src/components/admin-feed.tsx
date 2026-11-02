"use client";

import { Archive, Pencil, Pin, PinOff, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminPostsApi } from "@/api/posts.api";
import type { AdminState } from "@/hooks/use-admin";
import { toast } from "@/hooks/use-toast";
import { thaiDayMonth, workdayDate } from "@/lib/cohort";
import { DUE_DAY_MAX, POST_KIND_LABEL, POST_KINDS, postInputProblem, TITLE_MAX, type PostInput, type PostKind } from "@/lib/post";
import { BODY_MAX, LINKS_MAX } from "@/lib/submission";
import { timeAgo } from "@/lib/thread-labels";
import type { AdminPost, PostAck } from "@/types";
import { Button } from "./button";
import { ConfirmBox } from "./confirm-box";
import { EmptyState } from "./empty-state";
import { ErrorText } from "./error-text";
import { inputClass } from "./field";
import { MarkdownBody } from "./markdown-body";
import { SkeletonList } from "./skeleton";

// แท็บ "งานและประกาศ": โพสต์ลงฟีดของน้อง (งาน / ประกาศ / แหล่งเรียนรู้) เลือกรุ่นที่เห็นทุกครั้ง
// งานที่ผูกโจทย์ใหญ่ = งานย่อย กำหนดส่งเป็นวันทำงานที่ N ของรุ่น · งานเดี่ยวใช้วันที่จริง · กฎอยู่ใน src/lib/post.ts
const TOOLS: { label: string; snippet: string }[] = [
  { label: "หัวข้อ", snippet: "\n## หัวข้อ\n" },
  { label: "รายการ", snippet: "\n- รายการ\n" },
  { label: "ติ๊กได้", snippet: "\n- [ ] สิ่งที่ต้องทำ\n" },
  { label: "โค้ด", snippet: "\n```bash\nคำสั่ง\n```\n" },
  { label: "ตาราง", snippet: "\n| ข้อ | รายละเอียด |\n|---|---|\n| 1 | … |\n" },
];

const EMPTY: PostInput = { kind: "task", assignmentId: null, title: "", body: "", links: [], allCohorts: false, cohortIds: [], dueDay: null, dueAt: null, pinned: false };
const inputOf = (p: AdminPost): PostInput => ({
  kind: p.kind,
  assignmentId: p.assignmentId,
  title: p.title,
  body: p.body,
  links: p.links,
  allCohorts: p.allCohorts,
  cohortIds: p.cohortIds,
  dueDay: p.dueDay,
  dueAt: p.dueAt,
  pinned: p.pinned,
});

export function AdminFeed({ admin }: { admin: AdminState }) {
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminPost | "new" | null>(null);
  const [archiving, setArchiving] = useState<AdminPost | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const load = () =>
    adminPostsApi
      .list()
      .then(setPosts)
      .catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const pin = async (p: AdminPost) => {
    try {
      await adminPostsApi.setPinned(p.id, !p.pinned);
      toast.success(p.pinned ? "เลิกปักหมุดแล้ว" : "ปักหมุดแล้ว ขึ้นบนสุดของฟีด");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const archive = async (p: AdminPost) => {
    setArchiving(null);
    try {
      await adminPostsApi.archive(p.id);
      toast.success(`เก็บ "${p.title}" แล้ว น้องไม่เห็นในฟีดอีก`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (error) return <ErrorText>{error}</ErrorText>;
  const live = posts?.filter((p) => !p.archivedAt) ?? [];
  const archived = posts?.filter((p) => p.archivedAt) ?? [];

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {editing ? (
        <Composer
          admin={admin}
          edit={editing === "new" ? null : editing}
          onDone={(saved) => {
            setEditing(null);
            if (saved) load();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-fd-border bg-fd-card px-4 text-start text-fd-muted-foreground hover:border-fd-primary"
        >
          <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground">
            <Plus className="size-5" />
          </span>
          โพสต์งาน ประกาศ หรือแหล่งเรียนรู้ให้น้อง…
        </button>
      )}

      {!posts ? (
        <SkeletonList rows={3} />
      ) : live.length === 0 ? (
        <EmptyState icon={Users} title="ยังไม่มีโพสต์">
          โพสต์แรกจะขึ้นในฟีด &quot;งานและประกาศ&quot; ของน้องในรุ่นที่เลือก พร้อมแจ้งเตือน
        </EmptyState>
      ) : (
        live.map((p) => <PostRow key={p.id} admin={admin} post={p} onEdit={() => setEditing(p)} onPin={() => pin(p)} onArchive={() => setArchiving(p)} />)
      )}

      {archived.length > 0 && (
        <div className="flex flex-col gap-3">
          <Button variant="ghost" className="self-start" aria-expanded={showArchived} onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? "ซ่อนโพสต์ที่เก็บแล้ว" : `ดูโพสต์ที่เก็บแล้ว (${archived.length})`}
          </Button>
          {showArchived && archived.map((p) => <PostRow key={p.id} admin={admin} post={p} />)}
        </div>
      )}

      {archiving && (
        <ConfirmBox title={`เก็บโพสต์ "${archiving.title}"?`} confirmLabel="เก็บโพสต์" danger onConfirm={() => archive(archiving)} onCancel={() => setArchiving(null)}>
          น้องจะไม่เห็นโพสต์นี้ในฟีดอีก ส่วนบันทึกว่าใครรับทราบแล้วยังอยู่ ดูได้จาก &quot;โพสต์ที่เก็บแล้ว&quot;
        </ConfirmBox>
      )}
    </div>
  );
}

function scopeText(admin: AdminState, p: { allCohorts: boolean; cohortIds: number[] }) {
  if (p.allCohorts) return "ทุกรุ่น";
  return p.cohortIds.map((id) => admin.cohorts.find((c) => c.id === id)?.name ?? `รุ่น #${id}`).join(", ");
}

function dueText(admin: AdminState, p: { dueDay: number | null; dueAt: string | null; cohortIds: number[] }) {
  if (p.dueAt) return `กำหนดส่ง ${thaiDayMonth(p.dueAt)}`;
  if (p.dueDay === null) return "ไม่มีกำหนดส่ง";
  const first = admin.cohorts.find((c) => p.cohortIds.includes(c.id));
  const date = first ? workdayDate(first.startsOn, p.dueDay) : null;
  return `กำหนดส่ง วันทำงานที่ ${p.dueDay}${date && first ? ` (${first.name}: ${thaiDayMonth(date)})` : ""}`;
}

function PostRow({ admin, post: p, onEdit, onPin, onArchive }: { admin: AdminState; post: AdminPost; onEdit?: () => void; onPin?: () => void; onArchive?: () => void }) {
  const [acks, setAcks] = useState<PostAck[] | null>(null);
  const [open, setOpen] = useState(false);
  const showAcks = async () => {
    setOpen(!open);
    if (!acks) setAcks(await adminPostsApi.acks(p.id).catch(() => []));
  };
  return (
    <article className={`flex flex-col gap-2 rounded-2xl border bg-fd-card p-4 ${p.pinned ? "border-fd-primary/60" : "border-fd-border"} ${p.archivedAt ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="rounded-full bg-fd-muted px-2.5 py-0.5 font-semibold">{POST_KIND_LABEL[p.kind]}</span>
        {p.assignmentName && <span className="text-fd-muted-foreground">โจทย์ {p.assignmentName}</span>}
        <span className="text-fd-muted-foreground">· {scopeText(admin, p)}</span>
        {p.pinned && <Pin className="size-3.5 text-fd-primary" aria-label="ปักหมุด" />}
        <span className="ms-auto text-xs text-fd-muted-foreground">
          {p.author} · {timeAgo(p.createdAt)}
        </span>
      </div>
      <h3 className="font-semibold">{p.title}</h3>
      {p.kind === "task" && <p className="text-sm text-fd-muted-foreground">{dueText(admin, p)}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={showAcks} aria-expanded={open}>
          รับทราบ {p.acks}/{p.audience}
        </Button>
        {onEdit && (
          <Button variant="ghost" onClick={onEdit}>
            <Pencil className="size-4" /> แก้
          </Button>
        )}
        {onPin && (
          <Button variant="ghost" onClick={onPin}>
            {p.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />} {p.pinned ? "เลิกปักหมุด" : "ปักหมุด"}
          </Button>
        )}
        {onArchive && (
          <Button variant="ghost" onClick={onArchive}>
            <Archive className="size-4" /> เก็บ
          </Button>
        )}
      </div>
      {open && (
        <div className="grid gap-x-4 gap-y-1 rounded-lg bg-fd-muted/60 p-3 text-sm sm:grid-cols-2">
          {!acks ? (
            <span className="text-fd-muted-foreground">กำลังโหลด…</span>
          ) : acks.length === 0 ? (
            <span className="text-fd-muted-foreground">ยังไม่มีน้องในรุ่นที่เลือก</span>
          ) : (
            [...acks]
              .sort((a, b) => Number(!!a.ackedAt) - Number(!!b.ackedAt))
              .map((a) => (
                <span key={a.username} className={a.ackedAt ? "" : "font-semibold text-orange-700 dark:text-orange-400"}>
                  {a.ackedAt ? "✓" : "ยังไม่รับทราบ:"} {a.username}
                </span>
              ))
          )}
        </div>
      )}
    </article>
  );
}

function Composer({ admin, edit, onDone }: { admin: AdminState; edit: AdminPost | null; onDone: (saved: boolean) => void }) {
  const [p, setP] = useState<PostInput>(edit ? inputOf(edit) : EMPTY);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const set = (patch: Partial<PostInput>) => setP((x) => ({ ...x, ...patch }));
  const links = p.links.filter((l) => l.label.trim() || l.url.trim()).map((l) => ({ label: l.label.trim(), url: l.url.trim() }));
  const clean: PostInput = { ...p, links };
  const problem = postInputProblem(clean);
  const cohorts = [...admin.cohorts].sort((a, b) => Number(!!a.endedAt) - Number(!!b.endedAt));
  const assignments = admin.assignments;

  const setKind = (kind: PostKind) => set(kind === "task" ? { kind } : { kind, assignmentId: null, dueDay: null, dueAt: null });
  const setAssignment = (v: string) => {
    const id = v ? Number(v) : null;
    // ผูกโจทย์ = ใช้วันทำงานที่ N · ไม่ผูก = ใช้วันที่จริง (ล้างอีกแบบทิ้ง กันส่งค่าสองแบบ)
    set({ assignmentId: id, dueDay: null, dueAt: null });
  };
  const toggleCohort = (id: number) => set({ cohortIds: p.cohortIds.includes(id) ? p.cohortIds.filter((x) => x !== id) : [...p.cohortIds, id] });
  const insert = (snippet: string) => {
    const el = area.current;
    if (!el) return set({ body: p.body + snippet });
    const { selectionStart: a, selectionEnd: b } = el;
    set({ body: p.body.slice(0, a) + snippet + p.body.slice(b) });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = a + snippet.length;
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (problem) return void toast.error(problem);
    setSaving(true);
    try {
      if (edit) await adminPostsApi.update(edit.id, clean);
      else await adminPostsApi.create(clean);
      toast.success(edit ? "บันทึกแล้ว" : "โพสต์แล้ว น้องในรุ่นที่เลือกได้แจ้งเตือน");
      onDone(true);
    } catch (err) {
      toast.error(`โพสต์ไม่สำเร็จ: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const field = "flex flex-col gap-1 text-sm font-medium";
  const selectedCohorts = admin.cohorts.filter((c) => p.cohortIds.includes(c.id));
  return (
    <form onSubmit={submit} aria-label={edit ? "แก้โพสต์" : "โพสต์ใหม่"} className="flex flex-col gap-4 rounded-2xl border border-fd-primary/40 bg-fd-card p-4 sm:p-5">
      <div role="radiogroup" aria-label="แบบโพสต์" className="grid grid-cols-3 gap-2">
        {POST_KINDS.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={p.kind === k} onClick={() => setKind(k)} className={`min-h-11 rounded-lg border px-2 text-sm font-medium ${p.kind === k ? "border-fd-primary bg-fd-primary/10 text-fd-primary" : "border-fd-border hover:bg-fd-accent"}`}>
            {POST_KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <label className={field}>
        หัวข้อ
        <input className={`${inputClass} text-base font-semibold`} value={p.title} onChange={(e) => set({ title: e.target.value })} maxLength={TITLE_MAX} required autoFocus placeholder={p.kind === "task" ? "เช่น ตรวจรอบ 1: ตาราง + API" : p.kind === "announcement" ? "เช่น ศุกร์นี้ประชุมรวม 15:00" : "เช่น เกณฑ์คุณภาพโค้ดของทีม"} />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">รายละเอียด (Markdown)</span>
          <div role="tablist" aria-label="เขียนหรือดูตัวอย่าง" className="flex gap-1">
            {[false, true].map((v) => (
              <button key={String(v)} type="button" role="tab" aria-selected={preview === v} onClick={() => setPreview(v)} className={`min-h-11 rounded-lg px-3 text-sm font-medium ${preview === v ? "bg-fd-primary text-fd-primary-foreground" : "border border-fd-border hover:bg-fd-accent"}`}>
                {v ? "ตัวอย่าง" : "เขียน"}
              </button>
            ))}
          </div>
        </div>
        {preview ? (
          <div className="min-h-32 rounded-lg border border-fd-border p-3">{p.body.trim() ? <MarkdownBody md={p.body} className="text-sm" /> : <p className="text-sm text-fd-muted-foreground">ยังไม่ได้เขียนอะไร</p>}</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {TOOLS.map((t) => (
                <button key={t.label} type="button" onClick={() => insert(t.snippet)} className="min-h-9 rounded-lg border border-fd-border px-2.5 text-xs font-medium hover:bg-fd-accent">
                  {t.label}
                </button>
              ))}
            </div>
            <textarea ref={area} className={`${inputClass} min-h-40 font-mono text-sm`} value={p.body} onChange={(e) => set({ body: e.target.value })} maxLength={BODY_MAX} aria-label="รายละเอียด (Markdown)" />
          </>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">แนบลิงก์ (ไม่บังคับ)</legend>
        {p.links.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[12rem_1fr_auto]">
            <input className={inputClass} value={l.label} onChange={(e) => set({ links: p.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="ชื่อลิงก์" maxLength={60} aria-label={`ชื่อลิงก์ที่ ${i + 1}`} />
            <input className={inputClass} value={l.url} onChange={(e) => set({ links: p.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} placeholder="https://…" maxLength={300} inputMode="url" aria-label={`ที่อยู่ลิงก์ที่ ${i + 1}`} />
            <Button type="button" variant="ghost" aria-label={`ลบลิงก์ที่ ${i + 1}`} onClick={() => set({ links: p.links.filter((_, j) => j !== i) })}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" className="self-start" disabled={p.links.length >= LINKS_MAX} onClick={() => set({ links: [...p.links, { label: "", url: "" }] })}>
          <Plus className="size-4" /> เพิ่มลิงก์
        </Button>
      </fieldset>

      <fieldset className="flex flex-col gap-2 rounded-xl border border-fd-border p-3">
        <legend className="px-1 text-sm font-medium">ใครเห็นโพสต์นี้ (ต้องเลือก)</legend>
        <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" className="size-5" checked={p.allCohorts} onChange={(e) => set({ allCohorts: e.target.checked })} /> ทุกรุ่น
        </label>
        {!p.allCohorts && (
          <div className="flex flex-wrap gap-1">
            {cohorts.map((c) => (
              <label key={c.id} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm hover:bg-fd-accent">
                <input type="checkbox" className="size-5" checked={p.cohortIds.includes(c.id)} onChange={() => toggleCohort(c.id)} />
                {c.name}
                {c.endedAt && <span className="text-xs text-fd-muted-foreground">(จบแล้ว)</span>}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {p.kind === "task" && (
        <fieldset className="grid gap-3 rounded-xl border border-fd-border p-3 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium">งานนี้</legend>
          <label className={field}>
            อยู่ในโจทย์ใหญ่
            <select className={inputClass} value={p.assignmentId ?? ""} onChange={(e) => setAssignment(e.target.value)}>
              <option value="">ไม่ผูกโจทย์ (งานเดี่ยว)</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          {p.assignmentId !== null ? (
            <label className={field}>
              กำหนดส่ง: วันทำงานที่ N ของรุ่น
              <input type="number" inputMode="numeric" min={1} max={DUE_DAY_MAX} className={inputClass} value={p.dueDay ?? ""} onChange={(e) => set({ dueDay: e.target.value ? Number(e.target.value) : null })} placeholder="เช่น 5" />
            </label>
          ) : (
            <label className={field}>
              กำหนดส่ง (ไม่บังคับ)
              <input type="date" className={inputClass} value={p.dueAt ?? ""} onChange={(e) => set({ dueAt: e.target.value || null })} />
            </label>
          )}
          {p.assignmentId !== null && p.dueDay !== null && selectedCohorts.length > 0 && (
            <p className="text-xs text-fd-muted-foreground sm:col-span-2">
              {selectedCohorts.map((c) => `${c.name}: ${thaiDayMonth(workdayDate(c.startsOn, p.dueDay!) ?? c.startsOn)}`).join(" · ")} (นับจันทร์–ศุกร์ ไม่รวมวันหยุดราชการ)
            </p>
          )}
          <p className="text-xs text-fd-muted-foreground sm:col-span-2">ช่องส่งงานในโพสต์ (ลิงก์ ไฟล์ ข้อความ) จะมาในเวอร์ชันถัดไป</p>
        </fieldset>
      )}

      <label className="flex min-h-11 items-center gap-2.5 text-sm">
        <input type="checkbox" className="size-5" checked={p.pinned} onChange={(e) => set({ pinned: e.target.checked })} /> ปักหมุดไว้บนสุดของฟีด
      </label>

      {problem && p.title.trim() && <p className="text-sm text-orange-700 dark:text-orange-400">{problem}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => onDone(false)}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={!!problem || saving}>
          {saving ? "กำลังบันทึก…" : edit ? "บันทึก" : "โพสต์"}
        </Button>
      </div>
    </form>
  );
}
