"use client";

import { openCookieSettings } from "@/lib/consent";

// ลิงก์ท้ายเว็บ: เปิดหน้าต่างตั้งค่าคุกกี้ (ถอนความยินยอมได้ทุกเมื่อ)
export function CookieSettingsLink() {
  return (
    <button type="button" onClick={openCookieSettings} className="flex min-h-11 items-center text-start hover:text-white hover:underline">
      ตั้งค่าคุกกี้
    </button>
  );
}
