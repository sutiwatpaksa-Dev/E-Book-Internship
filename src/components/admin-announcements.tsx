"use client";

import { Megaphone } from "lucide-react";
import { useState } from "react";
import type { ContentAdminState } from "@/hooks/use-content-admin";
import { timeAgo } from "@/lib/thread-labels";
import type { Announcement, Audience } from "@/types";
import { Button } from "./button";
import { ConfirmBox } from "./confirm-box";
import { EmptyState } from "./empty-state";
import { Field, Input, inputClass } from "./field";

const AUDIENCE_LABEL: Record<Audience, string> = { intern: "น้องฝึกงาน", dev: "พี่เลี้ยง", all: "ทุกคน" };

// ประกาศ = แถบบนหน้า "วันนี้" ของคนในกลุ่มที่เลือก + แจ้งเตือนที่กระดิ่ง 1 ครั้งตอนประกาศ
// ตั้งวันจบไว้ได้ ถึงเวลาแล้วหายเอง ไม่ต้องกลับมาปิด
export function AdminAnnouncements({ content }: { content: ContentAdminState }) {
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("intern");
  // ค่าจาก <input type="datetime-local"> เป็นเวลาท้องถิ่นไม่มีเขตเวลา แปลงเป็น ISO ก่อนส่ง
  const [endsAt, setEndsAt] = useState("");
  const [confirm, setConfirm] = useState<Announcement | null>(null);
  const now = Date.now();
  const active = (a: Announcement) => new Date(a.startsAt).getTime() <= now && (!a.endsAt || new Date(a.endsAt).getTime() > now);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await content.createAnnouncement({ body: body.trim(), audience, endsAt: endsAt ? new Date(endsAt).toISOString() : null });
    if (ok) {
      setBody("");
      setEndsAt("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-fd-border p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="ข้อความ (ไม่เกิน 500 ตัวอักษร)">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} className={`${inputClass} min-h-24`} placeholder="เช่น Review รอบ 2 วันศุกร์ 14:00 ห้องประชุมเล็ก" />
          </Field>
        </div>
        <Field label="ใครเห็น">
          <select className={inputClass} value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
            {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="หายเองเมื่อ (เว้นว่าง = จนกว่าจะกดปิด)">
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={body.trim().length < 3} className="min-h-11">
            <Megaphone className="size-4" /> ประกาศ
          </Button>
          <span className="text-xs text-fd-muted-foreground">ขึ้นบนหน้า &quot;วันนี้&quot; ทันที และส่งแจ้งเตือนที่กระดิ่งให้ทุกคนในกลุ่ม</span>
        </div>
      </form>

      {confirm && (
        <ConfirmBox title="ปิดประกาศนี้?" confirmLabel="ปิดประกาศ" onCancel={() => setConfirm(null)} onConfirm={async () => (await content.endAnnouncement(confirm)) && setConfirm(null)}>
          แถบประกาศจะหายจากหน้า &quot;วันนี้&quot; ของทุกคนทันที (ยังเห็นในรายการนี้)
        </ConfirmBox>
      )}

      {content.announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="ยังไม่มีประกาศ">
          ใช้บอกเรื่องที่ทุกคนต้องรู้พร้อมกัน เช่น นัด review, เปลี่ยนกำหนดส่ง, ระบบปิดปรับปรุง
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {content.announcements.map((a) => {
            const on = active(a);
            return (
              <li key={a.id} className={`flex flex-col gap-2 rounded-xl border border-fd-border p-3 text-sm sm:flex-row sm:items-center ${on ? "" : "opacity-60"}`}>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="whitespace-pre-line">{a.body}</p>
                  <p className="text-xs text-fd-muted-foreground">
                    {on ? "กำลังแสดง" : "จบแล้ว"} · ถึง{AUDIENCE_LABEL[a.audience]} · {a.author} · {timeAgo(a.createdAt)}
                    {a.endsAt && on && ` · หายเอง ${new Date(a.endsAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}`}
                  </p>
                </div>
                {on && (
                  <Button variant="ghost" onClick={() => setConfirm(a)} className="min-h-10 shrink-0">
                    ปิดประกาศ
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
