import type { ComponentProps, ReactNode } from "react";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): ช่องกรอกพร้อมป้ายชื่อ
export const inputClass =
  "w-full rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm outline-none focus:border-fd-primary focus:ring-2 focus:ring-fd-primary/20";

export function Input(props: ComponentProps<"input">) {
  return <input className={inputClass} {...props} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
