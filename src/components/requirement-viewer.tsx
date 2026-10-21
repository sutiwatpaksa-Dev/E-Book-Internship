"use client";

// แผง Requirement ต้นฉบับ (PDF) เปิดข้างคู่มือ อ่านเทียบกันได้โดยไม่ต้องสลับแท็บ
// ถ้าจอแคบจนเหลือที่ให้เนื้อหาไม่พอ (วางคู่กันไม่ได้) จะเปิด PDF ในแท็บใหม่แทน
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { REQUIREMENT_PDF_URL as PDF } from "@/api/files.api";

// ความกว้างที่ต้องเหลือให้เนื้อหาคู่มือ และความกว้างต่ำสุดของแผง
const CONTENT_MIN = 608;
const PANEL_MIN = 360;
const WIDTH_KEY = "req-viewer-width";

// หัวข้อในต้นฉบับกับหน้าของ PDF (ตรงกับตารางใน starter/compare.mdx)
const SECTIONS = [
  { page: 1, label: "1. ภาพรวมโปรเจกต์" },
  { page: 2, label: "2. ขอบเขตงาน + เลือกธุรกิจ" },
  { page: 3, label: "3. Tech stack + โฟลเดอร์" },
  { page: 4, label: "4. หน้าบ้าน (Public)" },
  { page: 5, label: "5. หลังบ้าน (Admin)" },
  { page: 7, label: "6. ฐานข้อมูล" },
  { page: 8, label: "7. API Spec" },
  { page: 10, label: "8. Non-functional" },
  { page: 11, label: "9. Timeline 10 วัน" },
  { page: 12, label: "10. สิ่งที่ต้องส่ง + เกณฑ์" },
  { page: 13, label: "11. Bonus" },
  { page: 14, label: "Checklist รายวัน" },
  { page: 16, label: "ควรศึกษาก่อน (รายวัน)" },
];

// แผงกว้างได้สูงสุดเท่าที่เหลือหลังหักแถบเมนูซ้ายและที่ของเนื้อหา
function maxWidth() {
  const sidebar = document.getElementById("nd-sidebar")?.getBoundingClientRect().width ?? 0;
  return window.innerWidth - sidebar - CONTENT_MIN;
}
const clampWidth = (w: number) => Math.round(Math.min(Math.max(w, PANEL_MIN), Math.max(maxWidth(), PANEL_MIN)));

export function RequirementViewer() {
  // เอกสารนี้เป็นโจทย์ของ Mini Project แผงจึงแสดงเฉพาะหน้า STARTER ออกไปบทอื่นแล้วซ่อน กลับมาแล้วแสดงต่อ
  const onStarter = usePathname().startsWith("/starter");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  // เปลี่ยน key เพื่อโหลด iframe ใหม่ เพราะตัวอ่าน PDF ของเบราว์เซอร์ไม่สนใจการเปลี่ยน #page ทีหลัง
  const [frameKey, setFrameKey] = useState(0);
  const [width, setWidth] = useState(560);
  const [dockable, setDockable] = useState(false);
  const [dragging, setDragging] = useState(false);
  const visible = open && onStarter;

  // ใช้ ref ให้ตัวดักคลิกที่ผูกครั้งเดียวเห็นค่าล่าสุดเสมอ
  const dockableRef = useRef(dockable);
  dockableRef.current = dockable;

  const show = useCallback((p = 1) => {
    if (!dockableRef.current) {
      window.open(`${PDF}#page=${p}`, "_blank", "noopener");
      return;
    }
    setPage(p);
    setFrameKey((k) => k + 1);
    setOpen(true);
  }, []);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(WIDTH_KEY));
      if (saved) setWidth(clampWidth(saved));
    } catch {}

    const onResize = () => {
      const ok = maxWidth() >= PANEL_MIN;
      setDockable(ok);
      if (!ok) setOpen(false);
      setWidth((w) => clampWidth(w));
    };
    // ลิงก์ PDF ในเนื้อหา (มี #page=N) ให้เปิดในแผงแทนแท็บใหม่ (ดักตอน capture ก่อนลิงก์ทำงาน)
    const onClick = (e: MouseEvent) => {
      if (!dockableRef.current || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest?.("a");
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== PDF) return;
      e.preventDefault();
      show(Number(url.hash.match(/page=(\d+)/)?.[1] ?? 1));
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);

    onResize();
    window.addEventListener("resize", onResize);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [show]);

  // ดันเนื้อหาไปทางซ้ายเท่าความกว้างแผง ข้อความจึงไม่ถูกแผงบัง (สไตล์อยู่ใน global.css)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("req-open", visible);
    root.style.setProperty("--req-w", `${width}px`);
    return () => root.classList.remove("req-open");
  }, [visible, width]);

  if (!onStarter) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => show(1)}
        title="แสดงเอกสาร Requirement ต้นฉบับข้างคู่มือ"
        className="fixed right-5 bottom-5 z-40 rounded-full bg-fd-primary px-4 py-3 text-sm font-semibold text-fd-primary-foreground shadow-lg transition hover:-translate-y-0.5"
      >
        📄 แสดงเอกสาร Requirement
      </button>
    );
  }

  return (
    <aside
      aria-label="เอกสาร Requirement ต้นฉบับ"
      style={{ width }}
      className="fixed top-0 right-0 bottom-0 z-50 flex flex-col border-l border-fd-border bg-fd-background shadow-2xl"
    >
      {/* ลากขอบซ้ายเพื่อปรับความกว้าง (ระหว่างลาก ปิดการรับเมาส์ของ iframe ไม่งั้นมันกินเหตุการณ์ไป) */}
      <div
        role="separator"
        aria-orientation="vertical"
        title="ลากเพื่อปรับความกว้าง"
        className="absolute top-0 bottom-0 -left-1 w-2 cursor-col-resize hover:bg-fd-primary/30"
        onPointerDown={(e) => {
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => dragging && setWidth(clampWidth(window.innerWidth - e.clientX))}
        onPointerUp={() => {
          setDragging(false);
          try {
            localStorage.setItem(WIDTH_KEY, String(width));
          } catch {}
        }}
      />
      <header className="flex items-center gap-2 border-b border-fd-border px-3 py-2 text-sm">
        <strong className="whitespace-nowrap">📄 Requirement ต้นฉบับ</strong>
        <select
          aria-label="ไปที่หัวข้อ"
          value=""
          onChange={(e) => show(Number(e.target.value))}
          className="min-w-0 flex-1 rounded-md border border-fd-border bg-fd-background px-2 py-1"
        >
          <option value="" disabled>
            ไปที่หัวข้อ…
          </option>
          {SECTIONS.map((s) => (
            <option key={s.page} value={s.page}>
              {s.label} (หน้า {s.page})
            </option>
          ))}
        </select>
        <a href={`${PDF}#page=${page}`} target="_blank" rel="noopener" title="เปิดในแท็บใหม่" className="rounded-md px-2 py-1 hover:bg-fd-accent">
          ↗
        </a>
        <button type="button" title="ปิด (Esc)" aria-label="ปิดเอกสาร" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 hover:bg-fd-accent">
          ✕
        </button>
      </header>
      <iframe
        key={frameKey}
        src={`${PDF}#page=${page}&navpanes=0&view=FitH`}
        title="เอกสาร Requirement โปรเจกต์ฝึกงาน เว็บไซต์ STARTER (PDF)"
        className={`flex-1 border-0 ${dragging ? "pointer-events-none" : ""}`}
      />
    </aside>
  );
}
