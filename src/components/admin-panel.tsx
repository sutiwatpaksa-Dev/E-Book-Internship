"use client";

import { FileText, Inbox, LayoutDashboard, MessageCircle, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useUnread } from "@/hooks/use-unread";
import { AdminFiles } from "./admin-files";
import { AdminInternDetail } from "./admin-intern-detail";
import { AdminOverview } from "./admin-overview";
import { AdminRequests } from "./admin-requests";
import { AdminUsers } from "./admin-users";
import { Button } from "./button";
import { ChatPanel } from "./chat-panel";
import { ErrorText } from "./error-text";

type TabId = "overview" | "questions" | "requests" | "users" | "files";
const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "ภาพรวม", icon: LayoutDashboard },
  { id: "questions", label: "ข้อความจากน้อง", icon: MessageCircle },
  { id: "requests", label: "คำขอเนื้อหา", icon: Inbox },
  { id: "users", label: "บัญชีผู้ใช้", icon: Users },
  { id: "files", label: "ไฟล์และตั้งค่า", icon: FileText },
];

// แท็บต่างๆ พากันไปหน้าอื่นผ่านตัวนี้ (เช่น ภาพรวม → น้องรายคน → เปิดแชทของน้อง)
export type AdminNav = { goTab: (id: TabId) => void; openIntern: (id: number) => void; openThread: (id: number) => void };

// หลังบ้านพี่เลี้ยง: เมนูแท็บซ้าย (มือถือเป็นแถบเลื่อนด้านบน) + เนื้อหาของแท็บที่เลือก
export function AdminPanel({ titles, initialTab = "overview" }: { titles: Record<string, string>; initialTab?: string }) {
  const admin = useAdmin();
  // เปิดแท็บจากลิงก์ได้ เช่น /dev/admin?tab=questions จากเมนูบัญชี
  const [tab, setTab] = useState<TabId>(TABS.some((t) => t.id === initialTab) ? (initialTab as TabId) : "overview");
  // เปิดหน้าน้องรายคนอยู่ (อยู่ใต้แท็บภาพรวม) · เรื่องที่สั่งให้แชทเปิด
  const [internId, setInternId] = useState<number | null>(null);
  const [threadId, setThreadId] = useState<number | null>(null);
  const active = TABS.find((t) => t.id === tab)!;
  const waiting = useUnread();
  const intern = internId !== null ? admin.users.find((u) => u.id === internId) : undefined;

  const nav: AdminNav = {
    goTab: (id) => {
      setInternId(null);
      setThreadId(null);
      setTab(id);
      // ข้อมูลในแท็บอาจเก่าแล้ว (เช่นเพิ่งตอบแชทไป) โหลดใหม่ทุกครั้งที่สลับ
      admin.reload();
    },
    openIntern: (id) => {
      setTab("overview");
      setInternId(id);
    },
    openThread: (id) => {
      setInternId(null);
      setThreadId(id);
      setTab("questions");
    },
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div role="tablist" aria-label="เมนูหลังบ้าน" className="-mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:w-56 md:flex-col md:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === tab}
            aria-controls="admin-tabpanel"
            onClick={() => nav.goTab(t.id)}
            className={`flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm whitespace-nowrap ${t.id === tab ? "bg-fd-primary/10 font-semibold text-fd-primary" : "font-medium hover:bg-fd-accent"}`}
          >
            <t.icon className="size-4" />
            {t.label}
            {t.id === "questions" && waiting > 0 && (
              <span aria-label={`ยังไม่อ่าน ${waiting} เรื่อง`} className="ms-auto rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
                {waiting}
              </span>
            )}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="admin-tabpanel" aria-labelledby={`tab-${tab}`} className="flex min-w-0 flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold">{intern ? `น้อง ${intern.username}` : active.label}</h1>

        {admin.error && <ErrorText>{admin.error}</ErrorText>}
        {admin.issued && (
          <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-3 text-sm">
            <span>
              PIN ของ <strong>{admin.issued.username}</strong>:
            </span>
            <code className="rounded bg-fd-background px-2 py-1 text-lg font-bold tracking-[0.3em]">{admin.issued.pin}</code>
            <span className="text-fd-muted-foreground">คัดลอกส่งให้น้องตอนนี้ ปิดกล่องนี้แล้วจะดูอีกไม่ได้</span>
            <Button variant="ghost" onClick={admin.dismissPin}>
              ปิด
            </Button>
          </div>
        )}

        {tab === "overview" && (internId !== null ? <AdminInternDetail admin={admin} nav={nav} userId={internId} /> : <AdminOverview admin={admin} nav={nav} />)}
        {/* key: สั่งเปิดเรื่องใหม่จากหน้าอื่น ให้แชทเริ่มใหม่ที่เรื่องนั้น */}
        {tab === "questions" && <ChatPanel key={threadId ?? "list"} side="dev" titles={titles} initialId={threadId} />}
        {tab === "requests" && <AdminRequests admin={admin} nav={nav} />}
        {tab === "users" && <AdminUsers admin={admin} />}
        {tab === "files" && <AdminFiles admin={admin} />}
      </div>
    </div>
  );
}
