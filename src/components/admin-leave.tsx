"use client";

import { Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminState } from "@/hooks/use-admin";
import { useAdminLeave } from "@/hooks/use-admin-leave";
import type { LeaveAdminRow, LeaveStatus } from "@/lib/attendance";
import { cohortStatus } from "@/lib/cohort";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { ErrorText } from "./error-text";
import { inputClass } from "./field";

// ใบลา/แจ้งสายของน้องทั้งรุ่น: อนุมัติแตะเดียว · ไม่อนุมัติต้องบอกเหตุผล (น้องเห็น) · ใบที่ตัดสินแล้วแก้ไม่ได้
// พี่เลี้ยงไม่ตอบ = ใบค้างรออนุมัติ ระบบไม่อนุมัติแทน (วันนั้นยังนับตามจริง)
const TZ = "Asia/Bangkok";
const box = "rounded-2xl border border-fd-border bg-fd-card p-5";
const dayText = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const KIND_TEXT = { leave: "ลาทั้งวัน", late: "แจ้งมาสาย" } as const;
const FILTERS: { id: LeaveStatus | null; label: string }[] = [
  { id: "pending", label: "รอตัดสิน" },
  { id: "approved", label: "อนุมัติแล้ว" },
  { id: "rejected", label: "ไม่อนุมัติ" },
  { id: null, label: "ทั้งหมด" },
];

export function AdminLeave({ admin, mine, onChanged }: { admin: AdminState; mine: readonly number[]; onChanged: () => void }) {
  const running = admin.cohorts.filter((c) => cohortStatus(c) === "active");
  const first = running.find((c) => mine.includes(c.id)) ?? running[0] ?? admin.cohorts.find((c) => !c.endedAt) ?? admin.cohorts[0];
  const [cohortId, setCohortId] = useState<number | null>(first?.id ?? null);
  const [status, setStatus] = useState<LeaveStatus | null>("pending");
  const leave = useAdminLeave(cohortId, status, onChanged);
  useEffect(() => {
    if (!cohortId && first) setCohortId(first.id);
  }, [cohortId, first]);

  if (admin.cohorts.length === 0) return <EmptyState icon={Inbox} title="ยังไม่มีรุ่น">สร้างรุ่นที่แท็บ "รุ่นฝึกงาน" ก่อน</EmptyState>;

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
        <div role="group" aria-label="กรองสถานะ" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              aria-pressed={status === f.id}
              onClick={() => setStatus(f.id)}
              className={`min-h-11 rounded-lg border px-4 text-sm ${status === f.id ? "border-fd-primary bg-fd-primary/10 font-semibold text-fd-primary" : "border-fd-border hover:bg-fd-accent"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {leave.error && (
        <div className="flex flex-col items-start gap-3">
          <ErrorText>{leave.error}</ErrorText>
          <Button variant="ghost" onClick={leave.reload}>
            ลองใหม่
          </Button>
        </div>
      )}
      {!leave.items && !leave.error && <div aria-hidden className="h-40 animate-pulse rounded-2xl bg-fd-muted" />}
      {leave.items && leave.items.length === 0 && <p className="text-sm text-fd-muted-foreground">{status === "pending" ? "ไม่มีใบที่รอตัดสิน" : "ไม่มีใบในหมวดนี้"}</p>}
      {leave.items && leave.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {leave.items.map((l) => (
            <Item key={l.id} l={l} busy={leave.busy} onDecide={leave.decide} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Item({ l, busy, onDecide }: { l: LeaveAdminRow; busy: boolean; onDecide: (id: number, v: "approved" | "rejected", note: string) => Promise<boolean> }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  return (
    <li className={`${box} flex flex-col gap-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">
            {l.name} · {KIND_TEXT[l.kind]}
          </p>
          <p className="text-sm text-fd-muted-foreground">{dayText(l.workDate)}</p>
        </div>
        {l.status !== "pending" && (
          <span className={`text-sm font-semibold ${l.status === "approved" ? "text-emerald-700 dark:text-emerald-300" : "text-fd-muted-foreground"}`}>{l.status === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติ"}</span>
        )}
      </div>
      <p className="text-sm">{l.reason}</p>
      {l.decisionNote && <p className="text-sm text-fd-muted-foreground">คำตอบของพี่เลี้ยง: {l.decisionNote}</p>}
      {l.status === "pending" &&
        (rejecting ? (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              เหตุผลที่ไม่อนุมัติ (น้องเห็น)
              <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} className={`${inputClass} min-h-16`} placeholder="เช่น ขอเอกสารประกอบ หรือวันนั้นมีนัด review" autoFocus />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" disabled={busy || note.trim().length < 3} onClick={() => onDecide(l.id, "rejected", note.trim())}>
                ยืนยันไม่อนุมัติ
              </Button>
              <Button variant="ghost" onClick={() => setRejecting(false)} disabled={busy}>
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => onDecide(l.id, "approved", "")}>
              อนุมัติ
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setRejecting(true)}>
              ไม่อนุมัติ…
            </Button>
          </div>
        ))}
    </li>
  );
}
