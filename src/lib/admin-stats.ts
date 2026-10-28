import { cardByUrl, cardUrl, cards, cardsOf, nextUp, steps, type StepSlug } from "@/data/learn";
import type { ProgressEntry } from "@/types";

// ตัวเลขของกราฟหน้าภาพรวมหลังบ้าน · คำนวณจากข้อมูลที่หลังบ้านโหลดมาอยู่แล้ว (ไม่มีตารางหรือ API ใหม่)
// แยกจาก component ให้เทสต์ได้ด้วยวันที่ที่กำหนดเอง ไม่ต้องรอเวลาจริง

const DAY = 24 * 60 * 60 * 1000;
// วันตามเวลาไทย (YYYY-MM-DD) · ถ้าใช้ toISOString จะเป็นเวลา UTC งานที่ทำตอน 6 โมงเช้าจะไปนับเป็นเมื่อวาน
const dayTH = (t: number) => new Date(t).toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });

// นับเหตุการณ์รายวันย้อนหลัง n วัน (รวมวันนี้) · วันที่ไม่มีอะไรเลยก็ต้องมีแท่ง 0 ไม่งั้นกราฟจะดูเหมือนทำทุกวัน
export function dailyCounts(times: string[], days: number, now = Date.now()) {
  const counts = new Map<string, number>();
  for (const t of times) counts.set(dayTH(new Date(t).getTime()), (counts.get(dayTH(new Date(t).getTime())) ?? 0) + 1);
  return Array.from({ length: days }, (_, i) => {
    const day = dayTH(now - (days - 1 - i) * DAY);
    return { day, value: counts.get(day) ?? 0 };
  });
}

// "28 ต.ค." สำหรับป้ายแกนและ tooltip
export const shortDay = (day: string) => new Date(`${day}T12:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" });

const CARD_STEP = new Map(cards.map((c) => [cardUrl(c.slug), c.step] as const));
// ติ๊กผ่านเฉพาะการ์ดใน 7 ขั้น (บทเดิมและการ์ดของพี่เลี้ยงไม่นับ ตัวหารจึงเท่ากันทุกคน)
export const cardEntries = (entries: ProgressEntry[] = []) => entries.filter((e) => CARD_STEP.has(e.link));

// สรุปน้อง 1 คนสำหรับตารางภาพรวม: นับการ์ด 7 ขั้นแบบเดียวกับกราฟ (เดิมนับบทเก่าของ roadmap ตัวเลขจึงไม่ตรงกับกราฟ)
export function cardSummary(entries: ProgressEntry[] = []) {
  const list = cardEntries(entries);
  const done = new Set(list.map((e) => e.link));
  const { started, card, step } = nextUp(done);
  const last = list.reduce<ProgressEntry | null>((a, e) => (!a || e.doneAt > a.doneAt ? e : a), null);
  return {
    doneCount: done.size,
    total: cards.length,
    where: !card ? "ผ่านครบทุกการ์ด" : started ? `${step.num}. ${step.name}` : "ยังไม่เริ่ม",
    last: last && { title: cardByUrl(last.link)?.title ?? last.link, at: last.doneAt },
  };
}

// แต่ละขั้น: น้องผ่านการ์ดในขั้นนั้นเฉลี่ยกี่ % และตอนนี้มีกี่คนที่ "อยู่" ขั้นนั้น (ขั้นแรกที่ยังมีการ์ดไม่ผ่าน)
// ขั้นที่ยังไม่มีการ์ด (เช่น Deploy) ไม่แสดง เพราะเป็น 0% ตลอด อ่านแล้วเหมือนน้องไม่ทำ
export function stepProgress(perIntern: ProgressEntry[][]) {
  const withCards = steps.filter((s) => cardsOf(s.slug).length > 0);
  const here = new Map<StepSlug | "done", number>();
  const doneSets = perIntern.map((entries) => new Set(cardEntries(entries).map((e) => e.link)));
  for (const done of doneSets) {
    const at = withCards.find((s) => cardsOf(s.slug).some((c) => !done.has(cardUrl(c.slug))));
    here.set(at?.slug ?? "done", (here.get(at?.slug ?? "done") ?? 0) + 1);
  }
  return {
    rows: withCards.map((s) => {
      const list = cardsOf(s.slug);
      const pct = doneSets.length ? doneSets.reduce((sum, d) => sum + list.filter((c) => d.has(cardUrl(c.slug))).length / list.length, 0) / doneSets.length : 0;
      return { slug: s.slug, num: s.num, name: s.name, th: s.th, cards: list.length, pct: Math.round(pct * 100), here: here.get(s.slug) ?? 0 };
    }),
    finished: here.get("done") ?? 0,
  };
}

// กลุ่มการเข้าใช้งาน เรียงจากใหม่ไปเก่า (กราฟแท่งเดียวแบ่งส่วน) · เกณฑ์ 3 วันตรงกับ "ไม่ได้เข้า" ในกล่องตัวเลขด้านบน
export const LOGIN_BUCKETS = ["today", "recent", "stale", "never"] as const;
export type LoginBucket = (typeof LOGIN_BUCKETS)[number];
export const LOGIN_BUCKET_LABEL: Record<LoginBucket, string> = {
  today: "เข้าวันนี้",
  recent: "1–3 วันก่อน",
  stale: "เกิน 3 วัน",
  never: "ยังไม่เคยเข้า",
};
export function loginBuckets(lastLogins: (string | null)[], now = Date.now()) {
  const n: Record<LoginBucket, number> = { today: 0, recent: 0, stale: 0, never: 0 };
  for (const t of lastLogins) {
    if (!t) n.never++;
    else if (dayTH(new Date(t).getTime()) === dayTH(now)) n.today++;
    else if (now - new Date(t).getTime() <= 3 * DAY) n.recent++;
    else n.stale++;
  }
  return LOGIN_BUCKETS.map((key) => ({ key, label: LOGIN_BUCKET_LABEL[key], value: n[key] }));
}
