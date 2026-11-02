"use client";

import type { CohortFilter } from "@/lib/cohort";
import type { Cohort } from "@/types";
import { Button } from "./button";

// แถบเลือกรุ่นบนหลังบ้าน: "รุ่นของฉัน" กับ "ทุกรุ่น" กดได้ในคลิกเดียว · รุ่นอื่นเลือกจากรายการ
// ใช้ค่าเดียวกันทั้งแท็บภาพรวม แชท และงานที่ส่ง ตัวเลขบนเมนูจึงตรงกับที่เห็น
export function CohortFilterBar({ cohorts, mine, value, onChange }: { cohorts: Cohort[]; mine: readonly number[]; value: CohortFilter; onChange: (v: CohortFilter) => void }) {
  const mineNames = cohorts.filter((c) => mine.includes(c.id)).map((c) => c.name);
  const picked = typeof value === "number" || value === "none" ? String(value) : "";
  return (
    <div role="group" aria-label="ดูเฉพาะรุ่น" className="flex flex-wrap items-center gap-2">
      {mine.length > 0 && (
        <Button variant={value === "mine" ? "primary" : "ghost"} aria-pressed={value === "mine"} onClick={() => onChange("mine")} title={mineNames.join(", ")}>
          รุ่นของฉัน{mineNames.length === 1 ? ` · ${mineNames[0]}` : ` (${mineNames.length} รุ่น)`}
        </Button>
      )}
      <Button variant={value === "all" ? "primary" : "ghost"} aria-pressed={value === "all"} onClick={() => onChange("all")}>
        ทุกรุ่น
      </Button>
      <label className="flex items-center gap-2 text-sm">
        <span className="sr-only">เลือกรุ่นอื่น</span>
        <select
          className={`min-h-11 rounded-lg border bg-fd-background px-3 ${picked ? "border-fd-primary font-semibold text-fd-primary" : "border-fd-border"}`}
          value={picked}
          onChange={(e) => onChange(e.target.value === "none" ? "none" : Number(e.target.value))}
        >
          <option value="" disabled>
            เลือกรุ่น…
          </option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.endedAt ? " (จบแล้ว)" : ""}
            </option>
          ))}
          <option value="none">ไม่มีรุ่น</option>
        </select>
      </label>
    </div>
  );
}
