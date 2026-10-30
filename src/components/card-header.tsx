import { Clock, FolderKanban } from "lucide-react";
import Link from "next/link";
import { cards, cardUrl, stepBySlug, stepUrl, type LearnCard } from "@/data/learn";
import { CardStatus } from "./card-done";

// หัวการ์ด: อยู่ขั้นไหน › ช่วงไหน, เวลาอ่าน, และขั้นอื่นที่ใช้การ์ดนี้ด้วย
export function CardHeader({ card }: { card: LearnCard }) {
  const step = stepBySlug(card.step);
  return (
    <div className="not-prose flex flex-col gap-1.5 text-sm text-fd-muted-foreground">
      <nav aria-label="ตำแหน่งของการ์ด" className="flex flex-wrap items-center gap-1">
        <Link href="/learn" className="hover:text-fd-primary">
          7 ขั้น
        </Link>
        <span aria-hidden>›</span>
        <Link href={stepUrl(step.slug)} className="hover:text-fd-primary">
          {step.num} · {step.name}
        </Link>
        {card.part && (
          <>
            <span aria-hidden>›</span>
            <span>{card.part}</span>
          </>
        )}
      </nav>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> อ่านประมาณ {card.minutes} นาที
        </span>
        {card.alsoIn && <span>ใช้ในขั้น: {[card.step, ...card.alsoIn].map((s) => stepBySlug(s).name).join(", ")}</span>}
        <CardStatus link={cardUrl(card.slug)} />
      </p>
      {card.starter && (
        <p className="inline-flex items-center gap-1">
          <FolderKanban className="size-3.5" aria-hidden /> ใช้ในโจทย์ฝึกงาน: {card.starter}
        </p>
      )}
      {card.needs && (
        <p className="flex flex-wrap items-center gap-x-2">
          อ่านก่อน:
          {card.needs.map((slug) => {
            const need = cards.find((c) => c.slug === slug)!;
            return (
              <Link key={slug} href={cardUrl(slug)} className="font-medium text-fd-primary hover:underline">
                {need.title}
              </Link>
            );
          })}
        </p>
      )}
    </div>
  );
}
