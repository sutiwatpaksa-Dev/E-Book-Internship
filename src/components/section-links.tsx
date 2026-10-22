"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { gate } from "@/lib/page-access";
import { sectionOf, type NavSection } from "@/lib/nav-tree";
import { useSite } from "./nav-provider";

// เมนูหลัก 4 หมวด ใช้ทั้งบน headbar (จอกว้าง) และในลิ้นชักมือถือ
// ไฮไลต์ตามหมวดของหน้าที่เปิดอยู่ เช่น เปิดบทที่ 8 → "บทเรียน" ติดสี
function useSections() {
  const { nav } = useSite();
  const pathname = usePathname();
  const { role } = useSession();
  const active = sectionOf(nav, pathname);
  const firstChapter = nav.stages[0]?.items[0]?.url ?? "/";

  const sections: { id: NavSection; label: string; href: string }[] = [
    { id: "roadmap", label: "Roadmap", href: nav.home?.url ?? "/" },
    { id: "learn", label: "บทเรียน", href: firstChapter },
    { id: "project", label: "Mini Project", href: "/starter" },
    { id: "ref", label: "อ้างอิง", href: nav.refs[0]?.url ?? "/" },
  ];
  return sections.map((s) => ({ ...s, active: s.id === active, locked: gate(s.href, role) !== "allow" }));
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
