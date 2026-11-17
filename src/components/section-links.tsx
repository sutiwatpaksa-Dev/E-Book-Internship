"use client";

import { ClipboardList, LayoutDashboard, Menu, MessageCircle, Route } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRoleKnown, useSession } from "@/hooks/use-session";
import { useUnread } from "@/hooks/use-unread";
import { DASHBOARD_URL } from "@/lib/nav-tree";
import { useNavDrawer } from "@/hooks/use-nav-drawer";

// แถบล่างบนมือถือ: ของที่น้องใช้ทุกวันอยู่ในระยะนิ้วโป้ง (ภาพรวม · กระดานงาน · ถามพี่เลี้ยง) + "เมนู" เปิดเมนูเต็ม (site-nav.tsx)
// เมนูมีที่เดียวคือ sidebar/ลิ้นชัก แถบนี้เป็นแค่ทางลัด · จอกว้างซ่อน · หน้าเว็บต้องเว้นที่ด้านล่างให้ด้วย <BottomNavSpacer />
// ช่องที่ 2: น้อง = กระดานงาน (เปิดได้เฉพาะน้อง) · พี่เลี้ยง/ยังไม่ login = เส้นทาง 7 ขั้น
export function BottomNav() {
  const pathname = usePathname();
  const { role } = useSession();
  const known = useRoleKnown();
  const unread = useUnread();
  const { open, setOpen } = useNavDrawer();
  const on = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const tab = "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium";
  const tone = (active: boolean) => (active ? "text-fd-primary" : "text-fd-muted-foreground");
  const second = role === "intern" ? { href: "/work", label: "กระดานงาน", icon: ClipboardList } : { href: "/learn", label: "เส้นทาง", icon: Route };
  const links = [{ href: DASHBOARD_URL, label: "ภาพรวม", icon: LayoutDashboard }, second, { href: "/questions", label: "ถามพี่เลี้ยง", icon: MessageCircle }];

  return (
    <nav
      aria-label="ทางลัด"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-fd-border bg-fd-background/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
    >
      {links.map((l, n) => {
        // ช่อง 2 ขึ้นกับ role: ยังไม่รู้ = ช่องว่างกว้างเท่ากัน ไม่ขึ้น "เส้นทาง" แวบแล้วเปลี่ยนเป็น "กระดานงาน"
        if (n === 1 && !known) return <span key="pending" aria-hidden className={tab} />;
        const active = !open && on(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={`${tab} ${tone(active)}`}>
            <l.icon className="size-5.5" strokeWidth={active ? 2.4 : 2} aria-hidden />
            {l.label}
            {l.href === "/questions" && unread > 0 && (
              <span aria-label={`ข้อความใหม่ ${unread} เรื่อง`} className="absolute top-2 left-1/2 ms-1.5 size-3 rounded-full border-2 border-fd-background bg-amber-500" />
            )}
          </Link>
        );
      })}
      <button type="button" onClick={() => setOpen(true)} aria-expanded={open} className={`${tab} ${tone(open)}`}>
        <Menu className="size-5.5" strokeWidth={open ? 2.4 : 2} aria-hidden />
        เมนู
      </button>
    </nav>
  );
}

export function BottomNavSpacer() {
  return <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))] shrink-0 md:hidden" />;
}

