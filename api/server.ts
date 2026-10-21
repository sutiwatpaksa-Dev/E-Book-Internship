import { app } from "../server/app";

// บน Vercel (bunVersion ใน vercel.json) คำขอ /api/* ถูกส่งมาที่ฟังก์ชันนี้ ส่วน port ใช้ตอนรันในเครื่องเท่านั้น
Bun.serve({ port: Number(process.env.API_PORT ?? 3001), fetch: app.fetch });
