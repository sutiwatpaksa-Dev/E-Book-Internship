"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { notificationsApi } from "@/api/notifications.api";
import { playChime } from "@/lib/chime";
import type { Notification } from "@/types";
import { usePolling } from "./use-polling";
import { useSession } from "./use-session";

// กระดิ่งแจ้งเตือน: ตัวเลขถามทุก 1 นาทีตอนแท็บเปิดอยู่ (แบบเดียวกับป้ายแชท ใน use-unread.ts)
// รายการเต็มดึงตอนกดเปิดกระดิ่งเท่านั้น ไม่ดึงทุกนาที ประหยัดทั้งเน็ตและฐานข้อมูล
let count = 0;
// ครั้งแรกไม่ส่งเสียง: เลขที่ค้างมาก่อนเปิดเว็บ ไม่ใช่เรื่องที่เพิ่งเข้ามา
let loaded = false;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const setCount = (n: number) => {
  count = n;
  listeners.forEach((l) => l());
};

async function refresh() {
  try {
    const n = (await notificationsApi.unread()).count;
    // เลขเพิ่มระหว่างเปิดเว็บ = มีเรื่องใหม่ (ข้อความ ประกาศ การ์ดใหม่ ทุกอย่างสร้างแจ้งเตือนที่ server แล้ว) ส่งเสียงครั้งเดียว
    if (loaded && n > count) playChime();
    loaded = true;
    setCount(n);
  } catch {
    // บัตรหมดอายุหรือเน็ตหลุด: คงเลขเดิม
  }
}

export function useNotifications() {
  const { role } = useSession();
  const unread = useSyncExternalStore(subscribe, () => count, () => 0);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role) refresh();
  }, [role]);
  usePolling(refresh, 60_000, !!role, true);

  return {
    enabled: !!role,
    unread: role ? unread : 0,
    items,
    error,
    // เปิดกระดิ่ง = ดึงรายการแล้วถือว่าอ่านทั้งหมด (ตัวที่ยังไม่อ่านยังเน้นสีไว้ในรอบนี้ ให้เห็นว่าอันไหนใหม่)
    async open() {
      setError("");
      try {
        const r = await notificationsApi.list();
        setItems(r.items);
        if (r.unread > 0) {
          await notificationsApi.markRead();
          setCount(0);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    },
  };
}
