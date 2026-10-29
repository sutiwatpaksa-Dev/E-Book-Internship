import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { BrandMark } from "@/components/brand-mark";
import { NotificationBell } from "@/components/notification-bell";
import { TODAY_URL } from "@/lib/nav-tree";

// หลังบ้านพี่เลี้ยง (/dev/...) แยก layout จากหน้าคู่มือ: ไม่มีสารบัญบทเรียน มีแค่แถบบนกับพื้นที่ทำงาน
// แบบเดียวกับหน้า "จัดการร้าน" ของงาน STARTER ที่แยกจากหน้าเว็บของลูกค้า
export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-fd-border bg-fd-background/95 backdrop-blur-sm">
        <div className="flex h-16 items-center gap-3 px-4">
          <BrandMark size={30} />
          {/* มือถือ: เหลือคำว่า "หลังบ้าน" บรรทัดเดียว ปุ่มด้านขวาจะได้ไม่โดนบีบ */}
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-bold">
              <span className="max-sm:hidden">คู่มือฝึกงาน · </span>หลังบ้าน
            </span>
            <span className="text-[11px] text-fd-muted-foreground max-sm:hidden">สำหรับพี่เลี้ยง (Dev)</span>
          </span>
          {/* ไม่ใช้ "/" เพราะ src/proxy.ts ส่งพี่เลี้ยงที่เปิด / กลับมาหลังบ้าน ปุ่มนี้จะวนอยู่ที่เดิม */}
          <Link href={TODAY_URL} aria-label="กลับไปหน้าคู่มือ" className="ms-auto inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm hover:bg-fd-accent max-sm:px-2">
            <ArrowLeft className="size-4" />
            <span className="max-sm:hidden">กลับไปหน้าคู่มือ</span>
          </Link>
          {/* สลับธีมสว่าง/มืด ตัวเดียวกับแถบบนของหน้าคู่มือ (จำค่าไว้ในเบราว์เซอร์) */}
          <ThemeSwitch className="shrink-0" />
          <NotificationBell />
          <AccountMenu />
        </div>
      </header>
      {/* จอกว้างใช้ได้ถึง 1536px: เดิม max-w-6xl (1152px) ลบเมนูซ้ายแล้วเหลือแคบ ตารางต้องเลื่อนซ้าย-ขวาทั้งที่จอยังว่าง */}
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
    </>
  );
}
