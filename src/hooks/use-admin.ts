"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/api/admin.api";
import { filesApi } from "@/api/files.api";
import type { AdminQuestion, FileInfo, Role, User } from "@/types";

// ข้อมูลและคำสั่งทั้งหมดของหลังบ้าน แยกจากหน้าตา: component แค่เรียกใช้ ไม่เรียก API เอง
export function useAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [pdf, setPdf] = useState<FileInfo | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
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
      const [u, p, q] = await Promise.all([adminApi.listUsers(), adminApi.getRequirementInfo(), adminApi.listQuestions()]);
      setUsers(u);
      setPdf(p);
      setQuestions(q);
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
    questions,
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
      }),
    // คืน true เมื่อส่งสำเร็จ ให้ฟอร์มรู้ว่าปิดช่องเขียนได้
    answerQuestion: async (id: number, answer: string) => {
      let ok = false;
      await run(async () => {
        await adminApi.answerQuestion(id, answer);
        setQuestions(await adminApi.listQuestions());
        ok = true;
      });
      return ok;
    },
    uploadRequirement: (file: File) =>
      run(async () => {
        setPdf(await adminApi.uploadRequirement(file));
      }),
  };
}

export type AdminState = ReturnType<typeof useAdmin>;

// สถานะบัญชีที่หลายแท็บใช้ร่วมกัน
export const isLockedNow = (u: User) => !!u.lockedUntil && new Date(u.lockedUntil) > new Date();
export const daysSince = (d: string | null) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null);
