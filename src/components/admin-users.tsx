"use client";

import { ArrowLeftRight, Search, UserPlus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { isLockedNow, type AdminState } from "@/hooks/use-admin";
import { inCohort, type CohortFilter } from "@/lib/cohort";
import type { Role, User } from "@/types";
import { ROLE_BADGE, ROLE_LABEL } from "./account-menu";
import { AdminBulkCreate } from "./admin-bulk-create";
import type { AdminNav } from "./admin-panel";
import { CohortSelect, defaultCohortId } from "./admin-cohorts";
import { Button } from "./button";
import { ConfirmBox } from "./confirm-box";
import { Field, Input, inputClass } from "./field";

const PAGE_SIZE = 10;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("th-TH") : "–");
// แถบกรอง: ทุกชิ้นสูง 36px เท่ากัน (ช่องค้นหา, ปุ่มกลุ่ม, ตัวเลือกรุ่น) สายตาจะอ่านเป็นแถวเดียว
const toolbarInput = `${inputClass} h-9 py-0`;
const FILTERS: { id: Role | "all"; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "intern", label: ROLE_LABEL.intern },
  { id: "dev", label: ROLE_LABEL.dev },
];

// การกระทำที่ต้องถามก่อน เพราะมีผลกับน้องทันที
// เปลี่ยนบทบาทก็ต้องถาม: select เลือกพลาดได้ง่าย และน้องที่กลายเป็น Dev จะเห็นแชทของน้องทุกคนทันที
type Pending = { kind: "disable" | "reset"; user: User } | { kind: "role"; user: User; role: Role } | null;

const CONFIRM_TEXT = {
  disable: "น้องเรียก API (เช่นเปิด PDF) ไม่ได้ทันที แต่หน้า STARTER จะเปิดได้จนบัตรผ่านหมดอายุ (ไม่เกิน 12 ชั่วโมง) เปิดบัญชีคืนได้ภายหลัง",
  reset: "รหัสผ่านหรือ PIN เดิมใช้ไม่ได้ทันที และทุกเครื่องที่ login ค้างไว้จะหลุด · PIN ใหม่แสดงครั้งเดียว ใช้ได้ 30 นาที ส่งให้เจ้าของบัญชีเอง (ทักส่วนตัว ไม่ส่งในกลุ่ม) แล้วเขาจะตั้งรหัสผ่านใหม่ตอน login",
  // API อ่านบทบาทจากฐานข้อมูลทุกครั้ง (มีผลทันที) แต่ด่านหน้าเว็บอ่านจากบัตรผ่าน (มีผลเมื่อ login ใหม่)
  dev: "login ครั้งถัดไปจะเข้าหลังบ้านได้ เห็นแชทของน้องทุกคน สร้าง/ปิดบัญชีและออก PIN ให้คนอื่นได้",
  intern: "ใช้คำสั่งหลังบ้านไม่ได้ทันที ไม่เห็นแชทของน้องคนอื่นอีก เปลี่ยนกลับได้ภายหลัง",
};

