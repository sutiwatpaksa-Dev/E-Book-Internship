import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole, type AuthVars } from "../auth";
import { db } from "../db/client";
import { files, ROLES, users } from "../db/schema";
import { hashPin, newPin } from "../pin";

export const REQUIREMENT_KEY = "starter-requirement";
const PDF_MAX_BYTES = 4 * 1024 * 1024; // Vercel Functions รับ body ได้ไม่เกิน ~4.5 MB

const createBody = z.object({
  // ตัวพิมพ์เล็ก ตัวเลข . _ - เท่านั้น รูปแบบจริงพี่เลี้ยงกำหนดเอง
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,64}$/),
  role: z.enum(ROLES),
});
const patchBody = z.object({ role: z.enum(ROLES).optional(), disabled: z.boolean().optional(), unlock: z.literal(true).optional() });

const publicUser = {
  id: users.id,
  username: users.username,
  role: users.role,
  disabled: users.disabled,
  lockedUntil: users.lockedUntil,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
};

export const adminRoutes = new Hono<AuthVars>();
adminRoutes.use("*", requireRole("dev"));

adminRoutes.get("/users", async (c) => c.json(await db.select(publicUser).from(users).orderBy(asc(users.username))));

// PIN แสดงครั้งเดียวในคำตอบนี้ ระบบเก็บแค่ hash จึงดูย้อนหลังไม่ได้
adminRoutes.post("/users", async (c) => {
  const parsed = createBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "username ใช้ได้เฉพาะ a-z 0-9 . _ - ยาว 3–64 ตัว และต้องเลือก role" }, 400);
  const pin = newPin();
  const [created] = await db
    .insert(users)
    .values({ ...parsed.data, secretHash: await hashPin(pin) })
    .onConflictDoNothing()
    .returning(publicUser);
  if (!created) return c.json({ error: "มี username นี้แล้ว" }, 409);
  return c.json({ user: created, pin }, 201);
});

adminRoutes.post("/users/:id/reset-pin", async (c) => {
  const pin = newPin();
  const [u] = await db
    .update(users)
    .set({ secretHash: await hashPin(pin), secretKind: "pin", failedCount: 0, lockedUntil: null })
    .where(eq(users.id, Number(c.req.param("id"))))
    .returning(publicUser);
  if (!u) return c.json({ error: "ไม่พบบัญชี" }, 404);
  return c.json({ user: u, pin });
});

adminRoutes.patch("/users/:id", async (c) => {
  const parsed = patchBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
  const id = Number(c.req.param("id"));
  const { role, disabled, unlock } = parsed.data;
  // กันพี่เลี้ยงปิดหรือลดสิทธิ์ตัวเองจนไม่มีใครเข้าหน้า admin ได้
  if (id === c.get("user").id && (disabled === true || role === "intern")) {
    return c.json({ error: "ปิดหรือลดสิทธิ์บัญชีตัวเองไม่ได้" }, 400);
  }
  const [u] = await db
    .update(users)
    .set({ role, disabled, ...(unlock ? { failedCount: 0, lockedUntil: null } : {}) })
    .where(eq(users.id, id))
    .returning(publicUser);
  if (!u) return c.json({ error: "ไม่พบบัญชี" }, 404);
  return c.json(u);
});

adminRoutes.get("/requirement", async (c) => {
  const [f] = await db.select({ size: files.size, updatedAt: files.updatedAt }).from(files).where(eq(files.key, REQUIREMENT_KEY));
  return c.json(f ?? null);
});

adminRoutes.put("/requirement", async (c) => {
  if (c.req.header("content-type") !== "application/pdf") return c.json({ error: "ต้องเป็นไฟล์ PDF" }, 415);
  const data = Buffer.from(await c.req.arrayBuffer());
  if (data.length === 0 || data.length > PDF_MAX_BYTES) return c.json({ error: "ไฟล์ต้องไม่ว่างและไม่เกิน 4 MB" }, 413);
  // ตรวจหัวไฟล์จริง ไม่เชื่อแค่ content-type ที่ส่งมา
  if (data.subarray(0, 5).toString() !== "%PDF-") return c.json({ error: "ไฟล์นี้ไม่ใช่ PDF" }, 415);
  const row = { data, contentType: "application/pdf", size: data.length, updatedBy: c.get("user").id, updatedAt: new Date() };
  await db.insert(files).values({ key: REQUIREMENT_KEY, ...row }).onConflictDoUpdate({ target: files.key, set: row });
  return c.json({ size: data.length, updatedAt: row.updatedAt });
});
