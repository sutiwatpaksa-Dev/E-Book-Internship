import { z } from "zod";

// อ่านค่าตั้งค่าครั้งเดียวตอนเริ่ม ขาดตัวไหนให้ล้มตั้งแต่ต้น ดีกว่าไปพังกลางคำขอของผู้ใช้
const schema = z.object({
  DATABASE_URL: z.string().url(),
  // ใช้เซ็นบัตรผ่าน (JWT) ยาวอย่างน้อย 32 ตัว สร้างด้วย: openssl rand -base64 48
  SESSION_SECRET: z.string().min(32),
  // หน้าเว็บของเราเอง ด่าน CSRF ยอมเฉพาะคำขอจาก origin นี้
  APP_ORIGIN: z.string().url(),
  // repo ตัวอย่างระบบจริง แสดงหลัง login (เก็บใน env ไม่ใส่ใน repo สาธารณะ) ยังไม่ตั้งก็ได้
  EXAMPLE_REPO_URL: z.string().url().optional(),
});

// บอก "รูปร่าง" ของค่าที่ผิด ไม่บอกค่าจริง (อาจเป็นความลับ): พอให้รู้ว่าว่าง ติดอะไรมาหัวท้าย หรือมีอักขระแปลก
function describe(value: string | undefined) {
  if (value === undefined) return "ไม่ได้ตั้ง";
  if (value === "") return "ค่าว่าง";
  const head = value.split("://")[0].slice(0, 15);
  const odd = [
    /\s/.test(value) && "มีช่องว่าง/ขึ้นบรรทัด",
    /['"]/.test(value) && "มีเครื่องหมายคำพูด",
    /[^\x20-\x7e]/.test(value) && "มีอักขระที่มองไม่เห็นหรือไม่ใช่ ASCII",
  ].filter(Boolean);
  return `ยาว ${value.length} ตัว ขึ้นต้น "${head}"${odd.length ? ` · ${odd.join(" · ")}` : ""}`;
}

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const keys = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
  const detail = keys.map((k) => `${k} (${describe(process.env[k])})`);
  throw new Error(`ENV_INVALID: ${detail.join(", ")}`);
}
export const env = parsed.data;