// แท็บบัญชีผู้ใช้: สร้างบัญชี ค้นหา กรองตาม role แบ่งหน้า และจัดการทีละบัญชี
export function AdminUsers({ admin, nav }: { admin: AdminState; nav: AdminNav }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<Role>("intern");
  // undefined = ยังไม่ได้เลือกเอง ใช้รุ่นที่กำลังฝึก (คิดตอน render เพราะเปิดหน้านี้ตรงๆ รายการรุ่นยังโหลดไม่เสร็จ)
  const [pickedCohort, setNewCohort] = useState<number | null | undefined>(undefined);
  const newCohort = pickedCohort === undefined ? defaultCohortId(admin.cohorts) : pickedCohort;
  const [cohortFilter, setCohortFilter] = useState<CohortFilter>("all");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Role | "all">("all");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<Pending>(null);

  // ค้นหาและกรองในหน้าเว็บ (บัญชีมีไม่กี่สิบคน ดึงมาทั้งหมดครั้งเดียวพอ)
  // กรองรุ่นแล้วเหลือเฉพาะน้อง (พี่เลี้ยงไม่มีรุ่น) ยกเว้นเลือก "ทุกรุ่น"
  const rows = admin.users.filter(
    (u) => (filter === "all" || u.role === filter) && (cohortFilter === "all" || (u.role === "intern" && inCohort(u.cohortId, cohortFilter))) && u.username.includes(query.trim().toLowerCase()),
  );
  // บัญชีพี่เลี้ยงจัดการได้เฉพาะ Super admin · บัญชีน้องพี่เลี้ยงทุกคนจัดการได้ (เหมือนเดิม)
  const isSuper = !!admin.me?.superAdmin;
  const canManage = (u: User) => isSuper || u.role === "intern";
  const isMe = (u: User) => u.id === admin.me?.id;
  const cohortName = (id: number | null) => admin.cohorts.find((c) => c.id === id)?.name ?? "–";
  // คนที่ขอรีเซ็ตรหัสผ่านขึ้นก่อน (รออยู่) ที่เหลือเรียงตามชื่อเหมือนเดิม
  rows.sort((a, b) => Number(!!b.resetRequestedAt) - Number(!!a.resetRequestedAt));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    await admin.createUser(newUsername, newRole, newRole === "intern" ? newCohort : null);
    setNewUsername("");
  };

  const confirm = async () => {
    if (!pending) return;
    setPending(null);
    if (pending.kind === "role") await admin.updateUser(pending.user, { role: pending.role });
    else if (pending.kind === "reset") await admin.resetPin(pending.user);
    else await admin.updateUser(pending.user, { disabled: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fd-muted-foreground">
          PIN เป็นรหัสชั่วคราว แสดงครั้งเดียว · login ครั้งแรกแล้วเจ้าของบัญชีตั้งรหัสผ่านเอง · ใส่ผิด 5 ครั้งล็อก 15 นาที
          {admin.me && !isSuper && " · บัญชีพี่เลี้ยงสร้างและจัดการได้เฉพาะ Super admin"}
        </p>
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
              {admin.me?.superAdmin && <option value="dev">Dev (พี่เลี้ยง)</option>}
            </select>
          </Field>
          {newRole === "intern" && <CohortSelect cohorts={admin.cohorts} value={newCohort} onChange={setNewCohort} className={inputClass} />}
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
            className={`${toolbarInput} ps-9`}
          />
        </label>
        {/* ปุ่มกลุ่มแบบเดียวกับช่องกรอก (มุม 8px ขอบเดียว) ไม่ใช่ pill แยกกัน */}
        <div role="group" aria-label="กรองตามบทบาท" className="flex h-9 rounded-lg border border-fd-border p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={`rounded-md px-3 text-sm ${filter === f.id ? "bg-fd-primary font-semibold text-fd-primary-foreground" : "text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">กรองตามรุ่น</span>
          <select
            className={`${toolbarInput} w-auto`}
            value={String(cohortFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setCohortFilter(v === "all" || v === "none" ? v : Number(v));
              setPage(1);
            }}
          >
            <option value="all">รุ่น: ทุกรุ่น</option>
            {admin.cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="none">ไม่มีรุ่น</option>
          </select>
        </label>
      </div>

      {pending && (
        <ConfirmBox
          title={
            pending.kind === "role"
              ? `เปลี่ยน ${pending.user.username} เป็น ${ROLE_LABEL[pending.role]}?`
              : pending.kind === "disable"
                ? `ปิดบัญชี ${pending.user.username}?`
                : `ออก PIN ใหม่ให้ ${pending.user.username}?`
          }
          confirmLabel={pending.kind === "role" ? "เปลี่ยนบทบาท" : pending.kind === "disable" ? "ปิดบัญชี" : "ออก PIN ใหม่"}
          danger={pending.kind === "disable" || (pending.kind === "role" && pending.role === "dev")}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        >
          {CONFIRM_TEXT[pending.kind === "role" ? pending.role : pending.kind]}
        </ConfirmBox>
      )}

      {/* จอแคบ (มือถือ): แถวละการ์ด ปุ่มจัดการอยู่ในการ์ดเลย ไม่ต้องเลื่อนตารางไปขวาสุด (เดิมกว้าง 760px ในจอ 335px)
          ใช้ markup ชุดเดียวกับตาราง เปลี่ยนแค่ CSS ใต้ md: ข้อมูลไม่ต้องเขียนซ้ำ 2 ที่ · ชื่อช่องมาจาก data-label */}
      <div className="md:overflow-x-auto md:rounded-xl md:border md:border-fd-border">
        <table className="w-full text-sm max-md:block md:min-w-[760px]">
          <thead className="bg-fd-muted text-left max-md:hidden">
            <tr>
              <th className="px-3 py-2">ชื่อผู้ใช้</th>
              <th className="px-3 py-2">บทบาท</th>
              <th className="px-3 py-2">รุ่น</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">เข้าล่าสุด</th>
              <th className="px-3 py-2 text-end">จัดการ</th>
            </tr>
          </thead>
          <tbody className="max-md:flex max-md:flex-col max-md:gap-3">
            {shown.length === 0 && (
              <tr className="max-md:block">
                <td colSpan={6} className="px-3 py-6 text-center text-fd-muted-foreground max-md:block">
                  {admin.loading ? "กำลังโหลด…" : "ไม่พบบัญชีที่ตรงกับที่ค้นหา"}
                </td>
              </tr>
            )}
            {shown.map((u) => (
              <tr key={u.id} className="border-t border-fd-border max-md:grid max-md:grid-cols-2 max-md:gap-x-3 max-md:gap-y-2.5 max-md:rounded-xl max-md:border max-md:bg-fd-card max-md:p-3">
                {/* ทุกแถวมี 2 บรรทัด (ชื่อผู้ใช้ + ชื่อจริง) แถวจึงสูงเท่ากัน ยังไม่กรอกชื่อ = บอกตรงๆ */}
                <td className="px-3 py-2 max-md:col-span-2 max-md:p-0">
                  <span className="flex items-center gap-2 font-medium">
                    {/* น้อง: กดชื่อเปิดหน้าน้องรายคน (โปรไฟล์ ช่องติดต่อ ความคืบหน้า) */}
                    {u.role === "intern" ? (
                      <button type="button" onClick={() => nav.openIntern(u.id)} className="text-fd-primary underline-offset-2 hover:underline">
                        {u.username}
                      </button>
                    ) : (
                      u.username
                    )}
                    {u.role === "dev" && u.superAdmin && <span className="rounded-full bg-fd-primary/10 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-fd-primary">Super admin</span>}
                  </span>
                  <span className="block text-xs text-fd-muted-foreground">{u.fullName ?? "ยังไม่ระบุชื่อ"}</span>
                </td>
                {/* บทบาทเป็นป้ายนิ่ง ไม่ใช่ dropdown: สิทธิ์สำคัญ ไม่ควรเปลี่ยนได้จากการคลิกพลาด · Super admin เปลี่ยนผ่านปุ่มข้างป้าย (มีกล่องยืนยัน) */}
                <td data-label="บทบาท" className="px-3 py-2 max-md:p-0 max-md:before:block max-md:before:text-xs max-md:before:text-fd-muted-foreground max-md:before:content-[attr(data-label)]">
                  <span className="flex items-center gap-1">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                    {isSuper && !isMe(u) && (
                      <button
                        type="button"
                        aria-label={`เปลี่ยน ${u.username} เป็น${ROLE_LABEL[u.role === "intern" ? "dev" : "intern"]}`}
                        title={`เปลี่ยนเป็น${ROLE_LABEL[u.role === "intern" ? "dev" : "intern"]}`}
                        onClick={() => setPending({ kind: "role", user: u, role: u.role === "intern" ? "dev" : "intern" })}
                        className="inline-flex size-7 items-center justify-center rounded-md text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                      >
                        <ArrowLeftRight className="size-3.5" />
                      </button>
                    )}
                  </span>
                </td>
                <td data-label="รุ่น" className="px-3 py-2 whitespace-nowrap text-fd-muted-foreground max-md:p-0 max-md:whitespace-normal max-md:before:block max-md:before:text-xs max-md:before:text-fd-muted-foreground max-md:before:content-[attr(data-label)]">{u.role === "intern" ? cohortName(u.cohortId) : "–"}</td>
                <td data-label="สถานะ" className={`px-3 py-2 whitespace-nowrap max-md:p-0 max-md:before:block max-md:before:text-xs max-md:before:text-fd-muted-foreground max-md:before:content-[attr(data-label)] ${u.disabled || isLockedNow(u) || u.resetRequestedAt ? "text-orange-700 dark:text-orange-400" : ""}`}>
                  {u.disabled ? "ปิดอยู่" : u.resetRequestedAt ? "ขอรีเซ็ตรหัสผ่าน" : isLockedNow(u) ? "ล็อกชั่วคราว" : u.secretKind === "pin" ? "รอตั้งรหัสผ่าน" : "ใช้งาน"}
                  {u.resetRequestedAt && !u.disabled && <span className="block text-xs text-fd-muted-foreground">{fmt(u.resetRequestedAt)}</span>}
                </td>
                <td data-label="เข้าล่าสุด" className="px-3 py-2 whitespace-nowrap max-md:p-0 max-md:before:block max-md:before:text-xs max-md:before:text-fd-muted-foreground max-md:before:content-[attr(data-label)]">{fmt(u.lastLoginAt)}</td>
                <td className="px-3 py-2 max-md:col-span-2 max-md:border-t max-md:border-fd-border max-md:p-0 max-md:pt-2">
                  <div className="flex justify-end gap-1 whitespace-nowrap max-md:flex-wrap max-md:justify-start">
                    {isLockedNow(u) && (
                      <Button variant="ghost" onClick={() => admin.updateUser(u, { unlock: true })}>
                        ปลดล็อก
                      </Button>
                    )}
                    {(canManage(u) || isMe(u)) && (
                      // มีคำขอรีเซ็ต: ปุ่มเด่นขึ้น เป็นงานที่น้องรออยู่
                      <Button variant={u.resetRequestedAt ? "primary" : "ghost"} onClick={() => setPending({ kind: "reset", user: u })}>
                        ออก PIN ใหม่
                      </Button>
                    )}
                    {/* ไม่มีปุ่มให้กด = บอกเหตุผลแทนช่องว่าง (server ก็ไม่ให้ปิดบัญชีตัวเอง) */}
                    {isMe(u) ? (
                      <span className="inline-flex h-9 items-center px-2 text-xs text-fd-muted-foreground">บัญชีของคุณ</span>
                    ) : !canManage(u) ? (
                      <span className="inline-flex h-9 items-center px-2 text-xs text-fd-muted-foreground" title="บัญชีพี่เลี้ยงจัดการได้เฉพาะ Super admin">
                        เฉพาะ Super admin
                      </span>
                    ) : u.disabled ? (
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
