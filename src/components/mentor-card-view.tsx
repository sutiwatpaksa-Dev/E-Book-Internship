"use client";

import { Clock, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { contentApi } from "@/api/content.api";
import { cards, cardUrl, mentorCardUrl, steps, stepUrl, topics } from "@/data/learn";
import { useCatalog } from "@/hooks/use-catalog";
import { useSession } from "@/hooks/use-session";
import type { MentorCard } from "@/types";
import { MentorBadge } from "./card-library";
import { CardDone, CardStatus } from "./card-done";
import { ErrorText } from "./error-text";
import { MarkdownBody } from "./markdown-body";
import { PageNotes } from "./page-notes";

// เนื้อหาการ์ดของพี่เลี้ยง: ยังไม่ login เห็นหน้าล็อก (ชื่อการ์ดเห็นได้ในคลัง เนื้อหาต้องมีบัญชี)
export function MentorCardView({ slug }: { slug: string }) {
  const { role } = useSession();
  const [card, setCard] = useState<MentorCard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!role) return;
    contentApi
      .card(slug)
      .then((c) => {
        setCard(c);
        document.title = `${c.title} | คู่มือฝึกงาน`;
      })
      .catch((e: Error) => setError(e.message));
  }, [role, slug]);

  if (!role) {
    return (
      <div className="not-prose flex flex-col items-start gap-3 py-6">
        <Lock className="size-8 text-fd-primary" aria-hidden />
        <h1 className="text-2xl font-bold">การ์ดจากพี่เลี้ยง อ่านได้เมื่อ login</h1>
        <p className="text-fd-muted-foreground">การ์ดกลุ่มนี้พี่เลี้ยงเขียนให้น้องในบริษัท อาจพูดถึงงาน STARTER หรือระบบภายใน จึงเปิดให้เฉพาะคนที่มีบัญชี การ์ดอื่นในคลังยังอ่านได้ตามปกติ</p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/login?next=${encodeURIComponent(mentorCardUrl(slug))}`} className="inline-flex min-h-12 items-center rounded-xl bg-fd-primary px-5 font-semibold text-fd-primary-foreground hover:opacity-90">
            เข้าสู่ระบบ
          </Link>
          <Link href="/learn/cards" className="inline-flex min-h-12 items-center rounded-xl border border-fd-border px-5 font-semibold hover:bg-fd-accent">
            กลับคลังการ์ด
          </Link>
        </div>
      </div>
    );
  }
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!card) return <p className="text-fd-muted-foreground">กำลังโหลด…</p>;
  return (
    <>
      <MentorCardHeader card={card} />
      <MarkdownBody md={card.body} className="mt-6" />
      <PageNotes pageUrl={mentorCardUrl(card.slug)} />
      {card.status === "published" && <CardDone link={mentorCardUrl(card.slug)} />}
    </>
  );
}

function MentorCardHeader({ card }: { card: MentorCard }) {
  const { mentorCards } = useCatalog();
  const step = steps.find((s) => s.slug === card.step);
  const topic = topics.find((t) => t.slug === card.topic);
  // "อ่านก่อน": slug เปล่า = การ์ดในระบบ · "m/slug" = การ์ดของพี่เลี้ยงอีกใบ
  const needs = card.needs.map((n) => {
    if (n.startsWith("m/")) {
      const m = mentorCards.find((x) => x.slug === n.slice(2));
      return { href: mentorCardUrl(n.slice(2)), title: m?.title ?? n.slice(2) };
    }
    return { href: cardUrl(n), title: cards.find((c) => c.slug === n)?.title ?? n };
  });
  return (
    <div className="not-prose flex flex-col gap-2 text-sm text-fd-muted-foreground">
      <nav aria-label="ตำแหน่งของการ์ด" className="flex flex-wrap items-center gap-1">
        <Link href="/learn" className="hover:text-fd-primary">
          7 ขั้น
        </Link>
        <span aria-hidden>›</span>
        {step && (
          <Link href={stepUrl(step.slug)} className="hover:text-fd-primary">
            {step.num} · {step.name}
          </Link>
        )}
        {topic && (
          <>
            <span aria-hidden>›</span>
            <span>{topic.name}</span>
          </>
        )}
      </nav>
      <h1 className="text-3xl font-bold text-fd-foreground">{card.title}</h1>
      {card.status === "draft" && <p className="rounded-lg bg-fd-muted px-3 py-2 text-fd-foreground">ร่าง: น้องยังไม่เห็นการ์ดนี้ เผยแพร่ได้ที่หลังบ้าน เมนูการ์ดของพี่เลี้ยง</p>}
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <MentorBadge author={card.author} />
        <span className="inline-flex items-center gap-1 text-sm">
          <Clock className="size-3.5" /> อ่านประมาณ {card.minutes} นาที
        </span>
        <CardStatus link={mentorCardUrl(card.slug)} />
      </p>
      {needs.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2">
          อ่านก่อน:
          {needs.map((n) => (
            <Link key={n.href} href={n.href} className="font-medium text-fd-primary hover:underline">
              {n.title}
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}
