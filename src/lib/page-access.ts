import type { Role } from "@/types";

// path ไหนต้องมี role อะไร (dev เห็นทุกอย่างที่ intern เห็น)
// ที่เดียวที่กำหนดกฎ: ฝั่ง server ใช้ตัดสินก่อนส่งหน้า (require-page-access.ts) ฝั่งหน้าเว็บใช้แค่แสดง 🔒
const RULES: { test: RegExp; roles: Role[] }[] = [
  { test: /^\/(starter|steps)(\/|$)/, roles: ["intern", "dev"] },
  { test: /^\/questions(\/|$)/, roles: ["intern", "dev"] },
  { test: /^\/dev(\/|$)/, roles: ["dev"] },
];

export type GateResult = "allow" | "login" | "forbidden";

export function gate(pathname: string, role: Role | null): GateResult {
  const rule = RULES.find((r) => r.test.test(pathname));
  if (!rule) return "allow";
  if (!role) return "login";
  return rule.roles.includes(role) ? "allow" : "forbidden";
}

export const isLocked = (pathname: string) => gate(pathname, null) !== "allow";
