"use client";

import { FilePlus2, FileText, GraduationCap, History, Inbox, Layers, LayoutDashboard, Megaphone, MessageCircle, NotebookPen, Users, type LucideIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useNavDrawer } from "@/hooks/use-nav-drawer";
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
import { MobileDrawer } from "./mobile-drawer";

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
// ลิงก์เก่า ?tab=content (ก่อนแยกเมนู) ยังเปิดได้ · มี ?note= = มาจากปุ่ม "เพิ่มโน้ตหน้านี้" · มีแค่ ?t= = ลิงก์เรื่องในแชท
function pickTab(tab: string | null, note: string | null, thread: number | null): TabId {
  if (note) return "notes";
  if (tab === "content") return "cards";
  if (!tab && thread) return "questions";
  return TABS.some((t) => t.id === tab) ? (tab as TabId) : "overview";
}

// หน้าที่เปิดอยู่เก็บใน URL ที่เดียว (ไม่ใช่ state): รีเฟรชแล้วอยู่หน้าเดิม, ปุ่ม Back ใช้ได้, ส่งลิงก์ให้พี่เลี้ยงอีกคนได้
// เช่น ?tab=users · ?tab=overview&intern=7 · ?tab=cohorts&cohort=2 · ?tab=questions&t=5 · ?tab=notes&note=/learn/cards/hono
type View = { tab: TabId; intern?: number | null; cohort?: number | null; thread?: number | null; note?: string };
const positive = (v: string | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
function readView(p: URLSearchParams): View {
  const thread = positive(p.get("t"));
  const tab = pickTab(p.get("tab"), p.get("note"), thread);
  // ค่าย่อยมีความหมายเฉพาะใต้แท็บของมัน (?tab=users&intern=7 = แค่หน้าบัญชี)
  return {
    tab,
    intern: tab === "overview" ? positive(p.get("intern")) : null,
    cohort: tab === "cohorts" ? positive(p.get("cohort")) : null,
    thread: tab === "questions" ? thread : null,
    note: tab === "notes" ? (p.get("note") ?? undefined) : undefined,
  };
}
function viewHref(v: View) {
  const p = new URLSearchParams({ tab: v.tab });
  if (v.intern) p.set("intern", String(v.intern));
  if (v.cohort) p.set("cohort", String(v.cohort));
  if (v.thread) p.set("t", String(v.thread));
  if (v.note) p.set("note", v.note);
  return `/dev/admin?${p}`;
}

// แท็บต่างๆ พากันไปหน้าอื่นผ่านตัวนี้ (เช่น ภาพรวม → น้องรายคน → เปิดแชทของน้อง)
export type AdminNav = { goTab: (id: TabId) => void; openIntern: (id: number) => void; openThread: (id: number) => void; openNote: (pageUrl: string) => void; openCohort: (id: number | null) => void };

// หลังบ้านพี่เลี้ยง: เมนูแท็บซ้าย (มือถือเป็นแถบเลื่อนด้านบน) + เนื้อหาของแท็บที่เลือก
export function AdminPanel({ titles }: { titles: Record<string, string> }) {
  const admin = useAdmin();
  const content = useContentAdmin();
  // pushState ของ browser ทำให้ useSearchParams อัปเดตเอง (Next ไม่โหลดหน้าใหม่ ข้อมูลที่โหลดไว้ยังอยู่)
  const view = readView(useSearchParams());
  const { tab } = view;
  const go = (v: View, replace = false) => window.history[replace ? "replaceState" : "pushState"](null, "", viewHref(v));
  const active = TABS.find((t) => t.id === tab)!;
  const waiting = useUnread();
  const intern = view.intern ? admin.users.find((u) => u.id === view.intern) : undefined;

  // แชทเลือกเรื่องเอง: จด id ลง URL แบบ replace (รีเฟรช/แชร์ลิงก์แล้วเปิดเรื่องเดิม แต่ไม่เพิ่มประวัติทุกคลิก)
  // URL เปลี่ยนจากข้างนอก (ลิงก์แจ้งเตือน, ปุ่ม Back, เปิดจากหน้าน้อง) = สร้างแชทใหม่ให้เปิดเรื่องนั้น
  // effect ของลูกรันก่อนของแม่ ตอนแชทเพิ่งสร้าง selected จึงตรงกับ URL แล้ว ไม่สร้างซ้ำ
  const selected = useRef<number | null | undefined>(undefined);
  const [chatKey, setChatKey] = useState(0);
  useEffect(() => {
    if (tab === "questions" && view.thread !== selected.current) setChatKey((k) => k + 1);
  }, [tab, view.thread]);
  const onSelectThread = (id: number | null) => {
    selected.current = id;
    if (id !== view.thread) go({ tab: "questions", thread: id }, true);
  };

  const nav: AdminNav = {
    goTab: (id) => {
      if (id !== tab || viewHref(view) !== viewHref({ tab: id })) go({ tab: id });
      // ข้อมูลในแท็บอาจเก่าแล้ว (เช่นเพิ่งตอบแชทไป) โหลดใหม่ทุกครั้งที่สลับ
      admin.reload();
      if (CONTENT_TABS.includes(id)) content.reload();
      content.clearError();
    },
    openIntern: (id) => go({ tab: "overview", intern: id }),
    openThread: (id) => go({ tab: "questions", thread: id }),
    openCohort: (id) => go({ tab: "cohorts", cohort: id }),
    openNote: (pageUrl) => go({ tab: "notes", note: pageUrl }),
  };
  // เมนูเป็นลิงก์จริง: กดธรรมดา = สลับในหน้า (และปิดลิ้นชักบนมือถือ) · Ctrl/Cmd/กลางเมาส์ = เปิดแท็บใหม่ตามปกติของ browser
  const drawer = useNavDrawer();
  const onMenuClick = (e: MouseEvent<HTMLAnchorElement>, id: TabId) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    drawer.setOpen(false);
    nav.goTab(id);
  };
  const newRequests = admin.threads.filter((t) => t.kind === "content_request" && t.status === "new").length;
  const badge = (id: TabId) => (id === "questions" ? waiting : id === "requests" ? newRequests : 0);
  // เมนูชุดเดียว วางได้ 2 ที่: คอลัมน์ซ้ายบนจอกว้าง และลิ้นชักบนมือถือ
  const menuGroups = (
    <>
      {GROUPS.map((g, i) => (
        <div key={g.label} className="flex flex-col gap-0.5">
          <span className={`px-3 pb-1 text-xs font-semibold text-fd-muted-foreground ${i === 0 ? "" : "pt-5"}`}>{g.label}</span>
          {g.tabs.map((t) => {
            const n = badge(t.id);
            return (
              <a
                key={t.id}
                href={viewHref({ tab: t.id })}
                aria-current={t.id === tab ? "page" : undefined}
                onClick={(e) => onMenuClick(e, t.id)}
                className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm ${t.id === tab ? "bg-fd-primary/10 font-semibold text-fd-primary" : "font-medium hover:bg-fd-accent"}`}
              >
                <t.icon className="size-4" />
                {t.label}
                {n > 0 && (
                  <span aria-label={`${n} เรื่องใหม่`} className="ms-auto rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
                    {n}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      ))}
    </>
  );

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* จอกว้าง: คอลัมน์ซ้ายแบ่งกลุ่ม · มือถือ: เมนูเดียวกันอยู่ในลิ้นชัก เปิดจากปุ่ม ☰ บนแถบบน (เหมือนหน้าคู่มือ) */}
      <nav aria-label="เมนูหลังบ้าน" className="sticky top-24 w-56 shrink-0 self-start max-md:hidden">
        {menuGroups}
      </nav>
      <MobileDrawer title="เมนูหลังบ้าน">
        <nav aria-label="เมนูหลังบ้าน">{menuGroups}</nav>
      </MobileDrawer>

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
          (view.intern ? <AdminInternDetail admin={admin} nav={nav} userId={view.intern} /> : <AdminOverview admin={admin} content={content} nav={nav} titles={titles} />)}
        {/* key: สั่งเปิดเรื่องใหม่จากข้างนอก ให้แชทเริ่มใหม่ที่เรื่องนั้น (ดู chatKey ข้างบน) */}
        {tab === "questions" && <ChatPanel key={chatKey} side="dev" titles={titles} initialId={view.thread ?? null} onSelect={onSelectThread} />}
        {tab === "requests" && <AdminRequests admin={admin} nav={nav} />}
        {CONTENT_TABS.includes(tab) && content.loading ? (
          <p className="text-sm text-fd-muted-foreground">กำลังโหลด…</p>
        ) : (
          <>
            {tab === "cards" && <AdminMentorCards content={content} />}
            {tab === "notes" && <AdminNotes key={view.note ?? "list"} content={content} initialPage={view.note} titles={titles} />}
            {tab === "builtin" && <AdminBuiltInCards content={content} />}
            {tab === "announcements" && <AdminAnnouncements content={content} />}
          </>
        )}
        {tab === "cohorts" && <AdminCohorts admin={admin} nav={nav} cohortId={view.cohort ?? null} />}
        {tab === "users" && <AdminUsers admin={admin} nav={nav} />}
        {tab === "files" && <AdminFiles admin={admin} />}
        {tab === "audit" && <AdminAudit />}
      </section>
    </div>
  );
}
