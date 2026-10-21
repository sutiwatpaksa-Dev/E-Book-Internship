import { fileRepository } from "../repositories/file.repository";

const REQUIREMENT_KEY = "starter-requirement";
const PDF_MAX_BYTES = 4 * 1024 * 1024; // Vercel Functions รับ body ได้ไม่เกิน ~4.5 MB

export const fileService = {
  getRequirement: () => fileRepository.find(REQUIREMENT_KEY),
  getRequirementInfo: async () => (await fileRepository.findInfo(REQUIREMENT_KEY)) ?? null,

  async saveRequirement(data: Buffer, updatedBy: number) {
    if (data.length === 0 || data.length > PDF_MAX_BYTES) throw new Error("FILE_SIZE");
    // ตรวจหัวไฟล์จริง ไม่เชื่อแค่ content-type ที่ส่งมา
    if (data.subarray(0, 5).toString() !== "%PDF-") throw new Error("NOT_PDF");
    const updatedAt = new Date();
    await fileRepository.upsert({ key: REQUIREMENT_KEY, data, contentType: "application/pdf", size: data.length, updatedBy, updatedAt });
    return { size: data.length, updatedAt };
  },
};
