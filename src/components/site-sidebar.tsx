"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { LEARN_BASE } from "@/data/learn";
import { useNavDrawer } from "@/hooks/use-nav-drawer";
import { LearnNav } from "./learn-nav";
import { MobileDrawer } from "./mobile-drawer";
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

// ลิ้นชักเมนูบนมือถือ เปิดจากปุ่ม ☰ ใน headbar เลือกบทแล้วปิดเอง (โครงลิ้นชักอยู่ใน mobile-drawer.tsx ใช้ร่วมกับหลังบ้าน)
function NavDrawer() {
  const { setOpen } = useNavDrawer();
  const { version } = useSite();
  const pathname = usePathname();
  const learn = useInLearn();
  useEffect(() => setOpen(false), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => setOpen(false);

  return (
    <MobileDrawer title="สารบัญ" footer={<span>v{version}</span>}>
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
    </MobileDrawer>
  );
}
