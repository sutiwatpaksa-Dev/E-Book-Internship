"use client";

import { useSyncExternalStore } from "react";

// ติ๊ก "ผ่านแล้ว" เก็บในเบราว์เซอร์ของแต่ละคน (ไม่ส่งขึ้น server) ล้างเบราว์เซอร์แล้วหายได้
// หน้าแรก, sidebar และปุ่มในหน้าบทใช้ store เดียวกัน ติ๊กที่หนึ่ง ทุกที่อัปเดตพร้อมกัน (รวมแท็บอื่นด้วย)
const STORAGE_KEY = "bt-roadmap-done";
const EMPTY: ReadonlySet<string> = new Set();

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

// อ่านใหม่ทุกครั้งแต่คืน Set ตัวเดิมถ้าข้อมูลไม่เปลี่ยน (useSyncExternalStore ต้องการค่าที่เทียบด้วย === ได้)
let cache: { raw: string | null; done: ReadonlySet<string> } = { raw: null, done: EMPTY };
function read(): ReadonlySet<string> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {}
  if (raw === cache.raw) return cache.done;
  let list: unknown = [];
  try {
    list = JSON.parse(raw ?? "[]");
  } catch {}
  cache = { raw, done: new Set(Array.isArray(list) ? list.filter((x) => typeof x === "string") : []) };
  return cache.done;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // แท็บอื่นติ๊ก: เบราว์เซอร์ส่ง event storage มาให้แท็บนี้
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress() {
  // ตอน render ฝั่ง server ไม่มี localStorage จึงถือว่ายังไม่ได้ติ๊กอะไร
  const done = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = (link: string) => {
    const next = new Set(read());
    if (next.has(link)) next.delete(link);
    else next.add(link);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {}
    notify();
  };
  return { done, toggle };
}
