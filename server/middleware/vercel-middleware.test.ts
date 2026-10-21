import { beforeAll, expect, test } from "bun:test";
import middleware from "../../middleware";
import { createSessionToken } from "../lib/session";

const SECRET = "test-secret-test-secret-test-secret-123";
let intern = "";
beforeAll(async () => {
  process.env.SESSION_SECRET = SECRET;
  intern = await createSessionToken({ userId: 1, username: "a", role: "intern" }, SECRET);
});
const req = (path: string, token?: string) =>
  new Request(`https://e-book-internship.vercel.app${path}`, token ? { headers: { cookie: `x=1; bt_session=${token}` } } : {});

test("ไม่ได้ login เปิดหน้า STARTER ถูกพาไปหน้า login พร้อมทางกลับ", async () => {
  const res = (await middleware(req("/starter/timeline")))!;
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe("https://e-book-internship.vercel.app/login?next=%2Fstarter%2Ftimeline");
});
test("ไฟล์ JS ของหน้าที่ล็อกตอบ 401 ไม่ redirect", async () => {
  expect((await middleware(req("/assets/starter_index.md.abc.js")))!.status).toBe(401);
});
test("intern เปิด STARTER ได้ แต่หน้า Dev ไปหน้าไม่มีสิทธิ์", async () => {
  expect(await middleware(req("/starter/timeline", intern))).toBeUndefined();
  expect((await middleware(req("/dev/admin", intern)))!.headers.get("location")).toContain("/no-access");
});
test("บัตรปลอมหรือเซ็นด้วยกุญแจอื่นใช้ไม่ได้", async () => {
  const forged = await createSessionToken({ userId: 1, username: "a", role: "dev" }, "another-secret-another-secret-12345");
  expect((await middleware(req("/dev/admin", forged)))!.status).toBe(307);
});
