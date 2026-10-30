"use client";

import { MessageCircle, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChat, type ChatSide } from "@/hooks/use-chat";
import type { InternThreadKind, ThreadKind } from "@/types";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { ErrorText } from "./error-text";
import { NewThreadForm } from "./new-thread-form";
import { ThreadList } from "./thread-list";
import { ThreadView } from "./thread-view";

type Filter = "all" | "unread" | ThreadKind;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "unread", label: "ยังไม่อ่าน" },
  { id: "question", label: "คำถาม" },
  { id: "content_request", label: "ขอเนื้อหา" },
  { id: "mentor_message", label: "จากพี่เลี้ยง" },
];

type Props = {
  side: ChatSide;
  titles: Record<string, string>;
  // เปิดมาจากลิงก์ ?t=12 (เปิดเรื่องนั้นเลย) หรือ ?new=content_request (เปิดฟอร์มขอเนื้อหา)
  initialId?: number | null;
  initialNew?: InternThreadKind | null;
  // บอกหน้าที่ครอบอยู่ว่าตอนนี้เปิดเรื่องไหน (หลังบ้านจดลง URL) · เรียกตอนเริ่มด้วย
  onSelect?: (id: number | null) => void;
};

// แชทแบบรายการเรื่อง + ห้องแชท (คล้าย LINE/Messenger) ใช้ทั้งน้องและพี่เลี้ยง
// มือถือ: เห็นรายการก่อน แตะเรื่องแล้วค่อยเห็นห้องแชท (ปุ่ม ← กลับ)
export function ChatPanel({ side, titles, initialId = null, initialNew = null, onSelect }: Props) {
  const chat = useChat(side, initialId);
  // เก็บ onSelect ใน ref: แม่สร้างฟังก์ชันใหม่ทุก render ถ้าใส่ใน deps จะเรียกซ้ำทุกครั้ง
  const report = useRef(onSelect);
  report.current = onSelect;
  useEffect(() => report.current?.(chat.selectedId), [chat.selectedId]);
  const [composing, setComposing] = useState<InternThreadKind | null>(initialNew);
  const [filter, setFilter] = useState<Filter>("all");

  const rows = chat.threads.filter((t) => filter === "all" || (filter === "unread" ? t.unread : t.kind === filter));
  const showRight = composing !== null || chat.selectedId !== null;

  return (
    <div className="not-prose flex flex-col gap-2">
      {chat.error && <ErrorText>{chat.error}</ErrorText>}
      <div className="grid h-[min(75vh,44rem)] overflow-hidden rounded-xl border border-fd-border bg-fd-background md:grid-cols-[19rem_1fr]">
        <aside className={`min-h-0 flex-col border-fd-border md:flex md:border-e ${showRight ? "hidden" : "flex"}`}>
          <div className="flex flex-wrap items-center gap-1 border-b border-fd-border p-2">
            {chat.canCreate && (
              <Button
                className="w-full"
                onClick={() => {
                  chat.select(null);
                  setComposing("question");
                }}
              >
                <Plus className="size-4" /> เริ่มเรื่องใหม่
              </Button>
            )}
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={f.id === filter}
                onClick={() => setFilter(f.id)}
                className={`h-8 rounded-md px-2 text-xs ${f.id === filter ? "bg-fd-primary/10 font-semibold text-fd-primary" : "hover:bg-fd-accent"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {chat.loading ? (
              <p className="p-4 text-sm text-fd-muted-foreground">กำลังโหลด…</p>
            ) : rows.length === 0 ? (
              <p className="p-4 text-sm text-fd-muted-foreground">{filter === "all" ? "ยังไม่มีเรื่อง" : "ไม่มีเรื่องในหมวดนี้"}</p>
            ) : (
              <ThreadList
                threads={rows}
                selectedId={chat.selectedId}
                titles={titles}
                onSelect={(id) => {
                  setComposing(null);
                  chat.select(id);
                }}
              />
            )}
          </div>
        </aside>

        <section className={`min-h-0 flex-col md:flex ${showRight ? "flex" : "hidden"}`}>
          {composing !== null ? (
            <div className="overflow-y-auto">
              <h2 className="border-b border-fd-border px-4 py-3 font-semibold">เริ่มเรื่องใหม่</h2>
              <NewThreadForm
                key={composing}
                defaultKind={composing}
                onCancel={() => setComposing(null)}
                onSubmit={async (t) => {
                  const id = await chat.create(t);
                  if (id !== null) setComposing(null);
                  return id !== null;
                }}
              />
            </div>
          ) : chat.detail ? (
            <ThreadView chat={chat} detail={chat.detail} titles={titles} />
          ) : chat.selectedId !== null ? (
            <p className="p-4 text-sm text-fd-muted-foreground">กำลังโหลด…</p>
          ) : (
            <div className="m-auto p-6">
              <EmptyState icon={MessageCircle} title={side === "dev" ? "เลือกเรื่องทางซ้าย" : "ถามพี่เลี้ยง หรือขอเนื้อหาเพิ่ม"}>
                {side === "dev"
                  ? "จุดสีส้ม = น้องพิมพ์มาแล้วยังไม่มีพี่เลี้ยงเปิดอ่าน"
                  : "ติดตรงไหนในบทเรียน หรืออยากได้เนื้อหาเรื่องที่คู่มือยังไม่มี กด \"เริ่มเรื่องใหม่\" ได้เลย"}
              </EmptyState>
            </div>
          )}
        </section>
      </div>
      <p className="text-xs text-fd-muted-foreground">อัปเดตเองทุก 20 วินาทีขณะเปิดหน้านี้ไว้ และทันทีเมื่อกลับมาที่แท็บนี้</p>
    </div>
  );
}
