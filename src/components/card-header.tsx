import { Clock } from "lucide-react";
import Link from "next/link";
import { cards, cardUrl, partLabel, stepBySlug, stepUrl, type LearnCard } from "@/data/learn";
import { CardStatus } from "./card-done";

// หัวการ์ด (mock-up บอร์ด Card): ตำแหน่ง (แผนที่ 7 ขั้น / ขั้น / ช่วง) + ข้อมูล 3 บรรทัด: ใช้ในขั้น · เวลาอ่าน · ควรอ่านก่อน
export function CardHeader({ card }: { card: LearnCard }) {
  const step = stepBySlug(card.step);
  const part = card.part ? partLabel(card.part) : null;
  const others = (card.alsoIn ?? []).map((s) => stepBySlug(s));
  return (
    <div className="not-prose flex flex-col gap-2 text-sm">
      <nav aria-label="ตำแหน่งของการ์ด" className="flex flex-wrap items-center gap-1 text-fd-muted-foreground">
        <Link href="/learn" className="hover:text-fd-primary hover:underline">
          แผนที่ 7 ขั้น
        </Link>
        <span aria-hidden>/</span>
        <Link href={stepUrl(step.slug)} className="hover:text-fd-primary hover:underline">
          {step.name}
        </Link>
        {part && (
          <>
            <span aria-hidden>/</span>
            <span>{part}</span>
          </>
        )}
        <span className="ms-2">
          <CardStatus link={cardUrl(card.slug)} />
        </span>
      </nav>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-fd-muted-foreground">ใช้ในขั้น</dt>
        <dd>
          {step.num} {step.name}
          {part ? `, ช่วง ${part}` : ""}
          {others.length > 0 && <span className="text-fd-muted-foreground"> · ใช้ใน {others.map((s) => `${s.num} ${s.name}`).join(", ")} ด้วย</span>}
        </dd>
        <dt className="text-fd-muted-foreground">เวลาอ่าน</dt>
        <dd className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden /> ราว {card.minutes} นาที
        </dd>
        {card.needs && (
          <>
            <dt className="text-fd-muted-foreground">ควรอ่านก่อน</dt>
            <dd className="flex flex-wrap gap-x-3">
              {card.needs.map((slug) => (
                <Link key={slug} href={cardUrl(slug)} className="font-medium text-fd-primary underline">
                  {cards.find((c) => c.slug === slug)!.title}
                </Link>
              ))}
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
