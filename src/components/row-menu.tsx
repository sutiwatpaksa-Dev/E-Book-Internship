"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): เมนู ⋯ ท้ายแถว เก็บปุ่มที่ไม่ได้กดบ่อยไว้ข้างใน แถวจะได้ไม่รก
// คีย์บอร์ด: Enter เปิด · ↑↓ เลื่อน · Esc ปิดแล้วโฟกัสกลับที่ปุ่ม · คลิกข้างนอกปิด
export type RowMenuItem = { label: string; onSelect: () => void; danger?: boolean };

export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const els = [...(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const at = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === "ArrowDown") els[(at + 1) % els.length]?.focus();
    else if (e.key === "ArrowUp") els[(at - 1 + els.length) % els.length]?.focus();
    else return;
    e.preventDefault();
  };

  if (items.length === 0) return null;
  return (
    <div ref={root} className="relative z-10 inline-block" onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-11 items-center justify-center rounded-lg text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground md:size-10"
      >
        <MoreHorizontal className="size-5" />
      </button>
      {open && (
        <div role="menu" aria-label={label} className="absolute end-0 top-full z-20 mt-1 flex min-w-44 flex-col rounded-xl border border-fd-border bg-fd-popover p-1 text-sm shadow-md">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                it.onSelect();
              }}
              className={`min-h-11 rounded-lg px-3 text-start whitespace-nowrap hover:bg-fd-accent ${it.danger ? "text-red-700 dark:text-red-400" : ""}`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
