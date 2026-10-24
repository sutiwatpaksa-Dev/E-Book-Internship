import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

// คำใบ้ในส่วน "ลองเอง" ของการ์ด: พับไว้ เปิดทีละระดับ (1 ชี้ทิศ → 2 บอกเครื่องมือ → 3 โครงคร่าวๆ)
// ไม่มีเฉลยเต็ม ตั้งใจให้น้องคิดต่อเอง ติดจริงหลังระดับ 3 ค่อยถามพี่เลี้ยง
export function Hint({ level, children }: { level: 1 | 2 | 3; children: ReactNode }) {
  return (
    <details className="group my-2 rounded-lg border bg-fd-card px-4 py-2">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm font-medium text-fd-primary">
        <Lightbulb className="size-4" />
        คำใบ้ {level}
        <span className="text-xs font-normal text-fd-muted-foreground group-open:hidden">(กดเพื่อเปิด)</span>
      </summary>
      <div className="pt-1 text-sm">{children}</div>
    </details>
  );
}
