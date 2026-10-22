"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./button";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): กล่องยืนยันก่อนทำสิ่งที่มีผลกับคนอื่น (ปิดบัญชี, ออก PIN ใหม่)
// แสดงในหน้าแทน confirm() ของเบราว์เซอร์ อ่านง่ายกว่าและอธิบายผลที่จะเกิดได้
type Props = { title: string; children: ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void };

export function ConfirmBox({ title, children, confirmLabel, danger, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  // โฟกัสปุ่ม "ยกเลิก" ก่อน: กด Enter เผลอๆ จะไม่ทำสิ่งที่ย้อนไม่ได้
  useEffect(() => cancelRef.current?.focus(), []);

  return (
    <div
      role="alertdialog"
      aria-label={title}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      className={`flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm ${danger ? "border-red-500/40 bg-red-500/5" : "border-fd-primary/40 bg-fd-primary/5"}`}
    >
      <strong>{title}</strong>
      <span className="text-fd-muted-foreground">{children}</span>
      <div className="flex justify-end gap-2">
        <Button ref={cancelRef} variant="ghost" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
