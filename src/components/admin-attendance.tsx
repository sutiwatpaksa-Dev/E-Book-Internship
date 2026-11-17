"use client";

import { CalendarOff, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AdminState } from "@/hooks/use-admin";
import { useAdminAttendance } from "@/hooks/use-admin-attendance";
import { hhmm, rulesOn, type DayRow, type DayState } from "@/lib/attendance";
import { cohortStatus, todayTH } from "@/lib/cohort";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";

// แท็บ "เช็คอิน" ของหลังบ้าน: น้องทั้งรุ่นในวันที่เลือก · แก้เวลาให้น้อง (เหตุผลบังคับ) · ประกาศวันหยุดของรุ่น
// สถานะบอกเป็นข้อความเสมอ ไม่ใช้สีอย่างเดียว · เวลาเป็นเวลาไทยจาก server
const TZ = "Asia/Bangkok";
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
const longDate = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const duration = (min: number) => `${Math.floor(min / 60)} ชม. ${min % 60} นาที`;
const box = "rounded-2xl border border-fd-border bg-fd-card p-5";

const LABEL: Record<DayState, { text: string; tone: string }> = {
  outside: { text: "นอกช่วงรุ่น", tone: "text-fd-muted-foreground" },
  untracked: { text: "ก่อนเริ่มใช้ระบบ", tone: "text-fd-muted-foreground" },
  off_day: { text: "วันหยุด", tone: "text-fd-muted-foreground" },
  holiday: { text: "วันหยุดของรุ่น", tone: "text-fd-muted-foreground" },
  waiting: { text: "ยังไม่เช็คอิน", tone: "text-amber-800 dark:text-amber-300" },
  absent: { text: "ไม่ได้เช็คอิน", tone: "font-semibold text-red-700 dark:text-red-300" },
  working: { text: "กำลังทำงาน", tone: "text-emerald-700 dark:text-emerald-300" },
  done: { text: "เลิกงานแล้ว", tone: "" },
};
const IS_WORKDAY = (s: DayState) => s !== "outside" && s !== "off_day" && s !== "holiday" && s !== "untracked";

