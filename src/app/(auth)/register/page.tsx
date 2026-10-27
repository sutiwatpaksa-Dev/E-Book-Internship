import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSessionToken, SESSION_COOKIE } from "@server/lib/session";
import { BrandMark } from "@/components/brand-mark";
import { RegisterForm } from "@/components/register-form";
import { HOME } from "@/lib/home-path";

export const metadata: Metadata = { title: "สมัครด้วยรหัสรุ่น" };

type Props = { searchParams: Promise<{ code?: string }> };

// สมัครเองด้วยรหัสรุ่นที่พี่เลี้ยงส่งในกลุ่ม · ลิงก์จากพี่เลี้ยงมี ?code= มาด้วย ช่องรหัสจึงกรอกไว้ให้แล้ว
// login อยู่แล้ว (เช่นกดลิงก์ซ้ำ) ไม่ต้องสมัครอีก พาไปหน้าแรกของบทบาท
export default async function RegisterPage({ searchParams }: Props) {
  const session = await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET ?? "");
  if (session) redirect(HOME[session.role]);
  const code = (await searchParams).code?.slice(0, 20) ?? "";

  return (
    <main className="flex min-h-screen items-start justify-center bg-fd-background px-4 py-10 sm:items-center">
      <div className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-fd-border bg-fd-card p-6 sm:p-8">
        <span className="flex items-center gap-2.5 font-bold">
          <BrandMark size={28} /> คู่มือฝึกงาน Blicktech
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold">สมัครด้วยรหัสรุ่น</h1>
          <p className="text-sm text-fd-muted-foreground">ใช้รหัสที่พี่เลี้ยงส่งในกลุ่มของรุ่น สมัครเสร็จแล้วเข้าใช้งานได้ทันที</p>
        </div>
        <RegisterForm initialCode={code} />
        <p className="text-center text-sm text-fd-muted-foreground">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="font-medium text-fd-primary hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </main>
  );
}
