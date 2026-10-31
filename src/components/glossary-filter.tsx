"use client";

import { Search } from "lucide-react";
import { useState } from "react";

// ช่องกรองคำศัพท์เฉพาะหน้า /glossary: ซ่อนแถวของตารางที่ไม่มีคำที่พิมพ์ (ตารางเป็น Markdown ปกติ จึงกรองที่ DOM)
// หัวข้อกลุ่มที่ไม่เหลือแถวเลยก็ซ่อนด้วยไม่ได้ง่าย จึงบอกจำนวนที่เจอไว้ใต้ช่องแทน
export function GlossaryFilter() {
  const [count, setCount] = useState<number | null>(null);

  function apply(raw: string) {
    const q = raw.trim().toLowerCase();
    const rows = document.querySelectorAll<HTMLTableRowElement>("article table tbody tr, #nd-page table tbody tr");
    let hit = 0;
    rows.forEach((r) => {
      const ok = !q || (r.textContent ?? "").toLowerCase().includes(q);
      r.hidden = !ok;
      if (ok) hit++;
    });
    setCount(q ? hit : null);
  }

  return (
    <div className="not-prose my-4 flex flex-col gap-1.5">
      <label className="flex min-h-12 items-center gap-3 rounded-xl border-2 border-fd-primary bg-fd-background px-4 focus-within:ring-4 focus-within:ring-fd-primary/25">
        <Search className="size-5 text-fd-primary" aria-hidden />
        <span className="sr-only">กรองคำศัพท์ในหน้านี้</span>
        <input onChange={(e) => apply(e.target.value)} placeholder="พิมพ์คำที่งง เช่น API, migration" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
      </label>
      {count !== null && (
        <p className="text-sm text-fd-muted-foreground" aria-live="polite">
          {count === 0 ? "ไม่พบคำนี้ในหน้านี้ ลองค้นทั้งเว็บจากแถบด้านบน" : `พบ ${count} คำ`}
        </p>
      )}
    </div>
  );
}
