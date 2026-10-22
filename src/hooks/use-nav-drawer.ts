"use client";

import { useSyncExternalStore } from "react";

// ลิ้นชักเมนูบนมือถือ: ปุ่ม ☰ อยู่ใน headbar แต่ตัวลิ้นชักอยู่ใน sidebar สองที่จึงใช้สถานะร่วมกันผ่าน store นี้
let open = false;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useNavDrawer() {
  const isOpen = useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
  const setOpen = (value: boolean) => {
    open = value;
    listeners.forEach((l) => l());
  };
  return { open: isOpen, setOpen };
}
