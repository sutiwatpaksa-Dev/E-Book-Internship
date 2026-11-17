"use client";

import { useEffect, useState } from "react";
import { filesApi } from "@/api/files.api";
import type { CardAssignment } from "@/types";

// โจทย์ที่ดูได้ + โน้ตของการ์ดนี้ · ยังไม่ login (enabled = false) หรือโหลดไม่ได้ = ไม่มีกล่อง (items เป็น [])
// loading = true ระหว่างรอ เพื่อให้หัวการ์ดจองที่ไว้ ไม่กระตุกตอนกล่องโผล่
export function useCardAssignments(card: string, enabled: boolean) {
  const [items, setItems] = useState<CardAssignment[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    filesApi
      .cardBox(card)
      .then((r) => live && setItems(r))
      .catch(() => live && setItems([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [card, enabled]);

  return { items, loading };
}
