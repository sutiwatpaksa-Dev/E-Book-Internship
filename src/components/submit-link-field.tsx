"use client";

import { hasLink, TEXT_MIN, type DeliverableKind } from "@/lib/submission";
import { Field, Input, inputClass } from "./field";

// ช่องกรอกของที่น้องส่ง ขึ้นตามชนิดงาน (assignments.submit_kind): repo = ลิงก์ GitHub · link = ลิงก์ https ทั่วไป · text = ไม่มีช่องลิงก์ (มีแต่ช่องข้อความ)
// ใช้ร่วมกันทั้งกล่องส่งงานในหน้างานและหน้าการส่งงาน เพื่อให้ข้อความตรงกันทุกที่
const COPY = {
  repo: { label: "ลิงก์ repo บน GitHub", placeholder: "https://github.com/somchai/starter" },
  link: { label: "ลิงก์งานที่ส่ง", placeholder: "https://www.figma.com/file/…" },
} as const;

export function SubmitLinkField({ kind, value, onChange, error, hint }: { kind: DeliverableKind; value: string; onChange: (v: string) => void; error: string | null; hint?: string }) {
  if (!hasLink(kind)) return null;
  const c = COPY[kind as "repo" | "link"];
  const defaultHint = kind === "repo" ? "repo แบบ private ต้องเชิญพี่เลี้ยงเป็น collaborator ก่อน" : "ตั้งสิทธิ์ให้ \"ใครมีลิงก์ก็เปิดดูได้\" แล้วลองเปิดในหน้าต่าง Incognito ก่อนส่ง ไม่งั้นพี่เลี้ยงเปิดไม่ได้";
  return (
    <>
      <Field label={c.label} hint={hint ?? defaultHint}>
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={c.placeholder} inputMode="url" autoCapitalize="none" spellCheck={false} maxLength={300} aria-invalid={!!error} />
      </Field>
      {error && <p role="alert" className="-mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>}
    </>
  );
}

// ช่องข้อความถึงพี่เลี้ยง: งานแบบข้อความอย่างเดียวต้องกรอก (เป็นตัวงานเอง) ชนิดอื่นไม่บังคับ
export function SubmitNoteField({ kind, value, onChange, error }: { kind: DeliverableKind; value: string; onChange: (v: string) => void; error: string | null }) {
  const isText = kind === "text";
  return (
    <>
      <Field
        label={isText ? "สิ่งที่ทำ (ต้องกรอก)" : "ข้อความถึงพี่เลี้ยง (ไม่บังคับ)"}
        hint={isText ? `เขียนงานที่ทำส่งเป็นข้อความ อย่างน้อย ${TEXT_MIN} ตัวอักษร` : "รอบนี้ทำอะไรเสร็จ ยังค้างตรงไหน อยากให้ดูอะไรเป็นพิเศษ"}
      >
        <textarea className={`${inputClass} min-h-20`} value={value} onChange={(e) => onChange(e.target.value)} maxLength={1000} aria-invalid={!!error} />
      </Field>
      {error && <p role="alert" className="-mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>}
    </>
  );
}
