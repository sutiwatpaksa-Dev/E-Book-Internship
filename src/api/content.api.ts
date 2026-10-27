import type { Announcement, CardOverride, MentorCard, MentorCardSummary, PageNote } from "@/types";
import { request } from "./client";

// ฝั่งคนอ่าน: การ์ดของพี่เลี้ยง, การ์ดในระบบที่ถูกปรับ, โน้ตท้ายหน้า, ประกาศ
export const contentApi = {
  // หัวการ์ดที่เผยแพร่ (ไม่ต้อง login)
  cards: () => request<MentorCardSummary[]>("/content/cards"),
  // เนื้อหาเต็ม (ต้อง login)
  card: (slug: string) => request<MentorCard>(`/content/cards/${encodeURIComponent(slug)}`),
  overrides: () => request<CardOverride[]>("/content/overrides"),
  notes: (pageUrl: string) => request<PageNote[]>(`/content/notes?page=${encodeURIComponent(pageUrl)}`),
  announcements: () => request<Announcement[]>("/content/announcements"),
};
