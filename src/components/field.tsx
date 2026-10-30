import type { ComponentProps, ReactNode } from "react";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): ช่องกรอกพร้อมป้ายชื่อ
export const inputClass =
  "min-h-10 w-full rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-fd-muted-foreground/70 hover:border-fd-muted-foreground/50 focus:border-fd-primary focus:ring-2 focus:ring-fd-primary/20";

export function Input(props: ComponentProps<"input">) {
  return <input className={inputClass} {...props} />;
}

// hint = คำอธิบายสั้นใต้ช่อง (ตัวเล็กสีจาง) อยู่ใน label เดียวกัน โปรแกรมอ่านหน้าจออ่านต่อจากชื่อช่อง
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-fd-muted-foreground">{hint}</span>}
    </label>
  );
}
