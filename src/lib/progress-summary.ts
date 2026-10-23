import { requiredLinks, roadmap } from "@/data/roadmap";
import type { ProgressEntry } from "@/types";

const TITLE = new Map(roadmap.flatMap((l) => l.items.map((i) => [i.link, i.title] as const)));
export const chapterTitle = (link: string) => TITLE.get(link) ?? link;

// สรุปความคืบหน้าของน้อง 1 คน จากบทที่ผ่าน (นับเฉพาะบทหลัก บทเสริมไม่นับ เหมือนแถบบนหน้าแรก)
export function summarize(entries: ProgressEntry[] = []) {
  const done = new Set(entries.map((e) => e.link));
  const doneCount = requiredLinks.filter((l) => done.has(l)).length;
  // ด่านปัจจุบัน = ด่านแรกที่ยังมีบทหลักไม่ผ่าน (ผ่านครบทุกด่าน = จบแล้ว)
  const level = roadmap.find((l) => l.items.some((i) => !i.extra && !done.has(i.link)));
  const last = entries.reduce<ProgressEntry | null>((a, e) => (!a || e.doneAt > a.doneAt ? e : a), null);
  return {
    done,
    doneCount,
    total: requiredLinks.length,
    level: level ? level.title : "ผ่านครบทุกด่าน",
    last: last && { title: chapterTitle(last.link), at: last.doneAt },
  };
}
