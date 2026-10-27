"use client";

import { useEffect, useState } from "react";
import { adminContentApi } from "@/api/admin-content.api";
import { contentApi } from "@/api/content.api";
import type { Announcement, AnnouncementInput, CardOverride, CardStatus, MentorCardInput, MentorCardSummary, PageNote, PageNoteInput } from "@/types";
import { reloadCatalog } from "./use-catalog";
import { toast } from "./use-toast";

// ข้อมูลและคำสั่งของแท็บ "เนื้อหา" และ "ประกาศ" ในหลังบ้าน แยกจากหน้าตาแบบเดียวกับ use-admin.ts
// ทุกคำสั่งคืน true/false: หน้าฟอร์มรู้ว่าจะปิดตัวเองหรือค้างไว้ให้แก้ต่อ
export function useContentAdmin() {
  const [cards, setCards] = useState<MentorCardSummary[]>([]);
  const [notes, setNotes] = useState<PageNote[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [overrides, setOverrides] = useState<CardOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<void>, done?: string) {
    setError("");
    try {
      await fn();
      if (done) toast.success(done);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }

  const reload = () =>
    run(async () => {
      const [c, n, a, o] = await Promise.all([adminContentApi.listCards(), adminContentApi.listNotes(), adminContentApi.listAnnouncements(), contentApi.overrides()]);
      setCards(c);
      setNotes(n);
      setAnnouncements(a);
      setOverrides(o);
    });

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // หลังแก้อะไรก็ตาม: โหลดรายการหลังบ้านใหม่ และบอกคลังการ์ดในแท็บนี้ให้ดึงใหม่ด้วย
  const after = async () => {
    await reload();
    reloadCatalog();
  };

  return {
    cards,
    notes,
    announcements,
    overrides,
    loading,
    error,
    reload,
    clearError: () => setError(""),
    // เปิดการ์ดมาแก้: ดึงเนื้อหาเต็ม (ในรายการมีแค่หัวการ์ด) ผ่าน API ฝั่งคนอ่าน ซึ่งให้พี่เลี้ยงเห็นร่างได้
    loadCard: async (slug: string) => {
      setError("");
      try {
        return await contentApi.card(slug);
      } catch (e) {
        setError((e as Error).message);
        return null;
      }
    },
    saveCard: (id: number | null, input: MentorCardInput) =>
      run(async () => {
        if (id === null) await adminContentApi.createCard(input);
        else await adminContentApi.updateCard(id, input);
        await after();
      }, id === null ? "บันทึกร่างแล้ว น้องยังไม่เห็นจนกว่าจะกดเผยแพร่" : "บันทึกแล้ว"),
    setCardStatus: (c: MentorCardSummary, status: CardStatus) =>
      run(async () => {
        await adminContentApi.setCardStatus(c.id, status);
        await after();
      }, status === "published" ? `เผยแพร่ "${c.title}" แล้ว น้องเห็นในคลังการ์ดทันที` : `ถอน "${c.title}" กลับเป็นร่างแล้ว`),
    deleteCard: (c: MentorCardSummary) =>
      run(async () => {
        await adminContentApi.deleteCard(c.id);
        await after();
      }, `ลบ "${c.title}" แล้ว`),

    saveNote: (id: number | null, input: PageNoteInput) =>
      run(async () => {
        if (id === null) await adminContentApi.createNote(input);
        else await adminContentApi.updateNote(id, input);
        await after();
      }, input.visible ? "บันทึกโน้ตแล้ว น้องเห็นท้ายหน้านั้นทันที" : "บันทึกโน้ตแล้ว (ซ่อนอยู่)"),
    deleteNote: (n: PageNote) =>
      run(async () => {
        await adminContentApi.deleteNote(n.id);
        await after();
      }, "ลบโน้ตแล้ว"),

    createAnnouncement: (input: AnnouncementInput) =>
      run(async () => {
        await adminContentApi.createAnnouncement(input);
        await after();
      }, "ประกาศแล้ว ส่งแจ้งเตือนให้ทุกคนในกลุ่มที่เลือก"),
    endAnnouncement: (a: Announcement) =>
      run(async () => {
        await adminContentApi.endAnnouncement(a.id);
        await after();
      }, "ปิดประกาศแล้ว"),

    setOverride: (slug: string, o: Omit<CardOverride, "slug">) =>
      run(async () => {
        await adminContentApi.setOverride(slug, o);
        await after();
      }, o.hidden ? "ซ่อนการ์ดแล้ว น้องไม่เห็นในคลังและหน้าขั้น" : "บันทึกแล้ว"),
  };
}

export type ContentAdminState = ReturnType<typeof useContentAdmin>;
