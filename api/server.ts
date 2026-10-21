// บน Vercel (bunVersion ใน vercel.json) คำขอ /api/* ถูกส่งมาที่ฟังก์ชันนี้ ส่วน port ใช้ตอนรันในเครื่องเท่านั้น
// Vercel หา server จากการเรียก Bun.serve() ตอนโหลดไฟล์ จึงต้องเรียกทันทีครั้งเดียว ห้ามรอ await ก่อน
// ส่วน app โหลดทีหลังแบบ dynamic import: ถ้าตั้งค่า env ไม่ครบ ยังตอบเป็นข้อความที่อ่านรู้เรื่องได้ แทน 500 เปล่าๆ
type Fetch = (request: Request) => Response | Promise<Response>;

const ready: Promise<Fetch> = import("../server/app").then(
  ({ app }) => app.fetch,
  (err: Error) => {
    console.error("API start failed:", err.message);
    const missing = err.message.startsWith("ENV_INVALID: ") ? err.message.slice("ENV_INVALID: ".length).split(", ") : [];
    return () => Response.json({ error: "ระบบยังตั้งค่าไม่ครบ", missingEnv: missing }, { status: 503 });
  },
);

Bun.serve({
  port: Number(process.env.API_PORT ?? 3001),
  fetch: async (request) => (await ready)(request),
});
