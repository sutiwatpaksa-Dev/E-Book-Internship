import { z } from "zod";
import { steps, topics } from "../../src/data/learn";
import { AUDIENCES, CARD_STATUSES } from "../db/schema";

// ขั้นและหมวดรับเฉพาะที่มีในคู่มือ (src/data/learn.ts) · หมวดใหม่ต้องเพิ่มในโค้ด ไม่ได้สร้างจากหลังบ้าน
const step = z.enum(steps.map((s) => s.slug) as [string, ...string[]]);
const topic = z.enum(topics.map((t) => t.slug) as [string, ...string[]]);
// ส่วนท้าย URL ของการ์ด: ภาษาอังกฤษตัวเล็ก ตัวเลข และ - (ชื่อไทยใส่ใน URL แล้วอ่านยาก แชร์ลิงก์แล้วกลายเป็น %E0%B8...)
export const cardSlug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).min(3).max(60);
// การ์ดที่ควรอ่านก่อน: slug การ์ดในโค้ด หรือ m/<slug> ของการ์ดพี่เลี้ยง (service ตรวจอีกชั้นว่ามีจริง)
const need = z.string().regex(/^(m\/)?[a-z0-9]+(-[a-z0-9]+)*$/).max(64);
// path ของหน้าในคู่มือเท่านั้น (ไม่รับ URL เว็บอื่น) แบบเดียวกับหน้าที่น้องกดถาม
const pageUrl = z.string().max(200).regex(/^\/[a-z0-9/-]*$/);

export const mentorCardSchema = z.object({
  slug: cardSlug,
  title: z.string().trim().min(3).max(120),
  step,
  topic,
  minutes: z.number().int().min(1).max(60),
  needs: z.array(need).max(10).default([]),
  // 50,000 ตัวอักษร ≈ การ์ดยาวสุดในคู่มือตอนนี้ราว 3 เท่า พอสำหรับการ์ด 1 เรื่อง
  body: z.string().max(50_000),
});

export const cardStatusSchema = z.object({ status: z.enum(CARD_STATUSES) });

export const pageNoteSchema = z.object({
  pageUrl,
  body: z.string().trim().min(1).max(4000),
  visible: z.boolean().default(true),
});

export const noteQuerySchema = z.object({ page: pageUrl });

export const announcementSchema = z.object({
  body: z.string().trim().min(3).max(500),
  audience: z.enum(AUDIENCES),
  // รับเวลาแบบ ISO จาก <input type="datetime-local"> ที่หน้าเว็บแปลงแล้ว · ไม่ส่ง = เริ่มทันที / ไม่มีวันจบ
  startsAt: z.iso.datetime({ offset: true }).optional(),
  endsAt: z.iso.datetime({ offset: true }).nullable().optional(),
});

// ค่าว่าง (null) = กลับไปใช้ค่าในโค้ด
export const cardOverrideSchema = z.object({
  hidden: z.boolean(),
  title: z.string().trim().min(3).max(120).nullable(),
  minutes: z.number().int().min(1).max(60).nullable(),
  topic: topic.nullable(),
});

export const announcementEndSchema = z.object({ ended: z.literal(true) });
// read: true = ทำเป็นอ่านแล้ว · ไม่ส่ง ids = ทุกอัน
export const readNotificationsSchema = z.object({ read: z.literal(true), ids: z.array(z.number().int().positive()).max(100).optional() });
