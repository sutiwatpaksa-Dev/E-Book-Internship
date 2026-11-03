"use client";

import { BookOpen, ChevronRight, Newspaper, ClipboardList, FolderKanban, LayoutDashboard, Lock, MessageCircle, Settings, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useRoleKnown, useSession } from "@/hooks/use-session";
import { useUnread } from "@/hooks/use-unread";
import { LEARN_BASE } from "@/data/learn";
import { DASHBOARD_URL } from "@/lib/nav-tree";
import { gate } from "@/lib/page-access";
import type { Role } from "@/types";
import { LearnNav } from "./learn-nav";
import { BookProgress, SidebarNav } from "./sidebar-nav";

// เมนูซ้ายชุดเดียวทุกหน้า (ภาพรวม กระดานงาน 7 ขั้น การ์ด บทเดิม ฯลฯ) โครงไม่เปลี่ยนตามหน้า เปลี่ยนแค่แถบที่ไฮไลต์
// เดิมแต่ละหมวดหน้ามีเมนูของตัวเอง กดไปบทเดิมแล้วเมนู 7 ขั้นหายทั้งชุด น้องสับสนว่าอยู่ที่ไหน
// ใช้ทั้ง sidebar จอกว้าง (site-sidebar.tsx) และลิ้นชักมือถือ
// 6 ช่องที่ตำแหน่งคงที่: ช่อง 3 และ 6 ขึ้นกับ role (น้อง = กระดานงาน/โปรไฟล์ · พี่เลี้ยง = หลังบ้าน/โปรไฟล์)
// น้องกับพี่เลี้ยงจึงมี 5 แถวเท่ากัน · ตอนโหลดหน้ายังไม่รู้ role ช่องเหล่านี้เป็นแถบจองที่สูงเท่ากัน เมนูไม่ขยับตอนรู้ role
type Item = { href: string; label: string; icon: LucideIcon };
type Slot = Item | ((role: Role | null) => Item | null);
const MY_WORK: Slot[] = [
  { href: DASHBOARD_URL, label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/feed", label: "งานและประกาศ", icon: Newspaper },
  (r) => (r === "intern" ? { href: "/work", label: "กระดานงาน", icon: ClipboardList } : r === "dev" ? { href: "/dev/admin", label: "หลังบ้านพี่เลี้ยง", icon: Settings } : null),
  { href: "/starter", label: "โจทย์ฝึกงาน", icon: FolderKanban },
  { href: "/questions", label: "ข้อความถึงพี่เลี้ยง", icon: MessageCircle },
  (r) => (r ? { href: "/profile", label: "โปรไฟล์", icon: UserRound } : null),
];

// หน้าที่อยู่นอกหมวด "งานของฉัน" และ "เรียนรู้" = บทเดิม/อ้างอิง (บท 00–23, ศัพท์, cheat sheet, มีอะไรใหม่)
const APP_PATHS = [DASHBOARD_URL, "/feed", "/work", "/starter", "/questions", "/profile", "/dev", LEARN_BASE];
export const isReferencePage = (pathname: string) => pathname !== "/" && !APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function SiteNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role } = useSession();
  const known = useRoleKnown();
  const unread = useUnread();
  const reference = isReferencePage(pathname);
  const root = useRef<HTMLDivElement>(null);
  // เลื่อนเมนูให้หน้าที่เปิดอยู่โผล่มาให้เห็น (การ์ดในขั้นที่กางยาว หรือบทเดิมในกลุ่มอ้างอิงล่างสุด) · เห็นอยู่แล้วไม่ขยับ
  // เลื่อนกล่องเมนูเองแทน scrollIntoView: Chrome ย้ายจุดเริ่มกด Tab ไปที่ลิงก์ที่ scrollIntoView
  // กด Tab ครั้งแรกจึงข้ามลิงก์ "ข้ามไปเนื้อหา" กับแถบด้านบนไปทั้งหมด
  useEffect(() => {
    const reveal = () => {
      const el = [...(root.current?.querySelectorAll<HTMLElement>('[aria-current="page"]') ?? [])].at(-1); // ตัวที่ลึกสุด (การ์ด/บท) ไม่ใช่หัวกลุ่ม
      let box = el?.parentElement ?? null;
      while (box && !(box.scrollHeight > box.clientHeight && /(auto|scroll)/.test(getComputedStyle(box).overflowY))) box = box.parentElement;
      if (!el || !box) return;
      const e = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      if (e.top < b.top) box.scrollTop -= b.top - e.top + 16;
      else if (e.bottom > b.bottom) box.scrollTop += e.bottom - b.bottom + 16;
    };
    reveal();
    // รายการการ์ดและบทเดิมโหลดตามมาทีหลัง (catalog, ความคืบหน้า) ตำแหน่งจึงขยับ: ดูการเปลี่ยนแปลงช่วงสั้นๆ แล้วเลื่อนตาม
    // หยุดดูหลัง 2 วินาที ไม่ไปแย่งตอนน้องเลื่อนเมนูเอง
    const watch = new MutationObserver(reveal);
    if (root.current) watch.observe(root.current, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-current", "open"] });
    const stop = setTimeout(() => watch.disconnect(), 2000);
    // ลิ้นชักมือถือเลื่อนเข้ามาจากขอบ ระหว่างนั้นวัดตำแหน่งได้ไม่ตรง: วัดซ้ำอีกครั้งหลังเลื่อนเสร็จ
    const again = setTimeout(reveal, 400);
    return () => {
      watch.disconnect();
      clearTimeout(stop);
      clearTimeout(again);
    };
  }, [pathname]);

  return (
    <div ref={root} className="flex flex-col gap-5 pb-6">
      <Group title="งานของฉัน">
        <nav aria-label="งานของฉัน" className="flex flex-col gap-0.5 text-sm">
          {MY_WORK.map((slot, n) => {
            if (typeof slot === "function" && !known) return <span key={n} aria-hidden className="mx-2.5 my-[11px] block h-[22px] animate-pulse rounded bg-fd-muted" />;
            const i = typeof slot === "function" ? slot(role) : slot;
            if (!i) return null;
            const active = isActive(pathname, i.href);
            const locked = gate(i.href, role) === "login";
            return (
              <Link
                key={i.href}
                href={i.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 hover:bg-fd-accent ${active ? "bg-fd-muted font-semibold text-fd-foreground shadow-[inset_3px_0_0_var(--color-fd-primary)]" : ""}`}
              >
                <i.icon className="size-4.5 shrink-0 text-fd-primary" aria-hidden />
                <span className="min-w-0 flex-1">{i.label}</span>
                {locked && <Lock className="size-3.5 text-fd-muted-foreground" aria-label="ต้อง login" />}
                {i.href === "/questions" && unread > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white tabular-nums" aria-label={`ข้อความใหม่ ${unread} เรื่อง`}>
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </Group>

      <Group title="เรียนรู้">
        <LearnNav onNavigate={onNavigate} />
      </Group>

      {/* บทเดิมพับไว้ (เนื้อหาเสริม) · อยู่หน้าบทเดิมแล้วกางเองและไฮไลต์บทนั้น เมนูส่วนอื่นยังอยู่ที่เดิม */}
      <details key={reference ? "ref-open" : "ref-closed"} open={reference} className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 text-sm hover:bg-fd-accent [&::-webkit-details-marker]:hidden">
          <BookOpen className="size-4.5 shrink-0 text-fd-primary" aria-hidden />
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className={reference ? "font-semibold" : ""}>อ้างอิง: บทเรียนฉบับเต็ม</span>
            <span className="text-[13px] text-fd-muted-foreground">บทเดิม 00–23 · ศัพท์ · cheat sheet</span>
          </span>
          <ChevronRight className="size-3.5 shrink-0 text-fd-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
        </summary>
        <div className="mt-2 flex flex-col gap-3">
          <BookProgress />
          <SidebarNav onNavigate={onNavigate} />
        </div>
      </details>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="px-2.5 text-xs font-semibold tracking-wide text-fd-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
