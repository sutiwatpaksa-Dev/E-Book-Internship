"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useHistory } from "@/hooks/use-history";
import { type DayState, type HistoryRow } from "@/lib/attendance";
import { todayTH } from "@/lib/cohort";
import { Button } from "./button";
import { ErrorText } from "./error-text";

// ประวัติเข้างานของน้องเอง: แสดงข้อเท็จจริง (วันที่ เวลา ชั่วโมง) ไม่มีคะแนนรวม ไม่เทียบกับคนอื่น
// ภาษาไม่ตัดสิน เห็นเหตุผลที่พี่เลี้ยงแก้เวลาครบ เพื่อให้เป็นหลักฐานของน้องเองด้วย
const TZ = "Asia/Bangkok";
const box = "rounded-2xl border border-fd-border bg-fd-card p-5";
const time = (iso: string) => new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
const day = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
const monthLabel = (m: string) => new Date(`${m}-01T12:00:00+07:00`).toLocaleDateString("th-TH", { month: "long", year: "numeric", timeZone: TZ });
const hours = (min: number) => `${Math.floor(min / 60)} ชม. ${min % 60} นาที`;
const shiftMonth = (m: string, by: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const STATE_TEXT: Partial<Record<DayState, string>> = {
  holiday: "วันหยุดของรุ่น",
  absent: "ไม่มีเช็คอิน",
  working: "กำลังทำงาน",
  waiting: "ยังไม่เช็คอิน",
  outside: "นอกช่วงรุ่น",
};

export function HistoryBoard() {
  const [month, setMonth] = useState(() => todayTH().slice(0, 7));
  const { view, error, reload } = useHistory(month);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <Link href="/checkin" className="inline-flex min-h-11 items-center self-start text-sm font-medium text-fd-primary hover:underline">
          ← กลับไปหน้าเช็คอิน
        </Link>
        <h1 className="text-2xl font-bold sm:text-3xl">ประวัติเข้างานของฉัน</h1>
        <p className="text-sm text-fd-muted-foreground">ข้อมูลเวลาของตัวเองทั้งหมด รวมวันที่พี่เลี้ยงแก้เวลาให้และเหตุผล</p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setMonth(shiftMonth(month, -1))} disabled={view ? !view.hasPrev : true} aria-label="เดือนก่อนหน้า">
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <h2 className="text-lg font-semibold" aria-live="polite">
          {monthLabel(month)}
        </h2>
        <Button variant="ghost" onClick={() => setMonth(shiftMonth(month, 1))} disabled={view ? !view.hasNext : true} aria-label="เดือนถัดไป">
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {error && (
        <div className="flex flex-col items-start gap-3">
          <ErrorText>{error}</ErrorText>
          <Button variant="ghost" onClick={reload}>
            ลองใหม่
          </Button>
        </div>
      )}
      {!view && !error && <div aria-hidden className="h-64 animate-pulse rounded-2xl bg-fd-muted" />}

      {view && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="วันที่เช็คอิน" value={`${view.summary.workedDays}`} unit="วัน" />
            <Stat label="เข้างานหลังเวลา" value={`${view.summary.lateDays}`} unit="วัน" />
            <Stat label="วันที่ไม่มีเช็คอิน" value={`${view.summary.noCheckInDays}`} unit="วัน" />
            <Stat label="ชั่วโมงทำงาน" value={view.summary.minutes ? `${Math.floor(view.summary.minutes / 60)}` : "0"} unit={view.summary.minutes % 60 ? `ชม. ${view.summary.minutes % 60} น.` : "ชม."} />
          </div>

          <section aria-label="รายวัน" className={`${box} !p-3 sm:!p-5`}>
            {view.rows.length === 0 ? (
              <p className="px-2 py-4 text-sm text-fd-muted-foreground">เดือนนี้ยังไม่มีวันทำงานให้แสดง</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-fd-border text-left text-xs text-fd-muted-foreground">
                      <th className="px-2 py-2 font-semibold">วันที่</th>
                      <th className="px-2 py-2 font-semibold">เข้า</th>
                      <th className="px-2 py-2 font-semibold">ออก</th>
                      <th className="px-2 py-2 font-semibold">ชั่วโมง</th>
                      <th className="px-2 py-2 font-semibold">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.rows.map((r) => (
                      <Row key={r.date} r={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="px-2 pt-3 text-xs text-fd-muted-foreground">
              เวลาเลิกงานที่ระบบนับให้เมื่อลืมเช็คเอาต์ติดป้าย "ระบบนับให้" · เสาร์-อาทิตย์ที่ไม่มีเช็คอินไม่แสดง
            </p>
          </section>

          <p className="text-sm">
            เวลาไม่ตรงกับที่ทำจริง?{" "}
            <Link href="/questions" className="font-medium text-fd-primary hover:underline">
              บอกพี่เลี้ยงให้ตรวจ
            </Link>{" "}
            พี่เลี้ยงต้องเขียนเหตุผลทุกครั้งที่แก้ และคุณเห็นเหตุผลนั้นในตารางนี้
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className={box}>
      <p className="text-sm text-fd-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {value} <span className="text-sm font-normal text-fd-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function Row({ r }: { r: HistoryRow }) {
  const label = STATE_TEXT[r.state];
  const noTimes = !r.checkInAt;
  return (
    <tr className="border-b border-fd-border/60 align-top last:border-0">
      <td className="px-2 py-3 font-medium">{day(r.date)}</td>
      {noTimes ? (
        <td colSpan={3} className="px-2 py-3 text-fd-muted-foreground">
          {label}
          {r.holidayNote ? `: ${r.holidayNote}` : ""}
        </td>
      ) : (
        <>
          <td className="px-2 py-3 tabular-nums">{time(r.checkInAt!)}</td>
          <td className="px-2 py-3 tabular-nums">
            {r.state === "working" ? "ยังทำงานอยู่" : r.checkOutAt ? time(r.checkOutAt) : "-"}
            {r.checkOutAuto && <span className="ms-1 text-xs text-fd-muted-foreground">(ระบบนับให้)</span>}
          </td>
          <td className="px-2 py-3 tabular-nums">{r.minutes !== null ? hours(r.minutes) : "-"}</td>
        </>
      )}
      <td className="px-2 py-3">
        {r.late && <span className="text-amber-800 dark:text-amber-300">เข้างานหลังเวลา</span>}
        {r.editReason && (
          <p className="mt-1 text-xs text-fd-muted-foreground">
            พี่เลี้ยงแก้เวลา: {r.editReason}
          </p>
        )}
      </td>
    </tr>
  );
}
