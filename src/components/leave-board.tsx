"use client";

import Link from "next/link";
import { useState } from "react";
import { useLeave } from "@/hooks/use-leave";
import { earliestLeaveDate, LEAVE_BACK_WORKDAYS, type LeaveKind, type LeaveRow } from "@/lib/attendance";
import { todayTH } from "@/lib/cohort";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { Field, inputClass } from "./field";

// ส่งใบลา/แจ้งมาสาย (หน้าของน้อง): ขอล่วงหน้าได้ไม่จำกัด ย้อนหลังได้ไม่เกิน 3 วันทำการ · เกินกว่านั้นให้บอกพี่เลี้ยง
const TZ = "Asia/Bangkok";
const box = "rounded-2xl border border-fd-border bg-fd-card p-5";
const KIND_TEXT: Record<LeaveKind, string> = { leave: "ลาทั้งวัน", late: "แจ้งมาสาย" };
const dayText = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: TZ });

export function LeaveBoard() {
  const { items, error, busy, reload, request, withdraw } = useLeave();
  const today = todayTH();
  const [workDate, setWorkDate] = useState("");
  const [kind, setKind] = useState<LeaveKind>("leave");
  const [reason, setReason] = useState("");
  const valid = !!workDate && reason.trim().length >= 5;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <Link href="/checkin" className="inline-flex min-h-11 items-center self-start text-sm font-medium text-fd-primary hover:underline">
          ← กลับไปหน้าเช็คอิน
        </Link>
        <h1 className="text-2xl font-bold sm:text-3xl">ส่งใบลา / แจ้งมาสาย</h1>
        <p className="text-sm text-fd-muted-foreground">
          ขอล่วงหน้าได้ และย้อนหลังได้ไม่เกิน {LEAVE_BACK_WORKDAYS} วันทำการ ถ้าเกินกว่านั้นบอกพี่เลี้ยงทางแชท พี่เลี้ยงแก้เวลาให้ได้ ใบที่พี่เลี้ยงอนุมัติแล้วเท่านั้นมีผล: วันลาไม่ถูกนับว่าไม่มีเช็คอิน และวันที่แจ้งสายไว้ไม่ถูกนับว่าเข้างานหลังเวลา
        </p>
      </header>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await request({ workDate, kind, reason: reason.trim() })) {
            setWorkDate("");
            setReason("");
          }
        }}
        className={`${box} flex flex-col gap-4`}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">เรื่อง</legend>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(KIND_TEXT) as LeaveKind[]).map((k) => (
              <label key={k} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm ${kind === k ? "border-fd-primary bg-fd-primary/10 font-semibold" : "border-fd-border"}`}>
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
                {KIND_TEXT[k]}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="วันที่" hint={`ย้อนหลังสุด ${dayText(earliestLeaveDate(today))}`}>
          <input type="date" value={workDate} min={earliestLeaveDate(today)} onChange={(e) => setWorkDate(e.target.value)} className={`${inputClass} w-auto`} required />
        </Field>
        <Field label="เหตุผล (อย่างน้อย 5 ตัวอักษร)">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} className={`${inputClass} min-h-20`} placeholder={kind === "leave" ? "เช่น ไปสอบใบขับขี่" : "เช่น มีเรียนช่วงเช้า จะเข้างานประมาณ 10:30"} />
        </Field>
        <Button type="submit" disabled={!valid || busy} className="self-start">
          {busy ? "กำลังส่ง…" : "ส่งใบ"}
        </Button>
      </form>

      <section aria-label="ใบของฉัน" className={`${box} flex flex-col gap-3`}>
        <h2 className="text-lg font-semibold">ใบของฉัน</h2>
        {error && (
          <div className="flex flex-col items-start gap-3">
            <ErrorText>{error}</ErrorText>
            <Button variant="ghost" onClick={reload}>
              ลองใหม่
            </Button>
          </div>
        )}
        {!items && !error && <div aria-hidden className="h-24 animate-pulse rounded-xl bg-fd-muted" />}
        {items && items.length === 0 && <p className="text-sm text-fd-muted-foreground">ยังไม่มีใบที่ส่ง</p>}
        {items && items.length > 0 && (
          <ul className="flex flex-col divide-y divide-fd-border">
            {items.map((l) => (
              <Item key={l.id} l={l} busy={busy} onWithdraw={() => withdraw(l.id)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const STATUS: Record<LeaveRow["status"], { text: string; tone: string }> = {
  pending: { text: "รอพี่เลี้ยงตอบ", tone: "text-amber-800 dark:text-amber-300" },
  approved: { text: "อนุมัติแล้ว", tone: "text-emerald-700 dark:text-emerald-300" },
  rejected: { text: "ไม่อนุมัติ", tone: "text-fd-muted-foreground" },
};

function Item({ l, busy, onWithdraw }: { l: LeaveRow; busy: boolean; onWithdraw: () => void }) {
  const s = STATUS[l.status];
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-medium">
          {dayText(l.workDate)} · {KIND_TEXT[l.kind]}
        </p>
        <p className="text-sm text-fd-muted-foreground">{l.reason}</p>
        <p className={`mt-1 text-sm font-semibold ${s.tone}`}>
          {s.text}
          {l.decisionNote && <span className="font-normal text-fd-foreground"> · พี่เลี้ยง: {l.decisionNote}</span>}
        </p>
      </div>
      {l.status === "pending" && (
        <Button variant="ghost" onClick={onWithdraw} disabled={busy} aria-label={`ถอนใบวันที่ ${dayText(l.workDate)}`}>
          ถอนใบ
        </Button>
      )}
    </li>
  );
}
