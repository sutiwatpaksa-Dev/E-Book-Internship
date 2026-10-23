"use client";

import { ChevronRight, PartyPopper } from "lucide-react";
import { daysSince, isLockedNow, type AdminState } from "@/hooks/use-admin";
import { useUnread } from "@/hooks/use-unread";
import { summarize } from "@/lib/progress-summary";
import { timeAgo } from "@/lib/thread-labels";
import type { AdminNav } from "./admin-panel";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("th-TH") : "ยังไม่เคยเข้า");
const STALE_DAYS = 7;

// แท็บภาพรวม: บนสุดคือ "งานวันนี้" (สิ่งที่ต้องลงมือ กดแล้วไปที่นั่นเลย) ล่างคือความคืบหน้าของน้องทุกคน
// ตัวเลขทั้งหมดคำนวณจากข้อมูลจริง (ไม่มีข้อมูลตัวอย่าง)
export function AdminOverview({ admin, nav }: { admin: AdminState; nav: AdminNav }) {
  const unread = useUnread();
  const interns = admin.users.filter((u) => u.role === "intern" && !u.disabled);
  const locked = admin.users.filter(isLockedNow);
  // แยกสองกลุ่มเพราะต้องทำคนละอย่าง: ยังไม่เคยเข้า = อาจยังไม่ได้รับ PIN (ตามส่ง PIN)
  // เคยเข้าแต่หายไปเกิน 7 วัน = อาจติดอะไรอยู่ (ทักไปถามความคืบหน้า)
  const neverIn = interns.filter((u) => !u.lastLoginAt);
  const stale = interns.filter((u) => (daysSince(u.lastLoginAt) ?? 0) > STALE_DAYS);
  const toInterns = () => document.getElementById("interns")?.scrollIntoView({ behavior: "smooth" });
  const newRequests = admin.threads.filter((t) => t.status === "new").length;
  const waiting = admin.threads.filter((t) => t.status === "waiting").length;

  // เรียงตามความเร่ง: คนรอคำตอบอยู่ก่อน แล้วค่อยเรื่องบัญชีและไฟล์
  const todo = [
    { show: unread > 0, text: `ข้อความใหม่ที่ยังไม่มีใครเปิดอ่าน ${unread} เรื่อง`, go: () => nav.goTab("questions") },
    { show: waiting > 0, text: `คำถามที่รอพี่เลี้ยงตอบ ${waiting} เรื่อง`, go: () => nav.goTab("questions") },
    { show: newRequests > 0, text: `คำขอเนื้อหาที่ยังไม่รับเรื่อง ${newRequests} เรื่อง`, go: () => nav.goTab("requests") },
    { show: locked.length > 0, text: `บัญชีถูกล็อก ${locked.length} บัญชี (ใส่ PIN ผิด 5 ครั้ง)`, go: () => nav.goTab("users") },
    { show: neverIn.length > 0, text: `น้องยังไม่เคย login ${neverIn.length} คน ส่ง PIN ให้แล้วหรือยัง`, go: toInterns },
    { show: stale.length > 0, text: `น้องไม่ได้เข้ามาเกิน ${STALE_DAYS} วัน ${stale.length} คน ลองทักไปถาม`, go: toInterns },
    { show: !admin.pdf && !admin.loading, text: "ยังไม่มีไฟล์ Requirement PDF ให้น้องเปิด", go: () => nav.goTab("files") },
  ].filter((t) => t.show);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="todo-title" className="flex flex-col gap-2">
        <h2 id="todo-title" className="text-base font-semibold">
          งานวันนี้
        </h2>
        {admin.loading ? (
          <p className="text-sm text-fd-muted-foreground">กำลังโหลด…</p>
        ) : todo.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl border border-fd-border bg-fd-card px-4 py-3 text-sm">
            <PartyPopper className="size-4 text-green-600" /> ไม่มีงานค้าง ทุกเรื่องได้รับการดูแลแล้ว
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-fd-border overflow-hidden rounded-xl border border-fd-border bg-fd-card">
            {todo.map((t) => (
              <li key={t.text}>
                <button type="button" onClick={t.go} className="flex w-full items-center gap-3 px-4 py-3 text-start text-sm hover:bg-fd-accent">
                  <span className="size-2 shrink-0 rounded-full bg-orange-500" />
                  <span className="flex-1">{t.text}</span>
                  <ChevronRight className="size-4 text-fd-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="interns" aria-labelledby="interns-title" className="flex flex-col gap-2">
        <h2 id="interns-title" className="text-base font-semibold">
          น้องแต่ละคน ({interns.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-fd-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-fd-muted text-left">
              <tr>
                <th className="px-3 py-2">ชื่อผู้ใช้</th>
                <th className="px-3 py-2">อยู่ที่</th>
                <th className="px-3 py-2">ผ่านแล้ว</th>
                <th className="px-3 py-2">ผ่านล่าสุด</th>
                <th className="px-3 py-2">เข้าล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {interns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-fd-muted-foreground">
                    {admin.loading ? "กำลังโหลด…" : "ยังไม่มีบัญชีน้อง สร้างได้ในแท็บบัญชีผู้ใช้"}
                  </td>
                </tr>
              )}
              {interns.map((u) => {
                const s = summarize(admin.progress[u.id]);
                const isStale = !u.lastLoginAt || (daysSince(u.lastLoginAt) ?? 0) > STALE_DAYS;
                return (
                  <tr key={u.id} className="border-t border-fd-border">
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => nav.openIntern(u.id)} className="font-medium text-fd-primary underline-offset-2 hover:underline">
                        {u.username}
                      </button>
                      {isLockedNow(u) && <span className="ms-2 text-xs text-orange-700 dark:text-orange-400">ล็อกอยู่</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{s.level}</td>
                    <td className="px-3 py-2">
                      {/* shrink-0: แถบมี overflow-hidden ทำให้ flex บีบมันได้ถึง 0 จอแคบจึงเหลือแค่จุด */}
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-fd-muted">
                          <span className="block h-full bg-fd-primary" style={{ width: `${(s.doneCount / s.total) * 100}%` }} />
                        </span>
                        <span className="whitespace-nowrap tabular-nums">
                          {s.doneCount}/{s.total}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{s.last ? `${s.last.title} · ${timeAgo(s.last.at)}` : <span className="text-fd-muted-foreground">ยังไม่ติ๊ก</span>}</td>
                    <td className={`px-3 py-2 whitespace-nowrap ${isStale ? "text-orange-700 dark:text-orange-400" : ""}`}>{fmt(u.lastLoginAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-fd-muted-foreground">
          ความคืบหน้ามาจากปุ่ม &quot;ผ่านบทนี้แล้ว&quot; ที่น้องติ๊กเองตอน login อยู่ (ติ๊กก่อน login จะย้ายขึ้นบัญชีเมื่อ login ครั้งถัดไป) ใช้ดูว่าใครติดตรงไหน
          ไม่ใช่คะแนน
        </p>
      </section>
    </div>
  );
}
