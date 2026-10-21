import type { ReactNode } from "react";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): กล่องข้อความผิดพลาด role="alert" ให้โปรแกรมอ่านหน้าจออ่านทันที
export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
      {children}
    </p>
  );
}
