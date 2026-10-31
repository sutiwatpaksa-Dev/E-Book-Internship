import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// ชิ้นส่วนพื้นฐาน (ระดับ 1): กล่องบอกว่าส่วนนี้ยังไม่มีข้อมูล หรือยังไม่เปิดใช้ (แทนการใส่ข้อมูลปลอม)
export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-fd-border bg-fd-card px-6 py-10 text-center text-sm text-fd-muted-foreground">
      <Icon className="size-7 text-fd-muted-foreground" />
      <strong className="text-base text-fd-foreground">{title}</strong>
      <div className="max-w-md leading-relaxed">{children}</div>
      {action}
    </div>
  );
}
