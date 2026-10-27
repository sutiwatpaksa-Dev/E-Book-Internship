"use client";

import { useSession } from "@/hooks/use-session";
import { PasswordForm } from "./password-form";

// ตั้งเสร็จ: โหลดหน้าที่ตั้งใจไปใหม่ทั้งหน้า (บัตรผ่านใหม่ไม่ใช่ชั่วคราวแล้ว server จึงยอมให้ผ่าน)
// มีปุ่มออกจากระบบไว้ด้วย เผื่อ login ผิดบัญชี (ไม่งั้นติดอยู่หน้านี้)
export function SetPasswordPanel({ username, next }: { username: string; next: string }) {
  const { logout } = useSession();
  return (
    <>
      <PasswordForm username={username} needCurrent={false} onDone={() => location.assign(next)} />
      <button
        type="button"
        onClick={async () => {
          await logout();
          location.assign("/login");
        }}
        className="min-h-11 self-center text-sm text-fd-muted-foreground hover:text-fd-foreground hover:underline"
      >
        ไม่ใช่บัญชีของฉัน · ออกจากระบบ
      </button>
    </>
  );
}
