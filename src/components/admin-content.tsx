"use client";

import { EyeOff, FilePlus2, NotebookPen, Pencil } from "lucide-react";
import { useState } from "react";
import { cards as builtIn, cardUrl, steps, topics } from "@/data/learn";
import type { ContentAdminState } from "@/hooks/use-content-admin";
import { timeAgo } from "@/lib/thread-labels";
import type { MentorCardInput, MentorCardSummary, PageNote } from "@/types";
import { Button } from "./button";
import { ConfirmBox } from "./confirm-box";
import { EmptyState } from "./empty-state";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";
import { MarkdownBody } from "./markdown-body";

// แท็บ "เนื้อหา" ของหลังบ้าน: พี่เลี้ยงเพิ่มการ์ดเอง, เขียนโน้ตท้ายหน้าเดิม, และซ่อน/แก้ชื่อการ์ดในระบบ
// ทั้งหมดเก็บใน DB ขึ้นเว็บทันทีโดยไม่ต้อง deploy · ไฟล์ MDX ในโค้ดไม่ถูกแตะ
type Section = "cards" | "notes" | "builtin";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "cards", label: "การ์ดของพี่เลี้ยง" },
  { id: "notes", label: "โน้ตท้ายหน้า" },
  { id: "builtin", label: "การ์ดในระบบ" },
];

const stepName = (slug: string) => steps.find((s) => s.slug === slug)?.name ?? slug;
const topicName = (slug: string) => topics.find((t) => t.slug === slug)?.name ?? slug;

