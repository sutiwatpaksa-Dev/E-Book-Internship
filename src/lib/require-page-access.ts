import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSessionToken, SESSION_COOKIE } from "@server/lib/session";
import { gate } from "./page-access";

// ด่านตรวจสิทธิ์ก่อนส่งหน้าที่ล็อก ทำงานฝั่ง server ทุกครั้ง (พิมพ์ URL ตรงๆ ก็ต้องผ่านด่านนี้)
// หน้าทั่วไปไม่แตะ cookie เลย Next จึงยังสร้างเป็นไฟล์ static ได้ เร็วและไม่เปลืองเครื่อง
export async function requirePageAccess(pathname: string) {
  if (gate(pathname, null) === "allow") return;

  const secret = process.env.SESSION_SECRET ?? "";
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = secret ? await readSessionToken(token, secret) : null;
  // ยังถือ PIN ชั่วคราว: หน้าที่ล็อกเปิดไม่ได้จนกว่าจะตั้งรหัสผ่าน (API ก็กันไว้เหมือนกัน)
  if (session?.tmp) redirect(`/set-password?next=${encodeURIComponent(pathname)}`);
  const result = gate(pathname, session?.role ?? null);
  if (result === "allow") return;

  const next = encodeURIComponent(pathname);
  redirect(result === "login" ? `/login?next=${next}` : `/no-access?next=${next}`);
}
