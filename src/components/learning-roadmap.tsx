"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { requiredLinks, roadmap, type RoadmapItem } from "@/data/roadmap";
import { useProgress } from "@/hooks/use-progress";
import { useSession } from "@/hooks/use-session";
import { gate } from "@/lib/page-access";

export function LearningRoadmap() {
  const { role } = useSession();
  const { done, toggle } = useProgress();
  const doneCount = requiredLinks.filter((link) => done.has(link)).length;
  const percent = Math.round((doneCount / requiredLinks.length) * 100);

  return (
    <div className="not-prose my-6">
      <div role="status" className="flex items-center gap-3 text-sm">
        <span>
          ผ่านแล้ว <b>{doneCount}</b> / {requiredLinks.length} บท
        </span>
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-fd-muted">
          <span className="block h-full bg-(--rm-done) transition-all duration-300" style={{ width: `${percent}%` }} />
        </span>
        <span>{percent}%</span>
      </div>

      <Pill>เริ่มที่นี่</Pill>

      {roadmap.map((level, li) => (
        // เส้นแกนกลางร้อยทุกด่าน (จอแคบย้ายไปชิดซ้าย)
        <section
          key={level.title}
          className="relative pt-7 before:absolute before:top-0 before:bottom-0 before:left-3.5 before:border-l-[3px] before:border-(--rm-line) sm:before:left-1/2 sm:before:-translate-x-1/2 last:before:bottom-5"
        >
          <div className="relative z-10 flex w-full flex-col rounded-lg border-2 border-(--rm-node-fg) bg-(--rm-node-bg) px-4 py-2.5 text-(--rm-node-fg) sm:mx-auto sm:w-[min(340px,90%)] sm:items-center sm:text-center">
            <span className="font-bold">{level.title}</span>
            <span className="text-[13px] leading-snug">{level.goal}</span>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-y-3 pl-10 sm:grid-cols-[1fr_56px_1fr] sm:pl-0">
            {level.items.map((item, i) => (
              <Topic
                key={item.link}
                item={item}
                side={i % 2 === 0 ? "left" : "right"}
                done={done.has(item.link)}
                locked={gate(item.link, role) !== "allow"}
                onToggle={() => toggle(item.link)}
              />
            ))}
          </ul>
          {li === roadmap.length - 1 && <Pill>ส่งมอบเว็บที่ลูกค้าใช้งานจริง</Pill>}
        </section>
      ))}

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-fd-muted-foreground">
        <span>
          <i className="mr-1 inline-block h-3 w-4.5 rounded-sm border-2 border-(--rm-node-fg) bg-(--rm-item-bg) align-middle" /> บทหลัก อ่านตามลำดับ
        </span>
        <span>
          <i className="mr-1 inline-block h-3 w-4.5 rounded-sm border-2 border-dashed border-fd-muted-foreground bg-fd-card align-middle" /> บทเสริม อ่านเมื่ออยากรู้ลึก
        </span>
        <span>เครื่องหมายกุญแจ = ต้อง login</span>
        <span>✓ ติ๊กเองเมื่อผ่านบท (login อยู่: เก็บกับบัญชี · ไม่ได้ login: เก็บในเบราว์เซอร์นี้)</span>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 mt-5 w-fit rounded-full border border-fd-border bg-fd-card px-3.5 py-1.5 text-sm font-semibold sm:mx-auto">
      {children}
    </div>
  );
}

type TopicProps = { item: RoadmapItem; side: "left" | "right"; done: boolean; locked: boolean; onToggle: () => void };

function Topic({ item, side, done, locked, onToggle }: TopicProps) {
  // เส้นประจากบทไปหาแกนกลาง
  const connector =
    side === "left"
      ? "after:-left-[26px] after:w-[26px] sm:col-start-1 sm:after:left-auto sm:after:-right-7 sm:after:w-7"
      : "after:-left-[26px] after:w-[26px] sm:col-start-3 sm:after:-left-7 sm:after:w-7";
  const card = item.extra
    ? "border-dashed border-fd-muted-foreground bg-fd-card"
    : done
      ? "border-(--rm-done) bg-(--rm-item-bg)"
      : "border-(--rm-node-fg) bg-(--rm-item-bg) dark:border-fd-border";

  return (
    <li
      className={`relative flex after:absolute after:top-1/2 after:border-t-2 after:border-dashed after:border-(--rm-line) ${item.extra ? "after:border-dotted after:border-fd-muted-foreground" : ""} ${connector}`}
    >
      <Link
        href={item.link}
        className={`flex flex-1 gap-2.5 rounded-lg border-2 px-3 py-2.5 transition hover:-translate-y-0.5 hover:shadow-md ${card}`}
      >
        <span className="min-w-7 shrink-0 font-bold text-fd-primary">{item.num}</span>
        <span className="flex flex-col gap-0.5">
          <span className={`leading-snug font-semibold ${done ? "line-through decoration-(--rm-done)" : ""}`}>
            {item.title}
            {locked && <Lock aria-label="ต้อง login" className="ml-1 inline size-3.5 align-[-2px] text-fd-muted-foreground" />}
          </span>
          <span className="text-[13px] leading-snug text-fd-muted-foreground">{item.outcome}</span>
          <span className="text-xs text-fd-muted-foreground/80">{item.time}</span>
        </span>
      </Link>
      {!item.extra && (
        <button
          type="button"
          aria-pressed={done}
          title={done ? "ยกเลิกติ๊ก" : "ติ๊กว่าผ่านบทนี้แล้ว"}
          onClick={onToggle}
          className={`absolute -top-2 -right-2 size-6.5 rounded-full border-2 text-sm leading-none font-bold text-white ${done ? "border-(--rm-done) bg-(--rm-done)" : "border-fd-border bg-fd-background hover:border-(--rm-done)"}`}
        >
          {done ? "✓" : ""}
        </button>
      )}
    </li>
  );
}
