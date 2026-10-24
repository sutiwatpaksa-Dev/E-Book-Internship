"use client";

import { FolderKanban, LayoutGrid, Lock, MessageCircle, Route, Sun, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useUnread } from "@/hooks/use-unread";
import { gate } from "@/lib/page-access";
import { CARDS_URL, sectionOf, TODAY_URL, type NavSection } from "@/lib/nav-tree";
import { useSite } from "./nav-provider";

// เมนูหลัก 4 หมวด ใช้ทั้งบน headbar (จอกว้าง) ลิ้นชักมือถือ และแถบล่างมือถือ
// ไฮไลต์ตามหมวดของหน้าที่เปิดอยู่ เช่น เปิดการ์ด Migration → "คลังการ์ด" ติดสี
const SECTIONS: { id: NavSection; label: string; short: string; href: string; icon: LucideIcon }[] = [
  { id: "today", label: "วันนี้", short: "วันนี้", href: TODAY_URL, icon: Sun },
  { id: "path", label: "เส้นทาง 7 ขั้น", short: "เส้นทาง", href: "/learn", icon: Route },
  { id: "cards", label: "คลังการ์ด", short: "การ์ด", href: CARDS_URL, icon: LayoutGrid },
  { id: "project", label: "โปรเจกต์ STARTER", short: "โปรเจกต์", href: "/starter", icon: FolderKanban },
];

function useSections() {
  const { nav } = useSite();
  const pathname = usePathname();
  const { role } = useSession();
  const active = sectionOf(nav, pathname);
  return SECTIONS.map((s) => ({ ...s, active: s.id === active, locked: gate(s.href, role) !== "allow" }));
}

export function SectionLinks({ variant }: { variant: "bar" | "pills" }) {
  const sections = useSections();
  const look =
    variant === "bar"
      ? { base: "h-10 rounded-lg px-3", on: "bg-fd-primary/10 font-semibold text-fd-primary", off: "font-medium hover:bg-fd-accent hover:text-fd-primary" }
      : { base: "h-8 rounded-full border px-3", on: "border-fd-primary bg-fd-primary font-semibold text-fd-primary-foreground", off: "border-fd-border font-medium hover:bg-fd-accent" };

  return sections.map((s) => (
    <Link
      key={s.id}
      href={s.href}
      aria-current={s.active ? "page" : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap transition-colors ${look.base} ${s.active ? look.on : look.off}`}
    >
      {s.label}
      {s.locked && <Lock aria-label="ต้อง login" className="size-3.5" />}
    </Link>
  ));
}

// แถบล่างบนมือถือ: เมนูหลักอยู่ในระยะนิ้วโป้ง + ปุ่ม "ถาม" ที่ใช้บ่อยตอนติด
// จอกว้างซ่อน (มีเมนูบน headbar แล้ว) · หน้าเว็บต้องเว้นที่ด้านล่างให้ด้วย <BottomNavSpacer />
export function BottomNav() {
  const sections = useSections();
  const pathname = usePathname();
  const unread = useUnread();
  const asking = pathname.startsWith("/questions");
  const tab = "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium";

  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-fd-border bg-fd-background/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
    >
      {sections.map((s) => (
        <Link key={s.id} href={s.href} aria-current={s.active ? "page" : undefined} className={`${tab} ${s.active ? "text-fd-primary" : "text-fd-muted-foreground"}`}>
          <s.icon className="size-5.5" strokeWidth={s.active ? 2.4 : 2} aria-hidden />
          {s.short}
        </Link>
      ))}
      <Link href="/questions" aria-current={asking ? "page" : undefined} className={`${tab} ${asking ? "text-fd-primary" : "text-fd-muted-foreground"}`}>
        <MessageCircle className="size-5.5" strokeWidth={asking ? 2.4 : 2} aria-hidden />
        ถาม
        {/* จุดเดียวกับป้ายบนเมนูบัญชี */}
        {unread > 0 && <span aria-label={`ข้อความใหม่ ${unread} เรื่อง`} className="absolute top-2 left-1/2 ms-1.5 size-3 rounded-full border-2 border-fd-background bg-orange-500" />}
      </Link>
    </nav>
  );
}

export function BottomNavSpacer() {
  return <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))] shrink-0 md:hidden" />;
}

