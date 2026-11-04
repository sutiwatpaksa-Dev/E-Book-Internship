import { randomBytes } from "node:crypto";
import { IMAGE_ID, IMAGE_MAX_BYTES, IMAGE_URL_PREFIX, sniffImage } from "../../src/lib/image-upload";
import { fileRepository } from "../repositories/file.repository";
import { auditService } from "./audit.service";

// รูปในเนื้อหา Markdown ของหลังบ้าน (ภาพหน้าจอ) เก็บในตาราง files เหมือน PDF โจทย์ เพราะ repo เปิดสาธารณะและ Vercel ไม่มีดิสก์ถาวร
// key = img/<เลขสุ่ม 16 ตัว> · เสิร์ฟเฉพาะคนที่ login (ดู file.routes.ts) · รูปที่ไม่มีใครใช้แล้วยังค้างในฐาน (ลบทีหลังได้ ไม่กระทบหน้าที่ยังใช้อยู่)
export const imageService = {
  async save(devId: number, data: Buffer, declaredType: string) {
    if (data.length === 0 || data.length > IMAGE_MAX_BYTES) throw new Error("IMAGE_SIZE");
    // ตรวจหัวไฟล์จริง และต้องตรงกับที่ประกาศมา (ไฟล์อื่นที่ตั้งชื่อหรือชนิดหลอกเป็นรูปไม่ผ่าน)
    const type = sniffImage(data);
    if (!type || type !== declaredType.split(";")[0].trim()) throw new Error("NOT_IMAGE");
    const id = randomBytes(8).toString("hex");
    await fileRepository.upsert({ key: `img/${id}`, data, contentType: type, size: data.length, updatedBy: devId, updatedAt: new Date() });
    await auditService.log(devId, "image.upload", id, `${Math.round(data.length / 1024)} KB`);
    return { url: `${IMAGE_URL_PREFIX}${id}` };
  },

  async read(id: string) {
    if (!IMAGE_ID.test(id)) throw new Error("IMAGE_NOT_FOUND");
    const f = await fileRepository.find(`img/${id}`);
    if (!f) throw new Error("IMAGE_NOT_FOUND");
    return f;
  },
};
