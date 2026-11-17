"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToday } from "@/hooks/use-today";
import { hhmm, type TodayState, type TodayView } from "@/lib/attendance";
import { Button } from "./button";
import { ErrorText } from "./error-text";

// หน้า "วันนี้" ของน้อง (/checkin): หน้าแรกหลัง login · งานหลักคือเช็คอิน/เช็คเอาต์ได้ใน 1 แตะ
// สถานะบอกด้วยข้อความเสมอ ไม่ใช้สีอย่างเดียว · เวลาทั้งหมดเป็นเวลาไทยจาก server (ดู use-today.ts)
const TZ = "Asia/Bangkok";
const box = "rounded-2xl border border-fd-border bg-fd-card p-5 sm:p-6";

const clock = (ms: number) => new Date(ms).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: TZ });
const time = (iso: string) => new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
const longDate = (ms: number) => new Date(ms).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const shortDay = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const duration = (min: number) => `${Math.floor(min / 60)} ชม. ${min % 60} นาที`;

// ป้ายสถานะ: ข้อความ + โทนสี (ข้อความอ่านได้โดยไม่ต้องเห็นสี)
const BADGE: Record<TodayState, { text: string; tone: "info" | "ok" | "warn" | "muted" }> = {
  no_cohort: { text: "ยังไม่อยู่ในรุ่น", tone: "warn" },
  not_started: { text: "รุ่นยังไม่เริ่ม", tone: "muted" },
  cohort_ended: { text: "รุ่นจบแล้ว", tone: "muted" },
  off_day: { text: "วันหยุด", tone: "muted" },
  holiday: { text: "วันหยุดของรุ่น", tone: "muted" },
  closed: { text: "เลยเวลาเลิกงาน", tone: "warn" },
  ready: { text: "ยังไม่เช็คอิน", tone: "warn" },
  working: { text: "กำลังทำงาน", tone: "ok" },
  done: { text: "เลิกงานแล้ว", tone: "muted" },
};
const TONE = {
  info: "bg-fd-accent text-fd-foreground",
  ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warn: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  muted: "bg-fd-muted text-fd-muted-foreground",
};

// ข้อความอธิบายของสถานะที่เช็คอินไม่ได้ (ready/working/done ใช้ส่วนอื่นของการ์ด)
function note(v: TodayView): string | null {
  switch (v.state) {
    case "no_cohort":
      return "บัญชีนี้ยังไม่อยู่ในรุ่นไหน เช็คอินไม่ได้ ติดต่อพี่เลี้ยงให้เพิ่มเข้ารุ่น";
    case "not_started":
      return "รุ่นของคุณยังไม่เริ่ม ยังไม่ต้องเช็คอิน";
    case "cohort_ended":
      return "รุ่นของคุณจบแล้ว เช็คอินไม่ได้ ประวัติและคู่มือยังเปิดอ่านได้";
    case "off_day":
      return "วันนี้เป็นวันหยุด (เสาร์-อาทิตย์) ไม่ต้องเช็คอิน";
    case "holiday":
      return "วันนี้เป็นวันหยุดที่พี่เลี้ยงประกาศ ไม่ต้องเช็คอิน";
    case "closed":
      return `เลยเวลาเลิกงาน (${v.workEnd ? hhmm(v.workEnd) : ""}) แล้ว เช็คอินไม่ได้ ถ้าวันนี้มาทำงานจริง แจ้งพี่เลี้ยงให้บันทึกเวลาให้`;
    default:
      return null;
  }
}

export function TodayBoard() {
  const { view, now, error, busy, reload, checkIn, checkOut } = useToday();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-fd-muted-foreground" suppressHydrationWarning>
          {now ? longDate(now) : " "}
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">วันนี้</h1>
      </header>

      {error && (
        <div className="flex flex-col items-start gap-3">
          <ErrorText>{error}</ErrorText>
          <Button variant="ghost" onClick={reload}>
            ลองใหม่
          </Button>
        </div>
      )}

      {!view && !error && <div aria-hidden className="h-72 animate-pulse rounded-2xl bg-fd-muted" />}

      {view && now && <Card v={view} now={now} busy={busy} onIn={checkIn} onOut={checkOut} />}

      <div className="flex flex-wrap gap-x-6">
        <Link href="/checkin/history" className="inline-flex min-h-11 items-center text-sm font-medium text-fd-primary hover:underline">
          ดูประวัติเข้างานของฉัน
        </Link>
        <Link href="/checkin/leave" className="inline-flex min-h-11 items-center text-sm font-medium text-fd-primary hover:underline">
          ส่งใบลา / แจ้งมาสาย
        </Link>
        <Link href="/checkin/about" className="inline-flex min-h-11 items-center text-sm font-medium text-fd-primary hover:underline">
          ระบบนี้เก็บอะไร ใครเห็น
        </Link>
        <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-medium text-fd-primary hover:underline">
          ไปหน้าภาพรวมงานและคู่มือ
        </Link>
      </div>
    </div>
  );
}

