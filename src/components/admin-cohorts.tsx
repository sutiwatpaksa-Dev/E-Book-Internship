"use client";

import { cohortHref, internHref } from "@/lib/admin-links";
import { RowLink } from "./row-link";
import { ArrowLeft, Copy, GraduationCap, KeyRound, Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { cardUrl, cards } from "@/data/learn";
import { daysSince, type AdminState } from "@/hooks/use-admin";
import { toast } from "@/hooks/use-toast";
import { COHORT_STATUS_LABEL, cohortDay, cohortRange, cohortStatus, todayTH, type CohortStatus } from "@/lib/cohort";
import type { Cohort, CohortInput, User } from "@/types";
import type { AdminNav } from "./admin-panel";
import { Button } from "./button";
import { ConfirmBox } from "./confirm-box";
import { EmptyState } from "./empty-state";
import { Field, Input, inputClass } from "./field";

// สีป้ายสถานะ: กำลังฝึก = สีหลัก, เลยวันจบ = ส้ม (ต้องมีคนตัดสินใจ), ที่เหลือ = เทา
const STATUS_TONE: Record<CohortStatus, string> = {
  active: "bg-fd-primary/10 text-fd-primary",
  overdue: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  upcoming: "bg-fd-muted text-fd-muted-foreground",
  ended: "bg-fd-muted text-fd-muted-foreground",
};

// นับเฉพาะการ์ดในโค้ด (ตัวหารเท่ากันทุกคน) ไม่รวมบทเดิมและการ์ดของพี่เลี้ยง
const CARD_LINKS = new Set(cards.map((c) => cardUrl(c.slug)));
const cardsDone = (admin: AdminState, userId: number) => (admin.progress[userId] ?? []).filter((e) => CARD_LINKS.has(e.link)).length;

export function StatusPill({ cohort }: { cohort: Cohort }) {
  const s = cohortStatus(cohort);
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_TONE[s]}`}>{COHORT_STATUS_LABEL[s]}</span>;
}

// เมนู "รุ่นฝึกงาน": รายการรุ่น หรือหน้ารุ่นที่เลือก (cohortId) · สร้าง/แก้รุ่นใช้ฟอร์มเดียวกัน
export function AdminCohorts({ admin, nav, cohortId }: { admin: AdminState; nav: AdminNav; cohortId: number | null }) {
  const cohort = cohortId === null ? undefined : admin.cohorts.find((c) => c.id === cohortId);
  if (cohort) return <CohortDetail admin={admin} nav={nav} cohort={cohort} />;
  return <CohortList admin={admin} nav={nav} />;
}

function CohortList({ admin, nav }: { admin: AdminState; nav: AdminNav }) {
  const [creating, setCreating] = useState(false);
  const interns = admin.users.filter((u) => u.role === "intern");
  const noCohort = interns.filter((u) => u.cohortId === null).length;
  const avg = (c: Cohort) => {
    const list = interns.filter((u) => u.cohortId === c.id);
    if (list.length === 0) return null;
    return Math.round((list.reduce((n, u) => n + cardsDone(admin, u.id), 0) / list.length / cards.length) * 100);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fd-muted-foreground">น้องแต่ละรุ่นฝึกในช่วงเวลาเดียวกัน · ภาพรวมกรองตามรุ่นได้ · จบรุ่นแล้วน้องยังอ่านคู่มือได้ แต่เปิดเรื่องถามใหม่ไม่ได้</p>
        {!creating && (
          <Button onClick={() => setCreating(true)} className="min-h-11">
            <Plus className="size-4" /> รุ่นใหม่
          </Button>
        )}
      </div>

      {creating && (
        <CohortForm
          onCancel={() => setCreating(false)}
          onSave={async (input) => {
            if (await admin.saveCohort(null, input)) setCreating(false);
          }}
        />
      )}

      {admin.cohorts.length === 0 && !creating ? (
        <EmptyState icon={GraduationCap} title="ยังไม่มีรุ่นฝึกงาน">
          สร้างรุ่นแรก แล้วย้ายบัญชีน้องที่มีอยู่ ({interns.length} คน) เข้ารุ่นได้จากหน้ารุ่น
        </EmptyState>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-fd-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-fd-muted text-left">
              <tr>
                <th className="px-3 py-2">รุ่น</th>
                <th className="px-3 py-2">ช่วงฝึก</th>
                <th className="px-3 py-2">น้อง</th>
                <th className="px-3 py-2">การ์ดเฉลี่ย</th>
                <th className="px-3 py-2">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {admin.cohorts.map((c) => {
                const pct = avg(c);
                return (
                  <tr key={c.id} className="relative border-t border-fd-border hover:bg-fd-accent/50">
                    <td className="px-3 py-2">
                      <RowLink href={cohortHref(c.id)} onGo={() => nav.openCohort(c.id)} className="inline-flex min-h-10 items-center font-semibold">
                        {c.name}
                      </RowLink>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-fd-muted-foreground">{cohortRange(c)}</td>
                    <td className="px-3 py-2 tabular-nums">{c.internCount}</td>
                    <td className="px-3 py-2">
                      {pct === null ? (
                        <span className="text-fd-muted-foreground">–</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-20 overflow-hidden rounded-full bg-fd-muted">
                            <span className="block h-full bg-fd-primary" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="text-xs text-fd-muted-foreground tabular-nums">{pct}%</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill cohort={c} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {noCohort > 0 && <p className="text-sm text-fd-muted-foreground">น้องที่ยังไม่มีรุ่น {noCohort} คน (บัญชีที่สร้างก่อนมีระบบรุ่น) เปิดหน้ารุ่นแล้วกด &quot;ย้ายเข้ารุ่นนี้&quot;</p>}
    </div>
  );
}

function CohortForm({ initial, onSave, onCancel }: { initial?: CohortInput; onSave: (v: CohortInput) => void; onCancel: () => void }) {
  const [v, setV] = useState<CohortInput>(initial ?? { name: "", startsOn: "", endsOn: "" });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ ...v, name: v.name.trim() });
  };
  // ตรวจในหน้าก่อนส่ง ให้รู้ทันทีว่าผิดตรงไหน (server ตรวจซ้ำอีกรอบเสมอ)
  const badPeriod = !!v.startsOn && !!v.endsOn && v.endsOn < v.startsOn;
  return (
    <form onSubmit={submit} aria-label={initial ? "แก้ข้อมูลรุ่น" : "สร้างรุ่นใหม่"} className="grid gap-3 rounded-xl border border-fd-primary/40 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="ชื่อรุ่น">
          <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="เช่น รุ่น 2 · ฤดูหนาว 2569" minLength={2} maxLength={80} required />
        </Field>
      </div>
      <Field label="วันเริ่มฝึก">
        <Input type="date" value={v.startsOn} onChange={(e) => setV({ ...v, startsOn: e.target.value })} required />
      </Field>
      <Field label="วันจบ">
        <Input type="date" value={v.endsOn} min={v.startsOn || undefined} onChange={(e) => setV({ ...v, endsOn: e.target.value })} required />
      </Field>
      {badPeriod && <p className="text-sm text-red-700 sm:col-span-2 dark:text-red-400">วันจบต้องไม่ก่อนวันเริ่ม</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="min-h-11">
          ยกเลิก
        </Button>
        <Button type="submit" disabled={badPeriod} className="min-h-11">
          {initial ? "บันทึก" : "สร้างรุ่น"}
        </Button>
      </div>
    </form>
  );
}

function CohortDetail({ admin, nav, cohort: c }: { admin: AdminState; nav: AdminNav; cohort: Cohort }) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"end" | "reopen" | { remove: User } | null>(null);
  const status = cohortStatus(c);
  const day = cohortDay(c);
  const name = (id: number | null) => admin.cohorts.find((x) => x.id === id)?.name ?? "ไม่มีรุ่น";
  const members = admin.users.filter((u) => u.role === "intern" && u.cohortId === c.id);

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={() => nav.back("cohorts")} className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-medium text-fd-primary hover:underline">
        <ArrowLeft className="size-4" /> กลับ
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <strong className="text-xl">{c.name}</strong>
            <StatusPill cohort={c} />
          </span>
          <span className="text-sm text-fd-muted-foreground">
            {cohortRange(c)}
            {day && ` · วันที่ ${day.day} จาก ${day.total} วันทำงาน`}
            {status === "overdue" && " · เลยวันจบแล้ว ถ้าฝึกจบจริงกด \"จบรุ่น\""}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => nav.compose({ kind: "cohort", cohort: c })} disabled={members.length === 0} className="min-h-11">
            ส่งข้อความถึงทั้งรุ่น
          </Button>
          <Button variant="ghost" onClick={() => setEditing((v) => !v)} aria-expanded={editing} className="min-h-11">
            <Pencil className="size-4" /> แก้ข้อมูลรุ่น
          </Button>
          {c.endedAt ? (
            <Button variant="ghost" onClick={() => setConfirm("reopen")} className="min-h-11">
              เปิดรุ่นกลับ
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirm("end")} className="min-h-11">
              จบรุ่น
            </Button>
          )}
        </div>
      </div>

      {editing && (
        <CohortForm
          initial={{ name: c.name, startsOn: c.startsOn, endsOn: c.endsOn }}
          onCancel={() => setEditing(false)}
          onSave={async (input) => {
            if (await admin.saveCohort(c.id, input)) setEditing(false);
          }}
        />
      )}

      {confirm === "end" && (
        <ConfirmBox title={`จบ ${c.name} ตอนนี้?`} confirmLabel="จบรุ่น" danger onCancel={() => setConfirm(null)} onConfirm={() => (setConfirm(null), admin.setCohortEnded(c, true))}>
          น้อง {members.length} คนยังอ่านคู่มือได้ แต่เปิดเรื่องถามใหม่ไม่ได้ (ตอบเรื่องเดิมได้) · ข้อมูลและความคืบหน้าเก็บไว้ครบ กด &quot;เปิดรุ่นกลับ&quot; ได้ภายหลัง
        </ConfirmBox>
      )}
      {confirm === "reopen" && (
        <ConfirmBox title={`เปิด ${c.name} กลับ?`} confirmLabel="เปิดรุ่นกลับ" onCancel={() => setConfirm(null)} onConfirm={() => (setConfirm(null), admin.setCohortEnded(c, false))}>
          น้องในรุ่นเปิดเรื่องถามใหม่ได้อีกครั้ง
        </ConfirmBox>
      )}
      {confirm && typeof confirm === "object" && (
        <ConfirmBox
          title={`เอา ${confirm.remove.username} ออกจาก ${c.name}?`}
          confirmLabel="เอาออกจากรุ่น"
          onCancel={() => setConfirm(null)}
          onConfirm={() => (setConfirm(null), admin.assignCohort([confirm.remove.id], null))}
        >
          บัญชียังใช้ได้ตามเดิม ย้ายไปอยู่ &quot;ไม่มีรุ่น&quot; · ความคืบหน้าไม่หาย
        </ConfirmBox>
      )}

      <Assignments key={admin.assignments.map((a) => `${a.id}:${a.cohortIds.join(".")}`).join(",")} admin={admin} nav={nav} cohort={c} />

      <section aria-labelledby="members-title" className="flex flex-col gap-2">
        <h2 id="members-title" className="text-base font-semibold">
          น้องในรุ่น ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="rounded-xl border border-dashed border-fd-border p-4 text-sm text-fd-muted-foreground">ยังไม่มีน้องในรุ่นนี้ เลือกจากรายการด้านล่าง หรือสร้างบัญชีใหม่ในเมนู &quot;บัญชีผู้ใช้&quot; แล้วเลือกรุ่นนี้</p>
        ) : (
          <div className="relative overflow-x-auto rounded-xl border border-fd-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-fd-muted text-left">
                <tr>
                  <th className="px-3 py-2">ชื่อผู้ใช้</th>
                  <th className="px-3 py-2">การ์ดที่เข้าใจแล้ว</th>
                  <th className="px-3 py-2">เข้าล่าสุด</th>
                  <th className="px-3 py-2 text-end">
                    <span className="sr-only">จัดการ</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((u) => {
                  const d = daysSince(u.lastLoginAt);
                  return (
                    <tr key={u.id} className="relative border-t border-fd-border hover:bg-fd-accent/50">
                      <td className="px-3 py-2">
                        <RowLink href={internHref(u.id)} onGo={() => nav.openIntern(u.id)} className="inline-flex min-h-10 items-center">
                          {u.username}
                        </RowLink>
                        {u.disabled && <span className="ms-2 text-xs text-orange-700 dark:text-orange-400">ปิดอยู่</span>}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {cardsDone(admin, u.id)}/{cards.length}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-fd-muted-foreground">{d === null ? "ยังไม่เคยเข้า" : d === 0 ? "วันนี้" : `${d} วันก่อน`}</td>
                      <td className="px-3 py-2 text-end">
                        <Button variant="ghost" onClick={() => setConfirm({ remove: u })} className="min-h-10">
                          เอาออก
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Signup key={`${c.signupOpen}${c.signupUntil}${c.seatLimit}`} admin={admin} cohort={c} />
      <AddMembers admin={admin} cohort={c} name={name} />
      <Mentors key={c.mentorIds.join(",")} admin={admin} cohort={c} />
    </div>
  );
}

// โจทย์ของรุ่น: เพิ่มได้หลายชิ้นจนกว่าจะจบรุ่น · น้องเห็นทุกชิ้นในแผงเอกสาร ชิ้นที่เพิ่มล่าสุดเปิดก่อน
// เอาโจทย์ออกจากรุ่นที่เริ่มฝึกแล้วต้องกดยืนยัน (น้องที่ทำโจทย์นั้นอยู่จะเปิด PDF ไม่ได้ทันที) · server ล็อกรุ่นที่จบแล้วซ้ำอีกชั้น
function Assignments({ admin, nav, cohort: c }: { admin: AdminState; nav: AdminNav; cohort: Cohort }) {
  const current = admin.assignments.filter((a) => a.cohortIds.includes(c.id)).map((a) => a.id);
  const [picked, setPicked] = useState<Set<number>>(new Set(current));
  const [confirm, setConfirm] = useState(false);
  const removed = admin.assignments.filter((a) => current.includes(a.id) && !picked.has(a.id));
  const changed = picked.size !== current.length || current.some((id) => !picked.has(id));
  const started = cohortStatus(c) !== "upcoming";
  const toggle = (id: number) => setPicked((p) => (p.has(id) ? new Set([...p].filter((x) => x !== id)) : new Set([...p, id])));
  const save = () => (setConfirm(false), admin.setCohortAssignments(c, [...picked]));

  return (
    <section aria-labelledby="asg-title" className="flex flex-col gap-2 rounded-xl border border-fd-border p-4">
      <h2 id="asg-title" className="text-base font-semibold">
        โจทย์ของรุ่น
      </h2>
      {c.endedAt ? (
        <p className="text-sm text-fd-muted-foreground">รุ่นจบแล้ว เพิ่มหรือเอาโจทย์ออกไม่ได้ (ถ้าจำเป็นกด &quot;เปิดรุ่นกลับ&quot; ก่อน)</p>
      ) : (
        <p className="text-sm text-fd-muted-foreground">เลือกได้หลายโจทย์ น้องเห็นทุกโจทย์ที่เลือก โจทย์ที่เพิ่มล่าสุดเปิดเป็นชิ้นแรก · สร้างโจทย์ใหม่ได้ที่เมนู &quot;โจทย์และตั้งค่า&quot;</p>
      )}
      {admin.assignments.length === 0 ? (
        <p className="text-sm text-fd-muted-foreground">ยังไม่มีโจทย์ในระบบ</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {admin.assignments.map((a) => (
            <li key={a.id}>
              <label className={`flex min-h-11 items-center gap-2.5 rounded-lg px-2 ${c.endedAt ? "opacity-70" : "cursor-pointer hover:bg-fd-accent"}`}>
                <input type="checkbox" className="size-5" checked={picked.has(a.id)} disabled={!!c.endedAt} onChange={() => toggle(a.id)} />
                <span className="font-medium">{a.name}</span>
                {!a.pdf && <span className="text-xs text-orange-800 dark:text-orange-300">ยังไม่มี PDF</span>}
              </label>
            </li>
          ))}
        </ul>
      )}
      {confirm && (
        <ConfirmBox title={`เอาโจทย์ออกจาก ${c.name}?`} confirmLabel="เอาออก" danger onCancel={() => setConfirm(false)} onConfirm={save}>
          {removed.map((a) => a.name).join(", ")} จะหายจากแผงเอกสารของน้องทันที (งานที่น้องทำไปแล้วไม่หาย) · บันทึกลงประวัติการแก้ไข
        </ConfirmBox>
      )}
      {!c.endedAt && (
        <div className="flex flex-wrap gap-2">
          <Button variant={changed ? "primary" : "ghost"} disabled={!changed} onClick={() => (removed.length && started ? setConfirm(true) : save())} className="min-h-11">
            บันทึกโจทย์
          </Button>
          <Button variant="ghost" onClick={() => nav.goTab("files")} className="min-h-11">
            จัดการโจทย์
          </Button>
        </div>
      )}
    </section>
  );
}

// ตอนนี้น้องสมัครได้จริงไหม: เงื่อนไขเดียวกับ server (server/services/register.service.ts) · คืนเหตุผลที่ยังสมัครไม่ได้
function signupBlocker(c: Cohort) {
  if (c.endedAt) return "รุ่นจบแล้ว";
  if (!c.hasInvite) return "ยังไม่มีรหัสรุ่น";
  if (!c.signupOpen) return "ปิดรับสมัครอยู่";
  if (c.signupUntil && todayTH() > c.signupUntil) return "เลยวันปิดรับแล้ว";
  if (c.seatLimit && c.internCount >= c.seatLimit) return "รับครบจำนวนแล้ว";
  return null;
}

// รับสมัครเองด้วยรหัสรุ่น: แทนการสร้างบัญชีทีละคนแล้วส่ง PIN · น้องตั้งรหัสผ่านและกรอกโปรไฟล์เองตอนสมัคร
// รหัสเห็นครั้งเดียวหลังกดสร้าง (ระบบเก็บแค่ hash) ทำหายหรือหลุดไปกลุ่มอื่น กดสร้างใหม่ รหัสเดิมใช้ไม่ได้ทันที
function Signup({ admin, cohort: c }: { admin: AdminState; cohort: Cohort }) {
  const [open, setOpen] = useState(c.signupOpen);
  const [until, setUntil] = useState(c.signupUntil ?? "");
  const [seats, setSeats] = useState(c.seatLimit?.toString() ?? "");
  const [code, setCode] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const blocker = signupBlocker(c);
  const changed = open !== c.signupOpen || until !== (c.signupUntil ?? "") || seats !== (c.seatLimit?.toString() ?? "");
  const link = code && `${location.origin}/register?code=${code}`;

  async function generate() {
    setConfirm(false);
    setCode(await admin.newInvite(c));
  }
  async function copy() {
    if (!link || !code) return;
    await navigator.clipboard.writeText(`สมัครคู่มือฝึกงาน Blicktech (${c.name})\n${link}\nรหัสรุ่น: ${code}`);
    toast.success("คัดลอกข้อความแล้ว วางในกลุ่มของรุ่นได้เลย");
  }

  return (
    <section aria-labelledby="signup-title" className="flex flex-col gap-3 rounded-xl border border-fd-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="signup-title" className="text-base font-semibold">
          รับสมัครด้วยรหัสรุ่น
        </h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${blocker ? "bg-fd-muted text-fd-muted-foreground" : "bg-fd-primary/10 text-fd-primary"}`}>
          {blocker ?? "น้องสมัครได้อยู่"}
        </span>
      </div>
      <p className="text-sm text-fd-muted-foreground">
        ส่งลิงก์หรือรหัสให้น้องในกลุ่มของรุ่น น้องสมัคร ตั้งรหัสผ่าน และกรอกการศึกษาเอง แล้วเข้ารุ่นนี้ทันที ไม่ต้องสร้างบัญชีและส่ง PIN ทีละคน · รับแล้ว {c.internCount}
        {c.seatLimit ? `/${c.seatLimit}` : ""} คน
      </p>

      {code && link && (
        <div role="status" className="flex flex-col gap-2 rounded-lg border border-green-600/40 bg-green-600/10 p-3 text-sm">
          <span className="flex flex-wrap items-center gap-2">
            รหัสรุ่น <code className="rounded bg-fd-background px-2 py-1 text-lg font-bold tracking-[0.2em]">{code}</code>
          </span>
          <span className="break-all text-fd-muted-foreground">{link}</span>
          <span className="text-fd-muted-foreground">ระบบเก็บรหัสนี้แบบอ่านย้อนไม่ได้ ออกจากหน้านี้แล้วจะดูอีกไม่ได้ (ทำหายก็สร้างใหม่ได้)</span>
          <Button onClick={copy} className="min-h-11 self-start">
            <Copy className="size-4" /> คัดลอกข้อความส่งน้อง
          </Button>
        </div>
      )}

      {confirm && (
        <ConfirmBox title="สร้างรหัสใหม่?" confirmLabel="สร้างรหัสใหม่" onCancel={() => setConfirm(false)} onConfirm={generate}>
          รหัสเดิมใช้สมัครไม่ได้ทันที (คนที่สมัครไปแล้วไม่กระทบ) ใช้ตอนรหัสหลุดไปที่อื่น หรือทำรหัสหาย
        </ConfirmBox>
      )}
      {!c.endedAt && (
        <Button variant={c.hasInvite ? "ghost" : "primary"} onClick={() => (c.hasInvite ? setConfirm(true) : generate())} className="min-h-11 self-start">
          <KeyRound className="size-4" /> {c.hasInvite ? "สร้างรหัสใหม่ (รหัสเดิมใช้ไม่ได้)" : "สร้างรหัสรุ่น"}
        </Button>
      )}

      {c.hasInvite && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            admin.setSignup(c, { signupOpen: open, signupUntil: until || null, seatLimit: seats ? Number(seats) : null });
          }}
          className="flex flex-wrap items-end gap-3 border-t border-fd-border pt-3"
        >
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input type="checkbox" className="size-5" checked={open} onChange={(e) => setOpen(e.target.checked)} />
            เปิดรับสมัคร
          </label>
          <Field label="รับถึงวันที่ (ว่าง = ไม่กำหนด)">
            <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className={`${inputClass} min-h-11`} />
          </Field>
          <div className="w-44">
            <Field label="รับกี่คน (ว่าง = ไม่จำกัด)">
              <Input type="number" min={1} max={500} inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value)} className={`${inputClass} min-h-11`} />
            </Field>
          </div>
          <Button type="submit" variant={changed ? "primary" : "ghost"} disabled={!changed} className="min-h-11">
            บันทึก
          </Button>
        </form>
      )}
    </section>
  );
}

