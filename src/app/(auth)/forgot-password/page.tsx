import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ForgotForm } from "@/components/forgot-form";

export const metadata: Metadata = { title: "ลืมรหัสผ่าน" };

// ระบบไม่มีอีเมลของน้อง จึงรีเซ็ตผ่านพี่เลี้ยง: ขอที่นี่ → พี่เลี้ยงออก PIN ใหม่ → login แล้วตั้งรหัสผ่านใหม่
export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-fd-background px-4 py-10 sm:items-center">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-fd-border bg-fd-card p-6 sm:p-8">
        <span className="flex items-center gap-2.5 font-bold">
          <BrandMark size={28} /> คู่มือฝึกงาน Blicktech
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold">ลืมรหัสผ่าน</h1>
          <p className="text-sm text-fd-muted-foreground">ใส่ชื่อผู้ใช้ แล้วพี่เลี้ยงจะออก PIN ใหม่ให้ใช้ login ครั้งเดียว จากนั้นตั้งรหัสผ่านใหม่เอง</p>
        </div>
        <ForgotForm />
        <p className="text-center text-sm text-fd-muted-foreground">
          นึกออกแล้ว?{" "}
          <Link href="/login" className="font-medium text-fd-primary hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </main>
  );
}
