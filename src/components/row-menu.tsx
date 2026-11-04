"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): เมนู ⋯ ท้ายแถว เก็บปุ่มที่ไม่ได้กดบ่อยไว้ข้างใน แถวจะได้ไม่รก
// คีย์บอร์ด: Enter เปิด · ↑↓ เลื่อน · Esc ปิดแล้วโฟกัสกลับที่ปุ่ม · คลิกข้างนอกปิด
// ตัวเมนูเรนเดอร์ที่ document.body (portal) แล้ววางตามพิกัดปุ่ม: ถ้าอยู่ในเซลล์ตารางตรงๆ จะถูก overflow ของตารางตัด
// และถูกเซลล์ sticky ของแถวถัดไปวาดทับ (เห็นแต่กล่องเปล่า กดไม่ได้) · ที่ไม่พอด้านล่างจะพลิกขึ้นด้านบน
export type RowMenuItem = { label: string; onSelect: () => void; danger?: boolean };

const GAP = 4;
const EDGE = 8;

export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  // วัดขนาดเมนูจริงหลังเรนเดอร์ แล้ววางชิดขวาของปุ่ม · ไม่พอด้านล่างและมีที่ด้านบน = พลิกขึ้น
  const place = () => {
    if (!trigger.current || !menu.current) return;
    const t = trigger.current.getBoundingClientRect();
    const { offsetWidth: w, offsetHeight: h } = menu.current;
    const left = Math.max(EDGE, Math.min(t.right - w, window.innerWidth - w - EDGE));
    const below = t.bottom + GAP;
    const top = below + h > window.innerHeight - EDGE && t.top - GAP - h >= EDGE ? t.top - GAP - h : below;
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!menu.current?.contains(n) && !trigger.current?.contains(n)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    // เลื่อนหน้าหรือย่อขยายจอ (รวมแถบ URL ของมือถือที่หด/ขยาย) = วางตำแหน่งใหม่ตามปุ่ม ไม่ปิดเมนูทิ้งกลางคัน
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  // โฟกัสรายการแรกหลังวางตำแหน่งแล้ว (ก่อนหน้านั้นเมนูยังซ่อนอยู่ โฟกัสไม่ติด)
  useEffect(() => {
    // preventScroll: ไม่ให้การโฟกัสดันหน้าเลื่อน (เมนูเป็น fixed ไม่ต้องเลื่อนไปหา)
    if (open && pos) menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [open, pos]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const els = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const at = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Tab") {
      // เมนูอยู่ท้าย body (portal) จึงไม่อยู่ในลำดับ Tab ตามแถว: ปิดเมนู คืนโฟกัสที่ปุ่ม แล้วปล่อยให้ Tab เดินต่อจากปุ่มตามปกติ
      setOpen(false);
      trigger.current?.focus();
      return;
    }
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
    // onKeyDown อยู่ที่ราก: event ของเมนูใน portal ยังลอยขึ้นมาถึงตรงนี้ตามต้นไม้ React (ใส่ที่เมนูด้วยจะทำงานซ้ำ 2 รอบ)
    <div className="relative z-10 inline-block" onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setPos(null);
          setOpen((o) => !o);
        }}
        className="inline-flex size-11 items-center justify-center rounded-lg text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground md:size-10"
      >
        <MoreHorizontal className="size-5" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label={label}
            style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? "visible" : "hidden" }}
            className="z-50 flex min-w-44 flex-col rounded-xl border border-fd-border bg-fd-popover p-1 text-sm shadow-md"
          >
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
          </div>,
          document.body,
        )}
    </div>
  );
}