export function AdminContent({ content, initialNote }: { content: ContentAdminState; initialNote?: string }) {
  // เปิดจากปุ่ม "เพิ่มโน้ตหน้านี้" ท้ายบทเรียน (?note=/learn/cards/x) ให้เข้าโน้ตพร้อมกรอกหน้าให้แล้ว
  const [section, setSection] = useState<Section>(initialNote ? "notes" : "cards");
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="ประเภทเนื้อหา" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-fd-muted p-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === section}
            onClick={() => {
              content.clearError();
              setSection(s.id);
            }}
            className={`flex min-h-10 shrink-0 items-center rounded-lg px-4 text-sm font-semibold ${s.id === section ? "bg-fd-background text-fd-primary shadow-sm" : "text-fd-muted-foreground hover:text-fd-foreground"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {content.error && <ErrorText>{content.error}</ErrorText>}
      {content.loading ? (
        <p className="text-sm text-fd-muted-foreground">กำลังโหลด…</p>
      ) : section === "cards" ? (
        <MentorCards content={content} />
      ) : section === "notes" ? (
        <Notes content={content} initialPage={initialNote} />
      ) : (
        <BuiltInCards content={content} />
      )}
    </div>
  );
}

// ---------------- การ์ดของพี่เลี้ยง ----------------

// แม่แบบ 8 ส่วนเดียวกับการ์ดในคู่มือ (skill card-writer) ให้การ์ดของพี่เลี้ยงหน้าตาไปทางเดียวกัน
const TEMPLATE = `## ความหมาย

นิยาม 1–2 ประโยค

**นึกภาพ:** เปรียบกับเรื่องใกล้ตัว

## ที่มา

ไม่มีเรื่องนี้แล้วจะเจ็บยังไง

## การใช้งาน

\`\`\`bash
คำสั่งที่ใช้
\`\`\`

**ควรเห็น:** ผลที่ต้องได้

## ทริคที่แนะนำ

1. …เพราะ…

## ปรับไปใช้จริง

**ในงาน STARTER:** ใช้ตรงไหน วันไหน

## ตัวเลือกอื่นที่คล้ายกัน

## ลองเอง

## อ่านเพิ่ม
`;

const EMPTY_CARD: MentorCardInput = { slug: "", title: "", step: "coding", topic: "plan", minutes: 10, needs: [], body: TEMPLATE };

function MentorCards({ content }: { content: ContentAdminState }) {
  // null = ดูรายการ · { id: null } = การ์ดใหม่ · { id } = แก้การ์ดเดิม
  const [editing, setEditing] = useState<{ id: number | null; card: MentorCardInput; status?: MentorCardSummary } | null>(null);

  async function open(c: MentorCardSummary) {
    const full = await content.loadCard(c.slug);
    if (full) setEditing({ id: c.id, card: { slug: full.slug, title: full.title, step: full.step, topic: full.topic, minutes: full.minutes, needs: full.needs, body: full.body }, status: c });
  }

  if (editing) return <CardEditor key={editing.id ?? "new"} content={content} {...editing} onClose={() => setEditing(null)} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fd-muted-foreground">เขียนแล้วขึ้นในคลังการ์ดตามขั้นและหมวดที่เลือก · น้องเห็นเฉพาะที่เผยแพร่แล้ว และต้อง login ถึงอ่านเนื้อหาได้</p>
        <Button onClick={() => setEditing({ id: null, card: EMPTY_CARD })} className="min-h-11">
          <FilePlus2 className="size-4" /> การ์ดใหม่
        </Button>
      </div>
      {content.cards.length === 0 ? (
        <EmptyState icon={FilePlus2} title="ยังไม่มีการ์ดจากพี่เลี้ยง">
          เรื่องที่น้องถามซ้ำบ่อย หรือเรื่องเฉพาะของทีม (ตั้งชื่อ branch, ขั้นตอน review) เขียนเป็นการ์ดได้เลย
        </EmptyState>
      ) : (
        // relative: ป้าย sr-only ในหัวตารางเป็น position:absolute ถ้ากล่องเลื่อนไม่มี position มันจะหลุดออกนอกกล่อง ดันหน้าทั้งหน้าให้กว้างเกินจอมือถือ
        <div className="relative overflow-x-auto rounded-xl border border-fd-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-fd-muted/60 text-start text-xs text-fd-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start font-medium">สถานะ</th>
                <th className="px-3 py-2 text-start font-medium">ชื่อการ์ด</th>
                <th className="px-3 py-2 text-start font-medium">ขั้น · หมวด</th>
                <th className="px-3 py-2 text-start font-medium">คนเขียน</th>
                <th className="px-3 py-2 text-start font-medium">แก้ล่าสุด</th>
                <th className="px-3 py-2">
                  <span className="sr-only">จัดการ</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {content.cards.map((c) => (
                <tr key={c.id} className="border-t border-fd-border">
                  <td className="px-3 py-2">
                    <CardStatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-2 font-medium">{c.title}</td>
                  <td className="px-3 py-2 text-fd-muted-foreground">
                    {stepName(c.step)} · {topicName(c.topic)}
                  </td>
                  <td className="px-3 py-2 text-fd-muted-foreground">{c.author}</td>
                  <td className="px-3 py-2 text-fd-muted-foreground">{timeAgo(c.updatedAt)}</td>
                  <td className="px-3 py-2 text-end">
                    <Button variant="ghost" onClick={() => open(c)} className="min-h-10">
                      <Pencil className="size-4" /> แก้
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CardStatusBadge({ status }: { status: MentorCardSummary["status"] }) {
  return status === "published" ? (
    <span className="rounded-full bg-green-600/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-green-700 dark:text-green-400">เผยแพร่</span>
  ) : (
    <span className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-fd-muted-foreground">ร่าง</span>
  );
}

type View = "both" | "edit" | "preview";

function CardEditor({ content, id, card, status, onClose }: { content: ContentAdminState; id: number | null; card: MentorCardInput; status?: MentorCardSummary; onClose: () => void }) {
  const [form, setForm] = useState(card);
  const [view, setView] = useState<View>("both");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof MentorCardInput>(k: K, v: MentorCardInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  // ตัวเลือก "อ่านก่อน": การ์ดในระบบ + การ์ดพี่เลี้ยงใบอื่น (ไม่รวมตัวเอง)
  const needOptions = [
    ...builtIn.map((c) => ({ value: c.slug, label: c.title })),
    ...content.cards.filter((c) => c.slug !== form.slug).map((c) => ({ value: `m/${c.slug}`, label: `${c.title} (พี่เลี้ยง)` })),
  ];
  const labelOf = (v: string) => needOptions.find((o) => o.value === v)?.label ?? v;

  async function save() {
    setBusy(true);
    const ok = await content.saveCard(id, form);
    setBusy(false);
    if (ok) onClose();
  }

  async function toggleStatus() {
    if (!status) return;
    setBusy(true);
    // บันทึกที่แก้ค้างไว้ก่อน แล้วค่อยเปลี่ยนสถานะ จะได้ไม่เผยแพร่ฉบับเก่า
    const ok = (await content.saveCard(status.id, form)) && (await content.setCardStatus(status, status.status === "published" ? "draft" : "published"));
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose} className="min-h-10">
            ← กลับรายการ
          </Button>
          {status && <CardStatusBadge status={status.status} />}
        </div>
        <div className="flex flex-wrap gap-2">
          {status && (
            <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="min-h-11 text-red-700 dark:text-red-400">
              ลบ
            </Button>
          )}
          <Button variant="ghost" onClick={save} disabled={busy} className="min-h-11">
            {id === null ? "บันทึกร่าง" : "บันทึก"}
          </Button>
          {status && (
            <Button onClick={toggleStatus} disabled={busy} className="min-h-11">
              {status.status === "published" ? "ถอนกลับเป็นร่าง" : "เผยแพร่"}
            </Button>
          )}
        </div>
      </div>
      {id === null && <p className="text-sm text-fd-muted-foreground">บันทึกร่างก่อน แล้วกด &quot;แก้&quot; อีกครั้งเพื่อเผยแพร่ ระหว่างเป็นร่าง น้องยังไม่เห็น</p>}
      {confirmDelete && status && (
        <ConfirmBox
          title={`ลบการ์ด "${status.title}"?`}
          confirmLabel="ลบการ์ด"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            if (await content.deleteCard(status)) onClose();
          }}
        >
          ลบแล้วกู้คืนไม่ได้ ลิงก์ที่เคยแชร์จะเปิดไม่เจอ และติ๊ก &quot;เข้าใจแล้ว&quot; ของน้องที่การ์ดนี้จะไม่นับ ถ้าแค่อยากเก็บไว้ก่อน กด &quot;ถอนกลับเป็นร่าง&quot; แทน
        </ConfirmBox>
      )}

      <section aria-label="ข้อมูลการ์ด" className="grid gap-3 rounded-xl border border-fd-border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <Field label="ชื่อการ์ด">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="เช่น ต่อ Docker ใน WSL ไม่ได้ ทำยังไง" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="ชื่อใน URL (a-z 0-9 และ -)">
            <Input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase())}
              disabled={id !== null}
              placeholder="docker-wsl"
              autoCapitalize="none"
              spellCheck={false}
            />
          </Field>
          <p className="mt-1 text-xs text-fd-muted-foreground">
            /learn/cards/m/{form.slug || "…"} · {id === null ? "ตั้งแล้วเปลี่ยนไม่ได้ เพราะลิงก์ที่แชร์ไปและติ๊กของน้องผูกกับ URL นี้" : "เปลี่ยนไม่ได้หลังสร้าง"}
          </p>
        </div>
        <Field label="ขั้น">
          <select className={inputClass} value={form.step} onChange={(e) => set("step", e.target.value)}>
            {steps.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.num} {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="หมวด">
          <select className={inputClass} value={form.topic} onChange={(e) => set("topic", e.target.value)}>
            {topics.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="เวลาอ่าน (นาที)">
          <Input type="number" min={1} max={60} value={form.minutes} onChange={(e) => set("minutes", Number(e.target.value))} />
        </Field>
        <div className="flex flex-col gap-1 text-sm font-medium sm:col-span-2 lg:col-span-3">
          อ่านก่อน (ไม่บังคับ)
          <div className="flex flex-wrap items-center gap-1.5">
            {form.needs.map((n) => (
              <span key={n} className="inline-flex items-center gap-1 rounded-full bg-fd-primary/10 py-0.5 ps-3 pe-1 text-xs text-fd-primary">
                {labelOf(n)}
                <button
                  type="button"
                  aria-label={`เอา ${labelOf(n)} ออก`}
                  onClick={() => set("needs", form.needs.filter((x) => x !== n))}
                  className="flex size-7 items-center justify-center rounded-full hover:bg-fd-primary/15"
                >
                  ×
                </button>
              </span>
            ))}
            <select
              aria-label="เพิ่มการ์ดที่ควรอ่านก่อน"
              className={`${inputClass} w-auto max-w-full`}
              value=""
              onChange={(e) => e.target.value && set("needs", [...form.needs, e.target.value])}
            >
              <option value="">+ เพิ่ม…</option>
              {needOptions
                .filter((o) => !form.needs.includes(o.value))
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </section>

      <div role="tablist" aria-label="มุมมอง" className="flex w-fit gap-1 rounded-xl bg-fd-muted p-1">
        {(
          [
            ["both", "เขียน + ตัวอย่าง"],
            ["edit", "เขียน"],
            ["preview", "ตัวอย่าง"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${view === v ? "bg-fd-background text-fd-primary shadow-sm" : "text-fd-muted-foreground"} ${v === "both" ? "max-lg:hidden" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {view !== "preview" && (
          <label className={`flex flex-col overflow-hidden rounded-xl border border-fd-border ${view === "edit" ? "lg:col-span-2" : ""}`}>
            <span className="flex justify-between border-b border-fd-border px-3 py-2 text-xs text-fd-muted-foreground">
              <span>เนื้อหา (Markdown)</span>
              <span>## หัวข้อ · **ตัวหนา** · [ลิงก์](/learn) · ```โค้ด```</span>
            </span>
            <textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              className="min-h-[480px] resize-y bg-fd-background p-3 font-mono text-sm leading-relaxed outline-none"
              spellCheck={false}
            />
          </label>
        )}
        {view !== "edit" && (
          <section aria-label="ตัวอย่างที่น้องจะเห็น" className={`rounded-xl border border-fd-border p-5 ${view === "preview" ? "lg:col-span-2" : ""}`}>
            <p className="mb-3 text-xs text-fd-muted-foreground">ตัวอย่างที่น้องจะเห็น</p>
            <h2 className="mb-2 text-2xl font-bold">{form.title || "ชื่อการ์ด"}</h2>
            <MarkdownBody md={form.body} />
          </section>
        )}
      </div>
      <p className="text-xs text-fd-muted-foreground">ไม่รับ HTML (ใส่ไปจะแสดงเป็นตัวอักษร) กันโค้ดแปลกปลอม · การบันทึก เผยแพร่ และลบ ลงบันทึกการกระทำทุกครั้ง</p>
    </div>
  );
}

// ---------------- โน้ตท้ายหน้า ----------------

function Notes({ content, initialPage }: { content: ContentAdminState; initialPage?: string }) {
  const [editing, setEditing] = useState<{ id: number | null; pageUrl: string; body: string; visible: boolean } | null>(
    initialPage ? { id: null, pageUrl: initialPage, body: "", visible: true } : null,
  );
  const [confirm, setConfirm] = useState<PageNote | null>(null);

  async function save() {
    if (!editing) return;
    if (await content.saveNote(editing.id, { pageUrl: editing.pageUrl, body: editing.body, visible: editing.visible })) setEditing(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fd-muted-foreground">
          คำแนะนำของพี่เลี้ยงท้ายการ์ดหรือบทที่มีอยู่แล้ว เช่น &quot;รุ่นนี้ใช้ port 5433&quot; · น้องที่ login เห็นในกล่อง &quot;จากพี่เลี้ยง&quot; · เปิดหน้านั้นแล้วกด &quot;เพิ่มโน้ตหน้านี้&quot; ก็ได้
        </p>
        {!editing && (
          <Button onClick={() => setEditing({ id: null, pageUrl: "", body: "", visible: true })} className="min-h-11">
            <NotebookPen className="size-4" /> โน้ตใหม่
          </Button>
        )}
      </div>

      {editing && (
        <section aria-label="เขียนโน้ต" className="grid gap-3 rounded-xl border border-fd-primary/40 p-4 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Field label="หน้า (path ในเว็บนี้)">
              <Input
                value={editing.pageUrl}
                onChange={(e) => setEditing({ ...editing, pageUrl: e.target.value.trim() })}
                placeholder="/learn/cards/migration"
                autoCapitalize="none"
                spellCheck={false}
              />
            </Field>
            <Field label="ข้อความ (Markdown)">
              <textarea
                value={editing.body}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                maxLength={4000}
                className={`${inputClass} min-h-40 font-mono`}
              />
            </Field>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" className="size-5" checked={editing.visible} onChange={(e) => setEditing({ ...editing, visible: e.target.checked })} />
              แสดงให้น้องเห็น
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)} className="min-h-11">
                ยกเลิก
              </Button>
              <Button onClick={save} className="min-h-11">
                บันทึกโน้ต
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-fd-muted/50 p-4">
            <p className="mb-2 text-xs text-fd-muted-foreground">ตัวอย่างที่น้องจะเห็น</p>
            <NoteBox author="คุณ" body={editing.body || "…"} />
          </div>
        </section>
      )}

      {confirm && (
        <ConfirmBox
          title="ลบโน้ตนี้?"
          confirmLabel="ลบโน้ต"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            if (await content.deleteNote(confirm)) setConfirm(null);
          }}
        >
          โน้ตบนหน้า {confirm.pageUrl} จะหายไปและกู้คืนไม่ได้ ถ้าแค่อยากเก็บไว้ก่อน เอาติ๊ก &quot;แสดงให้น้องเห็น&quot; ออกแทน
        </ConfirmBox>
      )}

      {content.notes.length === 0 && !editing ? (
        <EmptyState icon={NotebookPen} title="ยังไม่มีโน้ต">
          เพิ่มคำแนะนำบนการ์ดเดิมได้โดยไม่ต้องแก้ไฟล์คู่มือ
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {content.notes.map((n) => (
            <li key={n.id} className={`flex flex-col gap-2 rounded-xl border border-fd-border p-3 text-sm ${n.visible ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a href={n.pageUrl} className="font-medium text-fd-primary hover:underline">
                  {n.pageUrl}
                </a>
                <span className="text-xs text-fd-muted-foreground">
                  {!n.visible && "ซ่อนอยู่ · "}
                  {n.author} · {timeAgo(n.updatedAt)}
                </span>
              </div>
              <p className="line-clamp-2 whitespace-pre-line text-fd-muted-foreground">{n.body}</p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditing({ id: n.id, pageUrl: n.pageUrl, body: n.body, visible: n.visible })} className="min-h-10">
                  <Pencil className="size-4" /> แก้
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(n)} className="min-h-10 text-red-700 dark:text-red-400">
                  ลบ
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// กล่องโน้ตหน้าตาเดียวกับที่น้องเห็นท้ายหน้า (page-notes.tsx)
export function NoteBox({ author, body }: { author: string; body: string }) {
  return (
    <aside className="rounded-xl border border-(--mentor-badge-fg)/30 bg-(--mentor-badge-bg)/50 px-4 py-3">
      <p className="mb-1 text-xs font-semibold text-(--mentor-badge-fg)">จากพี่เลี้ยง · {author}</p>
      <MarkdownBody md={body} className="text-sm" />
    </aside>
  );
}

// ---------------- การ์ดในระบบ ----------------

function BuiltInCards({ content }: { content: ContentAdminState }) {
  const [editing, setEditing] = useState<string | null>(null);
  const bySlug = new Map(content.overrides.map((o) => [o.slug, o]));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-fd-muted-foreground">
        การ์ดที่อยู่ในโค้ดของคู่มือ ซ่อนจากคลังและหน้าขั้นได้ (เช่น ยังไม่อยากให้รุ่นนี้เห็น) หรือเปลี่ยนชื่อ เวลาอ่าน หมวดที่แสดง · เนื้อหาในการ์ดแก้ได้ที่ไฟล์ MDX เท่านั้น
      </p>
      <ul className="flex flex-col divide-y divide-fd-border rounded-xl border border-fd-border">
        {builtIn.map((c) => {
          const o = bySlug.get(c.slug);
          return (
            <li key={c.slug} className="flex flex-col gap-2 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <a href={cardUrl(c.slug)} className={`min-w-0 flex-1 font-medium hover:underline ${o?.hidden ? "text-fd-muted-foreground line-through" : ""}`}>
                  {o?.title ?? c.title}
                </a>
                {o?.hidden && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-fd-muted px-2 py-0.5 text-[11px] font-semibold text-fd-muted-foreground">
                    <EyeOff className="size-3" /> ซ่อนอยู่
                  </span>
                )}
                {o && !o.hidden && <span className="rounded-full bg-fd-primary/10 px-2 py-0.5 text-[11px] font-semibold text-fd-primary">ปรับแล้ว</span>}
                <span className="text-xs text-fd-muted-foreground">
                  {stepName(c.step)} · {topicName(o?.topic ?? c.topic)} · {o?.minutes ?? c.minutes} นาที
                </span>
                <Button variant="ghost" onClick={() => setEditing(editing === c.slug ? null : c.slug)} className="min-h-10">
                  <Pencil className="size-4" /> ปรับ
                </Button>
              </div>
              {editing === c.slug && (
                <OverrideForm
                  key={c.slug}
                  title={c.title}
                  minutes={c.minutes}
                  current={o}
                  onCancel={() => setEditing(null)}
                  onSave={async (v) => {
                    if (await content.setOverride(c.slug, v)) setEditing(null);
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OverrideForm({
  title,
  minutes,
  current,
  onSave,
  onCancel,
}: {
  title: string;
  minutes: number;
  current?: { hidden: boolean; title: string | null; minutes: number | null; topic: string | null };
  onSave: (v: { hidden: boolean; title: string | null; minutes: number | null; topic: string | null }) => void;
  onCancel: () => void;
}) {
  const [hidden, setHidden] = useState(current?.hidden ?? false);
  const [t, setT] = useState(current?.title ?? "");
  const [m, setM] = useState(current?.minutes?.toString() ?? "");
  const [topic, setTopic] = useState(current?.topic ?? "");
  return (
    <div className="grid gap-3 rounded-lg bg-fd-muted/50 p-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex min-h-11 items-center gap-2 sm:col-span-2 lg:col-span-4">
        <input type="checkbox" className="size-5" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        ซ่อนการ์ดนี้จากคลังการ์ดและหน้าขั้น
      </label>
      <div className="sm:col-span-2">
        <Field label="ชื่อที่แสดง (เว้นว่าง = ใช้ชื่อเดิม)">
          <Input value={t} onChange={(e) => setT(e.target.value)} placeholder={title} maxLength={120} />
        </Field>
      </div>
      <Field label="เวลาอ่าน (นาที)">
        <Input type="number" min={1} max={60} value={m} onChange={(e) => setM(e.target.value)} placeholder={String(minutes)} />
      </Field>
      <Field label="หมวด">
        <select className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">ใช้หมวดเดิม</option>
          {topics.map((x) => (
            <option key={x.slug} value={x.slug}>
              {x.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
        <Button variant="ghost" onClick={onCancel} className="min-h-11">
          ยกเลิก
        </Button>
        <Button onClick={() => onSave({ hidden, title: t.trim() || null, minutes: m ? Number(m) : null, topic: topic || null })} className="min-h-11">
          บันทึก
        </Button>
      </div>
    </div>
  );
}
