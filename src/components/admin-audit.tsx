"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/api/admin.api";
import { AUDIT_GROUPS, AUDIT_LABEL, auditGroupOf, type AuditGroup } from "@/lib/audit-labels";
import type { AuditEntry } from "@/types";
import { ROLE_LABEL } from "./account-menu";
import { ErrorText } from "./error-text";

// บันทึกการกระทำ 200 รายการล่าสุด: ใครทำอะไรกับใครเมื่อไร (ดูอย่างเดียว แก้หรือลบไม่ได้)
// โหลดเมื่อเปิดแท็บนี้เท่านั้น ไม่โหลดพร้อมหน้าอื่นเพราะไม่ได้ใช้ทุกวัน
// กรองตามเรื่องและคนทำในเบราว์เซอร์ (200 แถวกรองเองเร็วพอ ไม่ต้องให้ server ค้นใหม่)
export function AdminAudit() {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState("");
  const [group, setGroup] = useState<AuditGroup | "all">("all");
  const [actor, setActor] = useState("");

  useEffect(() => {
    adminApi
      .audit()
      .then(setRows)
      .catch((e: Error) => setError(e.message));
  }, []);

  const detail = (r: AuditEntry) => (r.detail && (r.detail === "intern" || r.detail === "dev") ? ROLE_LABEL[r.detail] : r.detail);

  const actors = [...new Set((rows ?? []).map((r) => r.actor))].sort();
  const shown = (rows ?? []).filter((r) => (group === "all" || auditGroupOf(r.action) === group) && (!actor || r.actor === actor));

  return (
    <div className="flex flex-col gap-3">
      {error && <ErrorText>{error}</ErrorText>}
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="กรองตามเรื่อง" className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ id: "all" as const, label: "ทั้งหมด" }, ...AUDIT_GROUPS].map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => setGroup(g.id)}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${group === g.id ? "border-fd-primary bg-fd-primary text-fd-primary-foreground" : "border-fd-border hover:bg-fd-accent"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-medium sm:ms-auto">
          ใครทำ
          <select value={actor} onChange={(e) => setActor(e.target.value)} className="min-h-11 rounded-lg border border-fd-border bg-fd-background px-3">
            <option value="">ทุกคน</option>
            {actors.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="relative overflow-x-auto rounded-xl border border-fd-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-fd-muted text-left">
            <tr>
              <th className="px-3 py-2">เมื่อ</th>
              <th className="px-3 py-2">ใครทำ</th>
              <th className="px-3 py-2">ทำอะไร</th>
              <th className="px-3 py-2">กับ</th>
              <th className="px-3 py-2">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-fd-muted-foreground">
                  {rows === null ? "กำลังโหลด…" : rows.length === 0 ? "ยังไม่มีบันทึก" : "ไม่มีรายการตรงกับที่เลือก"}
                </td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-fd-border">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString("th-TH")}</td>
                <td className="px-3 py-2">{r.actor}</td>
                <td className="px-3 py-2 whitespace-nowrap">{AUDIT_LABEL[r.action] ?? r.action}</td>
                <td className="px-3 py-2">{r.target}</td>
                <td className="px-3 py-2 text-fd-muted-foreground">{detail(r) ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-fd-muted-foreground">เริ่มบันทึกตั้งแต่ v2.0.4c · แสดง 200 รายการล่าสุด</p>
    </div>
  );
}
