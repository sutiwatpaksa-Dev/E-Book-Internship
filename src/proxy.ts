import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@server/lib/session";
import { HOME, safeNext } from "@/lib/home-path";

// ประตูหน้าเว็บ ทำงานก่อน render หน้า (Next 16 เรียกไฟล์นี้ว่า proxy แทน middleware เดิม)
// - เปิด / : ยังไม่ login → หน้า login ก่อนเสมอ · login อยู่แล้ว → หน้าแรกของบทบาท
// - เปิด /login ทั้งที่ login อยู่ → ไม่ต้องกรอกซ้ำ ส่งไปหน้าที่ตั้งใจไป (?next=) หรือหน้าแรก
// ตัดสินที่นี่แทนในหน้า เพราะหน้าคู่มือและหน้า login จะยังเป็นไฟล์ static ได้ (ไม่ต้องอ่าน cookie ตอน render)
// ตรวจจากบัตรผ่านตัวจริง (httpOnly ลงลายเซ็น) ไม่ใช่ cookie คำใบ้ bt_role ที่ใครก็แก้เองได้
export async function proxy(req: NextRequest) {
  const secret = process.env.SESSION_SECRET ?? "";
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const role = secret ? (await readSessionToken(token, secret))?.role : undefined;
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === "/") return NextResponse.redirect(new URL(role ? HOME[role] : "/login", req.url));
  if (role) return NextResponse.redirect(new URL(safeNext(searchParams.get("next"), role), req.url));
  return NextResponse.next();
}

// ทำงานแค่ 2 path นี้ หน้าอื่นและไฟล์รูป/JS ไม่ผ่าน proxy เลย
export const config = { matcher: ["/", "/login"] };
