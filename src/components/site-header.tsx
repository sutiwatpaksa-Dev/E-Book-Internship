"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { stepBySlug, stepOfUrl } from "@/data/learn";
import { sectionOf, stageOf, DASHBOARD_URL } from "@/lib/nav-tree";
import { AccountMenu } from "./account-menu";
import { MenuButton } from "./mobile-drawer";
import { NotificationBell } from "./notification-bell";
import { BrandMark } from "./brand-mark";
import { useSite } from "./nav-provider";

const iconButton = "flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-fd-accent";

// แถบบนสุดทุกหน้า: โลโก้ · ค้นหา · โหมดมืด · แจ้งเตือน · บัญชี (เมนูอยู่ใน sidebar ซ้าย)
// ความสูงมาจากตัวแปร --site-header-h ใน global.css ซึ่ง Fumadocs ใช้ต่อ (sidebar/สารบัญขวาติดอยู่ใต้แถบนี้พอดี)
// menu=false: หน้าที่ไม่มีเมนูซ้าย (ตอนนี้ทุกหน้าในคู่มือมีแล้ว เหลือไว้เผื่อหน้าพิเศษ)
export function SiteHeader({ menu = true }: { menu?: boolean }) {
  const { version } = useSite();

  return (
    <header className="sticky top-0 z-40 flex h-(--site-header-h) flex-col border-b border-fd-border bg-fd-background/95 backdrop-blur-sm">
      <div className="flex min-h-0 flex-1 items-center gap-1 px-2 sm:gap-3 md:px-4">
        {menu && <MenuButton label="เปิดเมนูบทเรียน" />}

        <Link href={DASHBOARD_URL} className="flex min-h-11 items-center gap-2.5 me-1">
          <BrandMark size={30} />
          <span className="flex flex-col leading-tight">
            <span className="font-bold whitespace-nowrap">ระบบฝึกงาน</span>
            <span className="text-xs text-fd-muted-foreground max-xl:hidden">Blicktech · Full-stack</span>
          </span>
        </Link>
        {/* พื้นที่กดสูง 44px ส่วนป้ายยังเล็กเท่าเดิม */}
        <Link href="/changelog" title="มีอะไรใหม่" aria-label={`เวอร์ชัน ${version} ดูมีอะไรใหม่`} className="group inline-flex min-h-11 items-center px-1 max-xl:hidden">
          <span className="text-xs text-fd-muted-foreground tabular-nums group-hover:text-fd-foreground group-hover:underline">v{version}</span>
        </Link>

        {/* เมนูทุกหน้าอยู่ที่ sidebar ซ้ายที่เดียว (site-nav.tsx) แถบบนเหลือแค่เครื่องมือ ไม่ซ้ำกันสองที่ */}
        <div className="flex min-w-0 flex-1 justify-center max-md:hidden">
          <SearchButton wide />
        </div>
        <div className="ms-auto flex items-center gap-1.5 sm:gap-2 md:ms-0">
          <div className="md:hidden">
            <SearchButton />
          </div>
          <ThemeSwitch className="min-h-11 px-1.5 max-md:hidden" />
          <NotificationBell />
          <AccountMenu />
        </div>
      </div>
      <WhereAmI />
    </header>
  );
}

// ปุ่มค้นหา: เปิดหน้าต่างค้นหาของ Fumadocs (กด ⌘K / Ctrl+K ได้จากทุกหน้า)
function SearchButton({ wide = false }: { wide?: boolean }) {
  const { enabled, setOpenSearch, hotKey } = useSearchContext();
  if (!enabled) return null;
  if (!wide)
    return (
      <button type="button" onClick={() => setOpenSearch(true)} aria-label="ค้นหา" className={iconButton}>
        <Search className="size-5" />
      </button>
    );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpenSearch(true)}
        className="flex h-11 w-full max-w-md items-center gap-2 rounded-lg border border-fd-border bg-fd-secondary/50 px-3 text-left text-sm text-fd-muted-foreground hover:bg-fd-accent"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate">ค้นหาในคู่มือ</span>
        <span className="flex gap-0.5 max-xl:hidden">
          {hotKey.map((k, i) => (
            <kbd key={i} className="rounded border border-fd-border bg-fd-background px-1.5 text-xs">
              {k.display}
            </kbd>
          ))}
        </span>
      </button>
    </>
  );
}

// แถบเล็กใต้ headbar บนมือถือ: บอกว่าอยู่ภาคไหน บทที่เท่าไร (จอกว้างดูจาก sidebar ได้อยู่แล้ว)
function WhereAmI() {
  const { nav } = useSite();
  const pathname = usePathname();
  const stage = stageOf(nav, pathname);
  const section = sectionOf(nav, pathname);

  // นับเฉพาะบทเรียนที่มีเลข (ไม่นับหน้าย่อยของ Mini Project)
  const chapters = nav.stages.flatMap((s) => s.items).filter((i) => i.num && sectionOf(nav, i.url) === "cards");
  const chapterIndex = chapters.findIndex((i) => i.url === pathname);
  const inStage = stage?.items.findIndex((i) => i.url === pathname) ?? -1;

  // หน้าขั้นและหน้าการ์ดบอกขั้นที่อยู่ (การ์ดนับว่าอยู่ในขั้นที่ใช้มัน)
  const step = stepOfUrl(pathname);
  const label = stage
    ? `${stage.kicker} · ${stage.name}`
    : step
      ? `ขั้น ${stepBySlug(step).num} · ${stepBySlug(step).name}`
      : section === "path"
        ? "แผนที่ 7 ขั้น"
        : section === "dashboard"
        ? "ภาพรวม"
        : nav.refs.some((r) => r.url === pathname)
          ? "อ้างอิง"
          : section === "cards"
            ? "คลังการ์ด"
            : "ระบบฝึกงาน";
  // "บทที่ 8 · 9/24" = เลขบท และลำดับในเล่ม (บทที่ 0 นับเป็นบทแรก)
  const position =
    chapterIndex >= 0
      ? `บทที่ ${Number(chapters[chapterIndex].num)} · ${chapterIndex + 1}/${chapters.length}`
      : stage && inStage >= 0
        ? `หน้า ${inStage + 1}/${stage.items.length}`
        : "";

  return (
    <div className="flex h-8 shrink-0 items-center justify-between gap-3 border-t border-fd-border bg-fd-muted/60 px-4 text-xs text-fd-muted-foreground md:hidden">
      <span className="truncate font-medium">{label}</span>
      {position && <span className="shrink-0 tabular-nums">{position}</span>}
    </div>
  );
}