// ย้ายบัญชีน้องที่มีอยู่เข้ารุ่นนี้ (บัญชีเก่าที่ไม่มีรุ่นขึ้นก่อน) · ย้ายจากรุ่นอื่นได้ บอกว่าเดิมอยู่รุ่นไหน
function AddMembers({ admin, cohort: c, name }: { admin: AdminState; cohort: Cohort; name: (id: number | null) => string }) {
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const others = admin.users
    .filter((u) => u.role === "intern" && u.cohortId !== c.id)
    .sort((a, b) => Number(a.cohortId !== null) - Number(b.cohortId !== null) || a.username.localeCompare(b.username));
  if (others.length === 0) return null;
  const toggle = (id: number) => setPicked((p) => (p.has(id) ? new Set([...p].filter((x) => x !== id)) : new Set([...p, id])));

  return (
    <section aria-labelledby="add-title" className="flex flex-col gap-2 rounded-xl border border-fd-border p-4">
      <h2 id="add-title" className="text-base font-semibold">
        ย้ายบัญชีน้องเข้ารุ่นนี้
      </h2>
      <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((u) => (
          <li key={u.id}>
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2 hover:bg-fd-accent">
              <input type="checkbox" className="size-5" checked={picked.has(u.id)} onChange={() => toggle(u.id)} />
              <span className="font-medium">{u.username}</span>
              <span className="text-xs text-fd-muted-foreground">{name(u.cohortId)}</span>
            </label>
          </li>
        ))}
      </ul>
      <Button
        disabled={picked.size === 0}
        onClick={async () => {
          if (await admin.assignCohort([...picked], c.id)) setPicked(new Set());
        }}
        className="min-h-11 self-start"
      >
        ย้ายเข้ารุ่นนี้ {picked.size > 0 && `(${picked.size})`}
      </Button>
    </section>
  );
}

