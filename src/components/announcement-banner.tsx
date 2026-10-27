"use client";

import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { contentApi } from "@/api/content.api";
import { useSession } from "@/hooks/use-session";
import type { Announcement } from "@/types";

// แถบประกาศจากพี่เลี้ยงบนหน้า "วันนี้" (สร้างที่หลังบ้าน แท็บประกาศ)
// server กรองให้แล้วว่าใครเห็นและยังไม่หมดเวลา หน้านี้แค่แสดง
export function AnnouncementBanner() {
  const { role } = useSession();
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!role) return;
    contentApi
      .announcements()
      .then(setItems)
      .catch(() => {});
  }, [role]);

  if (!role || items.length === 0) return null;
  return (
    <section aria-label="ประกาศจากพี่เลี้ยง" className="flex flex-col gap-2">
      {items.map((a) => (
        <div key={a.id} className="flex items-start gap-3 rounded-2xl border border-fd-primary/40 bg-fd-primary/10 px-4 py-3">
          <Megaphone className="mt-1 size-5 shrink-0 text-fd-primary" aria-hidden />
          <div className="flex min-w-0 flex-col">
            <p className="whitespace-pre-line font-medium">{a.body}</p>
            <p className="text-xs text-fd-muted-foreground">
              ประกาศโดย {a.author} · {new Date(a.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
