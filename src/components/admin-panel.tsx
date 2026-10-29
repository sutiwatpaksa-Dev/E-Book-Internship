"use client";

import { FilePlus2, FileText, GraduationCap, History, Inbox, Layers, LayoutDashboard, Megaphone, MessageCircle, NotebookPen, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useUnread } from "@/hooks/use-unread";
import { useContentAdmin } from "@/hooks/use-content-admin";
import { AdminAnnouncements } from "./admin-announcements";
import { AdminAudit } from "./admin-audit";
import { AdminBuiltInCards, AdminMentorCards, AdminNotes } from "./admin-content";
import { AdminFiles } from "./admin-files";
import { AdminCohorts } from "./admin-cohorts";
import { AdminInternDetail } from "./admin-intern-detail";
import { AdminOverview } from "./admin-overview";
import { AdminRequests } from "./admin-requests";
import { AdminUsers } from "./admin-users";
import { Button } from "./button";
import { ChatPanel } from "./chat-panel";
import { ErrorText } from "./error-text";

type TabId = "overview" | "questions" | "requests" | "cards" | "notes" | "builtin" | "announcements" | "cohorts" | "users" | "files" | "audit";
type Tab = { id: TabId; label: string; icon: LucideIcon };
// เมนูแบ่ง 3 กลุ่มตามความถี่ที่ใช้: งานประจำวัน (เปิดทุกวัน) → เนื้อหา (เขียน/ปรับคู่มือ) → ระบบ (นานๆ ครั้ง)
const GROUPS: { label: string; tabs: Tab[] }[] = [
  {
    label: "งานประจำวัน",
    tabs: [
      { id: "overview", label: "ภาพรวม", icon: LayoutDashboard },
      { id: "questions", label: "ข้อความจากน้อง", icon: MessageCircle },
      { id: "requests", label: "คำขอเนื้อหา", icon: Inbox },
    ],
  },
  {
    label: "เนื้อหา",
    tabs: [
      { id: "cards", label: "การ์ดของพี่เลี้ยง", icon: FilePlus2 },
      { id: "notes", label: "โน้ตท้ายหน้า", icon: NotebookPen },
      { id: "builtin", label: "การ์ดในระบบ", icon: Layers },
      { id: "announcements", label: "ประกาศ", icon: Megaphone },
    ],
  },
  {
    label: "ระบบ",
    tabs: [
      { id: "cohorts", label: "รุ่นฝึกงาน", icon: GraduationCap },
      { id: "users", label: "บัญชีผู้ใช้", icon: Users },
      { id: "files", label: "ไฟล์และตั้งค่า", icon: FileText },
      { id: "audit", label: "บันทึกการกระทำ", icon: History },
    ],
  },
];
const TABS = GROUPS.flatMap((g) => g.tabs);
const CONTENT_TABS: TabId[] = ["cards", "notes", "builtin", "announcements"];
// ลิงก์เก่า ?tab=content (ก่อนแยกเมนู) ยังเปิดได้ · มี ?note= = มาจากปุ่ม "เพิ่มโน้ตหน้านี้"
function pickTab(tab: string | undefined, note: string | undefined): TabId {
  if (note) return "notes";
  if (tab === "content") return "cards";
  return TABS.some((t) => t.id === tab) ? (tab as TabId) : "overview";
}

// แท็บต่างๆ พากันไปหน้าอื่นผ่านตัวนี้ (เช่น ภาพรวม → น้องรายคน → เปิดแชทของน้อง)
export type AdminNav = { goTab: (id: TabId) => void; openIntern: (id: number) => void; openThread: (id: number) => void; openNote: (pageUrl: string) => void; openCohort: (id: number | null) => void };

// หลังบ้านพี่เลี้ยง: เมนูแท็บซ้าย (มือถือเป็นแถบเลื่อนด้านบน) + เนื้อหาของแท็บที่เลือก
type Props = { titles: Record<string, string>; initialTab?: string; initialThread?: number | null; initialNote?: string };

