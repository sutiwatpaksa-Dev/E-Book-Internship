// รูปในเนื้อหา Markdown ของหลังบ้าน (ภาพหน้าจอเป็นหลัก) · ค่ากำหนดและตัวตรวจใช้ร่วมกันทั้ง server และเบราว์เซอร์
// ชนิดที่รับ: PNG, JPG, WebP เท่านั้น (ไม่รับ SVG: ไฟล์ SVG ฝังสคริปต์ได้ และไม่รับ GIF เพื่อกันไฟล์หนัก)
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];
// Vercel Functions รับ body ได้ไม่เกิน ~4.5 MB และรูปเก็บในฐานข้อมูล จึงจำกัดที่ 2 MB (เบราว์เซอร์ย่อรูปให้พอดีก่อนส่ง)
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
// ภาพหน้าจอจากจอ Retina กว้าง 2,000–3,000px ซึ่งใหญ่เกินที่หน้าเว็บแสดงจริง ย่อให้กว้างไม่เกินนี้
export const IMAGE_MAX_WIDTH = 1600;
// รูปที่หน้าเว็บเสิร์ฟ: ชื่อไฟล์เป็นเลขฐานสิบหก 16 ตัว (สุ่มตอนอัปโหลด) ใช้เป็นเงื่อนไขเดียวที่ Markdown ยอมให้แสดงรูป
export const IMAGE_URL_PREFIX = "/api/files/img/";
export const IMAGE_ID = /^[a-f0-9]{16}$/;

// ดูชนิดจากหัวไฟล์จริง ไม่เชื่อ content-type หรือนามสกุลที่ส่งมา · ไม่ใช่รูปที่รับ = null
export function sniffImage(data: Uint8Array): ImageType | null {
  const at = (i: number, bytes: number[]) => bytes.every((b, k) => data[i + k] === b);
  if (data.length >= 8 && at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (data.length >= 3 && at(0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  // WebP = "RIFF" + ขนาด 4 ไบต์ + "WEBP"
  if (data.length >= 12 && at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return "image/webp";
  return null;
}

// ฝั่งเบราว์เซอร์: ย่อรูปให้กว้างไม่เกิน IMAGE_MAX_WIDTH และไฟล์ไม่เกิน IMAGE_MAX_BYTES ก่อนอัปโหลด
// รูปเล็กพออยู่แล้วส่งไฟล์เดิมไปเลย (ไม่บีบซ้ำให้คุณภาพตก) · โยนข้อความไทยเมื่อทำไม่ได้
export async function shrinkImage(file: File): Promise<Blob> {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) throw new Error("รูปต้องเป็น PNG, JPG หรือ WebP");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("เปิดรูปนี้ไม่ได้ ไฟล์อาจเสีย");
  });
  try {
    if (file.size <= IMAGE_MAX_BYTES && bitmap.width <= IMAGE_MAX_WIDTH) return file;
    const scale = Math.min(1, IMAGE_MAX_WIDTH / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("เบราว์เซอร์นี้ย่อรูปไม่ได้ ลองย่อรูปก่อนแล้วอัปโหลดใหม่");
    // พื้นขาวรองไว้ เผื่อต้องบันทึกเป็น JPG (ไม่มีความโปร่งใส)
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const encode = (type: string, q: number) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, q));
    for (const q of [0.85, 0.7, 0.55]) {
      // WebP เล็กกว่า แต่ Safari เข้ารหัส WebP ไม่ได้ (คืน PNG กลับมา) จึงใช้ JPG แทนในกรณีนั้น
      let blob = await encode("image/webp", q);
      if (blob?.type !== "image/webp") blob = await encode("image/jpeg", q);
      if (blob && blob.size <= IMAGE_MAX_BYTES) return blob;
    }
    throw new Error("รูปนี้ใหญ่เกินไป (เกิน 2 MB แม้ย่อแล้ว) ลองตัดเฉพาะส่วนที่ต้องการ");
  } finally {
    bitmap.close();
  }
}
