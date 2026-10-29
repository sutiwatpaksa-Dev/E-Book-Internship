"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { cardsOf, cardUrl, steps } from "@/data/learn";
import { daysSince, isLockedNow, type AdminState } from "@/hooks/use-admin";
import { toast } from "@/hooks/use-toast";
import { cardEntries, cardSummary } from "@/lib/admin-stats";
import { socialOf } from "@/lib/contact";
import { eduSummary, SCHOOL_TYPE_LABEL } from "@/lib/education";
import { KIND_LABEL, timeAgo } from "@/lib/thread-labels";
import type { AdminNav } from "./admin-panel";
import { Button } from "./button";
import { ConfirmBox } from "./confirm-box";
import { StatusBadge } from "./status-badge";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("th-TH") : "ยังไม่เคยเข้า");
const day = (d: string) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });

// ขั้นที่ยังไม่มีการ์ด (เช่น Maintenance) ไม่แสดง กล่อง 0/0 อ่านแล้วเหมือนน้องไม่ได้ทำ (เหมือนกราฟหน้าภาพรวม)
const stepsWithCards = steps.filter((st) => cardsOf(st.slug).length > 0);

// หน้าน้องรายคน: ทุกอย่างของน้อง 1 คนในหน้าเดียว (ความคืบหน้ารายขั้น เรื่องที่คุยกัน และจัดการบัญชี)
export function AdminInternDetail({ admin, nav, userId }: { admin: AdminState; nav: AdminNav; userId: number }) {
  const [pending, setPending] = useState<"disable" | "reset" | null>(null);
  const u = admin.users.find((x) => x.id === userId);
  if (!u) return <p className="text-sm text-fd-muted-foreground">{admin.loading ? "กำลังโหลด…" : "ไม่พบบัญชีนี้"}</p>;

  const entries = admin.progress[u.id] ?? [];
  // นับการ์ด 7 ขั้นแบบเดียวกับตารางและกราฟหน้าภาพรวม (เดิมนับบท roadmap เก่า 0/28 ตัวเลขจึงไม่ตรงกัน)
  const s = cardSummary(entries);
  const doneAt = new Map(cardEntries(entries).map((e) => [e.link, e.doneAt]));
  const threads = admin.threads.filter((t) => t.owner === u.username);
  const days = daysSince(u.lastLoginAt);
  const edu = eduSummary(u) ? `${u.schoolType ? `${SCHOOL_TYPE_LABEL[u.schoolType]} · ` : ""}${eduSummary(u)}` : null;
  // ช่องที่น้องกรอกเอง ว่าง = บอกว่ายังไม่ได้กรอก (ไม่ซ่อน จะได้รู้ว่าต้องทักให้กรอก)
  const contact: [string, string | null][] = [
    ["การศึกษา", edu],
    ["เบอร์โทร", u.phone ?? null],
    ["อีเมล", u.email ?? null],
    ["สนใจ / ถนัด", u.expertise ?? null],
    ["ช่องทางอื่น", socialOf(u) || null],
  ];
  async function copy() {
    const lines = [`ชื่อ: ${u!.fullName ?? u!.username}${u!.nickname ? ` (${u!.nickname})` : ""}`, ...contact.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success(`คัดลอกข้อมูลของ ${u!.nickname || u!.username} แล้ว`);
    } catch {
      toast.error("คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง");
    }
  }

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
      <div className="flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <strong className="min-w-0 text-base">
            {u.fullName ?? <span className="font-normal text-fd-muted-foreground">ยังไม่ได้กรอกชื่อ-นามสกุล</span>}
            {u.nickname && <span className="font-normal text-fd-muted-foreground"> ({u.nickname})</span>}
            <span className="block text-xs font-normal text-fd-muted-foreground">{u.username}</span>
          </strong>
          <Button variant="ghost" onClick={copy} className="shrink-0 border border-fd-border">
            คัดลอก
          </Button>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          {contact.map(([k, v]) => (
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
        <p className="text-xs text-fd-muted-foreground">น้องกรอกเองที่เมนูบัญชี → โปรไฟล์ของฉัน · พี่เลี้ยงทุกคนเห็นข้อมูลนี้</p>
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
          ความคืบหน้า: ผ่าน {s.doneCount}/{s.total} การ์ด · {s.where}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {stepsWithCards.map((st) => {
            const list = cardsOf(st.slug);
            const passed = list.filter((c) => doneAt.has(cardUrl(c.slug))).length;
            return (
              <div key={st.slug} className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-fd-border bg-fd-card p-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  {st.num}. {st.name} ({st.th})
                  <span className={`tabular-nums ${passed === list.length ? "text-green-700 dark:text-green-400" : "text-fd-muted-foreground"}`}>
                    {passed}/{list.length}
                  </span>
                </div>
                <ul className="flex flex-col gap-1 text-sm">
                  {list.map((c) => {
                    const at = doneAt.get(cardUrl(c.slug));
                    return (
                      <li key={c.slug} className={`flex items-center gap-2 ${at ? "" : "text-fd-muted-foreground"}`}>
                        <span className={`flex size-4 shrink-0 items-center justify-center rounded ${at ? "bg-fd-primary text-fd-primary-foreground" : "border border-fd-border"}`}>
                          {at && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{c.title}</span>
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
