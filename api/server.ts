// บน Vercel (bunVersion ใน vercel.json) คำขอ /api/* ถูกส่งมาที่ฟังก์ชันนี้ ส่วน port ใช้ตอนรันในเครื่องเท่านั้น
// โหลด app แบบ dynamic import: ถ้าตั้งค่า env ไม่ครบ ยังตอบเป็นข้อความที่อ่านรู้เรื่องได้ แทน 500 เปล่าๆ
const port = Number(process.env.API_PORT ?? 3001);

try {
  const { app } = await import("../server/app");
  Bun.serve({ port, fetch: app.fetch });
} catch (err) {
  const message = (err as Error).message;
  console.error("API start failed:", message);
  const missing = message.startsWith("ENV_INVALID: ") ? message.slice("ENV_INVALID: ".length).split(", ") : [];
  Bun.serve({
    port,
    fetch: () => Response.json({ error: "ระบบยังตั้งค่าไม่ครบ", missingEnv: missing }, { status: 503 }),
  });
}

export {};
