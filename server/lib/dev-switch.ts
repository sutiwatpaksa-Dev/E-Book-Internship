// ปุ่มสลับบัญชีสำหรับทดสอบในเครื่อง: เปิดได้เฉพาะเมื่อครบทั้ง 3 ข้อ (ขึ้น Vercel แล้วปิดเองเสมอ)
// 1) ไม่ใช่ production  2) ฐานข้อมูลอยู่เครื่องนี้  3) เว็บเปิดจาก localhost
// รายการให้เลือกคือบัญชีตัวอย่าง (demo.*) จาก scripts/seed-demo.ts · ฐานในเครื่องเท่านั้น จึงสลับกลับบัญชีเดิมของตัวเองได้ด้วย
export function devSwitchAllowed(env: { NODE_ENV?: string; DATABASE_URL: string; APP_ORIGIN: string }) {
  if (env.NODE_ENV === "production") return false;
  try {
    const db = new URL(env.DATABASE_URL).hostname;
    const app = new URL(env.APP_ORIGIN).hostname;
    return ["localhost", "127.0.0.1"].includes(db) && ["localhost", "127.0.0.1"].includes(app);
  } catch {
    return false;
  }
}

