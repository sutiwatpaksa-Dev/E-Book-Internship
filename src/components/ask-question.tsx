"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { threadsApi } from "@/api/threads.api";
import { useSession } from "@/hooks/use-session";
import type { NewThread, ThreadSummary } from "@/types";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { NewThreadForm } from "./new-thread-form";
import { StatusBadge } from "./status-badge";

// กล่องท้ายบท: ถามพี่เลี้ยงเรื่องบทนี้ (บันทึกว่ามาจากหน้าไหน) แล้วไปคุยต่อในหน้าแชท
// ไม่ได้ login ไม่แสดงเลย (คนนอกไม่มีบัญชีให้พี่เลี้ยงตอบกลับ)
export function AskQuestion({ pageUrl }: { pageUrl: string }) {
  const { role } = useSession();
  const [here, setHere] = useState<ThreadSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [sentId, setSentId] = useState<number | null>(null);

  useEffect(() => {
    if (!role) return;
    threadsApi
      .list()
      .then((ts) => setHere(ts.filter((t) => t.pageUrl === pageUrl)))
      .catch(() => {});
  }, [role, pageUrl]);

  if (!role) return null;

  const submit = async (t: NewThread) => {
    setError("");
    try {
      const { id } = await threadsApi.create(t);
      setHere(await threadsApi.list().then((ts) => ts.filter((x) => x.pageUrl === pageUrl)));
      setSentId(id);
      setOpen(false);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };

  return (
    <section aria-labelledby="ask-title" className="not-prose mt-10 flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-4">
      <h2 id="ask-title" className="flex items-center gap-2 text-base font-semibold">
        <MessageCircle className="size-5 text-fd-primary" /> ติดตรงไหนในบทนี้ ถามพี่เลี้ยงได้
      </h2>

      {here.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {here.map((t) => (
            <li key={t.id}>
              <Link href={`/questions?t=${t.id}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-fd-accent">
                <StatusBadge status={t.status} />
                <span className={`min-w-0 flex-1 truncate ${t.unread ? "font-bold" : ""}`}>{t.subject}</span>
                {t.unread && <span className="text-xs font-semibold text-orange-600">ข้อความใหม่</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {sentId !== null && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          ส่งแล้ว พี่เลี้ยงตอบเมื่อไรจะมีจุดแจ้งเตือนที่เมนูบัญชี ·{" "}
          <Link href={`/questions?t=${sentId}`} className="underline">
            เปิดแชท
          </Link>
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}

      {open ? (
        <div className="-m-4 mt-0">
          <NewThreadForm kinds={["question"]} pageUrl={pageUrl} onSubmit={submit} onCancel={() => setOpen(false)} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={() => setOpen(true)}>
            เขียนคำถาม
          </Button>
          <Link href="/questions?new=content_request" className="text-sm text-fd-primary underline">
            อยากได้เนื้อหาเรื่องอื่น? ขอเนื้อหาเพิ่ม
          </Link>
        </div>
      )}
    </section>
  );
}
