"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminApi } from "@/api/admin.api";
import { toast } from "@/hooks/use-toast";
import type { Cohort, User } from "@/types";
import { Button } from "./button";
import { ConfirmBox } from "./confirm-box";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";

// พี่เลี้ยงส่งข้อความหาน้อง: คนเดียว หรือทั้งรุ่น · ไปเป็นเรื่องในแชทเดิม น้องตอบกลับได้
// ส่งหลายคนต้องเห็นรายชื่อก่อน และยืนยันอีกครั้ง เพราะส่งแล้วแก้หรือเรียกคืนไม่ได้
export type ComposeTarget = { kind: "user"; user: User } | { kind: "cohort"; cohort: Cohort };

export function AdminSendMessage({ target, users, onClose }: { target: ComposeTarget; users: User[]; onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => first.current?.focus(), []);

  // ผู้รับที่ server จะส่งถึงจริง (ข้ามบัญชีที่ปิดอยู่) · server คำนวณซ้ำเอง ตรงนี้ไว้แสดงให้เห็นก่อนส่ง
  const to = target.kind === "user" ? [target.user].filter((u) => !u.disabled) : users.filter((u) => u.role === "intern" && u.cohortId === target.cohort.id && !u.disabled);
  const title = target.kind === "user" ? `ส่งข้อความถึง ${target.user.username}` : `ส่งข้อความถึงทั้งรุ่น ${target.cohort.name}`;
  const subjectBad = subject.trim().length > 0 && subject.trim().length < 3;
  const ready = subject.trim().length >= 3 && body.trim().length >= 5 && to.length > 0;

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const input = target.kind === "user" ? { userIds: [target.user.id] } : { cohortId: target.cohort.id };
      const r = await adminApi.sendMessage({ ...input, subject: subject.trim(), body: body.trim() });
      toast.success(`ส่งข้อความถึง ${r.count} คนแล้ว น้องได้รับแจ้งเตือน`);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      toast.error(`ส่งไม่สำเร็จ: ${(err as Error).message}`);
      setConfirming(false);
      setSending(false);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return toast.error(to.length === 0 ? "ไม่มีน้องที่ส่งถึงได้" : "ใส่หัวข้อ (อย่างน้อย 3 ตัวอักษร) และข้อความ (อย่างน้อย 5 ตัวอักษร) ก่อนส่ง");
    if (to.length > 1) setConfirming(true);
    else void send();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-[8vh]" onMouseDown={(e) => e.target === e.currentTarget && !sending && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={submit}
        onKeyDown={(e) => e.key === "Escape" && !sending && onClose()}
        className="flex w-full max-w-lg flex-col gap-3 rounded-xl border border-fd-border bg-fd-popover p-5 text-sm text-fd-popover-foreground shadow-lg"
      >
        <h2 className="text-lg font-semibold">{title}</h2>

        {to.length === 0 ? (
          <p role="alert" className="text-red-700 dark:text-red-400">
            ไม่มีน้องที่ส่งถึงได้ (บัญชีถูกปิดอยู่ หรือรุ่นนี้ยังไม่มีน้อง)
          </p>
        ) : (
          <details className="rounded-lg border border-fd-border bg-fd-card px-3 py-2">
            <summary className="cursor-pointer font-medium">ผู้รับ {to.length} คน{to.length > 1 && " (กดดูรายชื่อ)"}</summary>
            <p className="mt-1 text-fd-muted-foreground">{to.map((u) => u.nickname || u.username).join(" · ")}</p>
          </details>
        )}

        <Field label="หัวข้อ" hint="น้องเห็นเป็นชื่อเรื่องในหน้าคุยกับพี่เลี้ยง">
          <Input ref={first} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="เช่น นัดตรวจงานรอบ 1 วันพฤหัส" aria-invalid={subjectBad} />
        </Field>
        <Field label="ข้อความ" hint="น้องตอบกลับได้ในเรื่องนี้ · ไม่เกิน 2,000 ตัวอักษร">
          <textarea className={`${inputClass} min-h-32`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}

        {confirming ? (
          <ConfirmBox title={`ส่งถึง ${to.length} คน?`} confirmLabel={sending ? "กำลังส่ง…" : "ส่งเลย"} onConfirm={send} onCancel={() => setConfirming(false)}>
            น้องแต่ละคนจะได้เรื่องของตัวเอง ส่งแล้วแก้หรือเรียกคืนไม่ได้
          </ConfirmBox>
        ) : (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={sending || to.length === 0}>
              ส่งข้อความ
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
