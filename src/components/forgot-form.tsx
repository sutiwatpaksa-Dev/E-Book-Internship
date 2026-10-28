"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authApi } from "@/api/auth.api";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";

const bigInput = `${inputClass} min-h-12 text-base`;

// ลืมรหัสผ่าน: ส่งชื่อผู้ใช้ → ขึ้นเป็นงานในหลังบ้านให้พี่เลี้ยงออก PIN ใหม่ (ใช้ได้ 30 นาที)
// หน้าเว็บบอกผลแบบเดียวกันเสมอ เพราะ server ไม่บอกว่าชื่อนี้มีจริงไหม (กันคนนอกใช้หน้านี้เดาชื่อ)
export function ForgotForm() {
  const [username, setUsername] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await authApi.forgot(username);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div role="status" className="flex flex-col gap-3">
        <p className="rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-3 text-sm">
          ส่งคำขอแล้ว ถ้ามีบัญชี <strong>{username}</strong> พี่เลี้ยงจะเห็นในหลังบ้านและได้แจ้งเตือน
        </p>
        <ol className="list-decimal space-y-1 ps-5 text-sm">
          <li>ทักพี่เลี้ยงในกลุ่มของรุ่นว่าขอ PIN ใหม่ (พี่จะได้ไม่พลาด)</li>
          <li>ได้ PIN 6 หลักแล้ว login ภายใน 30 นาที (เกินนั้นต้องขอใหม่)</li>
          <li>ระบบจะพาไปตั้งรหัสผ่านใหม่ของตัวเอง</li>
        </ol>
        <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-fd-primary hover:underline">
          ← กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="ชื่อผู้ใช้" hint="ชื่อที่ใช้ login เช่น somchai.j">
        <Input className={bigInput} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={64} required />
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" disabled={busy} className="min-h-12 text-base">
        {busy ? "กำลังส่ง…" : "ขอ PIN ใหม่จากพี่เลี้ยง"}
      </Button>
    </form>
  );
}
