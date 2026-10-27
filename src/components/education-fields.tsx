"use client";

import { EDU_LEVEL_LABEL, majorLabel, SCHOOL_TYPE_LABEL } from "@/lib/education";
import type { EduLevel, ProfileFields, SchoolType } from "@/types";
import { Field, Input, inputClass } from "./field";

type Edu = Pick<ProfileFields, "schoolType" | "schoolName" | "major" | "eduLevel">;
const field = `${inputClass} min-h-11`;

// ช่องการศึกษาชุดเดียว ใช้ทั้งหน้าโปรไฟล์และหน้าสมัคร (วางใน grid 2 คอลัมน์ของฟอร์มแม่)
// เลือกวิทยาลัยแล้ว ตัวอย่างและชื่อช่องเปลี่ยนเป็นแบบอาชีวะ (แผนก) ให้น้องรู้ว่ากรอกอะไร
export function EducationFields({ value: v, onChange, required }: { value: Edu; onChange: (v: Edu) => void; required?: boolean }) {
  const set = <K extends keyof Edu>(k: K, value: Edu[K]) => onChange({ ...v, [k]: value });
  return (
    <>
      <fieldset className="flex flex-col gap-2 sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">ประเภทสถานศึกษา</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SCHOOL_TYPE_LABEL) as SchoolType[]).map((t) => (
            <label key={t} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${v.schoolType === t ? "border-fd-primary bg-fd-primary/10 font-semibold text-fd-primary" : "border-fd-border hover:bg-fd-accent"}`}>
              <input type="radio" name="schoolType" className="size-4" checked={v.schoolType === t} onChange={() => set("schoolType", t)} required={required} />
              {SCHOOL_TYPE_LABEL[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="sm:col-span-2">
        <Field label="ชื่อสถานศึกษา" hint={v.schoolType === "vocational" ? "เช่น วิทยาลัยเทคนิคชลบุรี" : "เช่น มหาวิทยาลัยบูรพา"}>
          <Input className={field} value={v.schoolName ?? ""} onChange={(e) => set("schoolName", e.target.value)} maxLength={150} minLength={required ? 2 : undefined} required={required} />
        </Field>
      </div>
      <Field label={majorLabel(v.schoolType)} hint={v.schoolType === "vocational" ? "เช่น แผนกเทคโนโลยีสารสนเทศ" : "เช่น วิทยาการคอมพิวเตอร์"}>
        <Input className={field} value={v.major ?? ""} onChange={(e) => set("major", e.target.value)} maxLength={150} />
      </Field>
      <Field label="ระดับการศึกษา">
        <select className={field} value={v.eduLevel ?? ""} onChange={(e) => set("eduLevel", (e.target.value || null) as EduLevel | null)} required={required}>
          <option value="">เลือกระดับ</option>
          {(Object.keys(EDU_LEVEL_LABEL) as EduLevel[]).map((l) => (
            <option key={l} value={l}>
              {EDU_LEVEL_LABEL[l]}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}
