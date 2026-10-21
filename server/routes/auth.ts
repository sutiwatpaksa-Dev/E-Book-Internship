import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { ipFailures, users } from "../db/schema";
import { env } from "../env";
import { createSessionToken, readSessionToken, ROLE_HINT_COOKIE, SESSION_COOKIE, SESSION_SECONDS } from "../session";

const USER_MAX_FAILS = 5;
const USER_LOCK_MS = 15 * 60 * 1000;
const IP_MAX_FAILS = 20;
const IP_WINDOW_MS = 15 * 60 * 1000;

const loginBody = z.object({
  username: z.string().trim().toLowerCase().min(1).max(64),
  pin: z.string().regex(/^\d{6}$/),
});

// ใช้ตอนไม่พบ username: ยังเสียเวลา verify เท่าเดิม คนร้ายจับเวลาตอบไม่ได้ว่าชื่อไหนมีอยู่จริง
const DUMMY_HASH = await Bun.password.hash("000000");
// ข้อความเดียวกันทุกกรณี ไม่บอกว่าผิดที่ชื่อ ผิดที่ PIN หรือถูกล็อก
const LOGIN_FAILED = "username หรือ PIN ไม่ถูกต้อง หรือบัญชีถูกล็อกชั่วคราว ลองใหม่ภายหลังหรือติดต่อพี่เลี้ยง";

const secure = env.APP_ORIGIN.startsWith("https://");
const cookieBase = { path: "/", secure, sameSite: "Lax" as const, maxAge: SESSION_SECONDS };

// Vercel ใส่ IP จริงของผู้ใช้ไว้ใน x-real-ip (ผู้ใช้ปลอม header นี้ผ่าน Vercel ไม่ได้)
const clientIp = (h: (n: string) => string | undefined) => h("x-real-ip") ?? h("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const parsed = loginBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "กรอก username และ PIN 6 หลัก" }, 400);
  const { username, pin } = parsed.data;
  const ip = clientIp((n) => c.req.header(n));
  const now = new Date();

  const [ipRow] = await db.select().from(ipFailures).where(eq(ipFailures.ip, ip));
  if (ipRow && now.getTime() - ipRow.windowStart.getTime() < IP_WINDOW_MS && ipRow.count >= IP_MAX_FAILS) {
    return c.json({ error: "ลองผิดหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่" }, 429);
  }

  const [user] = await db.select().from(users).where(eq(users.username, username));
  const locked = !!user?.lockedUntil && user.lockedUntil > now;
  const valid = await Bun.password.verify(pin, user?.secretHash ?? DUMMY_HASH);

  if (!user || user.disabled || locked || !valid) {
    await db
      .insert(ipFailures)
      .values({ ip, count: 1, windowStart: now })
      .onConflictDoUpdate({
        target: ipFailures.ip,
        // หน้าต่างเวลาหมดแล้วเริ่มนับใหม่ ยังไม่หมดก็นับต่อ
        set: {
          count: sql`case when ${ipFailures.windowStart} < ${new Date(now.getTime() - IP_WINDOW_MS)} then 1 else ${ipFailures.count} + 1 end`,
          windowStart: sql`case when ${ipFailures.windowStart} < ${new Date(now.getTime() - IP_WINDOW_MS)} then ${now} else ${ipFailures.windowStart} end`,
        },
      });
    if (user && !locked && !valid) {
      const fails = user.failedCount + 1;
      await db
        .update(users)
        .set(fails >= USER_MAX_FAILS ? { failedCount: 0, lockedUntil: new Date(now.getTime() + USER_LOCK_MS) } : { failedCount: fails })
        .where(eq(users.id, user.id));
    }
    return c.json({ error: LOGIN_FAILED }, 401);
  }

  await db.update(users).set({ failedCount: 0, lockedUntil: null, lastLoginAt: now }).where(eq(users.id, user.id));
  const token = await createSessionToken({ userId: user.id, username: user.username, role: user.role }, env.SESSION_SECRET);
  setCookie(c, SESSION_COOKIE, token, { ...cookieBase, httpOnly: true });
  setCookie(c, ROLE_HINT_COOKIE, user.role, cookieBase);
  return c.json({ username: user.username, role: user.role });
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  deleteCookie(c, ROLE_HINT_COOKIE, { path: "/" });
  return c.body(null, 204);
});

authRoutes.get("/me", async (c) => {
  const session = await readSessionToken(getCookie(c, SESSION_COOKIE), env.SESSION_SECRET);
  if (!session) return c.json({ error: "ยังไม่ได้ login" }, 401);
  return c.json({ username: session.username, role: session.role });
});
