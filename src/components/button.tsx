import type { ComponentProps } from "react";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): ไม่รู้ว่าปุ่มนี้ทำอะไร รับทุกอย่างผ่าน props
// (ดูบทเสริม "จัดโครงสร้างโปรเจกต์" หัวข้อแยก component เป็น 2 ระดับ)
type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "ghost" | "danger" };

const LOOK = {
  primary: "bg-fd-primary text-fd-primary-foreground hover:brightness-110 active:brightness-95",
  ghost: "border border-fd-border bg-fd-background hover:bg-fd-accent",
  danger: "bg-red-700 text-white hover:bg-red-800 active:bg-red-900",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${LOOK[variant]} ${className}`}
      {...props}
    />
  );
}
