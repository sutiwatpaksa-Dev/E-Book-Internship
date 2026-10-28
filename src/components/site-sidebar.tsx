"use client";

import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LEARN_BASE } from "@/data/learn";
import { useNavDrawer } from "@/hooks/use-nav-drawer";
import { LearnNav } from "./learn-nav";
import { useSite } from "./nav-provider";
import { SectionLinks } from "./section-links";
import { BookProgress, HomeLink, SidebarNav } from "./sidebar-nav";

// แทน sidebar เดิมของ Fumadocs (ช่อง slots.sidebar.root) วางในคอลัมน์ซ้ายของ grid ที่ Fumadocs จัดไว้
// id="nd-sidebar" คงไว้ เพราะแผง Requirement ใช้วัดความกว้างของแถบซ้าย
export function SiteSidebar() {
  const learn = useInLearn();
  return (
    <>
      <div className="sticky top-(--fd-docs-row-1) z-20 h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] [grid-area:sidebar] max-md:hidden">
        <aside id="nd-sidebar" aria-label="สารบัญคู่มือ" className="absolute inset-y-0 start-0 flex w-full flex-col items-end border-e border-fd-border bg-fd-card">
          <div className="flex h-full w-(--fd-sidebar-width) flex-col overflow-y-auto overscroll-contain">
            {learn ? (
              <div className="px-3 pt-4 pb-6">
                <LearnNav />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 px-3 pt-4 pb-1">
                  <HomeLink />
                  <BookProgress />
                </div>
                <div className="px-3 pt-2 pb-6">
                  <SidebarNav />
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
      <NavDrawer />
    </>
  );
}

// หน้าในโครงใหม่ 7 ขั้น (/learn) และหน้าของแอปที่ไม่ใช่บทเรียน (โปรไฟล์ ถามพี่เลี้ยง โปรเจกต์ STARTER) ใช้ sidebar 7 ขั้น
// ที่เหลือ (บทเดิม 00–23) ใช้สารบัญบทเรียนเดิม · เดิมหน้าแอปได้สารบัญเดิม น้องเห็น "0 / 28 บท" แล้วนึกว่าการ์ดที่ผ่านไม่ถูกบันทึก
const NEW_NAV = [LEARN_BASE, "/profile", "/questions", "/starter"];
function useInLearn() {
  const pathname = usePathname();
  return NEW_NAV.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// ลิ้นชักเมนูบนมือถือ เปิดจากปุ่ม ☰ ใน headbar เลือกบทแล้วปิดเอง
function NavDrawer() {
  const { open, setOpen } = useNavDrawer();
  const { version } = useSite();
  const pathname = usePathname();
  const learn = useInLearn();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ระหว่างเปิด: กด Esc ปิดได้, ล็อกการเลื่อนหน้าข้างหลัง, ย้ายโฟกัสไปปุ่มปิด (คนใช้คีย์บอร์ดไม่หลง)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  const close = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div role="dialog" aria-modal="true" aria-label="สารบัญ" className="flex h-full w-[86%] max-w-[340px] flex-col bg-fd-background shadow-xl animate-fd-fade-in">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-fd-border px-4">
          <span className="font-semibold">สารบัญ</span>
          <button ref={closeRef} type="button" onClick={close} aria-label="ปิดเมนู" className="flex size-10 items-center justify-center rounded-lg hover:bg-fd-accent">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-4">
          <div className="flex flex-wrap gap-1.5 pb-3">
            <SectionLinks variant="pills" />
          </div>
          {learn ? (
            <LearnNav onNavigate={close} />
          ) : (
            <>
              <div className="mb-3">
                <BookProgress />
              </div>
              <SidebarNav onNavigate={close} />
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-fd-border px-4 py-2.5 text-xs text-fd-muted-foreground">
          <span>v{version}</span>
          <ThemeSwitch />
        </div>
      </div>
      <button type="button" aria-label="ปิดเมนู" tabIndex={-1} onClick={close} className="flex-1 bg-black/40 backdrop-blur-xs" />
    </div>
  );
}
