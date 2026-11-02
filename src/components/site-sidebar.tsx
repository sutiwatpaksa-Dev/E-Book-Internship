"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useNavDrawer } from "@/hooks/use-nav-drawer";
import { MobileDrawer } from "./mobile-drawer";
import { useSite } from "./nav-provider";
import { SiteNav } from "./site-nav";

// แทน sidebar เดิมของ Fumadocs (ช่อง slots.sidebar.root) วางในคอลัมน์ซ้ายของ grid ที่ Fumadocs จัดไว้
// id="nd-sidebar" คงไว้ เพราะแผง Requirement ใช้วัดความกว้างของแถบซ้าย
export function SiteSidebar() {
  return (
    <>
      <div className="sticky top-(--fd-docs-row-1) z-20 h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] [grid-area:sidebar] max-md:hidden">
        <aside id="nd-sidebar" aria-label="เมนูข้าง" className="absolute inset-y-0 start-0 flex w-full flex-col items-end border-e border-fd-border bg-fd-card">
          <div className="flex h-full w-(--fd-sidebar-width) flex-col overflow-y-auto overscroll-contain">
            <div className="px-3 pt-4 pb-6">
              <SiteNav />
            </div>
          </div>
        </aside>
      </div>
      <NavDrawer />
    </>
  );
}

// ลิ้นชักเมนูบนมือถือ เปิดจากปุ่ม ☰ ใน headbar เลือกบทแล้วปิดเอง (โครงลิ้นชักอยู่ใน mobile-drawer.tsx ใช้ร่วมกับหลังบ้าน)
function NavDrawer() {
  const { setOpen } = useNavDrawer();
  const { version } = useSite();
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => setOpen(false);

  return (
    <MobileDrawer title="สารบัญ" footer={<span>v{version}</span>}>
      <SiteNav onNavigate={close} />
    </MobileDrawer>
  );
}