// พี่เลี้ยงประจำรุ่น: ใช้บอกน้องว่าใครดูแล และส่งแจ้งเตือนเรื่องของรุ่นนี้ (พี่เลี้ยงทุกคนยังเห็นทุกรุ่น)
function Mentors({ admin, cohort: c }: { admin: AdminState; cohort: Cohort }) {
  const devs = admin.users.filter((u) => u.role === "dev" && !u.disabled);
  const [picked, setPicked] = useState<Set<number>>(new Set(c.mentorIds));
  const changed = picked.size !== c.mentorIds.length || c.mentorIds.some((id) => !picked.has(id));
  const toggle = (id: number) => setPicked((p) => (p.has(id) ? new Set([...p].filter((x) => x !== id)) : new Set([...p, id])));

  return (
    <section aria-labelledby="mentor-title" className="flex flex-col gap-2 rounded-xl border border-fd-border p-4">
      <h2 id="mentor-title" className="text-base font-semibold">
        พี่เลี้ยงประจำรุ่น
      </h2>
      <div className="flex flex-wrap gap-1">
        {devs.map((u) => (
          <label key={u.id} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2 hover:bg-fd-accent">
            <input type="checkbox" className="size-5" checked={picked.has(u.id)} onChange={() => toggle(u.id)} />
            {u.username}
          </label>
        ))}
      </div>
      <Button variant={changed ? "primary" : "ghost"} disabled={!changed} onClick={() => admin.setCohortMentors(c, [...picked])} className="min-h-11 self-start">
        บันทึกพี่เลี้ยง
      </Button>
    </section>
  );
}

// รุ่นที่ควรเลือกไว้ก่อนตอนสร้างบัญชีน้อง: รุ่นที่กำลังฝึก หรือรุ่นถัดไปที่ใกล้สุด (ไม่มี = ไม่มีรุ่น)
export function defaultCohortId(cohorts: Cohort[]) {
  const open = cohorts.filter((c) => ["active", "upcoming"].includes(cohortStatus(c)));
  return (open.find((c) => cohortStatus(c) === "active") ?? open.at(-1))?.id ?? null;
}

// เลือกรุ่นในฟอร์มสร้างบัญชี · รุ่นที่จบแล้วไม่อยู่ในรายการ (สร้างบัญชีเข้ารุ่นที่จบไปแล้วไม่มีเหตุผล)
export function CohortSelect({ cohorts, value, onChange, className }: { cohorts: Cohort[]; value: number | null; onChange: (id: number | null) => void; className: string }) {
  return (
    <Field label="รุ่น">
      <select className={className} value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
        <option value="">ไม่มีรุ่น</option>
        {cohorts
          .filter((c) => !c.endedAt)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </select>
    </Field>
  );
}
