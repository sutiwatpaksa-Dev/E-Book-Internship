"use client";

import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { Menu, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavDrawer } from "@/hooks/use-nav-drawer";

// ปุ่ม ☰ บน headbar (มือถือเท่านั้น) · ใช้ทั้งหน้าคู่มือและหลังบ้าน เปิดลิ้นชักผ่าน store เดียวกัน
export function MenuButton({ label }: { label: string }) {
  const { open, setOpen } = useNavDrawer();
  return (
    <button type="button" onClick={() => setOpen(true)} aria-label={label} aria-expanded={open} className="flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-fd-accent md:hidden">
      <Menu className="size-5.5" />
    </button>
  );
}

// ลิ้นชักเมนูซ้ายบนมือถือ (จอกว้างใช้ sidebar ปกติ) · หน้าคู่มือกับหลังบ้านใช้ตัวเดียวกัน หน้าตาและวิธีปิดจึงเหมือนกัน
// ระหว่างเปิด: กด Esc ปิดได้, ล็อกการเลื่อนหน้าข้างหลัง, ย้ายโฟกัสไปปุ่มปิด (คนใช้คีย์บอร์ดไม่หลง)
export function MobileDrawer({ title, footer, children }: { title: string; footer?: React.ReactNode; children: React.ReactNode }) {
  const { open, setOpen } = useNavDrawer();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  const close = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div role="dialog" aria-modal="true" aria-label={title} className="flex h-full w-[86%] max-w-[340px] flex-col bg-fd-background shadow-xl animate-fd-fade-in">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-fd-border px-4">
          <span className="font-semibold">{title}</span>
          <button ref={closeRef} type="button" onClick={close} aria-label="ปิดเมนู" className="flex size-10 items-center justify-center rounded-lg hover:bg-fd-accent">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-4">{children}</div>
        <div className="flex shrink-0 items-center justify-between border-t border-fd-border px-4 py-2.5 text-xs text-fd-muted-foreground">
          {footer ?? <span />}
          <ThemeSwitch />
        </div>
      </div>
      <button type="button" aria-label="ปิดเมนู" tabIndex={-1} onClick={close} className="flex-1 bg-black/40 backdrop-blur-xs" />
    </div>
  );
}
