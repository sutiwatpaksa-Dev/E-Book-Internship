const PDF_MAX_BYTES = 4 * 1024 * 1024; // Vercel Functions รับ body ได้ไม่เกิน ~4.5 MB

// ไฟล์โจทย์ (PDF) เก็บในตาราง files แยกตามโจทย์ ดู assignment.service.ts
export function checkPdf(data: Buffer) {
  if (data.length === 0 || data.length > PDF_MAX_BYTES) throw new Error("FILE_SIZE");
  // ตรวจหัวไฟล์จริง ไม่เชื่อแค่ content-type ที่ส่งมา
  if (data.subarray(0, 5).toString() !== "%PDF-") throw new Error("NOT_PDF");
}
