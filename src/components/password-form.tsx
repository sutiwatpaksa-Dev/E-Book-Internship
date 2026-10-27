"use client";

import { Check, Circle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { authApi } from "@/api/auth.api";
import { toast } from "@/hooks/use-toast";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";

const bigInput = `${inputClass} min-h-12 text-base`;

// กติกาเดียวกับ server (server/validators/auth.validator.ts passwordProblem) แสดงให้เห็นก่อนกด
// server ตรวจซ้ำเสมอ ตรงนี้มีไว้บอกว่าขาดอะไร ไม่ใช่ตัวกัน · หน้าสมัคร (register-form) ใช้ร่วมกัน
export function passwordRules(password: string, username: string) {
  return [
    { ok: password.length >= 10, text: "ยาว 10 ตัวอักษรขึ้นไป (ภาษาไทยก็ได้ เป็นวลีที่จำง่ายยิ่งดี)" },
    { ok: password.length > 0 && !/^(.)\1+$/.test(password), text: "ไม่ใช่ตัวเดียวซ้ำทั้งหมด" },
    { ok: password.length > 0 && !password.toLowerCase().includes(username.toLowerCase()), text: "ไม่มีชื่อผู้ใช้อยู่ในรหัสผ่าน" },
  ];
}

export function PasswordChecklist({ checks }: { checks: { ok: boolean; text: string }[] }) {
  return (
    <ul aria-label="กติการหัสผ่าน" className="flex flex-col gap-1 text-sm">
      {checks.map((c) => (
        <li key={c.text} className={`flex items-center gap-2 ${c.ok ? "text-green-700 dark:text-green-400" : "text-fd-muted-foreground"}`}>
          {c.ok ? <Check className="size-4 shrink-0" aria-label="ผ่าน" /> : <Circle className="size-4 shrink-0" aria-label="ยังไม่ผ่าน" />}
          {c.text}
        </li>
      ))}
    </ul>
  );
}

// ตั้งรหัสผ่าน: ครั้งแรก (ต่อจาก PIN ชั่วคราว ไม่ต้องใส่รหัสเดิม) หรือเปลี่ยนรหัสในหน้าโปรไฟล์ (ต้องใส่รหัสเดิม)
// สำเร็จแล้ว server ออกบัตรผ่านใหม่ให้เครื่องนี้ ส่วนเครื่องอื่นที่ login ค้างไว้จะหลุด
export function PasswordForm({ username, needCurrent, onDone }: { username: string; needCurrent: boolean; onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const checks = passwordRules(password, username);
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = checks.every((c) => c.ok) && confirm === password && (!needCurrent || current.length > 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await authApi.setPassword(password, needCurrent ? current : undefined);
      toast.success(needCurrent ? "เปลี่ยนรหัสผ่านแล้ว เครื่องอื่นที่ login ค้างไว้ต้อง login ใหม่" : "ตั้งรหัสผ่านแล้ว ครั้งหน้า login ด้วยรหัสนี้");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {needCurrent && (
        <Field label="รหัสผ่านเดิม">
          <Input className={bigInput} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" maxLength={128} required />
        </Field>
      )}
      <Field label="รหัสผ่านใหม่">
        <Input className={bigInput} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" maxLength={128} required />
      </Field>
      <PasswordChecklist checks={checks} />
      <Field label="พิมพ์รหัสผ่านใหม่อีกครั้ง">
        <Input className={bigInput} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" maxLength={128} required aria-invalid={mismatch} />
      </Field>
      {mismatch && <p className="text-sm text-red-700 dark:text-red-400">สองช่องยังไม่ตรงกัน</p>}
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" disabled={!ready || busy} className="min-h-12 text-base">
        {busy ? "กำลังบันทึก…" : needCurrent ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่านแล้วเข้าใช้งาน"}
      </Button>
    </form>
  );
}
