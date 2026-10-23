"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/api/admin.api";
import { AUDIT_LABEL } from "@/lib/audit-labels";
import type { AuditEntry } from "@/types";
import { ROLE_LABEL } from "./account-menu";
import { ErrorText } from "./error-text";

// บันทึกการกระทำ 200 รายการล่าสุด: ใครทำอะไรกับใครเมื่อไร (ดูอย่างเดียว แก้หรือลบไม่ได้)
// โหลดเมื่อเปิดแท็บนี้เท่านั้น ไม่โหลดพร้อมหน้าอื่นเพราะไม่ได้ใช้ทุกวัน
export function AdminAudit() {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .audit()
      .then(setRows)
      .catch((e: Error) => setError(e.message));
  }, []);

  const detail = (r: AuditEntry) => (r.detail && (r.detail === "intern" || r.detail === "dev") ? ROLE_LABEL[r.detail] : r.detail);

  return (
    <div className="flex flex-col gap-3">
      {error && <ErrorText>{error}</ErrorText>}
      <div className="overflow-x-auto rounded-xl border border-fd-border">
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
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-fd-muted-foreground">
                  {rows === null ? "กำลังโหลด…" : "ยังไม่มีบันทึก"}
                </td>
              </tr>
            )}
            {rows?.map((r) => (
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
