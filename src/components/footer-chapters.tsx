"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSite } from "./nav-provider";

// บทเรียนฉบับเต็มแบบเดิม (00–23) อยู่ใน footer ทุกหน้า: หาเจอจากทุกที่ แต่ไม่แย่งที่การ์ดซึ่งเป็นทางหลัก
// จอกว้างแสดงเลย · มือถือรายการยาวเกือบ 30 บรรทัด จึงพับไว้ กดเปิดเอง (ปุ่ม "บทเรียนฉบับเต็ม" ในเมนูพาเลื่อนมาที่นี่)
// ไม่นับด่าน Mini Project เพราะอยู่ที่เมนูโปรเจกต์แล้ว
export function FooterChapters() {
  const { nav } = useSite();
  const [open, setOpen] = useState(false);

  // กดปุ่ม "บทเรียนฉบับเต็ม" ในเมนู (ลิงก์ #full) บนมือถือ: เลื่อนมาแล้วต้องเห็นรายการเลย ไม่ใช่เจอแค่หัวที่พับอยู่
  useEffect(() => {
    const openIfTarget = () => location.hash === "#full" && setOpen(true);
    openIfTarget();
    window.addEventListener("hashchange", openIfTarget);
    return () => window.removeEventListener("hashchange", openIfTarget);
  }, []);
  const linkClass = "flex min-h-9 items-center hover:text-white hover:underline";

  return (
    <section id="full" aria-labelledby="full-title" className="mx-auto max-w-6xl scroll-mt-24 border-b border-(--footer-line) px-6 py-8 text-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="full-list"
        className="flex min-h-11 w-full items-center justify-between text-left md:pointer-events-none"
      >
        <span>
          <span id="full-title" className="block text-base font-semibold text-white">
            บทเรียนฉบับเต็ม
          </span>
          <span className="text-(--footer-muted)">บทยาวแบบเดิม ใช้ตอนอยากรู้ลึก ไม่จำเป็นต่อโจทย์ การ์ดแต่ละใบมีลิงก์มาที่บทที่เกี่ยวข้องอยู่แล้ว</span>
        </span>
        <ChevronDown aria-hidden className={`size-5 shrink-0 transition md:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      <div id="full-list" className={`mt-4 grid-cols-2 gap-x-8 gap-y-5 md:grid lg:grid-cols-4 ${open ? "grid max-sm:grid-cols-1" : "hidden"}`}>
        {nav.stages
          .filter((s) => !s.items.some((i) => i.url.startsWith("/starter")))
          .map((s) => (
            <div key={s.id} className="flex flex-col">
              <span className="mb-1 text-xs font-semibold text-(--footer-muted)">
                {s.kicker} · {s.name}
              </span>
              {s.items.map((i) => (
                <Link key={i.url} href={i.url} className={linkClass}>
                  {i.num ? `${i.num.replace(/^0(?=\d)/, "")}. ` : ""}
                  {i.title}
                </Link>
              ))}
            </div>
          ))}
        <div className="flex flex-col">
          <span className="mb-1 text-xs font-semibold text-(--footer-muted)">อ้างอิง</span>
          {nav.refs.map((r) => (
            <Link key={r.url} href={r.url} className={linkClass}>
              {r.title}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
