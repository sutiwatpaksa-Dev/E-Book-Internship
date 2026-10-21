import { request } from "./client";

// ไฟล์อยู่หลัง login (API ตรวจ role ก่อนส่ง) ไม่ได้อยู่ใน public/ เพราะ repo นี้เปิดสาธารณะ
export const REQUIREMENT_PDF_URL = "/api/files/requirement.pdf";

export const filesApi = {
  links: () => request<{ exampleRepo: string | null }>("/files/links"),
};
