"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useMyQuestions } from "@/hooks/use-my-questions";
import { EmptyState } from "./empty-state";
import { ErrorText } from "./error-text";
import { QuestionThread } from "./question-thread";

// หน้า "คำถามของฉัน": ทุกข้อที่เคยถาม ข้อที่รอตอบขึ้นก่อน
export function MyQuestions({ titles }: { titles: Record<string, string> }) {
  const { questions, loading, error } = useMyQuestions();
  const sorted = [...questions].sort((a, b) => Number(!!a.answer) - Number(!!b.answer));

  if (error) return <ErrorText>{error}</ErrorText>;
  if (loading) return <p className="text-sm text-fd-muted-foreground">กำลังโหลด…</p>;
  if (sorted.length === 0)
    return (
      <EmptyState icon={MessageCircle} title="ยังไม่มีคำถาม">
        ติดตรงไหน เลื่อนลงไปท้ายบทนั้นแล้วกด &ldquo;เขียนคำถาม&rdquo;
      </EmptyState>
    );

  return (
    <div className="not-prose flex flex-col gap-3">
      {sorted.map((q) => (
        <article key={q.id} className="flex flex-col gap-2 rounded-xl border border-fd-border bg-fd-card p-4">
          <Link href={q.pageUrl} className="w-fit text-sm font-semibold text-fd-primary underline">
            {titles[q.pageUrl] ?? q.pageUrl}
          </Link>
          <QuestionThread q={q} />
        </article>
      ))}
    </div>
  );
}
