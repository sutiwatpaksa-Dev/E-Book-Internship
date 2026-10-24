"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";

// ลิงก์ "ถามพี่เลี้ยง" ในเนื้อหา: login แล้วเลื่อนไปกล่องถามท้ายหน้า (AskQuestion)
// ยังไม่ login กล่องนั้นไม่แสดง จึงพาไป login แล้วกลับมาหน้าเดิม
export function AskLink({ className, children }: { className?: string; children: ReactNode }) {
  const { role } = useSession();
  const pathname = usePathname();
  return (
    <Link href={role ? "#ask-title" : `/login?next=${encodeURIComponent(pathname)}`} className={className}>
      {children}
    </Link>
  );
}
