// สถานะ login ฝั่งหน้าเว็บ ใช้แสดงปุ่มและพาไปหน้า login เท่านั้น
// การตัดสินสิทธิ์จริงอยู่ที่ middleware และ API (cookie ตัวจริงเป็น httpOnly JavaScript อ่านไม่ได้)
import { ref } from "vue";

export type Role = "intern" | "dev";
export const role = ref<Role | null>(null);

export function readRoleHint(): Role | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)bt_role=(intern|dev)/);
  return (m?.[1] as Role) ?? null;
}

export function refreshRole() {
  role.value = readRoleHint();
}

export function needsRole(path: string): Role | null {
  if (/^\/dev(\/|$)/.test(path)) return "dev";
  if (/^\/(starter|steps)(\/|$)/.test(path)) return "intern";
  return null;
}

export const canSee = (need: Role | null, have: Role | null) => !need || (!!have && (need === "intern" || have === "dev"));

// fetch ที่ส่ง cookie ไปด้วย แล้วแปลงข้อผิดพลาดเป็นข้อความจาก API
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "same-origin", ...init });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `ผิดพลาด (${res.status})`);
  return body as T;
}
