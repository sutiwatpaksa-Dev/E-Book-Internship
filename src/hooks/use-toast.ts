"use client";

import { useSyncExternalStore } from "react";

// แจ้งผลสั้นๆ มุมจอแล้วหายเอง ไม่ขวางการทำงาน (ต่างจากหน้าต่างเด้งที่ต้องกดปิดก่อน)
// เรียก toast.success(...) ได้จากทุกที่ ชิ้นที่แสดงผลมีตัวเดียวคือ <Toaster /> ใน layout หลัก
export type Toast = { id: number; tone: "success" | "error" | "info"; text: string; link?: { href: string; label: string } };

const SHOW_MS = 5000;
let items: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function push(tone: Toast["tone"], text: string, link?: Toast["link"]) {
  const id = nextId++;
  // เก็บแค่ 3 อันล่าสุด กันจอเต็มถ้ามีหลายเรื่องพร้อมกัน
  items = [...items.slice(-2), { id, tone, text, link }];
  emit();
  setTimeout(() => dismissToast(id), SHOW_MS);
}

export const toast = {
  success: (text: string, link?: Toast["link"]) => push("success", text, link),
  error: (text: string, link?: Toast["link"]) => push("error", text, link),
  info: (text: string, link?: Toast["link"]) => push("info", text, link),
};

const EMPTY: Toast[] = [];
export const useToasts = () => useSyncExternalStore(subscribe, () => items, () => EMPTY);
