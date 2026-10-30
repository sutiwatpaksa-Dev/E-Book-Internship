"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

// ค้นหา/ไปที่ในหลังบ้าน (Ctrl/⌘ + K): หน้า น้อง รุ่น และเรื่องในแชท อยู่ในช่องเดียว
// ไม่รู้จักแท็บหรือข้อมูลเอง รับรายการ + สิ่งที่จะทำเมื่อเลือกผ่าน props (เหมือน button/field)
export type SearchItem = { id: string; group: string; label: string; hint?: string; run: () => void };

const norm = (s: string) => s.toLowerCase().normalize("NFC");
const LIMIT = 30;

export function AdminSearch({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const close = () => {
    setOpen(false);
    setQ("");
    setAt(0);
    trigger.current?.focus();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  // ทุกคำที่พิมพ์ต้องอยู่ในชื่อ คำใบ้ หรือชื่อกลุ่ม (พิมพ์ "มินท์ รุ่น" ก็เจอ)
  const shown = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return items.filter((i) => words.every((w) => norm(`${i.label} ${i.hint ?? ""} ${i.group}`).includes(w))).slice(0, LIMIT);
  }, [items, q]);
  const current = Math.min(at, Math.max(shown.length - 1, 0));

  const pick = (i: SearchItem) => {
    setOpen(false);
    setQ("");
    setAt(0);
    i.run();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return close();
    if (e.key === "ArrowDown") setAt((current + 1) % Math.max(shown.length, 1));
    else if (e.key === "ArrowUp") setAt((current - 1 + shown.length) % Math.max(shown.length, 1));
    else if (e.key === "Enter" && shown[current]) pick(shown[current]);
    else return;
    e.preventDefault();
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-fd-border bg-fd-background px-3 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent"
      >
        <Search className="size-4" />
        ค้นหา / ไปที่…
        <kbd className="ms-2 rounded border border-fd-border px-1.5 py-0.5 font-mono text-xs max-md:hidden">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div role="dialog" aria-modal="true" aria-label="ค้นหาในหลังบ้าน" onKeyDown={onKeyDown} className="flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-popover text-fd-popover-foreground shadow-lg">
            <div className="flex items-center gap-2 border-b border-fd-border px-3">
              <Search className="size-4 shrink-0 text-fd-muted-foreground" />
              <input
                ref={input}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={shown[current] ? `${listId}-${shown[current].id}` : undefined}
                aria-label="พิมพ์ชื่อหน้า น้อง รุ่น หรือเรื่อง"
                value={q}
                onChange={(e) => (setQ(e.target.value), setAt(0))}
                placeholder="พิมพ์ชื่อหน้า น้อง รุ่น หรือเรื่องในแชท"
                className="min-h-12 w-full bg-transparent text-sm outline-none placeholder:text-fd-muted-foreground"
              />
            </div>
            <ul id={listId} role="listbox" className="overflow-y-auto p-2">
              {shown.map((i, n) => (
                <li key={i.id} id={`${listId}-${i.id}`} role="option" aria-selected={n === current}>
                  {(n === 0 || shown[n - 1].group !== i.group) && <div className="px-2 pt-2 pb-1 text-xs font-semibold text-fd-muted-foreground">{i.group}</div>}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => pick(i)}
                    onMouseMove={() => setAt(n)}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-start text-sm ${n === current ? "bg-fd-primary/10 text-fd-primary" : ""}`}
                  >
                    <span className="min-w-0 truncate font-medium">{i.label}</span>
                    {i.hint && <span className="shrink-0 truncate text-xs text-fd-muted-foreground">{i.hint}</span>}
                  </button>
                </li>
              ))}
              {shown.length === 0 && <li className="px-3 py-8 text-center text-sm text-fd-muted-foreground">ไม่พบ ลองพิมพ์ชื่อสั้นลง หรือชื่อน้อง/รุ่น</li>}
            </ul>
            <div className="flex gap-4 border-t border-fd-border px-3 py-2 text-xs text-fd-muted-foreground max-md:hidden">
              <span>↑↓ เลือก</span>
              <span>Enter เปิด</span>
              <span>Esc ปิด</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
