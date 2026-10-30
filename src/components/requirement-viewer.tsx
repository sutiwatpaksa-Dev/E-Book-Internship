"use client";

// แผง Requirement ต้นฉบับ (PDF) เปิดข้างคู่มือ อ่านเทียบกันได้โดยไม่ต้องสลับแท็บ
// ถ้าจอแคบจนเหลือที่ให้เนื้อหาไม่พอ (วางคู่กันไม่ได้) จะเปิด PDF ในแท็บใหม่แทน
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { filesApi, REQUIREMENT_PDF_URL as PDF, requirementUrl } from "@/api/files.api";
import type { Assignment } from "@/types";

// ความกว้างที่ต้องเหลือให้เนื้อหาคู่มือ และความกว้างต่ำสุดของแผง
const CONTENT_MIN = 608;
const PANEL_MIN = 360;
const WIDTH_KEY = "req-viewer-width";

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
  // โจทย์ที่น้องดูได้ (ของรุ่นตัวเอง ชิ้นแรก = ชิ้นที่ควรเปิด) และชิ้นที่เปิดอยู่ · หัวข้อและเลขหน้ามาจากโจทย์นั้น
  const [list, setList] = useState<Assignment[]>([]);
  const [slug, setSlug] = useState<string>();
  const current = list.find((a) => a.slug === slug) ?? list[0];
  const visible = open && onStarter;

  useEffect(() => {
    if (!onStarter || list.length) return;
    filesApi
      .assignments()
      .then(setList)
      .catch(() => {});
  }, [onStarter, list.length]);

  // ใช้ ref ให้ตัวดักคลิกที่ผูกครั้งเดียวเห็นค่าล่าสุดเสมอ
  const dockableRef = useRef(dockable);
  dockableRef.current = dockable && onStarter;
  const currentRef = useRef(current);
  currentRef.current = current;

  const show = useCallback((p = 1, a?: string) => {
    const target = a ?? currentRef.current?.slug;
    if (!dockableRef.current) {
      window.open(`${requirementUrl(target)}#page=${p}`, "_blank", "noopener");
      return;
    }
    if (a) setSlug(a);
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
    // ลิงก์ PDF ในเนื้อหาให้เปิดในแผงแทนแท็บใหม่ (ดักตอน capture ก่อนลิงก์ทำงาน) เฉพาะหน้าโจทย์ที่มีแผง
    // ?sec=api = หัวข้อ แปลงเป็นเลขหน้าของโจทย์ที่เปิดอยู่ · #page=N = หน้าตรงๆ · ?a=slug = โจทย์ชิ้นนั้น
    const onClick = (e: MouseEvent) => {
      if (!dockableRef.current || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest?.("a");
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== PDF) return;
      e.preventDefault();
      const sec = url.searchParams.get("sec");
      const page = sec ? (currentRef.current?.sections.find((s) => s.key === sec)?.page ?? 1) : Number(url.hash.match(/page=(\d+)/)?.[1] ?? 1);
      show(page, url.searchParams.get("a") ?? undefined);
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
        <strong className="whitespace-nowrap">📄 Requirement</strong>
        {list.length > 1 && (
          <select
            aria-label="เลือกโจทย์"
            value={current?.slug}
            onChange={(e) => show(1, e.target.value)}
            className="min-h-9 max-w-40 min-w-0 rounded-md border border-fd-border bg-fd-background px-2 py-1"
          >
            {list.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="ไปที่หัวข้อ"
          value=""
          onChange={(e) => show(Number(e.target.value))}
          className="min-w-0 flex-1 rounded-md border border-fd-border bg-fd-background px-2 py-1"
        >
          <option value="" disabled>
            ไปที่หัวข้อ…
          </option>
          {(current?.sections ?? []).map((s) => (
            <option key={s.key} value={s.page}>
              {s.label} (หน้า {s.page})
            </option>
          ))}
        </select>
        <a href={`${requirementUrl(current?.slug)}#page=${page}`} target="_blank" rel="noopener" title="เปิดในแท็บใหม่" className="rounded-md px-2 py-1 hover:bg-fd-accent">
          ↗
        </a>
        <button type="button" title="ปิด (Esc)" aria-label="ปิดเอกสาร" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 hover:bg-fd-accent">
          ✕
        </button>
      </header>
      <iframe
        key={frameKey}
        src={`${requirementUrl(current?.slug)}#page=${page}&navpanes=0&view=FitH`}
        title={`เอกสาร Requirement โจทย์ฝึกงาน ${current?.name ?? ""} (PDF)`}
        className={`flex-1 border-0 ${dragging ? "pointer-events-none" : ""}`}
      />
    </aside>
  );
}
