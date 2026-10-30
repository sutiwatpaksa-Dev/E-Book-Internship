"use client";

import { useState, type FormEvent } from "react";
import { KIND_LABEL } from "@/lib/thread-labels";
import type { NewThread, InternThreadKind } from "@/types";
import { Button } from "./button";
import { Field, Input, inputClass } from "./field";

// คำแนะนำก่อนเขียน: คำถามที่บอกว่าลองอะไรไปแล้ว หรือคำขอที่บอกว่าจะเอาไปใช้ทำอะไร พี่เลี้ยงตอบได้ตรงกว่า
const HINT: Record<InternThreadKind, { text: string; placeholder: string }> = {
  question: {
    text: "ก่อนถาม ลองอ่าน error ทั้งบรรทัด ค้นในบทและหน้าศัพท์ แล้วลองแก้เองอย่างน้อยหนึ่งวิธี · เขียนให้บอก ทำอะไรอยู่ · คาดว่าจะได้อะไร · ได้อะไรจริง (วาง error) · ลองอะไรไปแล้ว",
    placeholder: "ทำอะไรอยู่ / คาดว่าจะได้ / ได้จริง / ลองอะไรไปแล้ว",
  },
  content_request: {
    text: "บอกว่าอยากได้เนื้อหาเรื่องอะไร จะเอาไปใช้ทำอะไร และตอนนี้รู้เรื่องนี้แค่ไหนแล้ว พี่เลี้ยงจะรับเรื่องและแจ้งความคืบหน้าในแชทนี้",
    placeholder: "เช่น อยากได้บท Python พื้นฐาน เอาไปใช้ทำงาน data ตอนนี้เขียน JS เป็นแล้ว",
  },
};

type Props = {
  kinds?: InternThreadKind[];
  defaultKind?: InternThreadKind;
  pageUrl?: string;
  onSubmit: (t: NewThread) => Promise<unknown>;
  onCancel?: () => void;
};

// ฟอร์มเริ่มเรื่องใหม่ (ใช้ทั้งในหน้าแชทและกล่องท้ายบท)
export function NewThreadForm({ kinds = ["question", "content_request"], defaultKind = "question", pageUrl, onSubmit, onCancel }: Props) {
  const [kind, setKind] = useState<InternThreadKind>(defaultKind);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    const ok = await onSubmit({ kind, subject, body, pageUrl: kind === "question" ? pageUrl : undefined });
    setSending(false);
    if (ok) {
      setSubject("");
      setBody("");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-4">
      {kinds.length > 1 && (
        <div role="radiogroup" aria-label="ประเภทเรื่อง" className="grid grid-cols-2 gap-2">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={k === kind}
              onClick={() => setKind(k)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${k === kind ? "border-fd-primary bg-fd-primary/10 text-fd-primary" : "border-fd-border hover:bg-fd-accent"}`}
            >
              {KIND_LABEL[k].label}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs leading-relaxed text-fd-muted-foreground">{HINT[kind].text}</p>
      <Field label="หัวข้อ">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} minLength={3} maxLength={120} required placeholder={kind === "question" ? "เช่น ทำไม index กัน race ได้" : "เช่น ขอเนื้อหา Python"} />
      </Field>
      <Field label="รายละเอียด">
        <textarea className={`${inputClass} min-h-32`} value={body} onChange={(e) => setBody(e.target.value)} minLength={10} maxLength={2000} required placeholder={HINT[kind].placeholder} />
      </Field>
      <p className="text-xs text-fd-muted-foreground">เห็นแค่เรากับพี่เลี้ยง น้องคนอื่นไม่เห็น</p>
      <div className="flex gap-2">
        <Button type="submit" disabled={sending}>
          {sending ? "กำลังส่ง…" : "ส่ง"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            ยกเลิก
          </Button>
        )}
      </div>
    </form>
  );
}
