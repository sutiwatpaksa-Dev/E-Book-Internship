import type { ComponentProps } from "react";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): ไม่รู้ว่าปุ่มนี้ทำอะไร รับทุกอย่างผ่าน props
// (ดูบทเสริม "จัดโครงสร้างโปรเจกต์" หัวข้อแยก component เป็น 2 ระดับ)
type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "ghost" | "danger" };

const LOOK = {
  primary: "bg-fd-primary text-fd-primary-foreground hover:opacity-90",
  ghost: "border border-fd-border hover:bg-fd-accent",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${LOOK[variant]} ${className}`}
      {...props}
    />
  );
}
