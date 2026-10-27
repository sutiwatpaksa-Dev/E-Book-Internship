import type { EduLevel, SchoolType } from "@/types";

// ป้ายภาษาไทยของการศึกษา (ค่าที่เก็บใน DB เป็นภาษาอังกฤษสั้นๆ: server/db/schema.ts)
export const SCHOOL_TYPE_LABEL: Record<SchoolType, string> = {
  university: "มหาวิทยาลัย",
  vocational: "วิทยาลัย / อาชีวศึกษา",
  other: "อื่นๆ",
};
export const EDU_LEVEL_LABEL: Record<EduLevel, string> = {
  pvc: "ปวช.",
  pvs: "ปวส.",
  bachelor: "ปริญญาตรี",
  other: "อื่นๆ",
};
// ช่องสาขา: มหาวิทยาลัยมักมีคณะ อาชีวะมักเรียกว่าแผนก
export const majorLabel = (t: SchoolType | null) => (t === "vocational" ? "แผนก / สาขาวิชา" : "คณะ / สาขา");

// "ปวส. · วิทยาลัยเทคนิคชลบุรี · แผนกเทคโนโลยีสารสนเทศ" (ข้ามช่องที่ยังไม่กรอก) · ไม่กรอกเลย = null
export function eduSummary(p: { eduLevel: EduLevel | null; schoolName: string | null; major: string | null }) {
  const parts = [p.eduLevel && EDU_LEVEL_LABEL[p.eduLevel], p.schoolName, p.major].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
