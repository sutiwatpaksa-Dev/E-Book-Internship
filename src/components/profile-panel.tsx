"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError } from "@/api/client";
import { profileApi } from "@/api/profile.api";
import { cardUrl, cards, nextUp } from "@/data/learn";
import { useProgress } from "@/hooks/use-progress";
import { toast } from "@/hooks/use-toast";
import { cohortDay, cohortRange } from "@/lib/cohort";
import { CONTACT_RULES, socialOf } from "@/lib/contact";
import type { MentorContact, Profile, ProfileFields } from "@/types";
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
      {profile.role === "intern" && profile.cohort && profile.cohort.mentors.length > 0 && <MentorContacts mentors={profile.cohort.mentors} />}
    </div>
  );
}

// ข้อมูลพี่เลี้ยงประจำรุ่น ไว้กรอกเอกสารฝึกงาน (ชื่อผู้ดูแล ตำแหน่ง เบอร์โทร) · server ส่งมาเฉพาะพี่เลี้ยงของรุ่นตัวเอง
const nameOf = (m: MentorContact) => m.fullName || m.nickname || m.username;
const gradOf = (m: MentorContact) => [m.schoolName, m.major].filter(Boolean).join(" · ");

function MentorContacts({ mentors }: { mentors: MentorContact[] }) {
  return (
    <section id="mentors" aria-labelledby="mentors-title" className="flex scroll-mt-24 flex-col gap-3">
      <div>
        <h2 id="mentors-title" className="text-lg font-semibold">
          ข้อมูลพี่เลี้ยง
        </h2>
        <p className="text-sm text-fd-muted-foreground">ใช้กรอกเอกสารฝึกงานของสถานศึกษา (ชื่อผู้ดูแล ตำแหน่ง เบอร์ติดต่อ) · เป็นข้อมูลที่พี่เลี้ยงกรอกเอง ช่องไหนว่างให้ถามพี่โดยตรง</p>
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {mentors.map((m) => (
          <MentorCard key={m.username} m={m} />
        ))}
      </ul>
    </section>
  );
}

