"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { roadmap } from "@/data/roadmap";
import { daysSince, isLockedNow, type AdminState } from "@/hooks/use-admin";
import { eduSummary, SCHOOL_TYPE_LABEL } from "@/lib/education";
import { summarize } from "@/lib/progress-summary";
import { KIND_LABEL, timeAgo } from "@/lib/thread-labels";
import type { AdminNav } from "./admin-panel";
import { Button } from "./button";
import { ConfirmBox } from "./confirm-box";
import { StatusBadge } from "./status-badge";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("th-TH") : "ยังไม่เคยเข้า");
const day = (d: string) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });

// หน้าน้องรายคน: ทุกอย่างของน้อง 1 คนในหน้าเดียว (ความคืบหน้ารายด่าน เรื่องที่คุยกัน และจัดการบัญชี)
export function AdminInternDetail({ admin, nav, userId }: { admin: AdminState; nav: AdminNav; userId: number }) {
  const [pending, setPending] = useState<"disable" | "reset" | null>(null);
  const u = admin.users.find((x) => x.id === userId);
  if (!u) return <p className="text-sm text-fd-muted-foreground">{admin.loading ? "กำลังโหลด…" : "ไม่พบบัญชีนี้"}</p>;

  const entries = admin.progress[u.id] ?? [];
  const s = summarize(entries);
  const doneAt = new Map(entries.map((e) => [e.link, e.doneAt]));
  const threads = admin.threads.filter((t) => t.owner === u.username);
  const days = daysSince(u.lastLoginAt);

  const confirm = async () => {
    const kind = pending;
    setPending(null);
    if (kind === "reset") await admin.resetPin(u);
    else await admin.updateUser(u, { disabled: true });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => nav.goTab("overview")}>
          <ArrowLeft className="size-4" /> ภาพรวม
        </Button>
        <span className="text-sm text-fd-muted-foreground">
          {u.disabled ? "ปิดบัญชีอยู่" : isLockedNow(u) ? "ล็อกชั่วคราว" : "ใช้งาน"} · เข้าล่าสุด {fmt(u.lastLoginAt)}
          {days !== null && days > 7 && <span className="text-orange-700 dark:text-orange-400"> ({days} วันก่อน)</span>}
        </span>
      </div>
      {/* โปรไฟล์ที่น้องกรอกเอง (ยังไม่กรอก = บอกตรงๆ ไม่ซ่อน จะได้รู้ว่าต้องทักให้กรอก) */}
      <div className="flex flex-col gap-0.5 rounded-xl border border-fd-border p-4 text-sm">
        <strong className="text-base">
          {u.fullName ?? <span className="font-normal text-fd-muted-foreground">ยังไม่ได้กรอกชื่อ-นามสกุล</span>}
          {u.nickname && <span className="font-normal text-fd-muted-foreground"> ({u.nickname})</span>}
        </strong>
        <span className="text-fd-muted-foreground">
          {eduSummary(u) ? `${u.schoolType ? `${SCHOOL_TYPE_LABEL[u.schoolType]} · ` : ""}${eduSummary(u)}` : "ยังไม่ได้กรอกข้อมูลการศึกษา (น้องกรอกเองที่เมนูบัญชี → โปรไฟล์ของฉัน)"}
        </span>
        {u.secretKind === "pin" && <span className="text-orange-700 dark:text-orange-400">ยังใช้ PIN ชั่วคราว: login ครั้งหน้าระบบจะให้ตั้งรหัสผ่าน</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {isLockedNow(u) && (
          <Button variant="ghost" onClick={() => admin.updateUser(u, { unlock: true })}>
            ปลดล็อก
          </Button>
        )}
        <Button variant="ghost" onClick={() => setPending("reset")}>
          ออก PIN ใหม่
        </Button>
        {u.disabled ? (
          <Button variant="ghost" onClick={() => admin.updateUser(u, { disabled: false })}>
            เปิดบัญชี
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setPending("disable")}>
            ปิดบัญชี
          </Button>
        )}
      </div>

      {pending && (
        <ConfirmBox
          title={pending === "disable" ? `ปิดบัญชี ${u.username}?` : `ออก PIN ใหม่ให้ ${u.username}?`}
          confirmLabel={pending === "disable" ? "ปิดบัญชี" : "ออก PIN ใหม่"}
          danger={pending === "disable"}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        >
          {pending === "disable" ? "น้องจะเรียก API ไม่ได้ทันที เปิดบัญชีคืนได้ภายหลัง ความคืบหน้าและแชทยังอยู่ครบ" : "PIN เดิมใช้ไม่ได้ทันที PIN ใหม่แสดงครั้งเดียวด้านบน ต้องส่งให้น้องเอง"}
        </ConfirmBox>
      )}

      <section aria-labelledby="progress-title" className="flex flex-col gap-3">
        <h2 id="progress-title" className="text-base font-semibold">
          ความคืบหน้า: ผ่าน {s.doneCount}/{s.total} บท · อยู่ที่ {s.level}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {roadmap.map((level) => {
            const main = level.items.filter((i) => !i.extra);
            const passed = main.filter((i) => s.done.has(i.link)).length;
            return (
              <div key={level.title} className="flex flex-col gap-1.5 rounded-xl border border-fd-border bg-fd-card p-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  {level.title}
                  <span className={`tabular-nums ${passed === main.length ? "text-green-700 dark:text-green-400" : "text-fd-muted-foreground"}`}>
                    {passed}/{main.length}
                  </span>
                </div>
                <ul className="flex flex-col gap-1 text-sm">
                  {level.items.map((i) => {
                    const at = doneAt.get(i.link);
                    return (
                      <li key={i.link} className={`flex items-center gap-2 ${at ? "" : "text-fd-muted-foreground"}`}>
                        <span className={`flex size-4 shrink-0 items-center justify-center rounded ${at ? "bg-fd-primary text-fd-primary-foreground" : "border border-fd-border"}`}>
                          {at && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {i.title}
                          {i.extra && <span className="text-xs text-fd-muted-foreground"> (เสริม)</span>}
                        </span>
                        {at && <span className="text-xs text-fd-muted-foreground">{day(at)}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="threads-title" className="flex flex-col gap-2">
        <h2 id="threads-title" className="text-base font-semibold">
          เรื่องที่คุยกับพี่เลี้ยง ({threads.length})
        </h2>
        {threads.length === 0 ? (
          <p className="text-sm text-fd-muted-foreground">ยังไม่เคยถามหรือขอเนื้อหา</p>
        ) : (
          <ul className="flex flex-col divide-y divide-fd-border overflow-hidden rounded-xl border border-fd-border bg-fd-card">
            {threads.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => nav.openThread(t.id)} className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm hover:bg-fd-accent">
                  <span aria-label={KIND_LABEL[t.kind].label}>{KIND_LABEL[t.kind].icon}</span>
                  <span className={`min-w-0 flex-1 truncate ${t.unread ? "font-bold" : ""}`}>{t.subject}</span>
                  <StatusBadge status={t.status} />
                  <span className="w-16 text-end text-xs text-fd-muted-foreground">{timeAgo(t.lastMessageAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
