import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { BrandMark } from "@/components/brand-mark";
import { TODAY_URL } from "@/lib/nav-tree";

// หลังบ้านพี่เลี้ยง (/dev/...) แยก layout จากหน้าคู่มือ: ไม่มีสารบัญบทเรียน มีแค่แถบบนกับพื้นที่ทำงาน
// แบบเดียวกับหน้า "จัดการร้าน" ของงาน STARTER ที่แยกจากหน้าเว็บของลูกค้า
export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-fd-border bg-fd-background/95 backdrop-blur-sm">
        <div className="flex h-16 items-center gap-3 px-4">
          <BrandMark size={30} />
          <span className="flex flex-col leading-tight">
            <span className="font-bold">คู่มือฝึกงาน · หลังบ้าน</span>
            <span className="text-[11px] text-fd-muted-foreground">สำหรับพี่เลี้ยง (Dev)</span>
          </span>
          {/* ไม่ใช้ "/" เพราะ src/proxy.ts ส่งพี่เลี้ยงที่เปิด / กลับมาหลังบ้าน ปุ่มนี้จะวนอยู่ที่เดิม */}
          <Link href={TODAY_URL} className="ms-auto inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm hover:bg-fd-accent">
            <ArrowLeft className="size-4" />
            <span className="max-sm:hidden">กลับไปหน้าคู่มือ</span>
          </Link>
          <AccountMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">{children}</main>
    </>
  );
}
