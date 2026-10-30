import Image from "next/image";
import Link from "next/link";
import { FooterChapters } from "./footer-chapters";

// ส่วนท้ายทุกหน้า: ซ้าย = ชื่อคู่มือ + ลิงก์ · ขวา = บทเรียนฉบับเต็ม (ทางเข้าบทยาวแบบเดิม ไม่แย่งที่การ์ด)
// ข้อมูลบริษัท/ช่องทางติดต่อยังไม่ได้รับ จึงยังไม่ใส่ (ไม่ใส่ข้อมูลเดาเอง)
export function SiteFooter({ version }: { version: string }) {
  return (
    <footer className="bg-(--footer-bg) text-(--footer-fg)">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 text-sm lg:grid-cols-[13rem_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            {/* พื้นขาวทั้งสองโหมด จึงใช้โลโก้แบบสว่างเสมอ */}
            <span className="rounded-lg bg-white p-1">
              <Image src="/brand/mark.png" alt="" width={24} height={24} />
            </span>
            <span className="font-bold text-white">คู่มือฝึกงาน Blicktech</span>
          </div>
          <nav aria-label="ลิงก์ท้ายเว็บ" className="flex flex-col gap-1 text-[13px]">
            <Link href="/changelog" className="flex min-h-11 items-center hover:text-white hover:underline md:min-h-7">
              มีอะไรใหม่ (v{version})
            </Link>
            <a href="https://roadmap.sh/full-stack" target="_blank" rel="noopener" className="flex min-h-11 items-center hover:text-white hover:underline md:min-h-7">
              ลำดับหัวข้ออ้างอิงจาก roadmap.sh
            </a>
            <a href="https://github.com/sutiwatpaksa-Dev/E-Book-Internship" target="_blank" rel="noopener" className="flex min-h-11 items-center hover:text-white hover:underline md:min-h-7">
              ซอร์สโค้ดของเว็บนี้ (GitHub)
            </a>
          </nav>
        </div>
        <FooterChapters />
      </div>
      <p className="border-t border-(--footer-line) px-6 py-3 text-center text-xs text-(--footer-muted)">
        สร้างด้วย Next.js + Fumadocs · React · TypeScript · Tailwind · Hono · stack เดียวกับที่คู่มือสอน
      </p>
    </footer>
  );
}
