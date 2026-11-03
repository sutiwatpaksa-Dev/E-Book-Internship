"use client";

import { useEffect, useState } from "react";
import { resolveCohortFilter, type CohortFilter } from "@/lib/cohort";

// ตัวกรองรุ่นของหลังบ้าน (ภาพรวม แชท งานที่ส่ง ใช้ค่าเดียวกัน) จำไว้ในเบราว์เซอร์ของพี่เลี้ยงคนนั้น รีเฟรชแล้วไม่หาย
// อ่านหลัง mount เท่านั้น ให้ render แรกตรงกับ server · localStorage ใช้ไม่ได้ (โหมดส่วนตัว) ก็แค่ไม่จำ
// mine = รุ่นที่ยังไม่จบซึ่งเราเป็นพี่เลี้ยงประจำ · ค่าเริ่ม/ค่าที่ใช้ไม่ได้แล้ว ดู resolveCohortFilter
const KEY = "admin.cohort";
const parse = (v: string): CohortFilter => (v === "all" || v === "mine" || v === "none" ? v : Number(v));

export function useCohortFilter(mine: readonly number[], running: readonly number[]) {
  const [saved, setSaved] = useState<CohortFilter | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setSaved(parse(v));
    } catch {}
  }, []);
  const set = (v: CohortFilter) => {
    setSaved(v);
    try {
      localStorage.setItem(KEY, String(v));
    } catch {}
  };
  return [resolveCohortFilter(saved, mine, running), set] as const;
}
