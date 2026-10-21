"use client";

import { useEffect, useState, type FormEvent } from "react";
import { adminApi } from "@/api/admin.api";
import { REQUIREMENT_PDF_URL } from "@/api/files.api";
import type { FileInfo, Role, User } from "@/types";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { Input } from "./field";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("th-TH") : "–");
const isLocked = (u: User) => !!u.lockedUntil && new Date(u.lockedUntil) > new Date();
const selectClass = "rounded-md border border-fd-border bg-fd-background px-2 py-1 text-sm";

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [pdf, setPdf] = useState<FileInfo | null>(null);
  const [error, setError] = useState("");
  // PIN ที่เพิ่งออก แสดงครั้งเดียวให้คัดลอกส่งน้อง (ระบบเก็บแค่ hash ดูย้อนหลังไม่ได้)
  const [issued, setIssued] = useState<{ username: string; pin: string } | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<Role>("intern");

  // ทุกปุ่มทำงานผ่านตัวนี้: ล้าง error เก่า แล้วแสดงข้อความจาก API ถ้าพลาด
  async function run(fn: () => Promise<void>) {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const load = () =>
    run(async () => {
      setUsers(await adminApi.listUsers());
      setPdf(await adminApi.getRequirementInfo());
    });

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const create = (e: FormEvent) => {
    e.preventDefault();
    return run(async () => {
      const r = await adminApi.createUser(newUsername, newRole);
      setIssued({ username: r.user.username, pin: r.pin });
      setNewUsername("");
      await load();
    });
  };

  const resetPin = (u: User) =>
    run(async () => {
      if (!confirm(`ออก PIN ใหม่ให้ ${u.username}? PIN เดิมจะใช้ไม่ได้ทันที`)) return;
      const r = await adminApi.resetPin(u.id);
      setIssued({ username: u.username, pin: r.pin });
      await load();
    });

  const patch = (u: User, changes: Parameters<typeof adminApi.updateUser>[1]) =>
    run(async () => {
      await adminApi.updateUser(u.id, changes);
      await load();
    });

  const upload = (file: File | undefined) =>
    run(async () => {
      if (file) setPdf(await adminApi.uploadRequirement(file));
    });

  return (
    <div className="not-prose mt-6 flex flex-col gap-4">
      {error && <ErrorText>{error}</ErrorText>}

      {issued && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-3 text-sm">
          <span>
            PIN ของ <strong>{issued.username}</strong>:
          </span>
          <code className="rounded bg-fd-background px-2 py-1 text-lg font-bold tracking-[0.3em]">{issued.pin}</code>
          <span className="text-fd-muted-foreground">คัดลอกส่งให้น้องตอนนี้ ปิดกล่องนี้แล้วจะดูอีกไม่ได้</span>
          <Button variant="ghost" onClick={() => setIssued(null)}>
            ปิด
          </Button>
        </div>
      )}

      <h2 className="text-lg font-semibold">เพิ่มบัญชี</h2>
      <form onSubmit={create} className="flex flex-wrap gap-2">
        <div className="w-56">
          <Input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </div>
        <select className={selectClass} value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
          <option value="intern">Internship</option>
          <option value="dev">Dev (พี่เลี้ยง)</option>
        </select>
        <Button type="submit">สร้าง + ออก PIN</Button>
      </form>

      <h2 className="text-lg font-semibold">บัญชีทั้งหมด</h2>
      <div className="overflow-x-auto rounded-lg border border-fd-border">
        <table className="w-full text-sm">
          <thead className="bg-fd-muted text-left">
            <tr>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">เข้าล่าสุด</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-fd-border">
                <td className="px-3 py-2 font-medium">{u.username}</td>
                <td className="px-3 py-2">
                  <select className={selectClass} value={u.role} onChange={(e) => patch(u, { role: e.target.value as Role })}>
                    <option value="intern">Internship</option>
                    <option value="dev">Dev</option>
                  </select>
                </td>
                <td className="px-3 py-2">{u.disabled ? "ปิดอยู่" : isLocked(u) ? "ล็อกชั่วคราว" : "ใช้งาน"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmt(u.lastLoginAt)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap justify-end gap-1">
                    {isLocked(u) && (
                      <Button variant="ghost" onClick={() => patch(u, { unlock: true })}>
                        ปลดล็อก
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => resetPin(u)}>
                      ออก PIN ใหม่
                    </Button>
                    <Button variant="ghost" onClick={() => patch(u, { disabled: !u.disabled })}>
                      {u.disabled ? "เปิดบัญชี" : "ปิดบัญชี"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold">ไฟล์ Requirement (PDF)</h2>
      <p className="text-sm">
        {pdf ? (
          <>
            ไฟล์ปัจจุบัน {Math.round(pdf.size / 1024)} KB · อัปเดต {fmt(pdf.updatedAt)} ·{" "}
            <a className="text-fd-primary underline" href={REQUIREMENT_PDF_URL} target="_blank" rel="noopener">
              เปิดดู
            </a>
          </>
        ) : (
          "ยังไม่มีไฟล์ น้องจะเปิดแผง Requirement ไม่ได้จนกว่าจะอัปโหลด"
        )}
      </p>
      <label className="w-fit cursor-pointer rounded-lg bg-fd-primary px-3 py-2 text-sm font-medium text-fd-primary-foreground hover:opacity-90">
        อัปโหลด PDF ใหม่ (ไม่เกิน 4 MB)
        <input type="file" accept="application/pdf" hidden onChange={(e) => upload(e.target.files?.[0])} />
      </label>
    </div>
  );
}
