"use client";

import { NotebookPen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { contentApi } from "@/api/content.api";
import { useSession } from "@/hooks/use-session";
import type { PageNote } from "@/types";
import { NoteBox } from "./admin-content";

// โน้ตจากพี่เลี้ยงท้ายหน้า (เพิ่มจากหลังบ้าน แท็บเนื้อหา) · ต้อง login ถึงเห็น เพราะอาจพูดถึงงานภายใน
// พี่เลี้ยงเห็นปุ่ม "เพิ่มโน้ตหน้านี้" ที่พาไปหลังบ้านพร้อมกรอกหน้าให้แล้ว
export function PageNotes({ pageUrl }: { pageUrl: string }) {
  const { role } = useSession();
  const [notes, setNotes] = useState<PageNote[]>([]);

  useEffect(() => {
    if (!role) return;
    contentApi
      .notes(pageUrl)
      .then(setNotes)
      .catch(() => {});
  }, [role, pageUrl]);

  if (!role || (notes.length === 0 && role !== "dev")) return null;
  return (
    <section aria-label="โน้ตจากพี่เลี้ยง" className="not-prose mt-8 flex flex-col gap-2">
      {notes.map((n) => (
        <NoteBox key={n.id} author={n.author} body={n.body} />
      ))}
      {role === "dev" && (
        <Link
          href={`/dev/admin?tab=content&note=${encodeURIComponent(pageUrl)}`}
          className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-medium text-fd-primary hover:underline"
        >
          <NotebookPen className="size-4" /> เพิ่มโน้ตหน้านี้
        </Link>
      )}
    </section>
  );
}
