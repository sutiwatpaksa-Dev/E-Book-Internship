"use client";

import { ChevronDown, FileText, LogIn, LogOut, MessageCircle, Package, Settings, UserRound, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { authApi } from "@/api/auth.api";
import { filesApi, REQUIREMENT_PDF_URL } from "@/api/files.api";
import { useSession } from "@/hooks/use-session";
import { useUnread } from "@/hooks/use-unread";
import { DevSwitchMenu } from "./dev-switch-menu";
import { PING_EVERY_MS } from "@/lib/presence";
import { playChime, setSoundOn, soundOn, subscribeSound } from "@/lib/chime";

export const ROLE_LABEL = { intern: "ฝึกงาน", dev: "พี่เลี้ยง" } as const;
export const ROLE_BADGE = {
  intern: "bg-fd-primary/10 text-fd-primary",
  dev: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
} as const;

const itemClass = "flex min-h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm hover:bg-fd-accent";

// บัญชีมุมขวาบน: ยังไม่ login = ปุ่มเข้าสู่ระบบ · login แล้ว = กดชื่อเพื่อเปิดเมนู
export function AccountMenu() {
  const { role, logout } = useSession();
  const unread = useUnread();
  const [username, setUsername] = useState<string | null>(null);
  const [exampleRepo, setExampleRepo] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const boxRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!role) return;
    authApi
      .me()
      .then((me) => {
        setUsername(me.username);
        // หน้าคู่มือเป็นไฟล์ static (server ไม่ได้ตรวจบัตรก่อนส่ง) จึงกันตรงนี้: ยังถือ PIN ชั่วคราว → ไปตั้งรหัสผ่าน
        if (me.mustSetPassword && location.pathname !== "/set-password") location.assign(`/set-password?next=${encodeURIComponent(location.pathname)}`);
      })
      // บัตรหมดอายุแต่ cookie บอก role ยังค้าง: ถือว่ายังไม่ได้ login
      .catch(() => logout());
    filesApi
      .links()
      .then((r) => setExampleRepo(r.exampleRepo))
      .catch(() => {});
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  // บอก server ทุกนาทีว่ายังเปิดหน้าเว็บอยู่ (เฉพาะตอนแท็บมองเห็น) ให้พี่เลี้ยงเห็นสถานะออนไลน์
  useEffect(() => {
    if (!role) return;
    const ping = () => document.visibilityState === "visible" && authApi.ping().catch(() => {});
    ping();
    const timer = setInterval(ping, PING_EVERY_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [role]);

  // ปิดเมนูเมื่อเปลี่ยนหน้า, กด Esc หรือคลิกนอกเมนู
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: PointerEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onClick);
    };
  }, [open]);

  // role มาจาก cookie hint ซึ่ง server ไม่เห็น: ก่อน mount ยังไม่รู้ว่า login อยู่ไหม ให้โชว์โครงวงกลมแทน (ไม่งั้นกระพริบเป็นปุ่ม "เข้าสู่ระบบ")
  if (!mounted) return <span aria-hidden className="size-11 animate-pulse rounded-full bg-fd-muted" />;

  if (!role) {
    return (
      <Link
        href="/login"
        aria-label="เข้าสู่ระบบ"
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-fd-primary px-3 text-sm font-medium text-fd-primary-foreground hover:brightness-110 sm:px-3.5"
      >
        <LogIn className="size-4" />
        <span className="max-sm:hidden">เข้าสู่ระบบ</span>
      </Link>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`บัญชี ${username ?? ""}`}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 items-center gap-2 rounded-full border border-fd-border bg-fd-background p-1.5 hover:bg-fd-accent sm:pe-2.5"
      >
        <span className="relative flex size-8 items-center justify-center rounded-full bg-fd-primary/10 text-sm font-bold text-fd-primary">
          {username?.[0]?.toUpperCase() ?? "·"}
          {/* จุดส้ม = มีข้อความใหม่ในแชทกับพี่เลี้ยง (พี่เลี้ยง: น้องพิมพ์มา) */}
          {unread > 0 && <span role="img" title={`มีข้อความใหม่ ${unread} เรื่อง`} aria-label={`ข้อความใหม่ ${unread} เรื่อง`} className="absolute -end-0.5 -top-0.5 size-3 rounded-full border-2 border-fd-background bg-orange-500" />}
        </span>
        <span className="max-w-28 truncate text-sm font-medium max-sm:hidden">{username}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold max-sm:hidden ${ROLE_BADGE[role]}`}>{ROLE_LABEL[role]}</span>
        <ChevronDown className="size-3.5 text-fd-muted-foreground max-sm:hidden" />
      </button>

      {open && (
        <div role="menu" className="absolute end-0 top-12 z-50 flex w-60 flex-col gap-0.5 rounded-xl border border-fd-border bg-fd-popover p-1.5 text-fd-popover-foreground shadow-lg">
          <div className="px-2.5 py-1.5 text-xs text-fd-muted-foreground sm:hidden">
            {username} · {ROLE_LABEL[role]}
          </div>
          {role === "dev" && (
            <Link role="menuitem" href="/dev/admin" className={itemClass}>
              <Settings className="size-4" /> หลังบ้านพี่เลี้ยง
            </Link>
          )}
          <Link role="menuitem" href="/profile" className={itemClass}>
            <UserRound className="size-4" /> โปรไฟล์ของฉัน
          </Link>
          <Link role="menuitem" href={role === "dev" ? "/dev/admin?tab=questions" : "/questions"} className={itemClass}>
            <MessageCircle className="size-4" /> {role === "dev" ? "ข้อความจากน้อง" : "ข้อความถึงพี่เลี้ยง"}
            {unread > 0 && <span className="ms-auto rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">{unread}</span>}
          </Link>
          <a role="menuitem" href={REQUIREMENT_PDF_URL} target="_blank" rel="noopener" className={itemClass}>
            <FileText className="size-4" /> เอกสาร Requirement
          </a>
          {exampleRepo && (
            <a role="menuitem" href={exampleRepo} target="_blank" rel="noopener" className={itemClass} title="โค้ดของระบบจริง ใช้ดูการวางโครงสร้าง">
              <Package className="size-4" /> ระบบตัวอย่าง
            </a>
          )}
          <SoundToggle />
          <DevSwitchMenu me={username} />
          <div className="mx-1.5 my-1 h-px bg-fd-border" />
          <button
            type="button"
            role="menuitem"
            className={`${itemClass} text-red-700 dark:text-red-400`}
            onClick={async () => {
              await logout();
              location.assign("/");
            }}
          >
            <LogOut className="size-4" /> ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}

// เปิด/ปิดเสียงแจ้งเตือน (ข้อความใหม่ ประกาศ การ์ดใหม่) · จำไว้ในเบราว์เซอร์เครื่องนี้ · เปิดแล้วเล่นให้ฟังหนึ่งครั้ง
// server render ถือว่าเปิด แล้วค่อยอ่านค่าจริงในเบราว์เซอร์ (เมนูนี้เปิดหลังกดเท่านั้น จึงไม่กระพริบ)
function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, soundOn, () => true);
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={on}
      className={itemClass}
      onClick={() => {
        setSoundOn(!on);
        if (!on) playChime(true);
      }}
    >
      {on ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />} เสียงแจ้งเตือน
      <span className={`ms-auto text-xs font-semibold ${on ? "text-fd-primary" : "text-fd-muted-foreground"}`}>{on ? "เปิด" : "ปิด"}</span>
    </button>
  );
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
