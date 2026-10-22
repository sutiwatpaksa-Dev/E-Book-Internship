"use client";

import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useNavDrawer } from "@/hooks/use-nav-drawer";
import { useSite } from "./nav-provider";
import { SectionLinks } from "./section-links";
import { BookProgress, HomeLink, SidebarNav } from "./sidebar-nav";

// แทน sidebar เดิมของ Fumadocs (ช่อง slots.sidebar.root) วางในคอลัมน์ซ้ายของ grid ที่ Fumadocs จัดไว้
// id="nd-sidebar" คงไว้ เพราะแผง Requirement ใช้วัดความกว้างของแถบซ้าย
export function SiteSidebar() {
  return (
    <>
      <div className="sticky top-(--fd-docs-row-1) z-20 h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] [grid-area:sidebar] max-md:hidden">
        <aside id="nd-sidebar" aria-label="สารบัญคู่มือ" className="absolute inset-y-0 start-0 flex w-full flex-col items-end border-e border-fd-border bg-fd-card">
          <div className="flex h-full w-(--fd-sidebar-width) flex-col overflow-y-auto overscroll-contain">
            <div className="flex flex-col gap-3 px-3 pt-4 pb-1">
              <HomeLink />
              <BookProgress />
            </div>
            <div className="px-3 pt-2 pb-6">
              <SidebarNav />
            </div>
          </div>
        </aside>
      </div>
      <NavDrawer />
    </>
  );
}

// ลิ้นชักเมนูบนมือถือ เปิดจากปุ่ม ☰ ใน headbar เลือกบทแล้วปิดเอง
function NavDrawer() {
  const { open, setOpen } = useNavDrawer();
  const { version } = useSite();
  const pathname = usePathname();
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
          <div className="mb-3">
            <BookProgress />
          </div>
          <SidebarNav onNavigate={close} />
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
