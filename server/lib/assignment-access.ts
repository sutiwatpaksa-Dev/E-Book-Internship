import type { Role } from "../db/schema";

// โจทย์ของบัญชีที่ยังไม่มีรุ่น (บัญชีเก่าก่อนมีระบบรุ่น) · เป็นโจทย์แรกที่ migration 0015 ใส่ไว้
// ตั้งแต่ 0023 slug ซ้ำได้ข้ามรุ่น (แต่ละรุ่นมีสำเนาของตัวเอง) บัญชีไม่มีรุ่นได้แถวเดิม (id น้อยสุด) ซึ่ง 0023 เก็บงานของคนไม่มีรุ่นไว้
export const DEFAULT_ASSIGNMENT = "starter";

// หน้าในหมวด /starter ที่ใช้กับทุกโจทย์ (แผน 10 วัน คุณภาพ เกณฑ์) · หน้าอื่นเขียนจากโจทย์ร้านค้าของ STARTER
export const SHARED_STARTER_PAGES = ["quality", "timeline", "submission"];

// น้องรุ่นนี้ควรเห็นหน้า /starter/<page> ไหม · page = "" คือหน้าแรกของหมวด
export const canReadStarterPage = (page: string, slugs: string[]) => slugs.includes(DEFAULT_ASSIGNMENT) || SHARED_STARTER_PAGES.includes(page);

export type AssignmentRef = { id: number; slug: string; cohortId: number };

// โจทย์ที่บัญชีนี้เห็น ชิ้นที่ควรเปิดก่อนอยู่แรก · slug ไม่ซ้ำในผลลัพธ์ (หน้าเว็บอ้างโจทย์ด้วย slug)
// น้อง: ของรุ่นตัวเอง ใหม่สุดก่อน · ไม่มีรุ่น: STARTER แถวเดิม
// พี่เลี้ยง: ทุก slug (ตรวจงานได้ทุกรุ่น) slug ที่มีหลายสำเนาใช้ของรุ่นที่กำลังดู (focus) ไม่มีก็ใช้แถวเดิม
export function visibleAssignments<T extends AssignmentRef>(role: Role, cohortId: number | null, all: T[], focus: number | null = null): T[] {
  if (role === "dev") {
    const bySlug = new Map<string, T>();
    for (const a of [...all].sort((x, y) => x.id - y.id)) {
      const cur = bySlug.get(a.slug);
      if (!cur || (cur.cohortId !== focus && a.cohortId === focus)) bySlug.set(a.slug, a);
    }
    return [...bySlug.values()].sort((x, y) => Number(y.cohortId === focus) - Number(x.cohortId === focus) || x.id - y.id);
  }
  if (cohortId === null) {
    const legacy = [...all].sort((x, y) => x.id - y.id).find((a) => a.slug === DEFAULT_ASSIGNMENT);
    return legacy ? [legacy] : [];
  }
  return all.filter((a) => a.cohortId === cohortId).sort((x, y) => y.id - x.id);
}

// เลือกโจทย์ที่จะส่งให้: ขอชิ้นไหนมาและมีสิทธิ์ = ชิ้นนั้น · ไม่ระบุ = ชิ้นใหม่สุดของรุ่น (พี่เลี้ยง = STARTER)
// ขอโจทย์ของรุ่นอื่น = null (ตอบ 404 เหมือนไม่มี ไม่บอกว่าโจทย์นั้นมีอยู่จริง)
export function pickAssignment<T extends AssignmentRef>(role: Role, cohortId: number | null, all: T[], focus: number | null = null, requested?: string): T | null {
  const visible = visibleAssignments(role, cohortId, all, focus);
  if (requested) return visible.find((a) => a.slug === requested) ?? null;
  if (role === "dev") return visible.find((a) => a.slug === DEFAULT_ASSIGNMENT) ?? visible[0] ?? null;
  return visible[0] ?? null;
}
