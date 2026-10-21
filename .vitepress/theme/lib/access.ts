import type { Role } from "../types";

// ใช้ฝั่งหน้าเว็บเพื่อแสดงปุ่มและพาไปหน้า login เท่านั้น
// การตัดสินสิทธิ์จริงอยู่ที่ server/middleware/page-gate.ts (cookie ตัวจริงเป็น httpOnly JavaScript อ่านไม่ได้)
export function readRoleHint(): Role | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)bt_role=(intern|dev)/);
  return (m?.[1] as Role) ?? null;
}

export function needsRole(path: string): Role | null {
  if (/^\/dev(\/|$)/.test(path)) return "dev";
  if (/^\/(starter|steps)(\/|$)/.test(path)) return "intern";
  return null;
}

export const canSee = (need: Role | null, have: Role | null) => !need || (!!have && (need === "intern" || have === "dev"));
