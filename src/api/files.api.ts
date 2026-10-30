import type { Assignment } from "@/types";
import { request } from "./client";

// ไฟล์อยู่หลัง login (API ตรวจ role ก่อนส่ง) ไม่ได้อยู่ใน public/ เพราะ repo นี้เปิดสาธารณะ
export const REQUIREMENT_PDF_URL = "/api/files/requirement.pdf";
// PDF ของโจทย์ที่เลือก (ไม่ใส่ slug = ชิ้นหลักของรุ่น)
export const requirementUrl = (slug?: string) => (slug ? `${REQUIREMENT_PDF_URL}?a=${encodeURIComponent(slug)}` : REQUIREMENT_PDF_URL);

export const filesApi = {
  // โจทย์ที่ดูได้ ชิ้นแรก = ชิ้นที่ควรเปิดก่อน
  assignments: () => request<Assignment[]>("/files/assignments"),
  links: () => request<{ exampleRepo: string | null }>("/files/links"),
};
