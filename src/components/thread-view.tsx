"use client";

import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { ChatState } from "@/hooks/use-chat";
import { KIND_LABEL, STATUS_LABEL, STATUSES_OF } from "@/lib/thread-labels";
import type { ThreadDetail, ThreadStatus } from "@/types";
import { Button } from "./button";
import { inputClass } from "./field";
import { StatusBadge } from "./status-badge";

const fmt = (d: string) => new Date(d).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

// ห้องแชทของเรื่องเดียว: หัวเรื่อง → ข้อความ → ช่องพิมพ์ตอบ
export function ThreadView({ chat, detail, titles }: { chat: ChatState; detail: ThreadDetail; titles: Record<string, string> }) {
  const { thread, messages } = detail;
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // มีข้อความใหม่ → เลื่อนลงล่างสุด เหมือนแอปแชททั่วไป
  // ใส่ {} ไม่คืนค่า: Chrome รุ่นใหม่ให้ scrollIntoView คืน Promise ถ้าคืนออกไป React จะเข้าใจว่าเป็นฟังก์ชันเก็บกวาดแล้วพัง
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    if (await chat.reply(body)) setBody("");
    setSending(false);
  };
  // Enter = ขึ้นบรรทัดใหม่ (ข้อความยาว/โค้ดหลายบรรทัด) · Ctrl/⌘ + Enter = ส่ง
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
  };
  // ข้อความของฝั่งเรา = ชิดขวา
  const mine = (role: string) => (chat.side === "dev" ? role === "dev" : role !== "dev");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-col gap-1 border-b border-fd-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => chat.select(null)} aria-label="กลับไปรายการ" className="rounded-md p-1 hover:bg-fd-accent md:hidden">
            <ArrowLeft className="size-4" />
          </button>
          <h2 className="min-w-0 flex-1 truncate font-semibold">{thread.subject}</h2>
          <StatusBadge status={thread.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fd-muted-foreground">
          <span>{KIND_LABEL[thread.kind].label}</span>
          {thread.pageUrl && (
            <Link href={thread.pageUrl} className="text-fd-primary underline" target={chat.side === "dev" ? "_blank" : undefined}>
              {titles[thread.pageUrl] ?? thread.pageUrl}
            </Link>
          )}
          {chat.canSetStatus && <StatusControl chat={chat} kind={thread.kind} status={thread.status} />}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((m) =>
          m.isSystem ? (
            <p key={m.id} className="self-center rounded-full bg-fd-muted px-3 py-1 text-xs text-fd-muted-foreground">
              {m.body} · {fmt(m.createdAt)}
            </p>
          ) : (
            <div key={m.id} className={`flex max-w-[85%] flex-col gap-1 ${mine(m.authorRole) ? "self-end items-end" : "self-start items-start"}`}>
              <span className="text-[11px] text-fd-muted-foreground">
                {m.authorRole === "dev" ? `พี่เลี้ยง (${m.author})` : m.author} · {fmt(m.createdAt)}
              </span>
              <p
                className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${mine(m.authorRole) ? "bg-fd-primary text-fd-primary-foreground" : "border border-fd-border bg-fd-card"}`}
              >
                {m.body}
              </p>
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-fd-border p-3">
        <label htmlFor="chat-reply" className="sr-only">
          พิมพ์ข้อความ
        </label>
        <textarea
          id="chat-reply"
          className={`${inputClass} max-h-40 min-h-11 flex-1 resize-y`}
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKey}
          maxLength={2000}
          placeholder="พิมพ์ข้อความ… (Ctrl/⌘ + Enter เพื่อส่ง)"
        />
        <Button type="submit" disabled={sending || !body.trim()} aria-label="ส่ง">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

// พี่เลี้ยงเปลี่ยนสถานะ: เลือก "ไม่ทำ" ต้องเขียนเหตุผล (ส่งไปเป็นข้อความในแชทด้วย)
function StatusControl({ chat, kind, status }: { chat: ChatState; kind: ThreadDetail["thread"]["kind"]; status: ThreadStatus }) {
  const [next, setNext] = useState<ThreadStatus>(status);
  const [note, setNote] = useState("");
  useEffect(() => setNext(status), [status]);
  const needNote = next === "declined";

  return (
    <span className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1">
        สถานะ
        <select className="rounded-md border border-fd-border bg-fd-background px-1.5 py-0.5 text-xs" value={next} onChange={(e) => setNext(e.target.value as ThreadStatus)}>
          {STATUSES_OF[kind].map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      {next !== status && (
        <>
          <input
            className="w-56 rounded-md border border-fd-border bg-fd-background px-2 py-0.5 text-xs"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={needNote ? "เหตุผลที่ไม่ทำ (จำเป็น)" : "ข้อความถึงน้อง (ไม่ใส่ก็ได้)"}
            maxLength={2000}
          />
          <Button
            className="px-2 py-0.5 text-xs"
            disabled={needNote && !note.trim()}
            onClick={async () => {
              if (await chat.setStatus(next, note.trim() || undefined)) setNote("");
            }}
          >
            บันทึก
          </Button>
        </>
      )}
    </span>
  );
}
