"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMyQuestions } from "@/hooks/use-my-questions";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { inputClass } from "./field";
import { QuestionThread } from "./question-thread";

// กล่องท้ายบท: ถามพี่เลี้ยงเรื่องบทนี้ เห็นกันแค่คนถามกับพี่เลี้ยง
// ไม่ได้ login ไม่แสดงเลย (คนนอกไม่มีบัญชีให้พี่เลี้ยงตอบกลับ)
export function AskQuestion({ pageUrl }: { pageUrl: string }) {
  const { loggedIn, questions, error, ask } = useMyQuestions();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  if (!loggedIn) return null;

  const here = questions.filter((q) => q.pageUrl === pageUrl);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    if (await ask(pageUrl, body)) setBody("");
    setSending(false);
  };

  return (
    <section aria-labelledby="ask-title" className="not-prose mt-10 flex flex-col gap-4 rounded-xl border border-fd-border bg-fd-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="ask-title" className="flex items-center gap-2 text-base font-semibold">
          <MessageCircle className="size-5 text-fd-primary" /> ติดตรงไหนในบทนี้ ถามพี่เลี้ยงได้
        </h2>
        <Link href="/questions" className="text-sm text-fd-primary underline">
          คำถามของฉันทั้งหมด
        </Link>
      </div>

      {here.map((q) => (
        <div key={q.id} className="border-t border-fd-border pt-3">
          <QuestionThread q={q} />
        </div>
      ))}

      {!open ? (
        <Button variant="ghost" className="w-fit" onClick={() => setOpen(true)} aria-expanded={open}>
          เขียนคำถาม
        </Button>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2">
          {/* พาให้ลองหาคำตอบเองก่อน: คำถามที่บอกว่าลองอะไรไปแล้ว พี่เลี้ยงตอบได้ตรงและเร็วกว่า */}
          <p className="text-xs leading-relaxed text-fd-muted-foreground">
            ก่อนถาม ลองอ่าน error ทั้งบรรทัด ค้นในบทนี้และหน้าศัพท์ แล้วลองแก้เองอย่างน้อยหนึ่งวิธี · เวลาเขียนให้บอก{" "}
            <strong>ทำอะไรอยู่ · คาดว่าจะได้อะไร · ได้อะไรจริง (คัดลอก error มาวาง) · ลองอะไรไปแล้ว</strong> · เห็นแค่เรากับพี่เลี้ยง
          </p>
          <label htmlFor="ask-body" className="sr-only">
            คำถาม
          </label>
          <textarea
            id="ask-body"
            className={`${inputClass} min-h-32`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            minLength={10}
            maxLength={2000}
            required
          />
          {error && <ErrorText>{error}</ErrorText>}
          <div className="flex gap-2">
            <Button type="submit" disabled={sending}>
              {sending ? "กำลังส่ง…" : "ส่งคำถาม"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              ปิด
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
