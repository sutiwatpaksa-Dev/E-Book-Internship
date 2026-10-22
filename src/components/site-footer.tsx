import Image from "next/image";
import Link from "next/link";

// ส่วนท้ายทุกหน้า: ข้อความใน [ ] คือที่ว่างรอข้อมูลจริงจากบริษัท (ยังไม่ได้รับ จึงไม่ใส่ข้อมูลเดาเอง)
export function SiteFooter({ version }: { version: string }) {
  return (
    <footer className="bg-(--footer-bg) text-(--footer-fg)">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 pt-8 pb-6 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            {/* พื้นขาวทั้งสองโหมด จึงใช้โลโก้แบบสว่างเสมอ */}
            <span className="rounded-lg bg-white p-1">
              <Image src="/brand/mark.png" alt="" width={24} height={24} />
            </span>
            <span className="font-bold text-white">คู่มือฝึกงาน Blicktech</span>
          </div>
          <p className="leading-relaxed">
            บริษัท บลิคซ์เทค คอนซัลแทนท์ จำกัด
            <br />
            [ที่อยู่บริษัท]
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-white">ติดต่อพี่เลี้ยง</span>
          <span>[ช่องทางติดต่อ เช่น LINE กลุ่มฝึกงาน]</span>
          <span>[อีเมลพี่เลี้ยง]</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-white">ลิงก์</span>
          <Link href="/changelog" className="hover:text-white hover:underline">
            มีอะไรใหม่ (v{version})
          </Link>
          <a href="https://roadmap.sh/full-stack" target="_blank" rel="noopener" className="hover:text-white hover:underline">
            ลำดับหัวข้ออ้างอิงจาก roadmap.sh
          </a>
          <a href="https://github.com/sutiwatpaksa-Dev/E-Book-Internship" target="_blank" rel="noopener" className="hover:text-white hover:underline">
            ซอร์สโค้ดของเว็บนี้ (GitHub)
          </a>
        </div>
      </div>
      <p className="border-t border-(--footer-line) px-6 py-3 text-center text-xs text-(--footer-muted)">
        สร้างด้วย Next.js + Fumadocs · React · TypeScript · Tailwind · Hono · stack เดียวกับที่คู่มือสอน
      </p>
    </footer>
  );
}
