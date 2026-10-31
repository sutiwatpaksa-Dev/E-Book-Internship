"use client";

import { useEffect, useSyncExternalStore } from "react";
import { progressApi } from "@/api/progress.api";
import { useSession } from "./use-session";
import { toast } from "./use-toast";

// ติ๊ก "ผ่านแล้ว" มีที่เก็บสองแบบ
// - ยังไม่ login: เก็บในเบราว์เซอร์ (localStorage) ล้างเบราว์เซอร์แล้วหาย
// - login แล้ว: เก็บกับบัญชีบน server เปลี่ยนเครื่องก็ยังอยู่ และพี่เลี้ยงเห็นว่าแต่ละคนอยู่บทไหน
// หน้าแรก, sidebar และปุ่มในหน้าบทใช้ store เดียวกัน ติ๊กที่หนึ่ง ทุกที่อัปเดตพร้อมกัน
const STORAGE_KEY = "bt-roadmap-done";
const EMPTY: ReadonlySet<string> = new Set();

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

// อ่านใหม่ทุกครั้งแต่คืน Set ตัวเดิมถ้าข้อมูลไม่เปลี่ยน (useSyncExternalStore ต้องการค่าที่เทียบด้วย === ได้)
let cache: { raw: string | null; done: ReadonlySet<string> } = { raw: null, done: EMPTY };
function readLocal(): ReadonlySet<string> {
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

function writeLocal(next: ReadonlySet<string>) {
  try {
    if (next.size === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {}
}

// ค่าจากบัญชี (null = ยังไม่ login หรือยังโหลดไม่เสร็จ ใช้ค่าในเบราว์เซอร์ไปก่อน)
let server: ReadonlySet<string> | null = null;
// หลาย component เรียกพร้อมกันตอนเปิดหน้า ให้ดึงจาก server แค่ครั้งเดียว
let syncing: Promise<void> | null = null;

function syncFromServer() {
  syncing ??= (async () => {
    try {
      const local = [...readLocal()];
      // ติ๊กที่ทำไว้ในเครื่องนี้ก่อน login ย้ายขึ้นบัญชี แล้วล้างทิ้ง
      // ถ้าไม่ล้าง ครั้งหน้าที่ login จะส่งขึ้นไปซ้ำ บทที่ยกเลิกติ๊กบนบัญชีไปแล้วจะกลับมาเอง
      const rows = local.length > 0 ? await progressApi.importLocal(local) : await progressApi.list();
      if (local.length > 0) writeLocal(EMPTY);
      server = new Set(rows.map((r) => r.link));
      notify();
    } catch {
      // ดึงไม่ได้ (เช่นบัตรผ่านหมดอายุ) ใช้ค่าในเบราว์เซอร์ต่อไป ครั้งหน้าที่เปิดหน้าจะลองใหม่
      syncing = null;
    }
  })();
}

function forgetServer() {
  if (server === null && syncing === null) return;
  server = null;
  syncing = null;
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // แท็บอื่นติ๊ก (ตอนยังไม่ login): เบราว์เซอร์ส่ง event storage มาให้แท็บนี้
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const read = () => server ?? readLocal();

export function useProgress() {
  const { role } = useSession();
  useEffect(() => {
    if (role) syncFromServer();
    else forgetServer();
  }, [role]);

  // ตอน render ฝั่ง server ไม่มี localStorage จึงถือว่ายังไม่ได้ติ๊กอะไร
  const done = useSyncExternalStore(subscribe, read, () => EMPTY);
  // ready: ตัวเลขที่แสดงเชื่อถือได้แล้ว · login อยู่แต่ยังไม่ได้ข้อมูลจากบัญชี = ยังไม่ ready (ห้ามโชว์ 0/39 ที่ยังไม่จริง ให้โชว์โครงรอแทน)
  const loaded = useSyncExternalStore(subscribe, () => server !== null, () => false);
  const ready = !role || loaded;

  const toggle = (link: string) => {
    const before = read();
    const next = new Set(before);
    const nowDone = !next.has(link);
    if (nowDone) next.add(link);
    else next.delete(link);

    if (server === null) {
      writeLocal(next);
      notify();
      return;
    }
    // เปลี่ยนบนจอก่อนแล้วค่อยบันทึก (กดแล้วติ๊กขึ้นทันที) ถ้าบันทึกไม่ได้ค่อยคืนค่าเดิมและบอกผู้ใช้
    server = next;
    notify();
    progressApi.set(link, nowDone).catch(() => {
      server = before;
      notify();
      toast.error("บันทึกความคืบหน้าไม่สำเร็จ ลองกดอีกครั้ง");
    });
  };
  return { done, toggle, ready };
}
