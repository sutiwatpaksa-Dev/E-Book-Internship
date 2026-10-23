"use client";

import { Copy } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { AdminState } from "@/hooks/use-admin";
import { toast } from "@/hooks/use-toast";
import { parseUsernameList } from "@/lib/username";
import type { BulkResult, Role } from "@/types";
import { Button } from "./button";
import { Field, inputClass } from "./field";

// สร้างบัญชีทีละหลายคน (เช่นน้องทั้งรุ่น): วางชื่อบรรทัดละคน ได้ตาราง PIN ไว้คัดลอกส่งในครั้งเดียว
// PIN อยู่ใน state ของกล่องนี้เท่านั้น ปิดกล่องหรือออกจากหน้าแล้วดูอีกไม่ได้ (ระบบเก็บแค่ hash)
export function AdminBulkCreate({ admin, onClose }: { admin: AdminState; onClose: () => void }) {
  const [text, setText] = useState("");
  const [role, setRole] = useState<Role>("intern");
  const [results, setResults] = useState<BulkResult[] | null>(null);

  // ตรวจทุกครั้งที่พิมพ์ ชี้ชื่อที่ผิดให้เห็นก่อนกดสร้าง แทนให้ server ปฏิเสธทั้งชุดโดยไม่บอกว่าชื่อไหน
  const { valid, invalid } = parseUsernameList(text);

  // ส่งเฉพาะชื่อที่ถูก ชื่อที่ผิดไปต่อท้ายตารางผลว่า "ข้าม" พร้อมเหตุผล จะได้เห็นครบทุกชื่อที่วางมา
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = await admin.createMany(valid, role);
    if (r) {
      setResults([...r, ...invalid]);
      setText("");
    }
  };

  const copyAll = async () => {
    const lines = (results ?? []).filter((r) => "pin" in r).map((r) => `${r.username}\t${"pin" in r ? r.pin : ""}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("คัดลอกแล้ว วางใน Excel ได้เป็นสองคอลัมน์");
    } catch {
      toast.error("คัดลอกไม่ได้ ลากเลือกจากตารางแทน");
    }
  };

  if (results) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-xl border border-green-600/40 bg-green-600/5 p-4">
        <p className="text-sm">
          <strong>PIN แสดงครั้งเดียว</strong> คัดลอกหรือจดก่อนปิด ส่งให้น้องแต่ละคนทางช่องทางส่วนตัว
        </p>
        <table className="w-full max-w-md text-sm">
          <tbody>
            {results.map((r) => (
              <tr key={r.username} className="border-t border-fd-border first:border-0">
                <td className="py-1.5 pe-4 font-medium">{r.username}</td>
                <td className="py-1.5">
                  {"pin" in r ? <code className="font-bold tracking-[0.2em]">{r.pin}</code> : <span className="text-orange-700 dark:text-orange-400">ข้าม: {r.error}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2">
          <Button onClick={copyAll}>
            <Copy className="size-4" /> คัดลอกทั้งหมด
          </Button>
          <Button variant="ghost" onClick={onClose}>
            ปิด (ดู PIN อีกไม่ได้)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-4">
      <Field label="ชื่อผู้ใช้ บรรทัดละคน (สูงสุด 50)">
        <textarea
          className={`${inputClass} min-h-32 font-mono`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"somchai.j\nsomying.k\nmanee.p"}
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </Field>
      {invalid.length > 0 && (
        <div role="alert" className="rounded-lg border border-orange-500/40 bg-orange-500/5 px-3 py-2 text-sm">
          <p>ชื่อเหล่านี้ใช้ไม่ได้ จะถูกข้าม (แก้ในช่องด้านบนก่อนกดสร้างก็ได้)</p>
          <ul className="mt-1 list-disc ps-5">
            {invalid.map((n) => (
              <li key={n.username}>
                <code>{n.username}</code> · {n.error}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <Field label="บทบาท">
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="intern">Internship</option>
            <option value="dev">Dev (พี่เลี้ยง)</option>
          </select>
        </Field>
        <Button type="submit" disabled={valid.length === 0 || valid.length > 50}>
          สร้าง {valid.length} บัญชี
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          ยกเลิก
        </Button>
      </div>
      <p className="text-xs text-fd-muted-foreground">
        {valid.length > 50 ? "ครั้งละไม่เกิน 50 ชื่อ แบ่งส่งเป็นหลายรอบ" : "ชื่อที่มีอยู่แล้วจะถูกข้าม คนอื่นยังสร้างได้ตามปกติ"}
      </p>
    </form>
  );
}
