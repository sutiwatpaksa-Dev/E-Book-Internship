"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import Link from "next/link";
import { dismissToast, useToasts, type Toast } from "@/hooks/use-toast";

const LOOK: Record<Toast["tone"], { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: "text-green-700 dark:text-green-400" },
  error: { icon: XCircle, className: "text-red-700 dark:text-red-400" },
  info: { icon: Info, className: "text-fd-primary" },
};

// ที่แสดง toast ทั้งเว็บ (วางครั้งเดียวใน layout หลัก) · มือถืออยู่กลางล่าง จอใหญ่อยู่มุมขวาล่าง
// role="status" ให้โปรแกรมอ่านหน้าจออ่านข้อความใหม่โดยไม่ขัดสิ่งที่กำลังอ่านอยู่
export function Toaster() {
  const toasts = useToasts();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:end-4 sm:items-end">
      {toasts.map((t) => {
        const { icon: Icon, className } = LOOK[t.tone];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-fd-border bg-fd-popover px-3.5 py-3 text-sm text-fd-popover-foreground shadow-lg"
          >
            <Icon className={`mt-0.5 size-4 shrink-0 ${className}`} />
            <span className="min-w-0 flex-1">
              {t.text}
              {t.link && (
                <>
                  {" "}
                  <Link href={t.link.href} onClick={() => dismissToast(t.id)} className="font-medium text-fd-primary underline">
                    {t.link.label}
                  </Link>
                </>
              )}
            </span>
            <button type="button" onClick={() => dismissToast(t.id)} aria-label="ปิด" className="-me-1 rounded p-0.5 text-fd-muted-foreground hover:bg-fd-accent">
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