export function AdminPanel({ titles, initialTab = "overview", initialThread = null, initialNote }: Props) {
  const admin = useAdmin();
  const content = useContentAdmin();
  // เปิดแท็บจากลิงก์ได้ เช่น /dev/admin?tab=questions จากเมนูบัญชี
  const [tab, setTab] = useState<TabId>(pickTab(initialTab, initialNote));
  // หน้าที่จะเขียนโน้ตให้ (จาก ?note= หรือปุ่มในภาพรวม) · key ของ AdminNotes เปลี่ยนตาม ฟอร์มจึงเปิดใหม่พร้อมหน้านั้น
  const [notePage, setNotePage] = useState(initialNote);
  // เปิดหน้าน้องรายคนอยู่ (อยู่ใต้แท็บภาพรวม) · เรื่องที่สั่งให้แชทเปิด
  const [internId, setInternId] = useState<number | null>(null);
  const [threadId, setThreadId] = useState<number | null>(initialThread);
  // หน้ารุ่นที่เปิดอยู่ (อยู่ใต้เมนูรุ่นฝึกงาน) · null = รายการรุ่น
  const [cohortId, setCohortId] = useState<number | null>(null);
  const active = TABS.find((t) => t.id === tab)!;
  const waiting = useUnread();
  const intern = internId !== null ? admin.users.find((u) => u.id === internId) : undefined;

  const nav: AdminNav = {
    goTab: (id) => {
      setInternId(null);
      setThreadId(null);
      setNotePage(undefined);
      setCohortId(null);
      setTab(id);
      // ข้อมูลในแท็บอาจเก่าแล้ว (เช่นเพิ่งตอบแชทไป) โหลดใหม่ทุกครั้งที่สลับ
      admin.reload();
      if (CONTENT_TABS.includes(id)) content.reload();
      content.clearError();
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
    openCohort: (id) => {
      setCohortId(id);
      setTab("cohorts");
    },
    openNote: (pageUrl) => {
      setInternId(null);
      setNotePage(pageUrl);
      setTab("notes");
    },
  };
  const newRequests = admin.threads.filter((t) => t.kind === "content_request" && t.status === "new").length;
  const badge = (id: TabId) => (id === "questions" ? waiting : id === "requests" ? newRequests : 0);

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* จอแคบ: เมนูเป็นแถบเลื่อนแนวนอนแถวเดียว (หัวกลุ่มซ่อน) · จอกว้าง: คอลัมน์ซ้ายแบ่งกลุ่ม */}
      <nav aria-label="เมนูหลังบ้าน" className="-mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:sticky md:top-24 md:mx-0 md:w-56 md:flex-col md:gap-0 md:self-start md:px-0">
        {GROUPS.map((g, i) => (
          <div key={g.label} className="contents md:flex md:flex-col md:gap-0.5">
            <span className={`px-3 pb-1 text-xs font-semibold text-fd-muted-foreground max-md:hidden ${i === 0 ? "" : "pt-5"}`}>{g.label}</span>
            {g.tabs.map((t) => {
              const n = badge(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  id={`tab-${t.id}`}
                  aria-current={t.id === tab ? "page" : undefined}
                  onClick={() => nav.goTab(t.id)}
                  className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm whitespace-nowrap ${t.id === tab ? "bg-fd-primary/10 font-semibold text-fd-primary" : "font-medium hover:bg-fd-accent"}`}
                >
                  <t.icon className="size-4" />
                  {t.label}
                  {n > 0 && (
                    <span aria-label={`${n} เรื่องใหม่`} className="ms-auto rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <section aria-labelledby="admin-title" className="flex min-w-0 flex-1 flex-col gap-4">
        <h1 id="admin-title" className="text-2xl font-bold">
          {intern ? `น้อง ${intern.username}` : active.label}
        </h1>

        {admin.error && <ErrorText>{admin.error}</ErrorText>}
        {CONTENT_TABS.includes(tab) && content.error && <ErrorText>{content.error}</ErrorText>}
        {admin.issued && (
          <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-3 text-sm">
            <span>
              PIN ของ <strong>{admin.issued.username}</strong>:
            </span>
            <code className="rounded bg-fd-background px-2 py-1 text-lg font-bold tracking-[0.3em]">{admin.issued.pin}</code>
            <span className="text-fd-muted-foreground">คัดลอกส่งให้น้องตอนนี้ ปิดกล่องนี้แล้วจะดูอีกไม่ได้ · PIN ที่ออกใหม่ใช้ได้ 30 นาที</span>
            <Button variant="ghost" onClick={admin.dismissPin}>
              ปิด
            </Button>
          </div>
        )}

        {tab === "overview" &&
          (internId !== null ? <AdminInternDetail admin={admin} nav={nav} userId={internId} /> : <AdminOverview admin={admin} content={content} nav={nav} titles={titles} />)}
        {/* key: สั่งเปิดเรื่องใหม่จากหน้าอื่น ให้แชทเริ่มใหม่ที่เรื่องนั้น */}
        {tab === "questions" && <ChatPanel key={threadId ?? "list"} side="dev" titles={titles} initialId={threadId} />}
        {tab === "requests" && <AdminRequests admin={admin} nav={nav} />}
        {CONTENT_TABS.includes(tab) && content.loading ? (
          <p className="text-sm text-fd-muted-foreground">กำลังโหลด…</p>
        ) : (
          <>
            {tab === "cards" && <AdminMentorCards content={content} />}
            {tab === "notes" && <AdminNotes key={notePage ?? "list"} content={content} initialPage={notePage} titles={titles} />}
            {tab === "builtin" && <AdminBuiltInCards content={content} />}
            {tab === "announcements" && <AdminAnnouncements content={content} />}
          </>
        )}
        {tab === "cohorts" && <AdminCohorts admin={admin} nav={nav} cohortId={cohortId} />}
        {tab === "users" && <AdminUsers admin={admin} nav={nav} />}
        {tab === "files" && <AdminFiles admin={admin} />}
        {tab === "audit" && <AdminAudit />}
      </section>
    </div>
  );
}
