"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { stepBySlug, stepOfUrl } from "@/data/learn";
import { useNavDrawer } from "@/hooks/use-nav-drawer";
import { sectionOf, stageOf, TODAY_URL } from "@/lib/nav-tree";
import { AccountMenu } from "./account-menu";
import { BrandMark } from "./brand-mark";
import { useSite } from "./nav-provider";
import { SectionLinks } from "./section-links";

const iconButton = "flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-fd-accent";

// แถบบนสุดทุกหน้า: โลโก้ · เมนูหลัก 4 หมวด · ค้นหา · โหมดมืด · บัญชี
// ความสูงมาจากตัวแปร --site-header-h ใน global.css ซึ่ง Fumadocs ใช้ต่อ (sidebar/สารบัญขวาติดอยู่ใต้แถบนี้พอดี)
// menu=false: หน้าที่ไม่มี sidebar (เช่น /today) ไม่ต้องมีปุ่ม ☰ ใช้แถบล่างแทน
export function SiteHeader({ menu = true }: { menu?: boolean }) {
  const { version } = useSite();
  const { open, setOpen } = useNavDrawer();

  return (
    <header className="sticky top-0 z-40 flex h-(--site-header-h) flex-col border-b border-fd-border bg-fd-background/95 backdrop-blur-sm">
      <div className="flex min-h-0 flex-1 items-center gap-1 px-2 sm:gap-3 md:px-4">
        {menu && (
          <button type="button" onClick={() => setOpen(true)} aria-label="เปิดเมนูบทเรียน" aria-expanded={open} className={`${iconButton} md:hidden`}>
            <Menu className="size-5.5" />
          </button>
        )}

        <Link href={TODAY_URL} className="flex min-h-11 items-center gap-2.5 me-1">
          <BrandMark size={30} />
          <span className="flex flex-col leading-tight">
            <span className="font-bold">คู่มือฝึกงาน</span>
            <span className="text-[11px] text-fd-muted-foreground max-sm:hidden">Blicktech · Full-stack</span>
          </span>
        </Link>
        <Link href="/changelog" title="มีอะไรใหม่" className="rounded-full bg-fd-primary/10 px-2 py-0.5 text-[11px] font-semibold text-fd-primary hover:bg-fd-primary/15 max-sm:hidden">
          v{version}
        </Link>

        <nav aria-label="เมนูหลัก" className="ms-2 flex items-center gap-0.5 max-lg:hidden">
          <SectionLinks variant="bar" />
        </nav>

        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          <SearchButton />
          <ThemeSwitch className="max-md:hidden" />
          <AccountMenu />
        </div>
      </div>
      <WhereAmI />
    </header>
  );
}

// ปุ่มค้นหา: เปิดหน้าต่างค้นหาของ Fumadocs (กด ⌘K / Ctrl+K ได้จากทุกหน้า)
function SearchButton() {
  const { enabled, setOpenSearch, hotKey } = useSearchContext();
  if (!enabled) return null;
  return (
    <>
      <button type="button" onClick={() => setOpenSearch(true)} aria-label="ค้นหา" className={`${iconButton} md:hidden`}>
        <Search className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => setOpenSearch(true)}
        className="flex h-10 w-56 items-center gap-2 rounded-lg border border-fd-border bg-fd-secondary/50 px-3 text-left text-sm text-fd-muted-foreground hover:bg-fd-accent max-md:hidden xl:w-64"
      >
        <Search className="size-4" />
        <span className="flex-1">ค้นหาในคู่มือ</span>
        <span className="flex gap-0.5">
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

// แถบเล็กใต้ headbar บนมือถือ: บอกว่าอยู่ด่านไหน บทที่เท่าไร (จอกว้างดูจาก sidebar ได้อยู่แล้ว)
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
        : section === "today"
        ? "วันนี้"
        : nav.refs.some((r) => r.url === pathname)
          ? "อ้างอิง"
          : section === "cards"
            ? "คลังการ์ด"
            : "คู่มือฝึกงาน";
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