function Card({ v, now, busy, onIn, onOut }: { v: TodayView; now: number; busy: boolean; onIn: () => void; onOut: () => void }) {
  // เช็คเอาต์ต้องกด 2 ขั้น: ปุ่มเช็คเอาต์อยู่ตำแหน่งเดียวกับปุ่มเช็คอิน ถ้าเช็คอินแล้วกดรัวต่อ จะได้ไม่เลิกงานโดยไม่ตั้งใจ
  // (เช็คเอาต์ไม่มีปุ่มย้อนกลับ เพราะเวลาเช็คเอาต์แก้เองไม่ได้ ต้องให้พี่เลี้ยงแก้)
  const [confirming, setConfirming] = useState(false);
  const badge = BADGE[v.state];
  const text = note(v);
  const rule = v.workStart && v.workEnd ? `เวลางาน ${hhmm(v.workStart)}–${hhmm(v.workEnd)} น. · ผ่อนผันสาย ${v.lateGraceMinutes} นาที` : null;

  return (
    <section aria-label="เช็คอินวันนี้" className={`${box} flex flex-col gap-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground">
          <Clock className="size-4" aria-hidden />
          เวลาจากระบบ (ไม่ใช่จากเครื่องของคุณ)
        </span>
        <span role="status" className={`rounded-full px-3 py-1 text-sm font-semibold ${TONE[badge.tone]}`}>
          {badge.text}
        </span>
      </div>

      {/* นาฬิกาเดินทุกวินาที จึงซ่อนจากโปรแกรมอ่านหน้าจอ ไม่ให้อ่านซ้ำทุกวินาที (สถานะอ่านจากป้ายด้านบน) */}
      <p aria-hidden className="text-5xl font-bold tracking-tight tabular-nums sm:text-6xl" suppressHydrationWarning>
        {clock(now)}
      </p>

      {rule && <p className="text-sm text-fd-muted-foreground">{rule}</p>}
      {v.leaveToday === "leave" && <p className="rounded-lg bg-fd-muted px-3 py-2 text-sm">วันนี้คุณลา (พี่เลี้ยงอนุมัติแล้ว) ถ้ามาทำงานจริง เช็คอินได้ตามปกติ</p>}
      {v.leaveToday === "late" && <p className="rounded-lg bg-fd-muted px-3 py-2 text-sm">วันนี้คุณแจ้งมาสายไว้และพี่เลี้ยงอนุมัติแล้ว เข้างานช้ากว่าเวลาปกติได้</p>}
      {/* พี่เลี้ยงตั้งเวลางานใหม่ไว้ล่วงหน้า: บอกน้องก่อนถึงวันเปลี่ยน ไม่ให้ไปเจอตอนเช็คอิน */}
      {v.nextRule && (
        <p className="rounded-lg bg-fd-muted px-3 py-2 text-sm">
          ตั้งแต่ {shortDay(v.nextRule.effectiveFrom)} เวลางานของรุ่นเปลี่ยนเป็น {hhmm(v.nextRule.workStart)}–{hhmm(v.nextRule.workEnd)} น. · ผ่อนผันสาย {v.nextRule.lateGraceMinutes} นาที
        </p>
      )}
      {text && <p className="text-fd-foreground">{text}</p>}

      {v.state === "ready" && (
        <Button onClick={onIn} disabled={busy} className="min-h-14 w-full text-lg">
          {busy ? "กำลังบันทึก…" : "เช็คอิน"}
        </Button>
      )}

      {v.state === "working" && v.checkInAt && (
        <>
          <p>
            เช็คอินเมื่อ <strong className="tabular-nums">{time(v.checkInAt)}</strong> น. ·{" "}
            <span className={v.late ? "font-semibold text-amber-800 dark:text-amber-300" : "font-semibold text-emerald-700 dark:text-emerald-300"}>{v.late ? "สาย" : "ตรงเวลา"}</span>
          </p>
          {confirming ? (
            <div className="flex flex-col gap-2 rounded-xl border border-fd-border p-3">
              <p className="text-sm">เลิกงานตอนนี้ใช่ไหม? เช็คเอาต์แล้วแก้เวลาเองไม่ได้</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => { onOut(); setConfirming(false); }} disabled={busy} className="min-h-12 flex-1">
                  {busy ? "กำลังบันทึก…" : "ยืนยันเช็คเอาต์"}
                </Button>
                <Button onClick={() => setConfirming(false)} disabled={busy} variant="ghost" className="min-h-12 flex-1">
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setConfirming(true)} disabled={busy} variant="ghost" className="min-h-14 w-full text-lg">
              เช็คเอาต์
            </Button>
          )}
          <p className="text-sm text-fd-muted-foreground">ถ้าลืมกดเช็คเอาต์ ระบบนับเวลาเลิกงานให้ตอน {v.workEnd ? hhmm(v.workEnd) : ""} น. (ในประวัติจะมีป้าย &quot;อัตโนมัติ&quot;)</p>
        </>
      )}

      {v.state === "done" && v.checkInAt && v.checkOutAt && (
        <p>
          เช็คอิน <strong className="tabular-nums">{time(v.checkInAt)}</strong> · เช็คเอาต์ <strong className="tabular-nums">{time(v.checkOutAt)}</strong>
          {v.checkOutAuto && <span className="text-fd-muted-foreground"> (ระบบนับให้ตามเวลาเลิกงาน)</span>}
          {v.minutes !== null && <> · ทำงาน {duration(v.minutes)}</>}
          {" · "}
          <span className={v.late ? "font-semibold text-amber-800 dark:text-amber-300" : "font-semibold text-emerald-700 dark:text-emerald-300"}>{v.late ? "สาย" : "ตรงเวลา"}</span>
        </p>
      )}
    </section>
  );
}