export function AdminAttendance({ admin, mine }: { admin: AdminState; mine: readonly number[] }) {
  // รุ่นเริ่มต้น: รุ่นของเราที่กำลังฝึกอยู่ → รุ่นไหนก็ได้ที่กำลังฝึก → รุ่นที่ยังไม่จบ → รุ่นแรกที่มี
  const running = admin.cohorts.filter((c) => cohortStatus(c) === "active");
  const firstCohort = running.find((c) => mine.includes(c.id)) ?? running[0] ?? admin.cohorts.find((c) => !c.endedAt) ?? admin.cohorts[0];
  const [cohortId, setCohortId] = useState<number | null>(firstCohort?.id ?? null);
  const [date, setDate] = useState(() => todayTH());
  const att = useAdminAttendance(cohortId, date);
  const [editing, setEditing] = useState<DayRow | null>(null);
  // เปลี่ยนรุ่น/วัน = ปิดฟอร์มแก้เวลา (ไม่ให้ฟอร์มของน้องคนเดิมค้างข้ามวัน)
  useEffect(() => setEditing(null), [cohortId, date]);
  useEffect(() => {
    if (!cohortId && firstCohort) setCohortId(firstCohort.id);
  }, [cohortId, firstCohort]);

  if (admin.cohorts.length === 0) return <EmptyState icon={CalendarOff} title="ยังไม่มีรุ่น">สร้างรุ่นที่แท็บ "รุ่นฝึกงาน" ก่อน แล้วค่อยดูเช็คอินของน้อง</EmptyState>;

  const day = att.day;
  const workRows = day ? day.rows.filter((r) => IS_WORKDAY(r.state)) : [];
  const checkedIn = workRows.filter((r) => r.checkInAt).length;
  const late = workRows.filter((r) => r.late).length;
  const missing = workRows.filter((r) => !r.checkInAt).length;
  const today = day?.today ?? todayTH();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          รุ่น
          <select className="min-h-11 min-w-0 max-w-full rounded-lg border border-fd-border bg-fd-background px-3 font-semibold" value={cohortId ?? ""} onChange={(e) => setCohortId(Number(e.target.value))}>
            {admin.cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.endedAt ? " (จบแล้ว)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          วันที่
          <input type="date" value={date} max={today} min={day?.cohort.startsOn} onChange={(e) => e.target.value && setDate(e.target.value)} className={`${inputClass} w-auto`} />
        </label>
        {date !== today && (
          <Button variant="ghost" onClick={() => setDate(today)}>
            กลับไปวันนี้
          </Button>
        )}
        {/* ส่งออกทั้งเดือนของวันที่เลือก · ข้อมูลเป็นของบริษัท เปิดใน Excel ได้ ไม่ผูกกับระบบนี้ */}
        {cohortId && (
          <a href={`/api/admin/attendance/export?cohortId=${cohortId}&month=${date.slice(0, 7)}`} download className="inline-flex min-h-11 items-center rounded-lg border border-fd-border px-4 text-sm font-semibold hover:bg-fd-accent">
            ดาวน์โหลด CSV เดือน {date.slice(0, 7)}
          </a>
        )}
      </div>

      {att.error && (
        <div className="flex flex-col items-start gap-3">
          <ErrorText>{att.error}</ErrorText>
          <Button variant="ghost" onClick={att.reload}>
            ลองใหม่
          </Button>
        </div>
      )}
      {!day && !att.error && <div aria-hidden className="h-64 animate-pulse rounded-2xl bg-fd-muted" />}

      {day && (
        <>
          <p className="text-sm text-fd-muted-foreground">
            {longDate(day.date)} · เวลางาน {hhmm(day.cohort.workStart)}–{hhmm(day.cohort.workEnd)} น. · ผ่อนผันสาย {day.cohort.lateGraceMinutes} นาที
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="เช็คอินแล้ว" value={`${checkedIn}`} unit={`/ ${workRows.length} คน`} />
            <Stat label="มาสาย" value={`${late}`} unit="คน" />
            <Stat label={date === today ? "ยังไม่มา" : "ไม่ได้เช็คอิน"} value={`${missing}`} unit="คน" />
          </div>

          {editing && (
            <EditForm
              key={editing.userId}
              row={editing}
              date={day.date}
              workStart={day.cohort.workStart}
              busy={att.busy}
              onCancel={() => setEditing(null)}
              onSave={async (v) => {
                if (await att.editTime({ userId: editing.userId, workDate: day.date, ...v })) setEditing(null);
              }}
            />
          )}

          <section aria-label="น้องในรุ่น" className={`${box} flex flex-col gap-3 !p-3 sm:!p-5`}>
            <h2 className="px-2 text-lg font-semibold">น้องทั้งหมด ({day.rows.length} คน)</h2>
            {day.rows.length === 0 ? (
              <p className="px-2 text-sm text-fd-muted-foreground">รุ่นนี้ยังไม่มีน้อง</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-fd-border text-left text-xs text-fd-muted-foreground">
                      <th className="px-2 py-2 font-semibold">ชื่อ</th>
                      <th className="px-2 py-2 font-semibold">สถานะ</th>
                      <th className="px-2 py-2 font-semibold">เข้า</th>
                      <th className="px-2 py-2 font-semibold">ออก</th>
                      <th className="px-2 py-2 font-semibold">ทำงาน</th>
                      <th className="px-2 py-2 font-semibold">
                        <span className="sr-only">แก้เวลา</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.rows.map((r) => (
                      <Row key={r.userId} r={r} onEdit={() => setEditing(r)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <WorkRules att={att} />
          <Holidays att={att} cohort={day.cohort} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className={box}>
      <p className="text-sm text-fd-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">
        {value} <span className="text-base font-normal text-fd-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function Row({ r, onEdit }: { r: DayRow; onEdit: () => void }) {
  const s = LABEL[r.state];
  return (
    <tr className="border-b border-fd-border/60 last:border-0">
      <td className="px-2 py-3 font-medium">{r.name}</td>
      <td className={`px-2 py-3 ${s.tone}`}>
        {s.text}
        {r.late && <span className="ms-1.5 font-semibold text-amber-800 dark:text-amber-300">· สาย</span>}
      </td>
      <td className="px-2 py-3 tabular-nums">{r.checkInAt ? time(r.checkInAt) : "-"}</td>
      <td className="px-2 py-3 tabular-nums">
        {r.checkOutAt ? time(r.checkOutAt) : "-"}
        {r.checkOutAuto && <span className="ms-1 text-xs text-fd-muted-foreground">(อัตโนมัติ)</span>}
      </td>
      <td className="px-2 py-3 tabular-nums">
        {r.minutes !== null ? duration(r.minutes) : "-"}
        {r.editReason && (
          <span title={`พี่เลี้ยงแก้เวลา: ${r.editReason}`} className="ms-1.5 rounded bg-fd-muted px-1.5 py-0.5 text-xs">
            แก้แล้ว
          </span>
        )}
      </td>
      <td className="px-2 py-1 text-right">
        <Button variant="ghost" onClick={onEdit} aria-label={`แก้เวลาของ ${r.name}`} className="min-h-11">
          <Pencil className="size-4" aria-hidden />
          แก้เวลา
        </Button>
      </td>
    </tr>
  );
}

function EditForm({ row, date, workStart, busy, onCancel, onSave }: { row: DayRow; date: string; workStart: string; busy: boolean; onCancel: () => void; onSave: (v: { checkIn: string; checkOut: string | null; reason: string }) => void }) {
  const [checkIn, setCheckIn] = useState(row.checkInAt ? time(row.checkInAt) : hhmm(workStart));
  // เวลาออกที่ระบบนับให้เอง (อัตโนมัติ) ไม่ใส่ในช่อง: ปล่อยว่าง = ยังไม่เช็คเอาต์ ระบบนับตามเวลาเลิกงานต่อ
  const [checkOut, setCheckOut] = useState(row.checkOutAt && !row.checkOutAuto ? time(row.checkOutAt) : "");
  const [reason, setReason] = useState("");
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => first.current?.focus(), []);
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(checkIn) && (checkOut === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(checkOut)) && reason.trim().length >= 5;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ checkIn, checkOut: checkOut || null, reason: reason.trim() });
      }}
      className={`${box} flex flex-col gap-4`}
    >
      <h2 className="text-lg font-semibold">แก้เวลาให้ {row.name}</h2>
      <p className="text-sm text-fd-muted-foreground">
        เวลาเดิมในระบบ: {row.checkInAt ? `เข้า ${time(row.checkInAt)}` : "ไม่มีข้อมูลเช็คอิน"}
        {row.checkOutAt ? ` · ออก ${time(row.checkOutAt)}${row.checkOutAuto ? " (อัตโนมัติ)" : ""}` : ""}
      </p>
      <div className="flex flex-wrap gap-4">
        <Field label="เวลาเข้า (24 ชม. เช่น 08:58)">
          <Input ref={first} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} inputMode="numeric" placeholder="08:58" maxLength={5} className={`${inputClass} !w-36`} />
        </Field>
        <Field label="เวลาออก (ว่าง = ยังไม่เช็คเอาต์)">
          <Input value={checkOut} onChange={(e) => setCheckOut(e.target.value)} inputMode="numeric" placeholder="18:00" maxLength={5} className={`${inputClass} !w-36`} />
        </Field>
      </div>
      <Field label="เหตุผล (บังคับ อย่างน้อย 5 ตัวอักษร)" hint={`ระบบบันทึกว่าใครแก้ เมื่อไหร่ และเวลาเดิมคืออะไรไว้ในบันทึกการกระทำ · แก้วันที่ ${date}`}>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} className={`${inputClass} min-h-20`} placeholder="เช่น น้องแจ้งว่าเน็ตหลุดตอนกดเช็คอิน ยืนยันกับพี่หัวหน้าแล้ว" />
      </Field>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!valid || busy}>
          {busy ? "กำลังบันทึก…" : "บันทึกการแก้"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}

function Holidays({ att, cohort }: { att: ReturnType<typeof useAdminAttendance>; cohort: { startsOn: string; endsOn: string } }) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  return (
    <section aria-label="วันหยุดของรุ่น" className={`${box} flex flex-col gap-4`}>
      <div>
        <h2 className="text-lg font-semibold">วันหยุดของรุ่น</h2>
        <p className="mt-1 text-sm text-fd-muted-foreground">เสาร์-อาทิตย์เป็นวันหยุดอยู่แล้ว เพิ่มวันหยุดอื่นได้ที่นี่ วันที่ประกาศแล้วน้องไม่ถูกนับขาดและกดเช็คอินไม่ได้ (คนที่เช็คอินไปก่อนประกาศยังเห็นเวลาของตัวเอง)</p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await att.addHoliday(date, note.trim())) {
            setDate("");
            setNote("");
          }
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <Field label="วันที่">
          <input type="date" value={date} min={cohort.startsOn} max={cohort.endsOn} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-auto`} required />
        </Field>
        <Field label="ชื่อวันหยุด (ไม่บังคับ)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="เช่น ปิดออฟฟิศ" className={`${inputClass} !w-64 max-w-full`} />
        </Field>
        <Button type="submit" disabled={!date || att.busy}>
          เพิ่มวันหยุด
        </Button>
      </form>
      {att.holidays.length === 0 ? (
        <p className="text-sm text-fd-muted-foreground">ยังไม่มีวันหยุดที่ประกาศ</p>
      ) : (
        <ul className="flex flex-col divide-y divide-fd-border">
          {att.holidays.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-medium">{longDate(h.date)}</span>
                {h.note && <span className="ms-2 text-sm text-fd-muted-foreground">{h.note}</span>}
              </span>
              <Button variant="ghost" onClick={() => att.removeHoliday(h.id)} disabled={att.busy} aria-label={`ยกเลิกวันหยุด ${longDate(h.date)}`}>
                ยกเลิก
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const shortDate = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const ruleText = (r: { workStart: string; workEnd: string; lateGraceMinutes: number }) => `${hhmm(r.workStart)}–${hhmm(r.workEnd)} น. · ผ่อนผันสาย ${r.lateGraceMinutes} นาที`;

// เวลางานของรุ่น: เปลี่ยนได้แต่ "เริ่มมีผลพรุ่งนี้เป็นต้นไป" ไม่มีผลย้อนหลัง ผลสาย/ชั่วโมงของวันที่ผ่านมาจึงไม่เปลี่ยน
function WorkRules({ att }: { att: ReturnType<typeof useAdminAttendance> }) {
  const v = att.rules;
  const [from, setFrom] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [grace, setGrace] = useState("5");
  if (!v) return null;
  const tomorrow = new Date(new Date(`${v.today}T00:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10);
  const current = rulesOn(v.today, v.base, v.rules);
  const upcoming = v.rules.filter((r) => r.effectiveFrom > v.today);
  const past = v.rules.filter((r) => r.effectiveFrom <= v.today);
  const g = Number(grace);
  const valid = !!from && HHMM.test(start) && HHMM.test(end) && end > start && Number.isInteger(g) && g >= 0 && g <= 120;

  return (
    <section aria-label="เวลางานของรุ่น" className={`${box} flex flex-col gap-4`}>
      <div>
        <h2 className="text-lg font-semibold">เวลางานของรุ่น</h2>
        <p className="mt-1 text-sm text-fd-muted-foreground">กติกาใหม่เริ่มมีผลตั้งแต่พรุ่งนี้เป็นต้นไปเท่านั้น วันที่ผ่านมาแล้วยังคิดสาย/ชั่วโมงตามกติกาเดิม ไม่เปลี่ยนย้อนหลัง</p>
      </div>
      <p>
        <span className="text-sm text-fd-muted-foreground">ใช้อยู่ตอนนี้: </span>
        <strong>{ruleText(current)}</strong>
      </p>
      {upcoming.length > 0 && (
        <ul className="flex flex-col divide-y divide-fd-border rounded-xl border border-fd-border px-3">
          {upcoming.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span>
                <span className="font-medium">เริ่มมีผล {shortDate(r.effectiveFrom)}</span>
                <span className="ms-2 text-sm text-fd-muted-foreground">{ruleText(r)}</span>
              </span>
              <Button variant="ghost" onClick={() => att.removeRule(r.id)} disabled={att.busy} aria-label={`ลบกติกาที่เริ่มมีผล ${shortDate(r.effectiveFrom)}`}>
                ลบ
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await att.addRule({ effectiveFrom: from, workStart: start, workEnd: end, lateGraceMinutes: g })) setFrom("");
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <Field label="เริ่มมีผลวันที่">
          <input type="date" value={from} min={tomorrow} onChange={(e) => setFrom(e.target.value)} className={`${inputClass} w-auto`} required />
        </Field>
        <Field label="เวลาเริ่มงาน">
          <Input value={start} onChange={(e) => setStart(e.target.value)} inputMode="numeric" maxLength={5} placeholder="09:00" className={`${inputClass} !w-28`} />
        </Field>
        <Field label="เวลาเลิกงาน">
          <Input value={end} onChange={(e) => setEnd(e.target.value)} inputMode="numeric" maxLength={5} placeholder="18:00" className={`${inputClass} !w-28`} />
        </Field>
        <Field label="ผ่อนผันสาย (นาที)">
          <Input value={grace} onChange={(e) => setGrace(e.target.value)} inputMode="numeric" maxLength={3} className={`${inputClass} !w-28`} />
        </Field>
        <Button type="submit" disabled={!valid || att.busy}>
          ตั้งเวลางานใหม่
        </Button>
      </form>
      {past.length > 0 && (
        <details className="text-sm">
          <summary className="min-h-11 cursor-pointer py-2 text-fd-muted-foreground">ประวัติกติกาที่เคยตั้ง ({past.length})</summary>
          <ul className="flex flex-col gap-1 ps-4">
            {past.map((r) => (
              <li key={r.id}>
                ตั้งแต่ {shortDate(r.effectiveFrom)}: {ruleText(r)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
