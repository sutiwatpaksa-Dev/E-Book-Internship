"use client";

import type { CohortFilter } from "@/lib/cohort";
import type { Cohort } from "@/types";

// ตัวเลือกรุ่นของหลังบ้าน: select ตัวเดียว เห็นค่าที่ใช้อยู่ชัด ไม่มีปุ่มหลายตัวที่ไฮไลต์ซ้อนกัน
// ใช้ค่าเดียวกันทั้งแท็บภาพรวม แชท และงานที่ส่ง ตัวเลขบนเมนูจึงตรงกับที่เห็น · รุ่นที่จบแล้วแยกกลุ่มไว้ท้าย
export function CohortFilterBar({ cohorts, mine, value, onChange }: { cohorts: Cohort[]; mine: readonly number[]; value: CohortFilter; onChange: (v: CohortFilter) => void }) {
  const mineNames = cohorts.filter((c) => mine.includes(c.id)).map((c) => c.name);
  const running = cohorts.filter((c) => !c.endedAt);
  const ended = cohorts.filter((c) => c.endedAt);
  const parse = (v: string): CohortFilter => (v === "mine" || v === "all" || v === "none" ? v : Number(v));
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm font-medium">
      ดูรุ่น
      <select className="min-h-11 min-w-0 max-w-full rounded-lg border border-fd-border bg-fd-background px-3 font-semibold" value={String(value)} onChange={(e) => onChange(parse(e.target.value))}>
        {mine.length > 0 && <option value="mine">รุ่นของฉัน{mineNames.length === 1 ? ` · ${mineNames[0]}` : ` (${mineNames.length} รุ่น)`}</option>}
        <option value="all">ทุกรุ่น</option>
        {running.length > 0 && (
          <optgroup label="กำลังฝึก">
            {running.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        )}
        {ended.length > 0 && (
          <optgroup label="จบแล้ว">
            {ended.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (จบแล้ว)
              </option>
            ))}
          </optgroup>
        )}
        <option value="none">ไม่มีรุ่น</option>
      </select>
    </label>
  );
}
