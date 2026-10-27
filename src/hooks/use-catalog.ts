"use client";

import { useEffect, useSyncExternalStore } from "react";
import { contentApi } from "@/api/content.api";
import { cards, mentorCardUrl, type LearnCard, type StepSlug, type TopicSlug } from "@/data/learn";
import type { CardOverride, MentorCardSummary } from "@/types";

// รายการการ์ดที่ "แสดงจริง" = การ์ดในโค้ด (src/data/learn.ts) ปรับตามที่พี่เลี้ยงตั้งในหลังบ้าน + การ์ดของพี่เลี้ยง
// คลังการ์ด หน้าขั้น sidebar และหัวการ์ดใช้ store เดียวกัน ดึงจาก API ครั้งเดียวต่อการเปิดเว็บ
// ระหว่างโหลด (หรือ API ล่ม) ใช้ค่าในโค้ดไปก่อน หน้าเว็บจึงไม่ว่างเปล่าและไม่พังตาม API
type Catalog = { overrides: ReadonlyMap<string, CardOverride>; mentor: MentorCardSummary[] };
const EMPTY: Catalog = { overrides: new Map(), mentor: [] };

let state = EMPTY;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function load() {
  loading ??= Promise.all([contentApi.overrides(), contentApi.cards()])
    .then(([o, m]) => {
      state = { overrides: new Map(o.map((x) => [x.slug, x])), mentor: m };
      listeners.forEach((l) => l());
    })
    .catch(() => {
      loading = null;
    });
}

// หลังบ้านแก้แล้วเรียกตัวนี้ หน้าอื่นที่เปิดอยู่ในแท็บเดียวกันจะเห็นค่าใหม่
export function reloadCatalog() {
  loading = null;
  load();
}

function viewIn(c: Catalog, card: LearnCard): LearnCard | null {
  const o = c.overrides.get(card.slug);
  if (!o) return card;
  if (o.hidden) return null;
  return { ...card, title: o.title ?? card.title, minutes: o.minutes ?? card.minutes, topic: (o.topic as TopicSlug | null) ?? card.topic };
}

// การ์ดในโค้ดที่แสดงจริง คิดครั้งเดียวต่อค่า store (ได้ array ตัวเดิมทุก render จนกว่าหลังบ้านจะเปลี่ยน)
const visibleCache = new WeakMap<Catalog, LearnCard[]>();
function visibleIn(c: Catalog) {
  let list = visibleCache.get(c);
  if (!list) {
    list = cards.flatMap((card) => viewIn(c, card) ?? []);
    visibleCache.set(c, list);
  }
  return list;
}

export function useCatalog() {
  const c = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  useEffect(load, []);
  return {
    mentorCards: c.mentor,
    // การ์ดในโค้ดเรียงตามเดิม ตัดใบที่ซ่อนออก และใช้ชื่อ/เวลา/หมวดที่ปรับแล้ว
    // ใช้แทน cards ของ src/data/learn.ts ทุกที่ที่น้องเห็น (นับความคืบหน้า, ทำต่อ, sidebar, ก่อน/ถัดไป)
    cards: visibleIn(c),
    // การ์ดในโค้ดตามที่ควรแสดง: ถูกซ่อน = null · เปลี่ยนชื่อ/เวลา/หมวด = ค่าใหม่
    view: (card: LearnCard) => viewIn(c, card),
    // หน้าการ์ดของพี่เลี้ยงอยู่ขั้นไหน (ไม่มีใน src/data/learn.ts จึงหาจาก store)
    mentorStepOf: (url: string) => (c.mentor.find((m) => mentorCardUrl(m.slug) === url)?.step as StepSlug | undefined) ?? null,
    isHidden: (slug: string) => !!c.overrides.get(slug)?.hidden,
  };
}
