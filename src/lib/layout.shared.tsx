import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
import { version } from "../../package.json";
import { AuthNav } from "@/components/auth-nav";

// ตั้งค่าแถบเมนูบนที่ทุกหน้าใช้ร่วมกัน
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image src="/brand/mark.png" alt="" width={28} height={28} className="dark:hidden" />
          <Image src="/brand/mark-dark.png" alt="" width={28} height={28} className="hidden dark:block" />
          <span className="font-semibold">คู่มือฝึกงาน</span>
        </>
      ),
    },
    links: [
      { text: "เริ่มอ่าน", url: "/00-start" },
      { text: "Mini Project", url: "/starter" },
      { text: "Deploy", url: "/17-network" },
      { text: "ศัพท์", url: "/glossary" },
      { text: "Cheat Sheet", url: "/cheat-sheet" },
      { text: `v${version}`, url: "/changelog" },
      { type: "custom", secondary: true, children: <AuthNav /> },
    ],
  };
}
