"use client";

import type { MouseEvent, ReactNode } from "react";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): ลิงก์หลักของแถวในตาราง/รายการ
// เป็น <a href> จริง (screen reader อ่านเป็นลิงก์ เปิดแท็บใหม่ได้) แล้วขยายพื้นที่กดให้คลุมทั้งแถว
// ใช้คู่กับแถวที่เป็น `relative` · ปุ่มอื่นในแถวต้องใส่ `relative z-10` ไม่งั้นถูกลิงก์บัง
export function RowLink({ href, onGo, children, className = "" }: { href: string; onGo: () => void; children: ReactNode; className?: string }) {
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    // Ctrl/⌘/Shift/กลางเมาส์ = ปล่อยให้ browser เปิดแท็บใหม่ตามปกติ
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onGo();
  };
  return (
    <a href={href} onClick={click} className={`font-medium text-fd-primary after:absolute after:inset-0 after:content-[''] hover:underline ${className}`}>
      {children}
    </a>
  );
}
