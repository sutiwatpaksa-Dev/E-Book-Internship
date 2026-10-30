"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { OPEN_SETTINGS_EVENT, readConsent, saveConsent, type ConsentCategory } from "@/lib/consent";
import { Button } from "./button";

const CATEGORIES: { key: "necessary" | ConsentCategory; name: string; desc: string }[] = [
  { key: "necessary", name: "จำเป็น", desc: "ใช้เก็บบัตรผ่านหลัง login และจำว่าเป็นน้องหรือพี่เลี้ยง ถ้าไม่มีจะเข้าสู่ระบบไม่ได้ จึงปิดไม่ได้" },
  { key: "analytics", name: "การวิเคราะห์", desc: "วัดว่าคนใช้หน้าไหนมากน้อย (เช่น Google Analytics) ตอนนี้เว็บนี้ยังไม่ใช้ ถ้าจะเพิ่มในอนาคตจะโหลดเฉพาะเมื่อคุณยินยอม" },
  { key: "marketing", name: "การตลาด", desc: "ใช้วัดโฆษณาหรือแสดงโฆษณาที่ตรงกับคุณ (เช่น Google Ads, Meta Pixel, LINE Tag) ตอนนี้เว็บนี้ยังไม่ใช้ ถ้าจะเพิ่มจะโหลดเฉพาะเมื่อคุณยินยอม" },
];

// แถบขอความยินยอมครั้งแรก + หน้าต่างตั้งค่า (เปิดซ้ำได้จากลิงก์ "ตั้งค่าคุกกี้" ท้ายเว็บ)
// ปุ่ม "ยอมรับ" กับ "ปฏิเสธ" เด่นเท่ากัน ไม่ซ่อนทางปฏิเสธ
export function CookieConsent() {
  const [mode, setMode] = useState<"closed" | "banner" | "settings">("closed");
  const [picked, setPicked] = useState({ analytics: false, marketing: false });
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readConsent();
    if (saved) setPicked({ analytics: saved.analytics, marketing: saved.marketing });
    else setMode("banner");
    const open = () => {
      const c = readConsent();
      setPicked({ analytics: c?.analytics ?? false, marketing: c?.marketing ?? false });
      setMode("settings");
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  useEffect(() => {
    if (mode === "settings") dialogRef.current?.focus();
  }, [mode]);

  const decide = (analytics: boolean, marketing: boolean, message: string) => {
    saveConsent({ analytics, marketing });
    setPicked({ analytics, marketing });
    setMode("closed");
    toast.success(message);
  };

  if (mode === "closed") return null;

  if (mode === "banner") {
    return (
      <section aria-label="ความยินยอมคุกกี้" className="fixed inset-x-0 bottom-0 z-50 border-t border-fd-border bg-fd-popover p-4 text-sm text-fd-popover-foreground shadow-lg">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <strong className="block text-base">เว็บไซต์นี้ใช้คุกกี้</strong>
            <p className="mt-1 text-fd-muted-foreground">
              เราใช้คุกกี้ที่จำเป็นเพื่อให้เว็บทำงานได้ (เช่น การเข้าสู่ระบบ) และขอความยินยอมสำหรับคุกกี้เพื่อการวิเคราะห์และการตลาด ซึ่งจะโหลดเฉพาะเมื่อคุณยินยอม คุณเลือกยอมรับหรือปฏิเสธแต่ละประเภทได้ และถอนความยินยอมได้ทุกเมื่อจากลิงก์ &quot;ตั้งค่าคุกกี้&quot; ท้ายเว็บไซต์{" "}
              <Link href="/cookies" className="font-medium text-fd-primary underline">
                อ่านนโยบายคุกกี้
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:shrink-0">
            <Button variant="ghost" onClick={() => setMode("settings")} className="min-h-11">
              ตั้งค่า
            </Button>
            <Button variant="ghost" onClick={() => decide(false, false, "ปฏิเสธคุกกี้ที่ไม่จำเป็นแล้ว")} className="min-h-11 border-fd-foreground/40">
              ปฏิเสธทั้งหมด
            </Button>
            <Button onClick={() => decide(true, true, "ยอมรับคุกกี้ทั้งหมดแล้ว")} className="min-h-11">
              ยอมรับทั้งหมด
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && setMode(readConsent() ? "closed" : "banner")}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-title"
        onKeyDown={(e) => e.key === "Escape" && setMode(readConsent() ? "closed" : "banner")}
        className="flex max-h-full w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-xl border border-fd-border bg-fd-popover p-5 text-sm text-fd-popover-foreground shadow-lg outline-none"
      >
        <h2 id="cookie-title" className="text-lg font-semibold">
          ตั้งค่าคุกกี้
        </h2>
        <ul className="flex flex-col gap-2">
          {CATEGORIES.map((c) => (
            <li key={c.key}>
              <label className="flex items-start gap-3 rounded-lg border border-fd-border bg-fd-card p-3">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 shrink-0"
                  checked={c.key === "necessary" ? true : picked[c.key]}
                  disabled={c.key === "necessary"}
                  onChange={(e) => c.key !== "necessary" && setPicked((p) => ({ ...p, [c.key]: e.target.checked }))}
                />
                <span className="flex flex-col gap-0.5">
                  <strong>
                    {c.name}
                    {c.key === "necessary" && <span className="ms-2 text-xs font-normal text-fd-muted-foreground">เปิดเสมอ</span>}
                  </strong>
                  <span className="text-fd-muted-foreground">{c.desc}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="text-fd-muted-foreground">
          ดูรายชื่อคุกกี้ที่ใช้จริงได้ใน{" "}
          <Link href="/cookies" className="font-medium text-fd-primary underline" onClick={() => setMode(readConsent() ? "closed" : "banner")}>
            นโยบายคุกกี้
          </Link>
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => decide(false, false, "ปฏิเสธคุกกี้ที่ไม่จำเป็นแล้ว")} className="min-h-11">
            ปฏิเสธทั้งหมด
          </Button>
          <Button variant="ghost" onClick={() => decide(true, true, "ยอมรับคุกกี้ทั้งหมดแล้ว")} className="min-h-11">
            ยอมรับทั้งหมด
          </Button>
          <Button onClick={() => decide(picked.analytics, picked.marketing, "บันทึกการตั้งค่าคุกกี้แล้ว")} className="min-h-11">
            บันทึกที่เลือก
          </Button>
        </div>
      </div>
    </div>
  );
}
