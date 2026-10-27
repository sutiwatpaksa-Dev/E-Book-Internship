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
  // จอกว้างแถวถี่ (อ่านทั้งรายการได้ในจอเดียว) · มือถือคงความสูงแถวไว้ให้นิ้วกดโดน
  const linkClass = "flex min-h-9 items-center leading-snug hover:text-white hover:underline md:min-h-7";

  return (
    <section id="full" aria-labelledby="full-title" className="min-w-0 scroll-mt-24 text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="full-list"
        className="flex min-h-11 w-full items-center justify-between text-left md:pointer-events-none"
      >
        <span>
          <span id="full-title" className="block text-sm font-semibold text-white">
            บทเรียนฉบับเต็ม
          </span>
          <span className="text-xs text-(--footer-muted)">บทยาวแบบเดิม ไว้อ่านลึก · การ์ดแต่ละใบลิงก์มาที่บทที่เกี่ยวข้องให้แล้ว</span>
        </span>
        <ChevronDown aria-hidden className={`size-5 shrink-0 transition md:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      {/* เรียงแบบคอลัมน์หนังสือพิมพ์ (columns) ไม่ใช่ grid: ด่านยาวสั้นไม่เท่ากัน grid จะเว้นช่องว่างตามด่านที่ยาวสุดของแถว
          columns เทต่อกันจนแต่ละคอลัมน์สูงพอๆ กัน footer จึงเตี้ยลงเกือบครึ่ง · break-inside-avoid กันหัวด่านแยกจากรายการ */}
      <div id="full-list" className={`mt-3 gap-x-6 md:block md:columns-3 lg:columns-4 ${open ? "block sm:columns-2" : "hidden"}`}>
        {nav.stages
          .filter((s) => !s.items.some((i) => i.url.startsWith("/starter")))
          .map((s) => (
            <div key={s.id} className="mb-4 flex break-inside-avoid flex-col">
              <span className="mb-0.5 text-xs font-semibold text-(--footer-muted)">
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
        <div className="mb-4 flex break-inside-avoid flex-col">
          <span className="mb-0.5 text-xs font-semibold text-(--footer-muted)">อ้างอิง</span>
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
