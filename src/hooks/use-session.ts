"use client";

import { useSyncExternalStore } from "react";
import { authApi } from "@/api/auth.api";
import type { Role } from "@/types";

// cookie bt_role เป็นแค่ "คำใบ้" ให้หน้าเว็บรู้ว่าจะแสดงปุ่มอะไร
// บัตรผ่านตัวจริง (bt_session) เป็น httpOnly JavaScript อ่านไม่ได้ และ server ตรวจทุกครั้งอยู่แล้ว
function readRoleHint(): Role | null {
  const m = document.cookie.match(/(?:^|;\s*)bt_role=(intern|dev)/);
  return (m?.[1] as Role | undefined) ?? null;
}

// ทุก component ที่ใช้ hook นี้เห็นค่าเดียวกัน: login/logout แล้วแจ้งทุกตัวให้อ่านใหม่
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSession() {
  // ตอน render ฝั่ง server ไม่มี cookie ของเบราว์เซอร์ จึงถือว่ายังไม่ login
  const role = useSyncExternalStore(subscribe, readRoleHint, () => null);

  // คืน role ให้หน้า login เลือกว่าจะพาไปหน้าไหนต่อ
  const login = async (username: string, pin: string) => {
    const user = await authApi.login(username, pin);
    notify();
    return user.role;
  };
  const logout = async () => {
    await authApi.logout().catch(() => {});
    notify();
  };
  return { role, login, logout };
}
