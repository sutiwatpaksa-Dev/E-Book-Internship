// ทุกคำขอ /api/* (ยกเว้น /api/search ของช่องค้นหา) ส่งต่อให้ API ที่เขียนด้วย Hono ใน server/
// โครง API แยกเป็นชั้น routes → services → repositories อยู่ใน server/ ทั้งหมด ไฟล์นี้เป็นแค่ประตูทางเข้า
//
// โหลด app ตอนมีคำขอแรก (dynamic import) ไม่ใช่ตอน build:
// - ตอน build ยังไม่มี env และ Bun.password ใช้ได้เฉพาะตอนรันบน Bun (bunVersion ใน vercel.json)
// - ถ้าตั้งค่า env ไม่ครบ ยังตอบเป็นข้อความที่อ่านรู้เรื่อง แทน 500 เปล่าๆ
type Fetch = (request: Request) => Response | Promise<Response>;

let ready: Promise<Fetch> | undefined;

function loadApp(): Promise<Fetch> {
  ready ??= import("@server/app").then(
    ({ app }) => app.fetch,
    (err: Error) => {
      // รายละเอียด (ยาวกี่ตัว มีช่องว่างไหม) ไว้ใน log ของ server เท่านั้น · คำตอบ API เป็นสาธารณะ บอกแค่ชื่อ key
      console.error("API start failed:", err.message);
      const missing = err.message.startsWith("ENV_INVALID: ") ? err.message.slice("ENV_INVALID: ".length).split(", ").map((d) => d.split(" (")[0]) : [];
      return () => Response.json({ error: "ระบบยังตั้งค่าไม่ครบ", missingEnv: missing }, { status: 503 });
    },
  );
  return ready;
}

const handler = async (request: Request) => (await loadApp())(request);

export const dynamic = "force-dynamic";
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
