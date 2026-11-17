import type { Role } from "@/types";

// หน้าแรกของแต่ละบทบาทหลัง login: พี่เลี้ยงไปหลังบ้าน น้องไปหน้า Dashboard (ภาพรวมงานและความคืบหน้า)
// ใช้ทั้งฝั่ง server (หน้า / และ /login ตอน login อยู่แล้ว) และฝั่งหน้าเว็บ (หลังกดเข้าสู่ระบบ) จึงแยกไว้ที่เดียว
export const HOME: Record<Role, string> = { dev: "/dev/admin", intern: "/dashboard" };

// รับเฉพาะ path ภายในเว็บเรา กันคนส่งลิงก์ login?next=https://เว็บปลอม มาหลอก
export function safeNext(next: string | null | undefined, role: Role) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : HOME[role];
}
