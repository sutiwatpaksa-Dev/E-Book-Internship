"use client";

import { Search, UserPlus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { isLockedNow, type AdminState } from "@/hooks/use-admin";
import type { Role, User } from "@/types";
import { ROLE_BADGE, ROLE_LABEL } from "./account-menu";
import { AdminBulkCreate } from "./admin-bulk-create";
import { Button } from "./button";
import { ConfirmBox } from "./confirm-box";
import { Field, Input, inputClass } from "./field";

const PAGE_SIZE = 10;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("th-TH") : "–");
// สีพื้นมาจากป้าย role (ROLE_BADGE) จึงไม่ใส่ bg ที่นี่ ไม่งั้นสองคลาสชนกัน
const selectClass = "rounded-md border border-fd-border px-2 py-1 text-sm";
const FILTERS: { id: Role | "all"; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "intern", label: ROLE_LABEL.intern },
  { id: "dev", label: ROLE_LABEL.dev },
];

// การกระทำที่ต้องถามก่อน เพราะมีผลกับน้องทันที
type Pending = { kind: "disable" | "reset"; user: User } | null;

// แท็บบัญชีผู้ใช้: สร้างบัญชี ค้นหา กรองตาม role แบ่งหน้า และจัดการทีละบัญชี
export function AdminUsers({ admin }: { admin: AdminState }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<Role>("intern");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Role | "all">("all");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<Pending>(null);

  // ค้นหาและกรองในหน้าเว็บ (บัญชีมีไม่กี่สิบคน ดึงมาทั้งหมดครั้งเดียวพอ)
  const rows = admin.users.filter((u) => (filter === "all" || u.role === filter) && u.username.includes(query.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    await admin.createUser(newUsername, newRole);
    setNewUsername("");
  };

  const confirm = async () => {
    if (!pending) return;
    const { kind, user } = pending;
    setPending(null);
    if (kind === "reset") await admin.resetPin(user);
    else await admin.updateUser(user, { disabled: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fd-muted-foreground">PIN แสดงครั้งเดียวตอนสร้างหรือออกใหม่ · ใส่ PIN ผิด 5 ครั้งล็อก 15 นาที</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowBulk((v) => !v)} aria-expanded={showBulk}>
            <Users className="size-4" /> สร้างหลายคน
          </Button>
          <Button onClick={() => setShowCreate((v) => !v)} aria-expanded={showCreate}>
            <UserPlus className="size-4" /> สร้างบัญชี
          </Button>
        </div>
      </div>

      {showBulk && <AdminBulkCreate admin={admin} onClose={() => setShowBulk(false)} />}

      {showCreate && (
        <form onSubmit={create} className="flex flex-wrap items-end gap-3 rounded-xl border border-fd-border bg-fd-card p-4">
          <div className="w-56">
            <Field label="ชื่อผู้ใช้">
              <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="เช่น somchai.j" autoCapitalize="none" spellCheck={false} required />
            </Field>
          </div>
          <Field label="บทบาท">
            <select className={inputClass} value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
              <option value="intern">Internship</option>
              <option value="dev">Dev (พี่เลี้ยง)</option>
            </select>
          </Field>
          <Button type="submit">สร้างและออก PIN</Button>
          <p className="w-full text-xs text-fd-muted-foreground">PIN 6 หลักจะแสดงครั้งเดียวหลังสร้าง ส่งให้น้องทางช่องทางส่วนตัว ระบบเก็บแค่ hash</p>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-64 max-w-full">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground" />
          <input
            type="search"
            aria-label="ค้นหาชื่อผู้ใช้"
            placeholder="ค้นหาชื่อผู้ใช้"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className={`${inputClass} ps-9`}
          />
        </label>
        <div role="group" aria-label="กรองตามบทบาท" className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={`h-9 rounded-full border px-3.5 text-sm ${filter === f.id ? "border-fd-primary bg-fd-primary font-semibold text-fd-primary-foreground" : "border-fd-border hover:bg-fd-accent"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <ConfirmBox
          title={pending.kind === "disable" ? `ปิดบัญชี ${pending.user.username}?` : `ออก PIN ใหม่ให้ ${pending.user.username}?`}
          confirmLabel={pending.kind === "disable" ? "ปิดบัญชี" : "ออก PIN ใหม่"}
          danger={pending.kind === "disable"}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        >
          {pending.kind === "disable"
            ? "น้องเรียก API (เช่นเปิด PDF) ไม่ได้ทันที แต่หน้า STARTER จะเปิดได้จนบัตรผ่านหมดอายุ (ไม่เกิน 12 ชั่วโมง) เปิดบัญชีคืนได้ภายหลัง"
            : "PIN เดิมจะใช้ไม่ได้ทันที PIN ใหม่แสดงครั้งเดียว ต้องส่งให้น้องเอง"}
        </ConfirmBox>
      )}

      {/* จอแคบ: ตารางเลื่อนซ้าย-ขวาได้ แทนการบีบปุ่มจนแถวสูงเกินไป */}
      <div className="overflow-x-auto rounded-xl border border-fd-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-fd-muted text-left">
            <tr>
              <th className="px-3 py-2">ชื่อผู้ใช้</th>
              <th className="px-3 py-2">บทบาท</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">เข้าล่าสุด</th>
              <th className="px-3 py-2 text-end">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-fd-muted-foreground">
                  {admin.loading ? "กำลังโหลด…" : "ไม่พบบัญชีที่ตรงกับที่ค้นหา"}
                </td>
              </tr>
            )}
            {shown.map((u) => (
              <tr key={u.id} className="border-t border-fd-border">
                <td className="px-3 py-2 font-medium">{u.username}</td>
                <td className="px-3 py-2">
                  <select
                    aria-label={`บทบาทของ ${u.username}`}
                    className={`${selectClass} ${ROLE_BADGE[u.role]}`}
                    value={u.role}
                    onChange={(e) => admin.updateUser(u, { role: e.target.value as Role })}
                  >
                    <option value="intern">{ROLE_LABEL.intern}</option>
                    <option value="dev">{ROLE_LABEL.dev}</option>
                  </select>
                </td>
                <td className={`px-3 py-2 ${u.disabled || isLockedNow(u) ? "text-orange-700 dark:text-orange-400" : ""}`}>
                  {u.disabled ? "ปิดอยู่" : isLockedNow(u) ? "ล็อกชั่วคราว" : "ใช้งาน"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{fmt(u.lastLoginAt)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1 whitespace-nowrap">
                    {isLockedNow(u) && (
                      <Button variant="ghost" onClick={() => admin.updateUser(u, { unlock: true })}>
                        ปลดล็อก
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => setPending({ kind: "reset", user: u })}>
                      ออก PIN ใหม่
                    </Button>
                    {u.disabled ? (
                      <Button variant="ghost" onClick={() => admin.updateUser(u, { disabled: false })}>
                        เปิดบัญชี
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => setPending({ kind: "disable", user: u })}>
                        ปิดบัญชี
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-fd-muted-foreground">
        <span>
          แสดง {shown.length} จาก {rows.length} บัญชี (หน้าละ {PAGE_SIZE})
        </span>
        <nav aria-label="เปลี่ยนหน้า" className="flex items-center gap-1">
          <Button variant="ghost" aria-label="หน้าก่อน" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            ‹
          </Button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Button key={n} variant={n === current ? "primary" : "ghost"} aria-current={n === current ? "page" : undefined} onClick={() => setPage(n)}>
              {n}
            </Button>
          ))}
          <Button variant="ghost" aria-label="หน้าถัดไป" disabled={current >= pages} onClick={() => setPage(current + 1)}>
            ›
          </Button>
        </nav>
      </div>
    </div>
  );
}
