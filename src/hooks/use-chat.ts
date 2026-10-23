"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/api/admin.api";
import { threadsApi } from "@/api/threads.api";
import type { NewThread, Role, ThreadDetail, ThreadStatus, ThreadSummary } from "@/types";
import { usePolling } from "./use-polling";
import { refreshUnread } from "./use-unread";

// แหล่งข้อมูลของแชท: น้องคุยผ่าน /api/threads (เห็นแค่ของตัวเอง) · พี่เลี้ยงผ่าน /api/admin/threads (เห็นทุกเรื่อง)
// หน้าตาแชทใช้ชุดเดียวกัน ต่างกันแค่ตัวนี้
export type ChatSide = Role;
type Source = {
  list: () => Promise<ThreadSummary[]>;
  get: (id: number) => Promise<ThreadDetail>;
  reply: (id: number, body: string) => Promise<unknown>;
  create?: (t: NewThread) => Promise<{ id: number }>;
  setStatus?: (id: number, status: ThreadStatus, note?: string) => Promise<unknown>;
};
const SOURCES: Record<ChatSide, Source> = {
  intern: threadsApi,
  dev: { list: adminApi.listThreads, get: adminApi.getThread, reply: adminApi.replyThread, setStatus: adminApi.setThreadStatus },
};

// เปิดแชทค้างไว้ = ดึงใหม่ทุก 20 วินาที (และทันทีเมื่อกลับมาที่แท็บ)
const POLL_MS = 20_000;

export function useChat(side: ChatSide, initialId: number | null = null) {
  const source = SOURCES[side];
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ทุกคำสั่งที่เปลี่ยนข้อมูลผ่านตัวนี้: ล้าง error เก่า แสดงข้อความจาก API ถ้าพลาด คืน true ถ้าสำเร็จ
  async function run(fn: () => Promise<void>) {
    setError("");
    try {
      await fn();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }

  const loadList = useCallback(() => source.list().then(setThreads), [source]);
  const loadDetail = useCallback(
    async (id: number) => {
      const d = await source.get(id);
      setDetail(d);
      // server จดว่าอ่านแล้วตอนเปิด: เอาป้าย "ใหม่" ออกจากรายการ และให้ป้ายบนเมนูนับใหม่
      setThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unread: false } : t)));
      refreshUnread(side);
    },
    [source, side],
  );

  useEffect(() => {
    loadList()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadList]);

  useEffect(() => {
    setDetail(null);
    if (selectedId !== null) loadDetail(selectedId).catch((e: Error) => setError(e.message));
  }, [selectedId, loadDetail]);

  usePolling(() => {
    loadList().catch(() => {});
    if (selectedId !== null) loadDetail(selectedId).catch(() => {});
  }, POLL_MS);

  return {
    side,
    threads,
    selectedId,
    detail,
    loading,
    error,
    canCreate: !!source.create,
    canSetStatus: !!source.setStatus,
    select: setSelectedId,
    reply: (body: string) =>
      run(async () => {
        await source.reply(selectedId!, body);
        await Promise.all([loadDetail(selectedId!), loadList()]);
      }),
    create: async (t: NewThread) => {
      let id: number | null = null;
      await run(async () => {
        id = (await source.create!(t)).id;
        await loadList();
        setSelectedId(id);
      });
      return id;
    },
    setStatus: (status: ThreadStatus, note?: string) =>
      run(async () => {
        await source.setStatus!(selectedId!, status, note);
        await Promise.all([loadDetail(selectedId!), loadList()]);
      }),
  };
}

export type ChatState = ReturnType<typeof useChat>;
