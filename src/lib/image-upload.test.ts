import { describe, expect, test } from "bun:test";
import { IMAGE_ID, IMAGE_MAX_BYTES, sniffImage } from "./image-upload";

const bytes = (...b: number[]) => new Uint8Array(b);
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0];
const webp = [0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50];

describe("ตรวจชนิดรูปจากหัวไฟล์", () => {
  test("PNG, JPG, WebP รับ", () => {
    expect(sniffImage(bytes(...PNG))).toBe("image/png");
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffImage(bytes(...webp))).toBe("image/webp");
  });
  test("SVG, GIF, PDF, ข้อความ ไม่รับ แม้ตั้งนามสกุลเป็นรูป", () => {
    const text = (s: string) => new TextEncoder().encode(s);
    expect(sniffImage(text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(sniffImage(text("GIF89a..."))).toBeNull();
    expect(sniffImage(text("%PDF-1.7"))).toBeNull();
    expect(sniffImage(text("<html>"))).toBeNull();
  });
  test("ไฟล์สั้นเกินหัวไฟล์ และ RIFF ที่ไม่ใช่ WebP ไม่รับ", () => {
    expect(sniffImage(bytes())).toBeNull();
    expect(sniffImage(bytes(0x89, 0x50))).toBeNull();
    expect(sniffImage(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45))).toBeNull(); // WAVE
  });
  test("ชื่อรูปที่เสิร์ฟต้องเป็นเลขฐานสิบหก 16 ตัว (กัน path แปลก ๆ)", () => {
    expect(IMAGE_ID.test("0123456789abcdef")).toBe(true);
    for (const bad of ["../etc/passwd", "0123456789abcde", "0123456789abcdeg", "0123456789ABCDEF", "0123456789abcdef0"]) expect(IMAGE_ID.test(bad)).toBe(false);
  });
  test("เพดานขนาดรูปคือ 2 MB", () => expect(IMAGE_MAX_BYTES).toBe(2 * 1024 * 1024));
});
