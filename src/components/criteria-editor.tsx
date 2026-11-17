"use client";

import { Plus, Trash2 } from "lucide-react";
import { DEFAULT_CRITERIA, type Criterion } from "@/lib/rubric";
import { Button } from "./button";
import { Field, Input } from "./field";

// เกณฑ์ให้คะแนน: พี่เลี้ยงคนไหนก็แก้ได้ (บันทึกในประวัติการทำงาน) · งานที่ตรวจไปแล้วเก็บสำเนาคะแนนไว้ แก้เกณฑ์ทีหลังคะแนนเก่าไม่เปลี่ยน
export function CriteriaEditor({ criteria, onChange, error }: { criteria: Criterion[]; onChange: (c: Criterion[]) => void; error: string | null }) {
  const set = (i: number, patch: Partial<Criterion>) => onChange(criteria.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const add = () => onChange([...criteria, { id: `c${Date.now().toString(36)}`, label: "", max: 10 }]);
  const total = criteria.reduce((n, c) => n + (Number.isFinite(c.max) ? c.max : 0), 0);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">
        เกณฑ์คะแนน <span className="font-normal text-fd-muted-foreground">(รวมเต็ม {total})</span>
      </legend>
      <p className="text-xs text-fd-muted-foreground">ตอนตรวจงาน พี่เลี้ยงกรอกคะแนนตามข้อเหล่านี้ · ถ้าไม่มีเกณฑ์เลย ตรวจแบบ ผ่าน/แก้ ตามเดิม</p>
      {criteria.map((c, i) => (
        <div key={c.id} className="grid gap-2 rounded-lg border border-fd-border p-3 sm:grid-cols-[1fr_6rem_auto] sm:items-end">
          <Field label="ชื่อข้อ">
            <Input value={c.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="เช่น ทำงานได้ตามโจทย์" maxLength={80} required />
          </Field>
          <Field label="คะแนนเต็ม">
            <Input type="number" inputMode="numeric" min={1} max={100} value={c.max} onChange={(e) => set(i, { max: Number(e.target.value) })} required />
          </Field>
          <Button type="button" variant="ghost" className="min-h-11" aria-label={`ลบ ${c.label || `ข้อที่ ${i + 1}`}`} onClick={() => onChange(criteria.filter((_, j) => j !== i))}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={add} disabled={criteria.length >= 10}>
          <Plus className="size-4" /> เพิ่มข้อ
        </Button>
        {criteria.length === 0 && (
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => onChange(DEFAULT_CRITERIA)}>
            ใช้เกณฑ์เริ่มต้น (รวม 100)
          </Button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
    </fieldset>
  );
}

