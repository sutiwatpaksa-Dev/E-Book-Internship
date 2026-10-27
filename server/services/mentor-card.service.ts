import { cards } from "../../src/data/learn";
import type { CardStatus } from "../db/schema";
import { mentorCardRepository } from "../repositories/mentor-card.repository";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";

type CardInput = { slug: string; title: string; step: string; topic: string; minutes: number; needs: string[]; body: string };

export const MENTOR_CARD_BASE = "/learn/cards/m";
export const mentorCardUrl = (slug: string) => `${MENTOR_CARD_BASE}/${slug}`;

const BUILT_IN = new Set(cards.map((c) => c.slug));

// "อ่านก่อน" ต้องชี้ไปการ์ดที่มีจริง ไม่งั้นน้องกดแล้วเจอหน้า 404 · ชี้ตัวเองไม่ได้ (วนไม่จบ)
async function checkNeeds(slug: string, needs: string[]) {
  for (const n of needs) {
    if (n === `m/${slug}`) throw new Error("UNKNOWN_NEED");
    const ok = n.startsWith("m/") ? !!(await mentorCardRepository.findBySlug(n.slice(2))) : BUILT_IN.has(n);
    if (!ok) throw new Error("UNKNOWN_NEED");
  }
}

async function found(id: number) {
  const c = await mentorCardRepository.findById(id);
  if (!c) throw new Error("CARD_NOT_FOUND");
  return c;
}

export const mentorCardService = {
  // ---- ทุกคน: รายการการ์ดที่เผยแพร่ (หัวการ์ดอย่างเดียว คนไม่ login เห็นชื่อพร้อมรูปกุญแจ) ----
  listPublished: () => mentorCardRepository.listPublished(),

  // ---- ต้อง login: เนื้อหาเต็ม · ร่างเปิดได้เฉพาะพี่เลี้ยง (ไว้ดูตัวอย่างก่อนเผยแพร่) ----
  async read(slug: string, canSeeDraft: boolean) {
    const c = await mentorCardRepository.findBySlug(slug);
    if (!c || (c.status !== "published" && !canSeeDraft)) throw new Error("CARD_NOT_FOUND");
    return c;
  },

  // ปุ่ม "เข้าใจแล้ว" ของการ์ดพี่เลี้ยง: ลิงก์ต้องเป็นการ์ดที่เผยแพร่อยู่
  async isPublishedLink(link: string) {
    if (!link.startsWith(`${MENTOR_CARD_BASE}/`)) return false;
    const c = await mentorCardRepository.findBySlug(link.slice(MENTOR_CARD_BASE.length + 1));
    return c?.status === "published";
  },

  // ---- หลังบ้าน ----
  listAll: () => mentorCardRepository.listAll(),

  async create(devId: number, input: CardInput) {
    await checkNeeds(input.slug, input.needs);
    const c = await mentorCardRepository.create({ ...input, authorId: devId, updatedBy: devId });
    if (!c) throw new Error("SLUG_TAKEN");
    await auditService.log(devId, "card.create", input.title, mentorCardUrl(input.slug));
    return c;
  },

  // slug เปลี่ยนไม่ได้หลังสร้าง: ลิงก์ที่แชร์ไปแล้ว และติ๊ก "เข้าใจแล้ว" ของน้องผูกกับ URL นี้
  async update(devId: number, id: number, input: Omit<CardInput, "slug">) {
    const c = await found(id);
    await checkNeeds(c.slug, input.needs);
    await mentorCardRepository.update(id, { ...input, updatedBy: devId });
    await auditService.log(devId, "card.update", input.title);
  },

  async setStatus(devId: number, id: number, status: CardStatus) {
    const c = await found(id);
    if (c.status === status) return;
    const firstPublish = status === "published" && !c.publishedAt;
    await mentorCardRepository.update(id, { status, updatedBy: devId, ...(firstPublish ? { publishedAt: new Date() } : {}) });
    await auditService.log(devId, status === "published" ? "card.publish" : "card.unpublish", c.title);
    // แจ้งน้องแค่ตอนเผยแพร่ครั้งแรก ถอนแล้วเผยแพร่ใหม่ (เช่นแก้คำผิด) ไม่เด้งซ้ำ
    if (firstPublish) await notificationService.toRoles(["intern"], { kind: "new_card", title: `การ์ดใหม่จากพี่เลี้ยง: ${c.title}`, link: mentorCardUrl(c.slug) });
  },

  async remove(devId: number, id: number) {
    const c = await found(id);
    await mentorCardRepository.remove(id);
    await auditService.log(devId, "card.delete", c.title, mentorCardUrl(c.slug));
  },
};
