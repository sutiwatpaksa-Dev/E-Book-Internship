import "server-only";
import { source } from "./source";

// ชื่อสั้นของทุกหน้า (เช่น "08b · จากแบบฐานข้อมูลสู่ Backend") ไว้บอกว่าคำถามมาจากบทไหน
// สร้างฝั่ง server แล้วส่งให้ component เป็น props หน้าเว็บจึงไม่ต้องโหลดข้อมูลเนื้อหาทั้งก้อน
export function pageTitles(): Record<string, string> {
  return Object.fromEntries(source.getPages().map((p) => [p.url, (p.data as { navTitle?: string }).navTitle ?? p.data.title]));
}
