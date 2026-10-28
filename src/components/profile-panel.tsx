"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError } from "@/api/client";
import { profileApi } from "@/api/profile.api";
import { cardUrl, cards, nextUp } from "@/data/learn";
import { useProgress } from "@/hooks/use-progress";
import { toast } from "@/hooks/use-toast";
import { cohortDay, cohortRange } from "@/lib/cohort";
import type { Profile, ProfileFields } from "@/types";
import { ROLE_BADGE, ROLE_LABEL } from "./account-menu";
import { Button } from "./button";
import { EducationFields } from "./education-fields";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";
import { PasswordForm } from "./password-form";

type Tab = "info" | "password";
const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "ข้อมูลของฉัน" },
  { id: "password", label: "รหัสผ่าน" },
];
const field = `${inputClass} min-h-11`;

// หน้าโปรไฟล์: แท็บข้อมูล (ชื่อ การศึกษา) กับแท็บเปลี่ยนรหัสผ่าน · component ไม่เรียก fetch เอง ใช้ src/api
export function ProfilePanel({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    profileApi
      .get()
      .then(setProfile)
      // บัตรผ่านหมดรอบ (เช่นเปลี่ยนรหัสผ่านจากเครื่องอื่น): พาไป login แล้วกลับมาหน้านี้ แทนกล่อง error ที่ไปต่อไม่ได้
      .catch((e: Error) => (e instanceof ApiError && e.status === 401 ? location.assign("/login?next=/profile") : setError(e.message)));
  }, []);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!profile) return <p className="text-sm text-fd-muted-foreground">กำลังโหลด…</p>;
  const display = profile.nickname || profile.fullName || profile.username;

  return (
    <div className="not-prose flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {/* รูปประจำตัว = ตัวแรกของชื่อเล่น/ชื่อ (ไม่มีการอัปโหลดรูป ไม่ต้องเก็บไฟล์) */}
        <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-fd-primary/10 text-2xl font-bold text-fd-primary">
          {display.charAt(0).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col">
          <strong className="truncate text-lg">{profile.fullName ?? profile.username}</strong>
          <span className="flex flex-wrap items-center gap-2 text-sm text-fd-muted-foreground">
            {profile.username}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[profile.role]}`}>{ROLE_LABEL[profile.role]}</span>
          </span>
        </div>
      </div>

      <div role="tablist" aria-label="ส่วนของโปรไฟล์" className="flex gap-1 border-b border-fd-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px min-h-11 border-b-2 px-4 text-sm font-semibold ${tab === t.id ? "border-fd-primary text-fd-primary" : "border-transparent text-fd-muted-foreground hover:text-fd-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* จอกว้าง: ฟอร์มซ้าย การ์ดสรุปขวา · มือถือ: การ์ดสรุปต่อใต้ฟอร์ม (ฟอร์มคืองานหลักของหน้านี้) */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          {tab === "info" ? (
            <InfoForm profile={profile} onSaved={(p) => setProfile({ ...profile, ...p })} />
          ) : (
            <div className="max-w-md">
              <PasswordForm username={profile.username} needCurrent={profile.passwordSet} onDone={() => setProfile({ ...profile, passwordSet: true })} />
            </div>
          )}
        </div>
        {profile.role === "intern" && <InternSummary profile={profile} />}
      </div>
    </div>
  );
}

// การ์ดสรุปของน้อง: อยู่รุ่นไหน วันที่เท่าไรของการฝึก ถามใครได้ และทำต่อตรงไหน
// พี่เลี้ยงไม่มีการ์ดนี้ (ภาพรวมของพี่อยู่ที่หลังบ้าน)
function InternSummary({ profile: { cohort, lastLoginAt } }: { profile: Profile }) {
  const { done } = useProgress();
  const { card, step } = nextUp(done);
  const passed = cards.filter((c) => done.has(cardUrl(c.slug))).length;
  const day = cohort && cohortDay(cohort);

  return (
    <aside aria-label="สรุปของฉัน" className="flex flex-col divide-y divide-fd-border rounded-xl border border-fd-border bg-fd-card text-sm xl:w-72 xl:shrink-0">
      <section className="flex flex-col gap-1 p-4">
        <h2 className="text-xs font-semibold text-fd-muted-foreground">รุ่นของฉัน</h2>
        {cohort ? (
          <>
            <strong className="text-base">{cohort.name}</strong>
            <span className="text-fd-muted-foreground">{cohortRange(cohort)}</span>
            {day && (
              <span>
                วันที่ <strong>{day.day}</strong> จาก {day.total} วันทำงาน
              </span>
            )}
            {cohort.endedAt && <span className="text-fd-muted-foreground">รุ่นนี้จบแล้ว ยังอ่านคู่มือได้ แต่เปิดเรื่องถามใหม่ไม่ได้</span>}
          </>
        ) : (
          <span className="text-fd-muted-foreground">ยังไม่ได้อยู่รุ่นไหน พี่เลี้ยงจะจัดให้</span>
        )}
      </section>

      {cohort && cohort.mentors.length > 0 && (
        <section className="flex flex-col gap-1.5 p-4">
          <h2 className="text-xs font-semibold text-fd-muted-foreground">พี่เลี้ยงประจำรุ่น</h2>
          <ul className="flex flex-col gap-1">
            {cohort.mentors.map((m) => (
              <li key={m.username}>
                {m.nickname || m.fullName || m.username}
                {(m.nickname || m.fullName) && <span className="text-fd-muted-foreground"> · {m.username}</span>}
              </li>
            ))}
          </ul>
          <Link href="/questions" className="inline-flex min-h-10 items-center font-medium text-fd-primary hover:underline">
            ถามพี่เลี้ยง →
          </Link>
        </section>
      )}

      <section className="flex flex-col gap-2 p-4">
        <h2 className="text-xs font-semibold text-fd-muted-foreground">ความคืบหน้า</h2>
        <span>
          เข้าใจแล้ว <strong>{passed}</strong> / {cards.length} การ์ด
        </span>
        <span className="block h-2 overflow-hidden rounded-full bg-(--chart-track)">
          <span className="block h-full rounded-full bg-fd-primary" style={{ width: `${(passed / cards.length) * 100}%` }} />
        </span>
        {card ? (
          <Link href={cardUrl(card.slug)} className="flex min-h-11 flex-col justify-center rounded-lg bg-fd-primary/10 px-3 py-2 hover:bg-fd-primary/15">
            <span className="text-xs text-fd-muted-foreground">ทำต่อ · ขั้น {step.num} {step.name}</span>
            <span className="font-medium text-fd-primary">{card.title}</span>
          </Link>
        ) : (
          <span className="text-fd-muted-foreground">ผ่านครบทุกการ์ดแล้ว</span>
        )}
      </section>

      {lastLoginAt && (
        <p className="p-4 text-xs text-fd-muted-foreground">
          เข้าครั้งนี้เมื่อ {new Date(lastLoginAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })} · ถ้าไม่ใช่เรา เปลี่ยนรหัสผ่านทันที
        </p>
      )}
    </aside>
  );
}

function InfoForm({ profile, onSaved }: { profile: Profile; onSaved: (p: ProfileFields) => void }) {
  const [v, setV] = useState<ProfileFields>(profile);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ProfileFields>(k: K, value: ProfileFields[K]) => setV({ ...v, [k]: value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      onSaved(await profileApi.update(v));
      toast.success("บันทึกโปรไฟล์แล้ว");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <Field label="ชื่อ-นามสกุล">
        <Input className={field} value={v.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)} maxLength={100} autoComplete="name" />
      </Field>
      <Field label="ชื่อเล่น">
        <Input className={field} value={v.nickname ?? ""} onChange={(e) => set("nickname", e.target.value)} maxLength={30} autoComplete="nickname" />
      </Field>

      {/* การศึกษามีไว้ให้พี่เลี้ยงรู้จักน้อง บัญชีพี่เลี้ยงจึงไม่ต้องกรอก */}
      {profile.role === "intern" && <EducationFields value={v} onChange={(e) => setV({ ...v, ...e })} />}

      {error && (
        <div className="sm:col-span-2">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
      <Button type="submit" disabled={busy} className="min-h-11 sm:col-span-2 sm:justify-self-start">
        {busy ? "กำลังบันทึก…" : "บันทึก"}
      </Button>
    </form>
  );
}
