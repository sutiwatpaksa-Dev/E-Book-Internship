"use client";

import {
  AppWindow,
  BookA,
  BookOpen,
  Check,
  ChevronRight,
  CodeXml,
  Database,
  FileText,
  Flag,
  FolderTree,
  History,
  House,
  Lock,
  Rocket,
  ShieldCheck,
  SquareCode,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { requiredLinks } from "@/data/roadmap";
import { useProgress } from "@/hooks/use-progress";
import { useSession } from "@/hooks/use-session";
import { stageOf, type NavItem, type NavStage } from "@/lib/nav-tree";
import { gate } from "@/lib/page-access";
import { useSite } from "./nav-provider";

// ไอคอนประจำด่าน (เรียงตามด่าน 1–7) และของหน้าเสริม/อ้างอิง ถ้าเพิ่มด่านหรือหน้าใหม่แล้วไม่มีในนี้ จะได้ไอคอนหนังสือ
const STAGE_ICONS: LucideIcon[] = [Wrench, CodeXml, Database, ShieldCheck, AppWindow, Flag, Rocket];
const PAGE_ICONS: Record<string, LucideIcon> = {
  "/react-language": SquareCode,
  "/project-structure": FolderTree,
  "/glossary": BookA,
  "/cheat-sheet": FileText,
  "/changelog": History,
};
const required = new Set(requiredLinks);

// แถบความคืบหน้าทั้งเล่ม (นับเฉพาะบทหลัก เหมือนหน้าแรก)
export function BookProgress() {
  const { done } = useProgress();
  const count = requiredLinks.filter((l) => done.has(l)).length;
  const percent = Math.round((count / requiredLinks.length) * 100);
  return (
    <div className="flex flex-col gap-1.5 px-1">
      <div className="flex justify-between text-xs text-fd-muted-foreground">
        <span>ความคืบหน้าทั้งเล่ม</span>
        <span className="tabular-nums">
          {count} / {requiredLinks.length} บท
        </span>
      </div>
      <div role="progressbar" aria-label="ความคืบหน้าทั้งเล่ม" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-fd-muted">
        <div className="h-full rounded-full bg-fd-primary transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// สารบัญบทเรียน: ด่านพับได้ + บทเสริม + อ้างอิง (ใช้ทั้ง sidebar จอกว้าง และลิ้นชักมือถือ)
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { nav } = useSite();
  const pathname = usePathname();
  const activeStage = stageOf(nav, pathname)?.id;
  // เริ่มต้นกางเฉพาะด่านของหน้าที่เปิดอยู่ ที่เหลือพับไว้ให้เห็นภาพรวมทั้งเล่ม
  const [open, setOpen] = useState<Record<string, boolean>>(() => (activeStage ? { [activeStage]: true } : {}));

  // เปิดบทที่อยู่ในด่านที่พับไว้ (เช่นกดลิงก์ในเนื้อหา): กางด่านนั้นให้เห็นว่าอยู่ตรงไหน
  useEffect(() => {
    if (activeStage) setOpen((o) => (o[activeStage] ? o : { ...o, [activeStage]: true }));
  }, [activeStage]);

  return (
    <nav aria-label="บทเรียน" className="flex flex-col gap-0.5 text-sm">
      {nav.stages.map((stage, i) => (
        <Stage
          key={stage.id}
          stage={stage}
          icon={STAGE_ICONS[i] ?? BookOpen}
          open={!!open[stage.id]}
          active={stage.id === activeStage}
          pathname={pathname}
          onToggle={() => setOpen((o) => ({ ...o, [stage.id]: !o[stage.id] }))}
          onNavigate={onNavigate}
        />
      ))}

      <div className="mx-2 my-2.5 h-px bg-fd-border" />
      <GroupLinks title="บทเสริม" items={nav.extras} pathname={pathname} onNavigate={onNavigate} />
      <GroupLinks title="อ้างอิง" items={nav.refs} pathname={pathname} onNavigate={onNavigate} />
    </nav>
  );
}

export function HomeLink({ onNavigate }: { onNavigate?: () => void }) {
  const { nav } = useSite();
  const pathname = usePathname();
  if (!nav.home) return null;
  const active = pathname === nav.home.url;
  return (
    <Link
      href={nav.home.url}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium hover:bg-fd-accent ${active ? "bg-fd-primary/10 text-fd-primary" : ""}`}
    >
      <House className="size-4.5 text-fd-primary" />
      {nav.home.title}
    </Link>
  );
}

type StageProps = {
  stage: NavStage;
  icon: LucideIcon;
  open: boolean;
  active: boolean;
  pathname: string;
  onToggle: () => void;
  onNavigate?: () => void;
};

function Stage({ stage, icon: Icon, open, active, pathname, onToggle, onNavigate }: StageProps) {
  const { role } = useSession();
  const { done } = useProgress();
  const locked = gate(stage.items[0]?.url ?? "/", role) !== "allow";
  const tracked = stage.items.filter((i) => required.has(i.url));
  const doneCount = tracked.filter((i) => done.has(i.url)).length;
  const complete = tracked.length > 0 && doneCount === tracked.length;
  const panelId = `${stage.id}-items`;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left hover:bg-fd-accent"
      >
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-md border ${
            active ? "border-fd-primary bg-fd-primary text-fd-primary-foreground" : complete ? "border-transparent bg-fd-primary/10 text-fd-primary" : "border-fd-border bg-fd-background text-fd-primary"
          }`}
        >
          <Icon className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-[11px] text-fd-muted-foreground">{stage.kicker}</span>
          <span className="font-semibold">{stage.name}</span>
        </span>
        {locked && <Lock aria-label="ต้อง login" className="size-3.5 shrink-0 text-fd-muted-foreground" />}
        {!locked && tracked.length > 0 && (
          <span className={`text-xs font-medium tabular-nums ${complete ? "text-fd-primary" : "text-fd-muted-foreground"}`}>
            {doneCount}/{tracked.length}
          </span>
        )}
        <ChevronRight className={`size-3.5 shrink-0 text-fd-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div id={panelId} className="mt-0.5 mb-2 ms-5.5 flex flex-col gap-px border-s border-fd-border ps-3">
          {stage.items.map((item) => (
            <Chapter key={item.url} item={item} active={item.url === pathname} done={required.has(item.url) && done.has(item.url)} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chapter({ item, active, done, onNavigate }: { item: NavItem; active: boolean; done: boolean; onNavigate?: () => void }) {
  // ป้ายเลขบท 3 สถานะ: ผ่านแล้ว (ทึบ ✓) · กำลังเปิด (ขอบสี) · ยังไม่ได้อ่าน (ขอบเทา)
  const badge = done
    ? "border-fd-primary bg-fd-primary text-fd-primary-foreground"
    : active
      ? "border-fd-primary bg-fd-background text-fd-primary"
      : "border-fd-border text-fd-muted-foreground";
  return (
    <Link
      href={item.url}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-9 items-center gap-2.5 rounded-md px-2 py-1 hover:bg-fd-accent ${active ? "bg-fd-primary/10 font-semibold text-fd-primary" : ""}`}
    >
      <span className={`flex h-5.5 min-w-6.5 shrink-0 items-center justify-center rounded-md border px-1 text-[11px] font-semibold tabular-nums ${badge}`}>
        {done ? <Check aria-label="ผ่านแล้ว" className="size-3" strokeWidth={3} /> : item.num}
      </span>
      <span className="min-w-0 flex-1 leading-snug">{item.title}</span>
    </Link>
  );
}

function GroupLinks({ title, items, pathname, onNavigate }: { title: string; items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  if (items.length === 0) return null;
  return (
    <>
      <div className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-fd-muted-foreground">{title}</div>
      {items.map((item) => {
        const Icon = PAGE_ICONS[item.url] ?? BookOpen;
        const active = item.url === pathname;
        return (
          <Link
            key={item.url}
            href={item.url}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-9 items-center gap-2.5 rounded-md px-2 py-1 hover:bg-fd-accent ${active ? "bg-fd-primary/10 font-semibold text-fd-primary" : ""}`}
          >
            <Icon className="size-4 shrink-0 text-fd-muted-foreground" />
            {item.title}
          </Link>
        );
      })}
    </>
  );
}
