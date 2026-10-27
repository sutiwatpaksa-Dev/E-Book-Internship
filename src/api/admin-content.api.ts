import type { Announcement, AnnouncementInput, CardOverride, CardStatus, MentorCardInput, MentorCardSummary, PageNote, PageNoteInput } from "@/types";
import { jsonBody, request } from "./client";

// หลังบ้าน: พี่เลี้ยงเขียนเนื้อหาเอง (ต้องเป็น role dev)
const base = "/admin/content";

export const adminContentApi = {
  listCards: () => request<MentorCardSummary[]>(`${base}/cards`),
  createCard: (input: MentorCardInput) => request<{ id: number }>(`${base}/cards`, jsonBody("POST", input)),
  updateCard: (id: number, { slug: _, ...input }: MentorCardInput) => request<null>(`${base}/cards/${id}`, jsonBody("PUT", input)),
  setCardStatus: (id: number, status: CardStatus) => request<null>(`${base}/cards/${id}/status`, jsonBody("PATCH", { status })),
  deleteCard: (id: number) => request<null>(`${base}/cards/${id}`, { method: "DELETE" }),

  listNotes: () => request<PageNote[]>(`${base}/notes`),
  createNote: (input: PageNoteInput) => request<{ id: number }>(`${base}/notes`, jsonBody("POST", input)),
  updateNote: (id: number, input: PageNoteInput) => request<null>(`${base}/notes/${id}`, jsonBody("PUT", input)),
  deleteNote: (id: number) => request<null>(`${base}/notes/${id}`, { method: "DELETE" }),

  listAnnouncements: () => request<Announcement[]>(`${base}/announcements`),
  createAnnouncement: (input: AnnouncementInput) => request<{ id: number }>(`${base}/announcements`, jsonBody("POST", input)),
  endAnnouncement: (id: number) => request<null>(`${base}/announcements/${id}/end`, { method: "POST" }),

  setOverride: (slug: string, o: Omit<CardOverride, "slug">) => request<null>(`${base}/overrides/${slug}`, jsonBody("PUT", o)),
};
