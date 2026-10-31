"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { timeAgo } from "@/lib/thread-labels";

// กระดิ่งมุมขวาบน (ข้างเมนูบัญชี): การ์ดใหม่, ประกาศ, พี่เลี้ยงตอบ, น้องถามใหม่
// ยังไม่ login ไม่แสดง · เปิดแล้วถือว่าอ่านทั้งหมด ตัวที่เพิ่งเข้ามายังเน้นสีไว้ในรอบนั้น
export function NotificationBell() {
  const n = useNotifications();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // ปิดเมื่อเปลี่ยนหน้า, กด Esc หรือคลิกนอกกล่อง (แบบเดียวกับเมนูบัญชี)
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

  if (!n.enabled) return null;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={n.unread > 0 ? `แจ้งเตือน ยังไม่อ่าน ${n.unread}` : "แจ้งเตือน"}
        onClick={() => {
          if (!open) n.open();
          setOpen((v) => !v);
        }}
        className="relative flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-fd-accent"
      >
        <Bell className="size-5" />
        {n.unread > 0 && (
          <span aria-hidden className="absolute end-0.5 top-0.5 min-w-4 rounded-full bg-orange-500 px-1 text-center text-xs leading-4 font-bold text-white">
            {n.unread > 9 ? "9+" : n.unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="แจ้งเตือน" className="absolute end-0 top-12 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-fd-border bg-fd-popover text-fd-popover-foreground shadow-lg">
          <p className="border-b border-fd-border px-4 py-2.5 text-sm font-semibold">แจ้งเตือน</p>
          {n.error && <p className="px-4 py-3 text-sm text-red-700 dark:text-red-400">{n.error}</p>}
          {n.items === null && !n.error && <p className="px-4 py-3 text-sm text-fd-muted-foreground">กำลังโหลด…</p>}
          {n.items?.length === 0 && <p className="px-4 py-6 text-center text-sm text-fd-muted-foreground">ยังไม่มีแจ้งเตือน</p>}
          {n.items && n.items.length > 0 && (
            <ul className="max-h-96 overflow-y-auto p-1.5">
              {n.items.map((x) => {
                const body = (
                  <>
                    <span className={x.readAt ? "" : "font-semibold"}>
                      {!x.readAt && <span aria-label="ใหม่" className="me-1.5 inline-block size-2 rounded-full bg-orange-500" />}
                      {x.title}
                    </span>
                    <span className="text-xs text-fd-muted-foreground">{timeAgo(x.createdAt)}</span>
                  </>
                );
                const cls = `flex min-h-12 flex-col justify-center gap-0.5 rounded-lg px-2.5 py-1.5 text-sm ${x.readAt ? "" : "bg-fd-primary/5"}`;
                return (
                  <li key={x.id}>
                    {x.link ? (
                      <Link href={x.link} className={`${cls} hover:bg-fd-accent`}>
                        {body}
                      </Link>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
