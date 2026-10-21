import type { Role } from "../db/schema";

// path ไหนต้องมี role อะไร (dev เห็นทุกอย่างที่ intern เห็น)
// ไฟล์ JS ของแต่ละหน้า VitePress ตั้งชื่อตาม path เช่น /assets/starter_index.md.abc123.js จึงต้องล็อกด้วย
const RULES: { test: RegExp; roles: Role[] }[] = [
  { test: /^\/(starter|steps)(\/|$)|^\/assets\/(starter|steps)_/, roles: ["intern", "dev"] },
  { test: /^\/dev(\/|$)|^\/assets\/dev_/, roles: ["dev"] },
];

export type GateResult = "allow" | "login" | "forbidden";

export function gate(pathname: string, role: Role | null): GateResult {
  const rule = RULES.find((r) => r.test.test(pathname));
  if (!rule) return "allow";
  if (!role) return "login";
  return rule.roles.includes(role) ? "allow" : "forbidden";
}

// คำขอหน้าเว็บ (เปิดลิงก์) ส่งไปหน้า login ได้ ส่วนไฟล์ประกอบ (js) ตอบรหัสสถานะเฉยๆ
export function isPageRequest(pathname: string) {
  return !/\.[a-z0-9]+$/i.test(pathname) || pathname.endsWith(".html");
}
