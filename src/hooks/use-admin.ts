"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/api/admin.api";
import { filesApi } from "@/api/files.api";
import type { Cohort, CohortInput, FileInfo, ProgressEntry, Role, SignupSettings, ThreadSummary, User } from "@/types";
import { toast } from "./use-toast";

// ข้อมูลและคำสั่งทั้งหมดของหลังบ้าน แยกจากหน้าตา: component แค่เรียกใช้ ไม่เรียก API เอง
export function useAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [pdf, setPdf] = useState<FileInfo | null>(null);
  // ใช้ในภาพรวม หน้าน้องรายคน และบอร์ดคำขอ: โหลดพร้อมรายชื่อ ทุกแท็บเห็นชุดเดียวกัน
  const [progress, setProgress] = useState<Record<number, ProgressEntry[]>>({});
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  // รุ่นใช้หลายแท็บ (ภาพรวมกรองตามรุ่น, บัญชีผู้ใช้, หน้ารุ่น) จึงโหลดพร้อมรายชื่อ
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [exampleRepo, setExampleRepo] = useState<string | null>(null);
  // ตัวเองเป็น Super admin ไหม: ใช้ซ่อนปุ่มจัดการบัญชีพี่เลี้ยง (server ตรวจซ้ำทุกคำสั่ง)
  const [me, setMe] = useState<{ id: number; superAdmin: boolean } | null>(null);
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
      const [u, p, pr, t, c] = await Promise.all([adminApi.listUsers(), adminApi.getRequirementInfo(), adminApi.progress(), adminApi.listThreads(), adminApi.listCohorts()]);
      setCohorts(c);
      setUsers(u);
      setPdf(p);
      setProgress(pr);
      setThreads(t);
    });

  useEffect(() => {
    reload().finally(() => setLoading(false));
    adminApi
      .me()
      .then(setMe)
      .catch(() => {});
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
    cohorts,
    me,
    reload,
    exampleRepo,
    loading,
    error,
    issued,
    dismissPin: () => setIssued(null),
    createUser: (username: string, role: Role, cohortId: number | null = null) =>
      run(async () => {
        const r = await adminApi.createUser(username, role, cohortId);
        setIssued({ username: r.user.username, pin: r.pin });
        await reload();
      }),
    // ผลลัพธ์ (PIN ของแต่ละคน) คืนให้ component แสดงครั้งเดียว ไม่เก็บไว้ใน state กลาง
    createMany: async (usernames: string[], role: Role, cohortId: number | null = null) => {
      setError("");
      try {
        const results = await adminApi.createMany(usernames, role, cohortId);
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
    // คืน true เมื่อสำเร็จ ให้ฟอร์มปิดตัวเองได้ (พลาด = ฟอร์มยังเปิด ข้อความที่กรอกไม่หาย)
    saveCohort: async (id: number | null, input: CohortInput) => {
      let ok = false;
      await run(async () => {
        if (id) await adminApi.updateCohort(id, input);
        else await adminApi.createCohort(input);
        await reload();
        toast.success(id ? "บันทึกข้อมูลรุ่นแล้ว" : `สร้าง ${input.name} แล้ว`);
        ok = true;
      });
      return ok;
    },
    setCohortEnded: (c: Cohort, ended: boolean) =>
      run(async () => {
        await adminApi.setCohortEnded(c.id, ended);
        await reload();
        toast.success(ended ? `จบ ${c.name} แล้ว น้องยังอ่านคู่มือได้ แต่เปิดเรื่องถามใหม่ไม่ได้` : `เปิด ${c.name} กลับแล้ว`);
      }),
    setCohortMentors: (c: Cohort, userIds: number[]) =>
      run(async () => {
        await adminApi.setCohortMentors(c.id, userIds);
        await reload();
        toast.success("บันทึกพี่เลี้ยงประจำรุ่นแล้ว");
      }),
    // คืนรหัสจริงให้หน้าจอแสดงครั้งเดียว (null = พลาด ข้อความ error อยู่ที่ error แล้ว)
    newInvite: async (c: Cohort) => {
      let code: string | null = null;
      await run(async () => {
        code = (await adminApi.newInvite(c.id)).code;
        await reload();
        toast.success(`สร้างรหัสของ ${c.name} แล้ว และเปิดรับสมัคร`);
      });
      return code as string | null;
    },
    setSignup: async (c: Cohort, s: SignupSettings) => {
      let ok = false;
      await run(async () => {
        await adminApi.setSignup(c.id, s);
        await reload();
        toast.success(s.signupOpen ? `เปิดรับสมัคร ${c.name} แล้ว` : `ปิดรับสมัคร ${c.name} แล้ว`);
        ok = true;
      });
      return ok;
    },
    assignCohort: async (userIds: number[], cohortId: number | null) => {
      let ok = false;
      await run(async () => {
        const r = await adminApi.assignCohort(userIds, cohortId);
        await reload();
        toast.success(cohortId === null ? `เอาออกจากรุ่นแล้ว ${r.moved} คน` : `ย้ายเข้ารุ่นแล้ว ${r.moved} คน`);
        ok = true;
      });
      return ok;
    },
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
