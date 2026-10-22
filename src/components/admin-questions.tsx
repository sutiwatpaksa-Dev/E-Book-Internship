"use client";

import { MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { AdminState } from "@/hooks/use-admin";
import type { AdminQuestion } from "@/types";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { inputClass } from "./field";
import { QuestionThread } from "./question-thread";

type Filter = "waiting" | "answered" | "all";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "waiting", label: "รอตอบ" },
  { id: "answered", label: "ตอบแล้ว" },
  { id: "all", label: "ทั้งหมด" },
];

// แท็บคำถามจากน้อง: แต่ละข้อบอกว่าใครถามจากบทไหน ตอบหรือแก้คำตอบได้ในที่เดียว
export function AdminQuestions({ admin, titles }: { admin: AdminState; titles: Record<string, string> }) {
  const [filter, setFilter] = useState<Filter>("waiting");
  const rows = admin.questions.filter((q) => filter === "all" || (filter === "waiting") === !q.answer);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="กรองคำถาม">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={f.id === filter}
            onClick={() => setFilter(f.id)}
            className={`h-9 rounded-lg px-3 text-sm ${f.id === filter ? "bg-fd-primary/10 font-semibold text-fd-primary" : "hover:bg-fd-accent"}`}
          >
            {f.label}
          </button>
        ))}
        <p className="w-full pt-1 text-xs text-fd-muted-foreground">
          น้องเห็นคำตอบท้ายบทที่ถาม และในหน้า &ldquo;คำถามของฉัน&rdquo; · น้องคนอื่นไม่เห็น
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={MessageCircle} title={filter === "waiting" ? "ไม่มีคำถามรอตอบ" : "ยังไม่มีคำถาม"}>
          น้องถามได้จากกล่องท้ายแต่ละบท (ต้อง login)
        </EmptyState>
      ) : (
        rows.map((q) => <QuestionCard key={q.id} q={q} title={titles[q.pageUrl] ?? q.pageUrl} onAnswer={admin.answerQuestion} />)
      )}
    </div>
  );
}

function QuestionCard({ q, title, onAnswer }: { q: AdminQuestion; title: string; onAnswer: AdminState["answerQuestion"] }) {
  const [editing, setEditing] = useState(!q.answer);
  const [text, setText] = useState(q.answer ?? "");
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    if (await onAnswer(q.id, text)) setEditing(false);
    setSending(false);
  };

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-4">
      <a href={q.pageUrl} target="_blank" rel="noopener" className="w-fit text-sm font-semibold text-fd-primary underline">
        {title}
      </a>
      <QuestionThread q={q} meta={`จาก ${q.askedBy}${q.answeredBy ? ` · ตอบโดย ${q.answeredBy}` : ""}`} />
      {editing ? (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label htmlFor={`answer-${q.id}`} className="text-sm font-medium">
            {q.answer ? "แก้คำตอบ" : "คำตอบ"}
          </label>
          {/* ตอบให้น้องคิดต่อเองได้: ชี้ว่าดูตรงไหน ทำไม แทนการให้โค้ดทั้งก้อน */}
          <textarea id={`answer-${q.id}`} className={`${inputClass} min-h-28`} value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} required />
          <div className="flex gap-2">
            <Button type="submit" disabled={sending}>
              {sending ? "กำลังส่ง…" : "ส่งคำตอบ"}
            </Button>
            {q.answer && (
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                ยกเลิก
              </Button>
            )}
          </div>
        </form>
      ) : (
        <Button variant="ghost" className="w-fit" onClick={() => setEditing(true)}>
          แก้คำตอบ
        </Button>
      )}
    </article>
  );
}
