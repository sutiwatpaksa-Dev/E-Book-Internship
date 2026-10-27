"use client";

import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { authApi } from "@/api/auth.api";
import { cohortRange } from "@/lib/cohort";
import { HOME } from "@/lib/home-path";
import { usernameProblem } from "@/lib/username";
import type { ProfileFields, RegisterInput } from "@/types";
import { Button } from "./button";
import { EducationFields } from "./education-fields";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";
import { PasswordChecklist, passwordRules } from "./password-form";

const field = `${inputClass} min-h-11`;
type CohortInfo = { name: string; startsOn: string; endsOn: string };

// 2 ขั้น: (1) ใส่รหัสรุ่น เห็นชื่อรุ่นก่อนว่าถูกรุ่น (2) กรอกชื่อผู้ใช้ รหัสผ่าน และการศึกษา
// แยกขั้นเพราะถ้ารหัสผิด จะได้รู้ก่อนกรอกฟอร์มยาว · server ตรวจรหัสซ้ำอีกรอบตอนส่งขั้นที่ 2
export function RegisterForm({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [cohort, setCohort] = useState<CohortInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function check(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      setCohort(await authApi.checkInvite(code));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (cohort) return <Details code={code} cohort={cohort} onBack={() => setCohort(null)} />;
  return (
    <form onSubmit={check} className="flex flex-col gap-4">
      <Field label="รหัสรุ่น" hint="8 ตัว เช่น K7QM-3XPA (ตัวเล็กหรือไม่ใส่ขีดก็ได้)">
        <Input
          className={`${inputClass} min-h-12 text-lg font-semibold tracking-[0.2em] uppercase`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          required
        />
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" disabled={busy} className="min-h-12 text-base">
        {busy ? "กำลังตรวจ…" : "ถัดไป"}
      </Button>
    </form>
  );
}

function Details({ code, cohort, onBack }: { code: string; cohort: CohortInfo; onBack: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [profile, setProfile] = useState<ProfileFields>({ fullName: "", nickname: "", schoolType: null, schoolName: "", major: "", eduLevel: null });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const name = username.trim().toLowerCase();
  const nameProblem = name ? usernameProblem(name) : null;
  const checks = passwordRules(password, name || " ");
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = !!name && !nameProblem && checks.every((c) => c.ok) && confirm === password && !!profile.schoolType && !!profile.eduLevel;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!profile.schoolType || !profile.eduLevel) return;
    setError("");
    setBusy(true);
    try {
      const input: RegisterInput = { ...profile, code, username: name, password, fullName: profile.fullName ?? "", schoolName: profile.schoolName ?? "", schoolType: profile.schoolType, eduLevel: profile.eduLevel };
      const user = await authApi.register(input);
      // โหลดหน้าใหม่ทั้งหน้า ให้ server เห็น cookie ใหม่ (สมัครแล้ว = login แล้ว)
      location.assign(HOME[user.role]);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-fd-primary/10 px-3 py-2 text-sm sm:col-span-2">
        <span>
          สมัครเข้า <strong>{cohort.name}</strong> · {cohortRange(cohort)}
        </span>
        <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-1 text-fd-primary hover:underline">
          <ArrowLeft className="size-4" /> เปลี่ยนรหัส
        </button>
      </div>

      <div className="sm:col-span-2">
        <Field label="ชื่อผู้ใช้ (ใช้ตอน login)" hint={nameProblem ?? "ตัวเล็ก a-z ตัวเลข . _ - เช่น somchai.j"}>
          <Input className={field} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={64} required aria-invalid={!!nameProblem} />
        </Field>
      </div>
      <Field label="รหัสผ่าน">
        <Input className={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" maxLength={128} required />
      </Field>
      <Field label="พิมพ์รหัสผ่านอีกครั้ง" hint={mismatch ? "สองช่องยังไม่ตรงกัน" : undefined}>
        <Input className={field} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" maxLength={128} required aria-invalid={mismatch} />
      </Field>
      <div className="sm:col-span-2">
        <PasswordChecklist checks={checks} />
      </div>

      <h2 className="mt-2 border-t border-fd-border pt-4 text-base font-semibold sm:col-span-2">เกี่ยวกับเรา (พี่เลี้ยงเห็น)</h2>
      <Field label="ชื่อ-นามสกุล">
        <Input className={field} value={profile.fullName ?? ""} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} autoComplete="name" minLength={2} maxLength={100} required />
      </Field>
      <Field label="ชื่อเล่น (ไม่บังคับ)">
        <Input className={field} value={profile.nickname ?? ""} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} autoComplete="nickname" maxLength={30} />
      </Field>
      <EducationFields value={profile} onChange={(e) => setProfile({ ...profile, ...e })} required />

      {error && (
        <div className="sm:col-span-2">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
      <Button type="submit" disabled={!ready || busy} className="min-h-12 text-base sm:col-span-2">
        {busy ? "กำลังสมัคร…" : "สมัครและเข้าใช้งาน"}
      </Button>
    </form>
  );
}
