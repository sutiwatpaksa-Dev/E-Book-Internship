"use client";

import { useEffect, useSyncExternalStore } from "react";
import { adminApi } from "@/api/admin.api";
import { threadsApi } from "@/api/threads.api";
import type { Role } from "@/types";
import { toast } from "./use-toast";
import { usePolling } from "./use-polling";
import { useSession } from "./use-session";

// จำนวนเรื่องที่มีข้อความใหม่ยังไม่อ่าน (ป้ายบนเมนูบัญชี)
// น้อง = พี่เลี้ยงตอบมา · พี่เลี้ยง = น้องพิมพ์มา · ทุกชิ้นที่ใช้ hook นี้เห็นเลขเดียวกัน
let count = 0;
// ยังไม่เคยดึงเลขครั้งแรก: ครั้งแรกไม่เด้ง toast (เลขที่ค้างมาก่อนเปิดเว็บ ไม่ใช่ข้อความที่เพิ่งเข้ามา)
let loaded = false;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export async function refreshUnread(role: Role | null) {
  if (!role) return;
  try {
    const r = role === "dev" ? await adminApi.unreadThreads() : await threadsApi.unread();
    // เลขเพิ่มขึ้นระหว่างเปิดเว็บอยู่ = มีคนเพิ่งพิมพ์มา บอกให้รู้ตัวแม้กำลังอ่านบทอื่น
    if (loaded && r.count > count && !location.pathname.startsWith("/questions") && !location.pathname.startsWith("/dev/admin")) {
      toast.info(role === "dev" ? "มีข้อความใหม่จากน้อง" : "พี่เลี้ยงตอบข้อความแล้ว", {
        href: role === "dev" ? "/dev/admin?tab=questions" : "/questions",
        label: "เปิดแชท",
      });
    }
    loaded = true;
    count = r.count;
    listeners.forEach((l) => l());
  } catch {
    // บัตรหมดอายุหรือเน็ตหลุด: คงเลขเดิมไว้ เมนูบัญชีจัดการเรื่อง login เอง
  }
}

export function useUnread() {
  const { role } = useSession();
  const value = useSyncExternalStore(subscribe, () => count, () => 0);
  useEffect(() => {
    refreshUnread(role);
  }, [role]);
  usePolling(() => refreshUnread(role), 60_000, !!role);
  return role ? value : 0;
}
