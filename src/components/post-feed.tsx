"use client";

import { Check, ExternalLink, Newspaper, Pin } from "lucide-react";
import { useEffect, useState } from "react";
import { postsApi } from "@/api/posts.api";
import { toast } from "@/hooks/use-toast";
import { daysBetween, thaiDayMonth, todayTH } from "@/lib/cohort";
import { POST_KIND_LABEL, POST_KINDS, type PostKind } from "@/lib/post";
import { timeAgo } from "@/lib/thread-labels";
import type { FeedPost } from "@/types";
import { EmptyState } from "./empty-state";
import { ErrorText } from "./error-text";
import { MarkdownBody } from "./markdown-body";
import { SkeletonList } from "./skeleton";

// ฟีดงานและประกาศของน้อง: server กรองเฉพาะโพสต์ของรุ่นตัวเอง/ทุกรุ่น และเรียงให้แล้ว (ปักหมุด → งานใกล้กำหนด → ใหม่สุด)
// ปุ่ม "รับทราบ" = บอกพี่เลี้ยงว่าเห็นแล้ว · กดซ้ำ = ยกเลิก
type Filter = "all" | PostKind;
const KIND_TONE: Record<PostKind, string> = {
  task: "bg-fd-primary/10 text-fd-primary",
  announcement: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  resource: "bg-green-600/15 text-green-800 dark:text-green-300",
  review: "bg-violet-600/15 text-violet-800 dark:text-violet-300",
};

export function PostFeed() {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    postsApi
      .feed()
      .then(setPosts)
      .catch((e: Error) => setError(e.message));
  }, []);

  // มาจากลิงก์แจ้งเตือน /feed#post-12: เลื่อนไปโพสต์นั้นหลังโหลดเสร็จ
  useEffect(() => {
    if (!posts || !location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [posts]);

  const toggleAck = async (p: FeedPost) => {
    const next = !p.acked;
    setPosts((list) => list?.map((x) => (x.id === p.id ? { ...x, acked: next } : x)) ?? null);
    try {
      await postsApi.setAck(p.id, next);
      toast.success(next ? `รับทราบ "${p.title}" แล้ว` : "ยกเลิกรับทราบแล้ว");
    } catch (e) {
      setPosts((list) => list?.map((x) => (x.id === p.id ? { ...x, acked: p.acked } : x)) ?? null);
      toast.error(`บันทึกไม่สำเร็จ: ${(e as Error).message}`);
    }
  };

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!posts) return <SkeletonList rows={3} />;
  const shown = filter === "all" ? posts : posts.filter((p) => p.kind === filter);
  const count = (k: Filter) => (k === "all" ? posts.length : posts.filter((p) => p.kind === k).length);

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="กรองโพสต์" className="flex flex-wrap gap-2">
        {(["all", ...POST_KINDS] as Filter[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium ${filter === k ? "border-fd-primary bg-fd-primary/10 text-fd-primary" : "border-fd-border hover:bg-fd-accent"}`}
          >
            {k === "all" ? "ทั้งหมด" : POST_KIND_LABEL[k]} <span className="tabular-nums text-fd-muted-foreground">{count(k)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Newspaper} title={filter === "all" ? "ยังไม่มีโพสต์" : `ยังไม่มี${POST_KIND_LABEL[filter]}`}>
          พี่เลี้ยงโพสต์งาน ประกาศ หรือแหล่งเรียนรู้แล้วจะขึ้นที่นี่ พร้อมแจ้งเตือนที่กระดิ่ง
        </EmptyState>
      ) : (
        shown.map((p) => <PostCard key={p.id} post={p} onAck={() => toggleAck(p)} />)
      )}
    </div>
  );
}

function DueLine({ due }: { due: string | null }) {
  if (!due) return <p className="text-sm text-fd-muted-foreground">ไม่มีกำหนดส่ง</p>;
  const left = daysBetween(todayTH(), due);
  const tone = left < 0 ? "text-red-700 dark:text-red-400" : left <= 2 ? "text-orange-700 dark:text-orange-400" : "text-fd-muted-foreground";
  const words = left < 0 ? `เลยกำหนด ${-left} วัน` : left === 0 ? "ส่งวันนี้" : `เหลือ ${left} วัน`;
  return (
    <p className={`text-sm font-semibold ${tone}`}>
      กำหนดส่ง {thaiDayMonth(due)} · {words}
    </p>
  );
}

// โพสต์ยาว (เช่น ผลรีวิวทั้งฉบับ) ย่อไว้ก่อนให้ฟีดไม่ยาวเกิน · มาจากลิงก์แจ้งเตือน (#post-id) = เปิดเต็มเลย
const LONG_BODY = 1500;

function PostCard({ post: p, onAck }: { post: FeedPost; onAck: () => void }) {
  const long = p.body.length > LONG_BODY;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (long && window.location.hash === `#post-${p.id}`) setOpen(true);
  }, [long, p.id]);
  const collapsed = long && !open;
  return (
    <article id={`post-${p.id}`} aria-labelledby={`post-${p.id}-title`} className={`flex scroll-mt-28 flex-col gap-3 rounded-2xl border bg-fd-card p-4 sm:p-5 ${p.pinned ? "border-fd-primary/60" : "border-fd-border"}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${KIND_TONE[p.kind]}`}>{POST_KIND_LABEL[p.kind]}</span>
        {p.assignmentName && <span className="text-fd-muted-foreground">โจทย์ {p.assignmentName}</span>}
        {p.pinned && (
          <span className="inline-flex items-center gap-1 text-fd-primary">
            <Pin className="size-3.5" aria-hidden /> ปักหมุด
          </span>
        )}
        <span className="ms-auto text-xs text-fd-muted-foreground">
          {p.author} · {timeAgo(p.createdAt)}
          {p.editedAt && " · แก้แล้ว"}
        </span>
      </div>

      <h2 id={`post-${p.id}-title`} className="text-lg leading-snug font-semibold">
        {p.title}
      </h2>
      {p.kind === "task" && <DueLine due={p.due} />}
      {p.body.trim() && (
        <div id={`post-${p.id}-body`} className={collapsed ? "relative max-h-80 overflow-hidden" : undefined}>
          <MarkdownBody md={p.body} className="text-sm" />
          {collapsed && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-fd-card" />}
        </div>
      )}
      {long && (
        <button type="button" aria-expanded={open} aria-controls={`post-${p.id}-body`} onClick={() => setOpen((v) => !v)} className="inline-flex min-h-11 items-center self-start rounded-lg px-3 text-sm font-semibold text-fd-primary hover:bg-fd-accent">
          {open ? "ย่อ" : "อ่านทั้งหมด"}
        </button>
      )}

      {p.links.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {p.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-fd-border px-3 text-sm text-fd-primary hover:bg-fd-accent">
                {l.label} <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-fd-border pt-3">
        <button
          type="button"
          aria-pressed={p.acked}
          onClick={onAck}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold ${p.acked ? "border-fd-primary bg-fd-primary/10 text-fd-primary" : "border-fd-border hover:bg-fd-accent"}`}
        >
          {p.acked && <Check className="size-4" aria-hidden />}
          {p.acked ? "รับทราบแล้ว" : "รับทราบ"}
        </button>
        {p.kind === "task" && <span className="text-xs text-fd-muted-foreground">ช่องส่งงานในโพสต์จะมาในเวอร์ชันถัดไป ระหว่างนี้ส่งตามที่พี่เลี้ยงบอกในโพสต์</span>}
      </div>
    </article>
  );
}
