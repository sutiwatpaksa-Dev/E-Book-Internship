"use client";

import { ChevronDown, ExternalLink, FolderKanban } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { requirementUrl } from "@/api/files.api";
import { useCardAssignments } from "@/hooks/use-card-assignments";
import { useSession } from "@/hooks/use-session";
import { hasCardAssignment, pickCardAssignment } from "@/lib/card-assignment";
import { inputClass } from "./field";

// กล่องโจทย์ฝึกงานในหัวการ์ด: พับเป็น 1 บรรทัดเสมอ (ไม่ดันเนื้อการ์ดลงไป) กดแล้วขยายดูว่าการ์ดนี้ใช้ตอนไหนของโจทย์ที่เลือก
// เลือกโจทย์อื่นที่ตัวเองดูได้ (น้อง = ของรุ่นตัวเอง · พี่เลี้ยง = ทุกโจทย์) · จำโจทย์ที่เลือกไว้ในเบราว์เซอร์
// ข้อความมาจากที่พี่เลี้ยงผูกการ์ดกับโจทย์ในหลังบ้าน (STARTER ที่ยังไม่มีใครผูกใช้ข้อความสำรองใน learn.ts)
const STORAGE_KEY = "bt-card-box-assignment";

export function AssignmentBox({ card }: { card: string }) {
  const { role } = useSession();
  const { items, loading } = useCardAssignments(card, role !== null);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const panelId = useId();

  useEffect(() => {
    setSaved(localStorage.getItem(STORAGE_KEY));
  }, []);

  if (role === null) return null;
  // จองที่ 1 บรรทัดระหว่างโหลด ไม่ให้เนื้อหาข้างล่างกระตุกตอนกล่องโผล่
  if (loading) return <div className="h-9" aria-hidden />;
  if (!hasCardAssignment(items)) return null;

  const current = pickCardAssignment(items, saved)!;
  const choose = (slug: string) => {
    setSaved(slug);
    localStorage.setItem(STORAGE_KEY, slug);
  };

  return (
    <div className="not-prose text-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-lg text-fd-muted-foreground hover:text-fd-foreground pointer-coarse:min-h-11"
      >
        <FolderKanban className="size-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 break-words text-start">
          โจทย์ฝึกงาน: <span className="font-medium text-fd-foreground">{current.name}</span>
        </span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div id={panelId} className="mt-1 flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-3">
          {items.length > 1 && (
            <label className="flex flex-col gap-1 text-xs font-medium text-fd-muted-foreground">
              ดูโจทย์
              <select className={`${inputClass} h-10 py-0 text-sm text-fd-foreground`} value={current.slug} onChange={(e) => choose(e.target.value)}>
                {items.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.name}
                    {a.bound ? "" : " (ยังไม่ได้ระบุการใช้การ์ดนี้)"}
                  </option>
                ))}
              </select>
            </label>
          )}
          {current.bound ? (
            <p className="whitespace-pre-line break-words text-fd-foreground">{current.note || "การ์ดนี้ใช้ในโจทย์นี้ (พี่เลี้ยงยังไม่ได้เขียนรายละเอียดว่าใช้ตอนไหน)"}</p>
          ) : (
            <p className="text-fd-muted-foreground">พี่เลี้ยงยังไม่ได้ระบุว่าการ์ดนี้ใช้ตอนไหนของโจทย์ {current.name}</p>
          )}
          {current.brief && <p className="whitespace-pre-line break-words text-xs text-fd-muted-foreground">{current.brief}</p>}
          <a
            href={requirementUrl(current.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 w-fit items-center gap-1.5 font-medium text-fd-primary hover:underline pointer-coarse:min-h-11"
          >
            เปิดไฟล์โจทย์ (PDF) <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      )}
    </div>
  );
}
