"use client";

import { CheckCircle2, ChevronRight, Clock, Inbox } from "lucide-react";
import type { MouseEvent } from "react";
import type { ReviewPost } from "@/types";

// ชั้น "งาน" ของหน้าตรวจงาน: โพสต์ (โจทย์ × รอบ) ของรุ่นที่เลือก เรียงรอตรวจมากสุดก่อน (server เรียงให้แล้ว)
// สถานะบอกด้วยคำ + ไอคอนเสมอ ไม่ใช้สีอย่างเดียว · การ์ดทั้งใบกดได้ (ลิงก์จริง คลิกกลาง/เปิดแท็บใหม่ได้)

const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export function ReviewPosts({ posts, interns, hrefOf, onOpen }: { posts: ReviewPost[]; interns: number; hrefOf: (p: ReviewPost) => string; onOpen: (p: ReviewPost) => void }) {
  const waiting = posts.reduce((n, p) => n + p.waiting, 0);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-fd-muted-foreground">
        {waiting > 0 ? (
          <>
            รุ่นนี้มี <strong className="text-fd-foreground">{waiting} ชิ้น</strong> รอตรวจ เลือกงานที่จะตรวจ (งานที่รอเยอะสุดอยู่บนสุด)
          </>
        ) : (
          "ตอนนี้ไม่มีงานรอตรวจในรุ่นนี้ กดเข้าไปดูงานที่ตรวจแล้วได้"
        )}
      </p>
      <ul className="flex flex-col gap-3">
        {posts.map((p) => (
          <li key={`${p.assignment}/${p.round}`}>
            <PostCard post={p} interns={interns} href={hrefOf(p)} onOpen={() => onOpen(p)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PostCard({ post: p, interns, href, onOpen }: { post: ReviewPost; interns: number; href: string; onOpen: () => void }) {
  const submitted = p.waiting + p.reviewed;
  // ตัวหาร: จำนวนน้องที่ยังฝึกอยู่ (ถ้าน้องที่ส่งแล้วถูกปิดบัญชี ตัวเลขส่งแล้วอาจเกิน ใช้ค่าที่มากกว่าเพื่อไม่ให้แถบเกิน 100%)
  const total = Math.max(interns, submitted);
  const pct = (n: number) => (total ? `${(n / total) * 100}%` : "0%");
  return (
    <a
      href={href}
      onClick={(e) => {
        if (!plainClick(e)) return;
        e.preventDefault();
        onOpen();
      }}
      className="group flex min-h-11 items-center gap-3 rounded-xl border border-fd-border bg-fd-card p-4 text-sm hover:bg-fd-accent"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <strong className="break-words text-base">{p.roundLabel}</strong>
          <span className="break-words text-fd-muted-foreground">
            {p.assignmentName} · กำหนดส่ง วันทำงานที่ {p.day}
          </span>
        </span>
        <span className="flex items-center gap-1.5 font-semibold">
          {p.waiting > 0 ? (
            <>
              <Clock aria-hidden className="size-4 shrink-0" /> รอตรวจ {p.waiting} คน
            </>
          ) : submitted > 0 ? (
            <>
              <CheckCircle2 aria-hidden className="size-4 shrink-0" /> ตรวจครบแล้ว
            </>
          ) : (
            <>
              <Inbox aria-hidden className="size-4 shrink-0" /> ยังไม่มีใครส่ง
            </>
          )}
        </span>
        {/* แถบเข้ม = ตรวจแล้ว · แถบจาง = รอตรวจ · ตัวเลขข้างล่างเป็นข้อมูลจริง แถบเป็นภาพประกอบ (aria-hidden) */}
        <span aria-hidden className="flex h-2 overflow-hidden rounded-full bg-fd-muted">
          <span className="bg-fd-primary" style={{ width: pct(p.reviewed) }} />
          <span className="bg-fd-primary/35" style={{ width: pct(p.waiting) }} />
        </span>
        <span className="text-fd-muted-foreground">
          ส่งแล้ว {submitted} จาก {interns} คน · ตรวจแล้ว {p.reviewed}
        </span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-fd-muted-foreground group-hover:text-fd-foreground" />
    </a>
  );
}
