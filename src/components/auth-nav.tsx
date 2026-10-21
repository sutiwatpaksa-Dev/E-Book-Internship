"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { filesApi } from "@/api/files.api";
import { useSession } from "@/hooks/use-session";

const ROLE_LABEL = { intern: "Internship", dev: "Dev" } as const;
const linkClass = "whitespace-nowrap rounded-md px-2 py-1 text-sm text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground";

export function AuthNav() {
  const { role, logout } = useSession();
  const [exampleRepo, setExampleRepo] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;
    filesApi
      .links()
      .then((r) => setExampleRepo(r.exampleRepo))
      // บัตรหมดอายุแต่ cookie บอก role ยังค้าง: ถือว่ายังไม่ได้ login
      .catch(() => logout());
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!role) {
    return (
      <Link href="/login" className={linkClass}>
        🔑 เข้าสู่ระบบ
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {exampleRepo && (
        <a href={exampleRepo} target="_blank" rel="noopener" className={linkClass} title="โค้ดของระบบจริง ใช้ดูการวางโครงสร้าง">
          📦 ระบบตัวอย่าง
        </a>
      )}
      {role === "dev" && (
        <Link href="/dev/admin" className={linkClass}>
          ⚙️ จัดการบัญชี
        </Link>
      )}
      <span className="rounded-full bg-fd-primary/10 px-2 py-0.5 text-xs font-semibold text-fd-primary">{ROLE_LABEL[role]}</span>
      <button
        type="button"
        className={linkClass}
        onClick={async () => {
          await logout();
          location.assign("/");
        }}
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
