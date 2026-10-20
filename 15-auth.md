# บทที่ 15: ระบบ login หน้าจัดการร้าน 🔑

> ⏱ ประมาณ 4 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 10, 13 และ 14 · 🛠 ใช้: Hono, `Bun.password`, React Router

> **⚡ สรุป 30 วินาที**
> - เก็บรหัสผ่านแบบ **hash** (แปลงทางเดียว ย้อนกลับไม่ได้ ไม่ใช่การเข้ารหัส) ด้วย `Bun.password`
> - login สำเร็จ → server ออก **บัตรผ่าน (JWT)** ใส่ไว้ใน **cookie แบบที่โค้ดในหน้าเว็บอ่านไม่ได้** (`httpOnly`) ใช้ได้ 1 วัน
> - มี **ด่านตรวจ (middleware)** หน้าทุก `/api/admin/...` ไม่มีบัตรหรือบัตรหมดอายุ → ตอบ `401`
> - login ผิดตอบข้อความเดียว **"อีเมลหรือรหัสผ่านไม่ถูกต้อง"** ห้ามบอกว่าผิดช่องไหน
> - หน้าเว็บพาคนที่ยังไม่ login ไปหน้า login ก็จริง แต่ **ตัวกันจริงคือ server**

> **📖 คำใหม่ในบทนี้**
> [Hash](./glossary.md#hash) · [JWT](./glossary.md#jwt) · [Cookie](./glossary.md#cookie) · [HttpOnly](./glossary.md#httponly) · [Middleware](./glossary.md#middleware) · [401 / 403](./glossary.md#401) · [XSS](./glossary.md#xss) · [CORS](./glossary.md#cors)

---

## 📖 เรื่องเล่า

บิตทำหน้า `/admin` เสร็จ ซ่อนปุ่มไว้อย่างดี พี่ไบต์เปิด Terminal แล้วพิมพ์:
```bash
curl -X DELETE http://localhost:3000/api/admin/categories/1
```
หมวดหายไปทั้งหมวด 😱 บิต: *"แต่พี่ยังไม่ได้ login เลยนะ!"*
พี่ไบต์: *"server ไม่รู้หรอกว่าเราซ่อนปุ่มไว้ server ต้องถามเองทุกครั้งว่า 'คุณเป็นใคร'"*

> ⚠️ นี่คือ 1 ใน 3 ข้อที่ทำให้งาน STARTER **ไม่ผ่านทันที**: *เรียก API หลังบ้านได้โดยไม่ต้อง login*

---

## 1. login ทำงานยังไง

![ลำดับตอน login: เบราว์เซอร์ส่งอีเมลและรหัสผ่าน server หาบัญชีแล้วเทียบ hash ตรงก็ออกบัตรผ่านใน Set-Cookie ไม่ตรงตอบ 401](/img/15-login-sequence.svg)
*ลำดับขั้นของการ login ตั้งแต่กดปุ่มจนได้บัตรผ่าน*

> 💡 **นึกภาพ:** สายรัดข้อมือเข้างานคอนเสิร์ต 🎟️ ตรวจบัตรครั้งเดียวที่ประตู แล้วได้สายรัดข้อมือ เดินเข้าโซนไหนก็แค่โชว์สายรัด ไม่ต้องโชว์บัตรประชาชนทุกครั้ง

**ทำไมเก็บบัตรใน cookie แบบ `httpOnly` ไม่ใช่ localStorage** (ทบทวน [บทที่ 10](./10-security.md#_3-authentication-vs-authorization))
| | localStorage | cookie แบบ `httpOnly` |
|---|---|---|
| โค้ดในหน้าเว็บอ่านได้ไหม | ✅ ได้ → ถ้าคนร้ายแอบใส่โค้ดลงหน้าเว็บได้ บัตรถูกขโมยทันที | ❌ ไม่ได้ |
| ต้องแนบบัตรเองทุกครั้งไหม | ต้องเขียนโค้ดแนบเอง | เบราว์เซอร์แนบให้เอง |
| กันเว็บอื่นแอบส่งคำขอแทนเรา | ไม่ช่วย | ตั้ง `SameSite=Lax` ช่วยกันได้ |

**ตั้งค่า cookie แต่ละตัวทำอะไร**
| ตั้งค่า | ทำอะไร |
|---|---|
| `HttpOnly` | โค้ดในหน้าเว็บอ่าน cookie นี้ไม่ได้ |
| `SameSite=Lax` | ถ้าเว็บอื่นพยายามส่งคำขอมาที่เว็บเรา เบราว์เซอร์จะไม่แนบ cookie ไปให้ |
| `Secure` | ส่ง cookie เฉพาะตอนเป็น `https://` (เปิดตอนขึ้นระบบจริง ตอนพัฒนาในเครื่องใช้ `http://` จึงปิดไว้) |
| `Max-Age=86400` | หมดอายุใน 1 วัน (86,400 วินาที) ตามที่งาน STARTER กำหนด |
| `Path=/` | ใช้ได้ทุกหน้าของเว็บ |

![เปรียบเทียบ localStorage ที่โค้ดแปลกปลอมอ่านได้ กับ cookie แบบ HttpOnly ที่อ่านไม่ได้ พร้อมค่าที่ตั้งใน cookie](/img/15-cookie-flags.svg)
*ถ้าเก็บบัตรใน localStorage โค้ดแปลกปลอมอ่านได้ แต่ cookie แบบ HttpOnly อ่านไม่ได้*

---

## 2. 🔧 เตรียมตารางบัญชี และกุญแจลับ

เพิ่มใน `src/db/schema.ts`
```ts
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),     // ห้ามมีคอลัมน์ password เด็ดขาด
  name: text("name").notNull(),
  ...timestamps,
});
```
```bash
bun run db:generate && bun run db:migrate
```

สุ่มกุญแจลับยาวๆ ไว้เซ็นบัตรผ่าน (Mac/Linux/Git Bash)
```bash
openssl rand -base64 48
```
เพิ่มใน `server/.env` (และใส่แค่ชื่อไว้ใน `.env.example` ไม่ใส่ค่าจริง)
```
JWT_SECRET=<ค่าที่สุ่มได้>
ADMIN_EMAIL=admin@bitcafe.local
ADMIN_PASSWORD=<รหัสผ่านทดสอบ อย่างน้อย 12 ตัว>
```

`src/env.ts` เพิ่ม
```ts
  JWT_SECRET: z.string().min(32, "JWT_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร"),
```

เพิ่มท้ายไฟล์ `src/db/seed.ts` (ก่อนบรรทัด `process.exit`) เพื่อสร้างบัญชีเจ้าของร้านคนแรก
```ts
import { admins } from "./schema";   // ย้ายไปไว้บนสุดของไฟล์

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (email && password) {
  await db
    .insert(admins)
    .values({ email: email.toLowerCase(), passwordHash: await Bun.password.hash(password), name: "เจ้าของร้าน" })
    .onConflictDoNothing({ target: admins.email });
  console.log(`👤 admin: ${email}`);
}
```
```bash
bun run seed
```

![seed อ่านอีเมลกับรหัสผ่านจาก .env, hash รหัสผ่านแล้วบันทึกลงตาราง admins และ hash ต่างจากการเข้ารหัส](/img/15-seed-admin.svg)
*บัญชีเจ้าของร้านคนแรกสร้างจาก seed รันซ้ำได้ไม่ซ้ำบัญชี*

เปิด pgAdmin ดูช่อง `password_hash` จะเห็นประมาณ `$argon2id$v=19$m=65536,t=2,p=1$...` ไม่ใช่รหัสผ่านจริง ✅
(`Bun.password.hash` ใช้ argon2id ซึ่งเป็น hash สำหรับรหัสผ่านโดยเฉพาะ ตั้งใจให้ช้า คนร้ายจะเดาทีละล้านรหัสไม่ไหว และย้อนกลับเป็นรหัสจริงไม่ได้ ต่างจากการเข้ารหัสที่ถอดกลับได้ถ้ามีกุญแจ: [บทที่ 10 ข้อ 2](./10-security.md#_2-เก็บรหัสผ่านผู้ใช้-hash-ไม่ใช่-encrypt))

---

## 3. 🔧 ออกบัตร + ตรวจบัตร

บัตรผ่าน (JWT) มี 3 ส่วนต่อกันด้วยจุด และอ่านได้แต่แก้ไม่ได้

![โครงสร้างของ JWT: header, payload และ signature อ่านข้างในได้แต่ถ้าแก้ลายเซ็นจะไม่ตรง](/img/15-jwt-anatomy.svg)
*JWT ไม่ได้เข้ารหัส ใครก็อ่านข้างในได้ แค่เซ็นชื่อกันแก้ จึงห้ามใส่ข้อมูลลับ*

`src/auth/session.ts` ออกบัตรผ่าน และอ่านบัตรผ่าน
```ts
import { sign, verify } from "hono/jwt";
import { env } from "../env";

export const SESSION_COOKIE = "session";
const ONE_DAY = 60 * 60 * 24;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "Lax",
  path: "/",
  maxAge: ONE_DAY,
} as const;

export function createSessionToken(adminId: number): Promise<string> {
  return sign({ sub: String(adminId), exp: Math.floor(Date.now() / 1000) + ONE_DAY }, env.JWT_SECRET, "HS256");
}

// คืน adminId ถ้า token ถูกต้องและยังไม่หมดอายุ / ไม่งั้นคืน null
export async function readSessionToken(token: string): Promise<number | null> {
  try {
    const payload = await verify(token, env.JWT_SECRET, "HS256");   // ตรวจลายเซ็น + exp ให้เอง
    const id = Number(payload.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}
```

`src/middleware/requireAdmin.ts` ด่านตรวจหน้า API หลังบ้าน
```ts
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { readSessionToken, SESSION_COOKIE } from "../auth/session";
import { AppError } from "../http/response";

export type AdminEnv = { Variables: { adminId: number } };

export const requireAdmin = createMiddleware<AdminEnv>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  const adminId = token ? await readSessionToken(token) : null;
  if (!adminId) throw new AppError(401, "UNAUTHORIZED", "กรุณาเข้าสู่ระบบ");

  c.set("adminId", adminId);     // route ถัดไปใช้ c.get("adminId") ได้
  await next();
});
```

---

## 4. 🔧 เข้าระบบ / ออกจากระบบ / ถามว่าเป็นใคร

`src/routes/auth.ts` (2 ที่อยู่นี้ **ไม่ต้อง** login ก่อน)
```ts
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { admins } from "../db/schema";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "../auth/session";
import { AppError, ok, parse } from "../http/response";
import { rateLimit } from "../middleware/rateLimit";

const LoginInput = z.object({ email: z.email(), password: z.string().min(1) });

// hash หลอก: ใช้ตอนไม่พบอีเมล ให้เวลาตอบพอๆ กับกรณีรหัสผิด คนร้ายจะเดาไม่ได้ว่าอีเมลไหนมีจริง
const DUMMY_HASH = await Bun.password.hash("not-a-real-password");

export const authRoutes = new Hono();

authRoutes.post("/login", rateLimit({ limit: 10, windowMs: 15 * 60 * 1000 }), async (c) => {
  const body = parse(LoginInput, await c.req.json().catch(() => null));

  const [admin] = await db.select().from(admins).where(eq(admins.email, body.email.toLowerCase()));
  const valid = await Bun.password.verify(body.password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");   // ข้อความเดียวทุกกรณี
  }

  setCookie(c, SESSION_COOKIE, await createSessionToken(admin.id), sessionCookieOptions);
  return ok(c, { id: admin.id, email: admin.email, name: admin.name });
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return ok(c, null);
});
```

`src/routes/admin.ts` (ทุกที่อยู่ในไฟล์นี้ต้อง login ก่อน)
```ts
import { Hono } from "hono";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { admins, categories, contactMessages, services } from "../db/schema";
import { AppError, ok, parse } from "../http/response";
import type { AdminEnv } from "../middleware/requireAdmin";

const IdParam = z.object({ id: z.coerce.number().int().positive() });
const MessageUpdate = z.object({ isRead: z.boolean() });

export const adminRoutes = new Hono<AdminEnv>();

adminRoutes.get("/me", async (c) => {
  const [admin] = await db
    .select({ id: admins.id, email: admins.email, name: admins.name })
    .from(admins)
    .where(eq(admins.id, c.get("adminId")));
  if (!admin) throw new AppError(401, "UNAUTHORIZED", "กรุณาเข้าสู่ระบบ");    // ถูกลบบัญชีไปแล้ว
  return ok(c, admin);
});

adminRoutes.get("/dashboard", async (c) => {
  const unread = await db.$count(contactMessages, eq(contactMessages.isRead, false));
  const totalServices = await db.$count(services);
  const latest = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(5);
  return ok(c, { unread, totalServices, latest });
});

// เปลี่ยนสถานะอ่านแล้ว/ยังไม่อ่าน ใช้ PATCH ไม่ใช่ GET เพราะ GET ต้องไม่เปลี่ยนข้อมูล (บทที่ 5)
adminRoutes.patch("/messages/:id", async (c) => {
  const { id } = parse(IdParam, c.req.param());
  const body = parse(MessageUpdate, await c.req.json().catch(() => null));
  const [message] = await db
    .update(contactMessages)
    .set({ isRead: body.isRead })
    .where(eq(contactMessages.id, id))
    .returning();
  if (!message) throw new AppError(404, "NOT_FOUND", "ไม่พบข้อความนี้");
  return ok(c, message);
});

adminRoutes.delete("/categories/:id", async (c) => {
  const { id } = parse(IdParam, c.req.param());
  const [used] = await db.select({ n: count() }).from(services).where(eq(services.categoryId, id));
  if (used && used.n > 0) {
    throw new AppError(409, "CATEGORY_IN_USE", `ยังมีบริการ ${used.n} รายการในหมวดนี้ ย้ายหรือลบก่อน`);
  }
  const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
  if (!deleted) throw new AppError(404, "NOT_FOUND", "ไม่พบหมวดนี้");
  return ok(c, deleted);
});
```

`src/index.ts` ประกอบเข้าด้วยกัน
```ts
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { requireAdmin } from "./middleware/requireAdmin";

app.route("/api", publicRoutes);
app.route("/api/admin", authRoutes);         // ① login / logout ประกาศก่อน
app.use("/api/admin/*", requireAdmin);       // ② ทุก /api/admin/* ที่ประกาศหลังบรรทัดนี้ต้องผ่าน middleware
app.route("/api/admin", adminRoutes);        // ③ endpoint ที่ต้อง login
```
> ⚠️ **ลำดับบรรทัดสำคัญมาก:** Hono ทำงานตามลำดับที่เขียน คำขอ `/api/admin/login` เจอบรรทัด ① ก่อนและตอบกลับเลย จึงไม่ต้องผ่านด่านตรวจ ② ถ้าสลับลำดับ จะไม่มีใคร login ได้เลย

![คำขอ login ถูกตอบก่อนถึงด่าน requireAdmin ส่วนคำขออื่นต้องผ่านด่าน ไม่ผ่านได้ 401](/img/15-middleware-gate.svg)
*คำขอ login ไม่ผ่านด่าน แต่คำขออื่นของ /api/admin ต้องผ่าน requireAdmin ก่อนถึงโค้ดที่ทำงานจริง*

### 🔧 ลองด้วยคำสั่ง curl
```bash
# ① ไม่ login → ต้องได้ 401
curl -i http://localhost:3000/api/admin/me

# ② login ผิด → 401 ข้อความเดียวกันทั้งอีเมลผิดและรหัสผิด
curl -i -H "Content-Type: application/json" \
  -d '{"email":"admin@bitcafe.local","password":"wrong"}' \
  http://localhost:3000/api/admin/login

# ③ login ถูก → 200 + Set-Cookie (เก็บ cookie ลงไฟล์ด้วย -c)
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"admin@bitcafe.local","password":"<ADMIN_PASSWORD>"}' \
  http://localhost:3000/api/admin/login

# ④ ส่ง cookie กลับไป (-b) → 200
curl -i -b cookies.txt http://localhost:3000/api/admin/me

# ⑤ ลบหมวดที่ยังมีบริการ → 409
curl -i -b cookies.txt -X DELETE http://localhost:3000/api/admin/categories/1
```
👀 ดูบรรทัด `Set-Cookie` ในข้อ ③ ต้องมีคำว่า `HttpOnly` และ `SameSite=Lax`

---

## 5. 🔧 ฝั่งหน้าเว็บ

`client/src/api/auth.ts`
```ts
import { api } from "./client";

export interface Admin {
  id: number;
  email: string;
  name: string;
}

export const login = (email: string, password: string) =>
  api<Admin>("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const logout = () => api<null>("/api/admin/logout", { method: "POST" });
export const getMe = () => api<Admin>("/api/admin/me");
```
👀 ไม่ต้องแนบบัตรเอง หน้าเว็บกับ API ดูเหมือนอยู่เว็บเดียวกัน (Vite ส่งต่อให้: บทที่ 14) เบราว์เซอร์จึงแนบ cookie ให้เอง

### ยังไม่ login → พาไปหน้า login
![RequireAuth มี 3 สถานะ: checking, in, out ถ้าได้ 401 พาไปหน้า login แล้วกลับมาหน้าเดิม](/img/15-require-auth.svg)
*RequireAuth เช็คกับ server ว่ายัง login อยู่ไหม แล้วแสดงหน้าหรือพาไปหน้า login*

`client/src/components/RequireAuth.tsx`
```tsx
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { getMe } from "../api/auth";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => {
    getMe()
      .then(() => setState("in"))
      .catch(() => setState("out"));
  }, [location.pathname]);                       // เช็คใหม่ทุกครั้งที่เปลี่ยนหน้า (session อาจหมดอายุ)

  if (state === "checking") return <p className="p-8">กำลังตรวจสอบสิทธิ์... ⏳</p>;
  if (state === "out") return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
```

### หน้า login
`client/src/pages/admin/LoginPage.tsx`
```tsx
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { login } from "../../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });          // กลับไปหน้าที่ตั้งใจจะเข้าตอนแรก
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-24 max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow">
      <title>เข้าสู่ระบบหลังบ้าน</title>
      <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
      <input type="email" autoComplete="username" placeholder="อีเมล" value={email}
        onChange={(e) => setEmail(e.target.value)} className="w-full rounded border p-2" />
      <input type="password" autoComplete="current-password" placeholder="รหัสผ่าน" value={password}
        onChange={(e) => setPassword(e.target.value)} className="w-full rounded border p-2" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={sending} className="w-full rounded bg-brand py-2 text-white disabled:opacity-50">
        {sending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
```

### ปุ่มออกจากระบบ (ในโครงหน้าหลังบ้าน)
```tsx
const navigate = useNavigate();
<button onClick={async () => { await logout(); navigate("/admin/login", { replace: true }); }}>
  ออกจากระบบ
</button>
```

### เปิดอ่านข้อความแล้วเปลี่ยนเป็น "อ่านแล้ว"
ในหน้าข้อความ ตอนเจ้าของร้านกดเปิดข้อความไหน ให้หน้าเว็บส่ง `PATCH` ไปบอก server
```ts
await api(`/api/admin/messages/${id}`, { method: "PATCH", body: JSON.stringify({ isRead: true }) });
```

![เทียบการให้ GET เปลี่ยนสถานะอ่านแล้วเอง ซึ่งผิด กับการใช้ PATCH ที่ถูก](/img/15-message-read.svg)
*GET ต้องดูอย่างเดียว การเปลี่ยนสถานะอ่านแล้วต้องใช้ PATCH*

💡 ทำไมไม่ให้ `GET` เปลี่ยนสถานะให้เองเลย? เพราะ `GET` ต้องเป็นการดูอย่างเดียว (บทที่ 5) ระบบอื่นอาจเรียก `GET` เองโดยไม่มีใครตั้งใจ เช่น ตัวโหลดหน้าล่วงหน้าของเบราว์เซอร์ แล้วข้อความจะกลายเป็นอ่านแล้วทั้งที่เจ้าของร้านยังไม่เห็น

### บัตรหมดอายุระหว่างใช้งาน
เพิ่มใน `api()` ของไฟล์ `client/src/api/client.ts` ก่อนบรรทัด `throw` ตัวสุดท้าย:
```ts
if (res.status === 401 && path.startsWith("/api/admin") && path !== "/api/admin/login") {
  window.location.assign("/admin/login");     // หมดอายุ → ส่งกลับไป login
}
```

![บัตรใช้ได้ 1 วัน หมดอายุแล้วได้ 401 และหน้าเว็บพาไป login ส่วนออกจากระบบคือลบ cookie](/img/15-session-expiry.svg)
*เส้นเวลาของบัตรผ่าน และสิ่งที่เกิดขึ้นตอนกดออกจากระบบ*

---

## 6. 🛡️ เช็คความปลอดภัยของระบบ login

- [ ] ตาราง `admins` ไม่มีรหัสผ่านจริง มีแต่ `password_hash`
- [ ] กุญแจลับ `JWT_SECRET` ยาว 32 ตัวขึ้นไป สุ่มจริง อยู่ในไฟล์ `.env` เท่านั้น (ไม่ขึ้น Git)
- [ ] เรียก `/api/admin/...` ทุกตัวโดยไม่มี cookie ได้ `401` (ลองให้ครบทุกตัว)
- [ ] login ผิดได้ข้อความเดียวกัน ไม่ว่าอีเมลผิดหรือรหัสผิด
- [ ] หน้า login จำกัดจำนวนครั้งที่ลองได้
- [ ] cookie มี `HttpOnly`, `SameSite=Lax` และตอนขึ้นระบบจริงมี `Secure`
- [ ] ไม่มีโค้ดไหนเก็บบัตรผ่านไว้ใน localStorage
- [ ] ออกจากระบบแล้ว เรียก `/api/admin/me` ได้ `401`

> 🤓 **ข้อจำกัดของบัตรผ่านแบบนี้:** ออกจากระบบ = ลบ cookie ในเครื่องเรา แต่ถ้ามีคนก๊อปบัตรไปก่อน บัตรนั้นยังใช้ได้จนหมดอายุ (1 วัน) ระบบที่ต้องเตะผู้ใช้ออกทันที จะเก็บรายการคนที่ login อยู่ไว้ที่ server แทน ([บทที่ 10](./10-security.md#login-แล้ว-server-จําเราได้ยังไง-session-vs-jwt))

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ทำไมกันคนไม่ได้ login ที่หน้าเว็บอย่างเดียวไม่พอ?</summary>

โค้ดหน้าเว็บอยู่ในเครื่องของผู้ใช้ แก้หรือข้ามได้ และใครก็ส่งคำขอตรงไปที่ API ด้วย curl ได้ ตัวตัดสินจริงต้องเป็นด่านตรวจที่ server
</details>

<details><summary>2. ทำไมตอนหาอีเมลไม่เจอ ยังต้องเทียบรหัสผ่านกับรหัสหลอกอีก?</summary>

การเทียบรหัสผ่านใช้เวลานาน (ตั้งใจให้ช้า) ถ้าหาอีเมลไม่เจอแล้วตอบทันที คนร้ายจับเวลาได้ว่าอีเมลไหนมีบัญชีจริง การเทียบกับรหัสหลอกทำให้ทุกกรณีใช้เวลาพอๆ กัน
</details>

<details><summary>3. บัตรผ่าน (JWT) ถูกเข้ารหัสไหม ใส่อะไรลงไปได้บ้าง?</summary>

ไม่ได้เข้ารหัส แค่เซ็นชื่อกันแก้ ใครก็อ่านข้างในได้ จึงใส่ได้แค่ข้อมูลที่ไม่ลับ เช่น เลขบัญชีกับเวลาหมดอายุ
</details>

<details><summary>4. ถ้าหน้าเว็บอยู่ <code>shop.com</code> แต่ API อยู่ <code>api-shop.com</code> จะเกิดอะไรกับ cookie?</summary>

เบราว์เซอร์ถือว่าเป็นคนละเว็บ cookie แบบ `SameSite=Lax` จะไม่ถูกแนบไป ต้องตั้งค่าข้ามเว็บเพิ่มหลายอย่าง ซึ่งยุ่งและเสี่ยงกว่า จึงควรให้ API อยู่ชื่อเว็บเดียวกันที่ `/api` ([บทที่ 20](./20-deploy-vps.md), [บทที่ 22](./22-deploy-managed.md))
</details>

---

## ✏️ แบบฝึกหัด

ทำหน้าจัดการร้านของ Bit Café: หน้า login, หน้าสรุป (จำนวนข้อความที่ยังไม่อ่าน + ข้อความล่าสุด 5 ข้อความ), หน้าข้อความ (ที่ยังไม่อ่านเป็นตัวหนา กดเปิดแล้วส่ง `PATCH` ให้เป็นอ่านแล้ว) และปุ่มออกจากระบบ จากนั้นเขียนไฟล์ `.http` ที่เรียก API หลังบ้านทุกตัวโดยไม่ login แล้วได้ `401` ครบทุกตัว

## ✅ ผ่านด่าน

- [ ] hash รหัสผ่านด้วย `Bun.password` และสร้างบัญชีเจ้าของร้านคนแรกจาก seed ได้
- [ ] login แล้วได้บัตรผ่านใน cookie แบบ `httpOnly` อายุ 1 วัน
- [ ] มีด่านตรวจหน้าทุก `/api/admin/...` และเข้าใจว่าทำไมลำดับบรรทัดสำคัญ
- [ ] หน้าเว็บมีหน้า login, พาคนไม่ได้ login ไปหน้า login, ปุ่มออกจากระบบ และรับมือบัตรหมดอายุ
- [ ] ผ่านรายการเช็คความปลอดภัยข้อ 6 ครบ

---

[← บทที่ 14: สร้าง API](./14-hono-api.md) · [🏠 สารบัญ](/) · [บทที่ 16: ทำงานคู่กับ AI →](./16-ai-pairing.md)
