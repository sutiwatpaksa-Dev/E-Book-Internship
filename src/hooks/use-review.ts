"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submissionsApi } from "@/api/submissions.api";
import type { ReviewPage, ReviewQuery, ReviewSummary } from "@/types";

// โหลดข้อมูลของหน้าตรวจงานแบบเจาะลง
// - เปลี่ยนตัวกรองเร็วๆ: คำตอบของคำขอเก่าที่มาช้ากว่าห้ามทับของใหม่ (เทียบเลขคำขอ)
// - ระหว่างโหลดใหม่ยังเก็บข้อมูลเดิมไว้โชว์ (loading = true) หน้าจอไม่กะพริบเป็นโครงเปล่า
//   แต่เฉพาะในขอบเขตเดิม (scope: รุ่น/งานเดียวกัน) · ข้ามไปรุ่นหรืองานอื่น = ไม่โชว์ของเก่า ไม่งั้นเห็นตัวเลขของรุ่นเก่าใต้ชื่อรุ่นใหม่
function useLoad<T>(load: (() => Promise<T>) | null, key: string, scope: string) {
  const [loaded, setLoaded] = useState<{ scope: string; value: T } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  const run = useCallback(() => {
    const fn = loadRef.current;
    const id = ++latest.current;
    if (!fn) {
      setLoaded(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fn()
      .then((r) => {
        if (id !== latest.current) return;
        setLoaded({ scope: scopeRef.current, value: r });
        setError(null);
      })
      .catch((e: Error) => id === latest.current && setError(e.message))
      .finally(() => id === latest.current && setLoading(false));
  }, []);

  // key = ตัวกรองที่เปลี่ยนแล้วต้องโหลดใหม่ (ใช้ข้อความ ไม่ใช่ object เพื่อไม่ให้โหลดวนทุก render)
  useEffect(() => {
    run();
  }, [key, run]);
  return { data: loaded && loaded.scope === scope ? loaded.value : null, error, loading, reload: run };
}

// ชั้น "งาน": โพสต์ทั้งหมดของรุ่น + จำนวนรอตรวจ/ตรวจแล้ว · cohort ว่าง = ยังไม่มีรุ่นให้ดู
export function useReviewSummary(cohort: number | null) {
  return useLoad<ReviewSummary>(cohort === null ? null : () => submissionsApi.reviewSummary(cohort), `summary:${cohort}`, `${cohort}`);
}

// ชั้น "คน": หน้าหนึ่งของตาราง · query ว่าง = ยังไม่ได้เลือกงาน ไม่ต้องโหลด
export function useReviewPage(query: ReviewQuery | null) {
  return useLoad<ReviewPage>(query ? () => submissionsApi.reviewPage(query) : null, query ? JSON.stringify(query) : "none", query ? `${query.cohort}/${query.assignment}/${query.round}` : "none");
}
