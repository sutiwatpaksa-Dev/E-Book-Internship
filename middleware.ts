import { gate, isPageRequest } from "./server/middleware/page-gate";
import { readCookie, readSessionToken, SESSION_COOKIE } from "./server/lib/session";

// Vercel Routing Middleware: ทำงานก่อนส่งไฟล์ static ทุกไฟล์ที่ตรง matcher
// เว็บนี้เป็น static ถ้าซ่อนแค่ปุ่มในหน้าเว็บ คนยังพิมพ์ URL เปิดเองได้ การตรวจจึงต้องอยู่ฝั่ง server ตรงนี้
export const config = {
  runtime: "nodejs", // โปรเจกต์ใช้ Bun runtime (bunVersion) ซึ่ง Vercel ให้ตั้งค่านี้ไว้ใน middleware
  matcher: ["/starter", "/starter/:path*", "/steps/:path*", "/dev", "/dev/:path*", "/assets/:file(starter_.*|steps_.*|dev_.*)"],
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.SESSION_SECRET ?? "";
  const session = secret ? await readSessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), secret) : null;
  const result = gate(url.pathname, session?.role ?? null);
  if (result === "allow") return; // ไม่คืนค่า = ส่งไฟล์ตามปกติ

  if (!isPageRequest(url.pathname)) return new Response(null, { status: result === "login" ? 401 : 403 });
  const to = new URL(result === "login" ? "/login" : "/no-access", url);
  to.searchParams.set("next", url.pathname);
  return Response.redirect(to, 307);
}
