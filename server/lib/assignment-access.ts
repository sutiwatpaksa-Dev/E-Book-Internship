import type { Role } from "../db/schema";

// โจทย์ที่ทุกคนได้ถ้ายังไม่มีรุ่น (บัญชีเก่าก่อนมีระบบรุ่น) · เป็นโจทย์แรกที่ migration 0015 ใส่ไว้
export const DEFAULT_ASSIGNMENT = "starter";

// cohortSlugs = โจทย์ของรุ่นที่บัญชีนี้อยู่ ใหม่สุดก่อน · null = ไม่มีรุ่น
// พี่เลี้ยงเห็นทุกโจทย์ (ตรวจงานได้ทุกรุ่น) · น้องเห็นแค่ของรุ่นตัวเอง
export function visibleAssignments(role: Role, cohortSlugs: string[] | null, allSlugs: string[]): string[] {
  if (role === "dev") return allSlugs;
  if (cohortSlugs === null) return allSlugs.includes(DEFAULT_ASSIGNMENT) ? [DEFAULT_ASSIGNMENT] : [];
  return cohortSlugs;
}

// เลือกโจทย์ที่จะส่งให้: ขอชิ้นไหนมาและมีสิทธิ์ = ชิ้นนั้น · ไม่ระบุ = ชิ้นใหม่สุดของรุ่น (พี่เลี้ยง = STARTER)
// ขอโจทย์ของรุ่นอื่น = null (ตอบ 404 เหมือนไม่มี ไม่บอกว่าโจทย์นั้นมีอยู่จริง)
export function pickAssignment(role: Role, cohortSlugs: string[] | null, allSlugs: string[], requested?: string): string | null {
  const visible = visibleAssignments(role, cohortSlugs, allSlugs);
  if (requested) return visible.includes(requested) ? requested : null;
  if (role === "dev" && visible.includes(DEFAULT_ASSIGNMENT)) return DEFAULT_ASSIGNMENT;
  return visible[0] ?? null;
}
