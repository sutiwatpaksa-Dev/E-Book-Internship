"use client";

import { FileText, LayoutDashboard, MessageCircle, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { AdminFiles } from "./admin-files";
import { AdminOverview } from "./admin-overview";
import { AdminQuestions } from "./admin-questions";
import { AdminUsers } from "./admin-users";
import { Button } from "./button";
import { ErrorText } from "./error-text";

type TabId = "overview" | "users" | "files" | "questions";
const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "ภาพรวม", icon: LayoutDashboard },
  { id: "users", label: "บัญชีผู้ใช้", icon: Users },
  { id: "files", label: "ไฟล์และตั้งค่า", icon: FileText },
  { id: "questions", label: "คำถามจากน้อง", icon: MessageCircle },
];

// หลังบ้านพี่เลี้ยง: เมนูแท็บซ้าย (มือถือเป็นแถบเลื่อนด้านบน) + เนื้อหาของแท็บที่เลือก
export function AdminPanel({ titles }: { titles: Record<string, string> }) {
  const admin = useAdmin();
  const [tab, setTab] = useState<TabId>("overview");
  const active = TABS.find((t) => t.id === tab)!;
  const waiting = admin.questions.filter((q) => !q.answer).length;

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
            onClick={() => setTab(t.id)}
            className={`flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm whitespace-nowrap ${t.id === tab ? "bg-fd-primary/10 font-semibold text-fd-primary" : "font-medium hover:bg-fd-accent"}`}
          >
            <t.icon className="size-4" />
            {t.label}
            {t.id === "questions" && waiting > 0 && (
              <span aria-label={`รอตอบ ${waiting} ข้อ`} className="ms-auto rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
                {waiting}
              </span>
            )}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="admin-tabpanel" aria-labelledby={`tab-${tab}`} className="flex min-w-0 flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold">{active.label}</h1>

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

        {tab === "overview" && <AdminOverview admin={admin} />}
        {tab === "users" && <AdminUsers admin={admin} />}
        {tab === "files" && <AdminFiles admin={admin} />}
        {tab === "questions" && <AdminQuestions admin={admin} titles={titles} />}
      </div>
    </div>
  );
}
