import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { steps } from "@/data/learn";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

// หน้า login อยู่ในกลุ่ม (auth) แยกจาก (docs): ไม่มี headbar และ sidebar สารบัญ
// เพราะคนที่ยังไม่ login ต้องการแค่ 2 อย่าง คือรู้ว่าเว็บนี้คืออะไร กับช่องกรอก
// จอกว้าง: ซ้ายบอกเรื่องคู่มือ ขวาเป็นฟอร์ม · มือถือ: ส่วนบอกเรื่องย่อเหลือหัวข้อ แล้วฟอร์มต่อด้านล่าง
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <section
        aria-label="คู่มือนี้คืออะไร"
        className="relative isolate flex flex-col gap-5 overflow-hidden bg-(--login-panel-bg) px-5 py-7 text-(--login-panel-fg) md:flex-1 md:gap-7 md:px-14 md:py-14"
      >
        {/* รูปเป็นของตกแต่ง (alt ว่าง ให้โปรแกรมอ่านหน้าจอข้ามไป)
            จอกว้าง: เลื่อนรูปไปขวา (ล้นขอบขวาเล็กน้อย) ให้จุด 7 ขั้นในรูปไม่ทับรายการ 7 ขั้นที่เป็นตัวหนังสือ
            ชั้นไล่สีซ้าย→ขวาทับอีกชั้น: ฝั่งตัวหนังสือทึบ อ่านได้เสมอ และกลบรอยต่อขอบซ้ายของรูป */}
        <div aria-hidden className="absolute inset-0 -z-10 md:-right-[8%] md:left-[22%]">
          <Image
            src="/brand/login-bg.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover object-right-bottom"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-r from-(--login-panel-bg) from-25% via-(--login-panel-bg)/60 via-50% to-transparent max-md:via-(--login-panel-bg)/75"
        />
        <Link href="/" className="flex w-fit items-center gap-2.5 text-lg font-bold">
          <span className="rounded-lg bg-fd-background p-1">
            <BrandMark size={28} />
          </span>
          คู่มือฝึกงาน Blicktech
        </Link>
        <h1 className="max-w-lg text-2xl leading-snug font-bold md:text-4xl md:leading-tight">
          ทำซอฟต์แวร์ 1 ระบบ ให้ครบ 7 ขั้น แบบที่ทีมจริงทำ
        </h1>
        <ol className="flex flex-col gap-2.5 max-md:hidden">
          {steps.map((s) => (
            <li key={s.slug} className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--login-panel-fg)/15 text-sm font-bold">
                {s.num}
              </span>
              <span className="font-semibold">{s.name}</span>
              <span className="opacity-75">{s.th}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm opacity-80 md:hidden">{steps.map((s) => s.name).join(" → ")}</p>
        <p className="mt-auto max-w-xs text-sm opacity-80 max-md:hidden">
          เครื่องมืออย่าง Git, Docker, SQL เป็นการ์ดที่หยิบมาอ่านตอนต้องใช้ ไม่ต้องอ่านทั้งเล่มก่อนเริ่ม
        </p>
      </section>

      <main className="flex flex-1 justify-center bg-fd-background px-5 py-8 md:items-center md:px-6 md:py-12">
        <div className="flex w-full max-w-sm flex-col gap-5">
          <div>
            <h2 className="text-2xl font-bold">เข้าสู่ระบบ</h2>
            <p className="mt-1 text-fd-muted-foreground">ใช้ชื่อผู้ใช้และ PIN ที่พี่เลี้ยงให้</p>
          </div>
          <LoginForm />
          <p className="text-sm text-fd-muted-foreground">
            ลืม PIN หรือยังไม่มีบัญชี บอกพี่เลี้ยงให้ตั้งให้ · ใส่ผิดหลายครั้งระบบจะล็อกไว้ชั่วคราว
          </p>
          <hr className="border-fd-border" />
          <Link href="/learn/cards" className="inline-flex min-h-11 items-center font-medium text-fd-primary hover:underline">
            อ่านคลังการ์ดโดยไม่ login →
          </Link>
          <p className="text-xs text-fd-muted-foreground">
            ต้อง login เฉพาะส่วน STARTER และ Requirement (โจทย์ที่บริษัทใช้กับลูกค้าจริง) · ระบบหน้านี้ทำแบบเดียวกับการ์ด{" "}
            <Link href="/learn/cards/jwt-cookie" className="underline">
              JWT ใน cookie
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