function MentorCard({ m }: { m: MentorContact }) {
  const rows: [string, string | null][] = [
    ["ชื่อ-นามสกุล", m.fullName],
    ["ชื่อเล่น", m.nickname],
    ["ตำแหน่ง", m.jobTitle],
    ["เบอร์โทร", m.phone],
    ["อีเมล", m.email],
    ["จบจาก", gradOf(m) || null],
    ["ถนัดด้าน", m.expertise],
    ["ช่องทางอื่น", socialOf(m) || null],
  ];
  // คัดลอกเป็นข้อความหลายบรรทัด วางลงเอกสารหรือแชทได้ทันที (ข้ามช่องที่ว่าง)
  async function copy() {
    try {
      await navigator.clipboard.writeText(rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n"));
      toast.success(`คัดลอกข้อมูลของ${m.nickname || nameOf(m)}แล้ว`);
    } catch {
      toast.error("คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง");
    }
  }
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate">{nameOf(m)}</strong>
          {m.jobTitle && <span className="text-sm text-fd-muted-foreground">{m.jobTitle}</span>}
        </div>
        <Button type="button" variant="ghost" onClick={copy} className="min-h-11 shrink-0 border border-fd-border">
          คัดลอก
        </Button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-fd-muted-foreground">{k}</dt>
            <dd className="min-w-0 break-words">
              {k === "เบอร์โทร" && v ? (
                <a href={`tel:${v.replace(/[^\d+]/g, "")}`} className="font-medium text-fd-primary hover:underline">
                  {v}
                </a>
              ) : (
                (v ?? <span className="text-fd-muted-foreground">ยังไม่ได้กรอก</span>)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </li>
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
              <li key={m.username} className="flex flex-col">
                <span>{m.nickname || m.fullName || m.username}</span>
                {m.jobTitle && <span className="text-xs text-fd-muted-foreground">{m.jobTitle}</span>}
              </li>
            ))}
          </ul>
          <span className="flex flex-wrap gap-x-4">
            <Link href="/questions" className="inline-flex min-h-10 items-center font-medium text-fd-primary hover:underline">
              ถามพี่เลี้ยง →
            </Link>
            <a href="#mentors" className="inline-flex min-h-10 items-center font-medium text-fd-primary hover:underline">
              ข้อมูลติดต่อ ↓
            </a>
          </span>
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

type Setter = <K extends keyof ProfileFields>(k: K, value: ProfileFields[K]) => void;

const txtOf = (v: ProfileFields) => (k: keyof ProfileFields) => (v[k] as string | null | undefined) ?? "";

// ช่องของพี่เลี้ยง: น้องในรุ่นที่พี่ดูแลเห็นทั้งหมด (คนนอกรุ่นและคนที่ไม่ได้ login ไม่เห็น)
function MentorFieldsForm({ v, set }: { v: ProfileFields; set: Setter }) {
  const txt = txtOf(v);
  return (
    <>
      <p className="rounded-lg bg-fd-primary/10 px-3 py-2 text-sm sm:col-span-2">
        น้องในรุ่นที่พี่ดูแลเห็นข้อมูลด้านล่าง ใช้กรอกเอกสารฝึกงานของสถานศึกษา · ใส่เบอร์และช่องทางที่ใช้ทำงาน
      </p>
      <Field label="ตำแหน่ง">
        <Input className={field} value={txt("jobTitle")} onChange={(e) => set("jobTitle", e.target.value)} maxLength={100} autoComplete="organization-title" placeholder="เช่น Senior Full-stack Developer" />
      </Field>
      <PhoneField v={v} set={set} />
      <EmailField v={v} set={set} />
      <Field label="จบจาก (สถานศึกษา)">
        <Input className={field} value={txt("schoolName")} onChange={(e) => set("schoolName", e.target.value)} maxLength={150} placeholder="เช่น มหาวิทยาลัยบูรพา" />
      </Field>
      <Field label="คณะ / สาขา">
        <Input className={field} value={txt("major")} onChange={(e) => set("major", e.target.value)} maxLength={150} placeholder="เช่น วิทยาการคอมพิวเตอร์" />
      </Field>
      <ExpertiseField v={v} set={set} label="ถนัดด้าน" hint="น้องจะได้รู้ว่าเรื่องไหนควรถามพี่คนนี้" placeholder="เช่น React, ออกแบบฐานข้อมูล, Deploy บน Vercel" />
      <SocialFields v={v} set={set} />
    </>
  );
}

// ช่องติดต่อของน้อง: พี่เลี้ยงทุกคนเห็นในหลังบ้าน (หน้าน้องรายคน) ไว้ติดต่อเรื่องงานและเอกสารฝึกงาน
function InternContactForm({ v, set }: { v: ProfileFields; set: Setter }) {
  return (
    <>
      <p className="rounded-lg bg-fd-primary/10 px-3 py-2 text-sm sm:col-span-2">
        ช่องติดต่อด้านล่างไม่บังคับ พี่เลี้ยงทุกคนเห็น (น้องคนอื่นไม่เห็น) ใช้ติดต่อเรื่องงานและเอกสารฝึกงาน
      </p>
      <PhoneField v={v} set={set} />
      <EmailField v={v} set={set} />
      <ExpertiseField v={v} set={set} label="ด้านที่สนใจ / ถนัด" hint="พี่เลี้ยงจะได้รู้ว่าน้องอยากฝึกเรื่องไหน" placeholder="เช่น หน้าเว็บ React, ฐานข้อมูล, อยากลอง Deploy" />
      <SocialFields v={v} set={set} />
    </>
  );
}

// บอกผิดใต้ช่องทันทีที่พิมพ์ (server ตรวจซ้ำด้วยกฎเดียวกันใน src/lib/contact.ts)
function contactProblem(v: ProfileFields) {
  const txt = txtOf(v);
  const problem = (k: keyof typeof CONTACT_RULES) => CONTACT_RULES[k](txt(k).trim());
  const Err = ({ k }: { k: keyof typeof CONTACT_RULES }) =>
    problem(k) ? (
      <span role="alert" className="text-xs text-red-700 dark:text-red-400">
        {problem(k)}
      </span>
    ) : null;
  return { txt, problem, Err };
}

function PhoneField({ v, set }: { v: ProfileFields; set: Setter }) {
  const { txt, problem, Err } = contactProblem(v);
  return (
    <Field label="เบอร์โทร">
      <Input className={field} type="tel" inputMode="tel" value={txt("phone")} onChange={(e) => set("phone", e.target.value)} maxLength={25} autoComplete="tel" placeholder="เช่น 081-234-5678" aria-invalid={!!problem("phone")} />
      <Err k="phone" />
    </Field>
  );
}

function EmailField({ v, set }: { v: ProfileFields; set: Setter }) {
  const { txt, problem, Err } = contactProblem(v);
  return (
    <Field label="อีเมล">
      <Input className={field} type="email" inputMode="email" value={txt("email")} onChange={(e) => set("email", e.target.value)} maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="เช่น somchai@gmail.com" aria-invalid={!!problem("email")} />
      <Err k="email" />
    </Field>
  );
}

function ExpertiseField({ v, set, label, hint, placeholder }: { v: ProfileFields; set: Setter; label: string; hint: string; placeholder: string }) {
  return (
    <div className="sm:col-span-2">
      <Field label={label} hint={hint}>
        <textarea value={txtOf(v)("expertise")} onChange={(e) => set("expertise", e.target.value)} maxLength={300} className={`${inputClass} min-h-20`} placeholder={placeholder} />
      </Field>
    </div>
  );
}

function SocialFields({ v, set }: { v: ProfileFields; set: Setter }) {
  const { txt, problem, Err } = contactProblem(v);
  return (
    <fieldset className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
      <legend className="mb-2 text-sm font-semibold">
        ช่องทางติดต่อเสริม <span className="font-normal text-fd-muted-foreground">(ไม่บังคับ)</span>
      </legend>
      <Field label="LINE ID">
        <Input className={field} value={txt("lineId")} onChange={(e) => set("lineId", e.target.value)} maxLength={20} autoCapitalize="none" spellCheck={false} aria-invalid={!!problem("lineId")} />
        <Err k="lineId" />
      </Field>
      <Field label="Instagram">
        <Input className={field} value={txt("instagram")} onChange={(e) => set("instagram", e.target.value)} maxLength={31} autoCapitalize="none" spellCheck={false} placeholder="@ชื่อผู้ใช้" aria-invalid={!!problem("instagram")} />
        <Err k="instagram" />
      </Field>
      <Field label="Facebook">
        <Input className={field} value={txt("facebook")} onChange={(e) => set("facebook", e.target.value)} maxLength={100} autoCapitalize="none" spellCheck={false} placeholder="facebook.com/..." aria-invalid={!!problem("facebook")} />
        <Err k="facebook" />
      </Field>
    </fieldset>
  );
}

function InfoForm({ profile, onSaved }: { profile: Profile; onSaved: (p: ProfileFields) => void }) {
  const [v, setV] = useState<ProfileFields>(profile);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set: Setter = (k, value) => setV({ ...v, [k]: value });

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

      {/* น้อง: การศึกษา (ให้พี่เลี้ยงรู้จัก) · พี่เลี้ยง: ข้อมูลที่น้องใช้กรอกเอกสารฝึกงาน */}
      {profile.role === "intern" ? (
        <>
          <EducationFields value={v} onChange={(e) => setV({ ...v, ...e })} />
          <InternContactForm v={v} set={set} />
        </>
      ) : (
        <MentorFieldsForm v={v} set={set} />
      )}

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
