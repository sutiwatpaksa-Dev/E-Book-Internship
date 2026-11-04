import type { CardAssignment } from "@/types";

// กล่องโจทย์ในหัวการ์ด: เลือกว่าจะโชว์โจทย์ไหนก่อน
// 1) โจทย์ที่น้องเลือกไว้ครั้งก่อน (ถ้ายังดูได้อยู่) 2) โจทย์แรกที่ผูกการ์ดนี้ไว้ 3) โจทย์แรกในรายการ
export function pickCardAssignment(list: CardAssignment[], saved: string | null): CardAssignment | null {
  return list.find((a) => a.slug === saved) ?? list.find((a) => a.bound) ?? list[0] ?? null;
}

// ไม่มีโจทย์ไหนผูกการ์ดนี้เลย = ไม่มีอะไรจะบอก ซ่อนกล่องทั้งใบ (ไม่โชว์กล่องที่มีแต่ "ยังไม่ได้ระบุ")
export const hasCardAssignment = (list: CardAssignment[]) => list.some((a) => a.bound);
