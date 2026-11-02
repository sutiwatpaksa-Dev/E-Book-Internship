"use client";

import { useState, type FormEvent } from "react";
import { useMyMentors } from "@/hooks/use-my-mentors";
import { toast } from "@/hooks/use-toast";
import { sendToLine } from "@/lib/mentors";
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
  feedback: {
    text: "เล่าตรงๆ ได้เลย ทั้งเรื่องคู่มือ งานที่ได้ทำ และการดูแลของพี่เลี้ยง พี่เลี้ยงเห็นชื่อเรา แต่ใช้เพื่อปรับการฝึกงานรุ่นถัดไป ไม่มีผลกับคะแนน ส่งได้หลายครั้ง และส่งได้แม้รุ่นจบแล้ว",
    placeholder: "ตอบเท่าที่อยากตอบ",
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

// feedback: ใส่หัวข้อและคำถามนำไว้ให้ น้องเติมใต้แต่ละข้อ พี่เลี้ยงอ่านทุกเรื่องในรูปเดียวกัน
const FEEDBACK_SUBJECT = "Feedback การฝึกงาน";
const FEEDBACK_BODY = ["1. อะไรช่วยให้ทำงานได้มากที่สุด", "", "", "2. ติดหรืองงตรงไหนบ้าง (บท การ์ด ขั้นตอน หรือเครื่องมือ)", "", "", "3. อยากให้เปลี่ยนหรือเพิ่มอะไรให้รุ่นถัดไป", "", "", "4. ให้คะแนนการฝึกงานรวม 1–5 (5 = ดีมาก):", ""].join("\n");
const startOf = (k: InternThreadKind) => (k === "feedback" ? { subject: FEEDBACK_SUBJECT, body: FEEDBACK_BODY } : { subject: "", body: "" });

// ฟอร์มเริ่มเรื่องใหม่ (ใช้ทั้งในหน้าแชทและกล่องท้ายบท)
export function NewThreadForm({ kinds = ["question", "content_request", "feedback"], defaultKind = "question", pageUrl, onSubmit, onCancel }: Props) {
  const [kind, setKindState] = useState<InternThreadKind>(defaultKind);
  const [subject, setSubject] = useState(startOf(defaultKind).subject);
  const [body, setBody] = useState(startOf(defaultKind).body);
  // สลับประเภท: ข้อความที่ยังเป็นค่าเริ่มของประเภทเดิม (หรือว่าง) เปลี่ยนตาม · ที่พิมพ์เองแล้วไม่ทับ
  const setKind = (k: InternThreadKind) => {
    const from = startOf(kind);
    const to = startOf(k);
    if (subject === from.subject) setSubject(to.subject);
    if (body === from.body) setBody(to.body);
    setKindState(k);
  };
  const [sending, setSending] = useState(false);
  // กัน kind ที่ไม่รู้จัก (เช่น หน้าเว็บรุ่นเก่าที่ยังค้างในเบราว์เซอร์) ไม่ให้หน้าพัง
  const hint = HINT[kind] ?? HINT.question;
  const to = sendToLine(useMyMentors());

  // ส่งแบบฟอร์มเปล่า (ยังไม่เติมใต้ข้อไหนเลย) พี่เลี้ยงไม่ได้อะไร
  const blank = kind === "feedback" && body.replace(/\s/g, "") === FEEDBACK_BODY.replace(/\s/g, "");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (blank) return void toast.error("เติมคำตอบใต้ข้อไหนก็ได้อย่างน้อย 1 ข้อก่อนส่ง");
    setSending(true);
    const ok = await onSubmit({ kind, subject, body, pageUrl: kind === "question" ? pageUrl : undefined });
    setSending(false);
    if (ok) {
      setSubject(startOf(kind).subject);
      setBody(startOf(kind).body);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-4">
      {kinds.length > 1 && (
        <div role="radiogroup" aria-label="ประเภทเรื่อง" className={`grid gap-2 ${kinds.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={k === kind}
              onClick={() => setKind(k)}
              className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-medium ${k === kind ? "border-fd-primary bg-fd-primary/10 text-fd-primary" : "border-fd-border hover:bg-fd-accent"}`}
            >
              {KIND_LABEL[k].label}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs leading-relaxed text-fd-muted-foreground">{hint.text}</p>
      <Field label="หัวข้อ">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} minLength={3} maxLength={120} required placeholder={kind === "question" ? "เช่น ทำไม index กัน race ได้" : "เช่น ขอเนื้อหา Python"} />
      </Field>
      <Field label="รายละเอียด">
        <textarea className={`${inputClass} ${kind === "feedback" ? "min-h-80" : "min-h-32"}`} value={body} onChange={(e) => setBody(e.target.value)} minLength={10} maxLength={2000} required placeholder={hint.placeholder} />
      </Field>
      <p className="text-xs text-fd-muted-foreground">{to ? `${to} · น้องคนอื่นไม่เห็น` : "เห็นแค่เรากับพี่เลี้ยง น้องคนอื่นไม่เห็น"}</p>
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
