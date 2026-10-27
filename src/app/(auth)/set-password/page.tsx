import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSessionToken, SESSION_COOKIE } from "@server/lib/session";
import { BrandMark } from "@/components/brand-mark";
import { SetPasswordPanel } from "@/components/set-password-panel";
import { safeNext } from "@/lib/home-path";

export const metadata: Metadata = { title: "ตั้งรหัสผ่าน" };

type Props = { searchParams: Promise<{ next?: string }> };

// หน้าแรกหลัง login ด้วย PIN ชั่วคราว: ตั้งรหัสผ่านของตัวเองก่อนเข้าใช้งาน
// ยังไม่ login → ไปหน้า login · ตั้งรหัสแล้ว (บัตรไม่ใช่ชั่วคราว) → ไปหน้าที่ตั้งใจเลย (เปลี่ยนรหัสอยู่ในหน้าโปรไฟล์)
export default async function SetPasswordPage({ searchParams }: Props) {
  const session = await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET ?? "");
  if (!session) redirect("/login");
  const next = safeNext((await searchParams).next, session.role);
  if (!session.tmp) redirect(next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-fd-background px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-fd-border bg-fd-card p-6 sm:p-8">
        <span className="flex items-center gap-2.5 font-bold">
          <BrandMark size={28} /> คู่มือฝึกงาน Blicktech
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold">ตั้งรหัสผ่านของคุณ</h1>
          <p className="text-sm text-fd-muted-foreground">
            สวัสดี <strong className="text-fd-foreground">{session.username}</strong> · PIN จากพี่เลี้ยงใช้ได้แค่ครั้งแรก ตั้งรหัสผ่านที่จำได้คนเดียว ครั้งหน้าใช้รหัสนี้ login
          </p>
        </div>
        <SetPasswordPanel username={session.username} next={next} />
      </div>
    </main>
  );
}
