"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/api/admin.api";
import { filesApi } from "@/api/files.api";
import type { FileInfo, ProgressEntry, Role, ThreadSummary, User } from "@/types";
import { toast } from "./use-toast";

// ข้อมูลและคำสั่งทั้งหมดของหลังบ้าน แยกจากหน้าตา: component แค่เรียกใช้ ไม่เรียก API เอง
export function useAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [pdf, setPdf] = useState<FileInfo | null>(null);
  // ใช้ในภาพรวม หน้าน้องรายคน และบอร์ดคำขอ: โหลดพร้อมรายชื่อ ทุกแท็บเห็นชุดเดียวกัน
  const [progress, setProgress] = useState<Record<number, ProgressEntry[]>>({});
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [exampleRepo, setExampleRepo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // PIN ที่เพิ่งออก แสดงครั้งเดียวให้คัดลอกส่งน้อง (ระบบเก็บแค่ hash ดูย้อนหลังไม่ได้)
  const [issued, setIssued] = useState<{ username: string; pin: string } | null>(null);

  // ทุกคำสั่งทำงานผ่านตัวนี้: ล้าง error เก่า แล้วแสดงข้อความจาก API ถ้าพลาด
  async function run(fn: () => Promise<void>) {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const reload = () =>
    run(async () => {
      const [u, p, pr, t] = await Promise.all([adminApi.listUsers(), adminApi.getRequirementInfo(), adminApi.progress(), adminApi.listThreads()]);
      setUsers(u);
      setPdf(p);
      setProgress(pr);
      setThreads(t);
    });

  useEffect(() => {
    reload().finally(() => setLoading(false));
    filesApi
      .links()
      .then((r) => setExampleRepo(r.exampleRepo))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    users,
    pdf,
    progress,
    threads,
    reload,
    exampleRepo,
    loading,
    error,
    issued,
    dismissPin: () => setIssued(null),
    createUser: (username: string, role: Role) =>
      run(async () => {
        const r = await adminApi.createUser(username, role);
        setIssued({ username: r.user.username, pin: r.pin });
        await reload();
      }),
    // ผลลัพธ์ (PIN ของแต่ละคน) คืนให้ component แสดงครั้งเดียว ไม่เก็บไว้ใน state กลาง
    createMany: async (usernames: string[], role: Role) => {
      setError("");
      try {
        const results = await adminApi.createMany(usernames, role);
        await reload();
        toast.success(`สร้างบัญชีแล้ว ${results.filter((r) => "pin" in r).length} คน`);
        return results;
      } catch (e) {
        setError((e as Error).message);
        return null;
      }
    },
    resetPin: (u: User) =>
      run(async () => {
        const r = await adminApi.resetPin(u.id);
        setIssued({ username: u.username, pin: r.pin });
        await reload();
      }),
    updateUser: (u: User, changes: Parameters<typeof adminApi.updateUser>[1]) =>
      run(async () => {
        await adminApi.updateUser(u.id, changes);
        await reload();
        const what = changes.unlock ? "ปลดล็อก" : changes.disabled === true ? "ปิด" : changes.disabled === false ? "เปิดใช้" : "เปลี่ยนบทบาทของ";
        toast.success(`${what}บัญชี ${u.username} แล้ว`);
      }),
    uploadRequirement: (file: File) =>
      run(async () => {
        setPdf(await adminApi.uploadRequirement(file));
        toast.success("อัปโหลด Requirement PDF แล้ว น้องเปิดดูฉบับใหม่ได้ทันที");
      }),
  };
}

export type AdminState = ReturnType<typeof useAdmin>;

// สถานะบัญชีที่หลายแท็บใช้ร่วมกัน
export const isLockedNow = (u: User) => !!u.lockedUntil && new Date(u.lockedUntil) > new Date();
export const daysSince = (d: string | null) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null);
