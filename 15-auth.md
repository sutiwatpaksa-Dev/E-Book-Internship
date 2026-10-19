# บทที่ 15: Login หลังบ้าน (JWT + httpOnly Cookie) 🔑

> ⏱ ประมาณ 4 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 10, 13 และ 14 · 🛠 ใช้: Hono, `Bun.password`, React Router

> **⚡ สรุป 30 วินาที**
> - รหัสผ่านเก็บเป็น **hash** ด้วย `Bun.password` / login สำเร็จได้ **JWT** ใส่ใน **cookie `httpOnly`** อายุ 1 วัน
> - **middleware** เช็ค cookie ทุก `/api/admin/*` ไม่มีหรือหมดอายุ → `401`
> - login ผิดตอบข้อความเดียว **"อีเมลหรือรหัสผ่านไม่ถูกต้อง"** ห้ามบอกว่าผิดช่องไหน
> - หน้าเว็บมี `RequireAuth` พาไปหน้า login แต่ **ตัวกันจริงคือ API**

---

## 📖 เรื่องเล่า

บิตทำหน้า `/admin` เสร็จ ซ่อนปุ่มไว้อย่างดี พี่ไบต์เปิด terminal พิมพ์:
```bash
curl -X DELETE http://localhost:3000/api/admin/categories/1
```
หมวดหายไปทั้งหมวด 😱 บิต: *"แต่พี่ยังไม่ได้ login เลยนะ!"*
พี่ไบต์: *"server ไม่รู้หรอกว่าเราซ่อนปุ่มไว้ server ต้องถามเองทุกครั้งว่า 'คุณเป็นใคร'"*

> ⚠️ นี่คือ 1 ใน 3 ข้อที่ทำให้ STARTER **ไม่ผ่านทันที**: *admin API เรียกได้โดยไม่ login*

---

## 1. ภาพรวมการ login

```
 1. POST /api/admin/login { email, password }
        |
        v
 2. server: หา admin จาก email → Bun.password.verify(password, hash)
        |  ผิด → 401 "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        v  ถูก
 3. server: สร้าง JWT { sub: adminId, exp: +1 วัน } ลงลายเซ็นด้วย JWT_SECRET
        |
        v
 4. ตอบกลับพร้อม  Set-Cookie: session=<JWT>; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400
        |
        v
 5. browser แนบ cookie ให้เองทุก request ไปที่เว็บเดียวกัน  →  middleware ตรวจลายเซ็น + วันหมดอายุ
```

**ทำไม cookie `httpOnly` ไม่ใช่ `localStorage`** (ทบทวน [บทที่ 10](./10-security.md#_3-authentication-vs-authorization))
| | localStorage | cookie `httpOnly` |
|---|---|---|
| JavaScript อ่านได้ไหม | ✅ ได้ → ถ้ามี XSS หลุดมา token ถูกขโมยทันที | ❌ ไม่ได้ |
| ต้องแนบเองทุก request | ต้องเขียนโค้ดแนบ header | browser แนบให้เอง |
| ป้องกันเว็บอื่นส่ง request แทนเรา (CSRF) | ไม่เกี่ยว | ใช้ `SameSite=Lax` ช่วย |

**ความหมายของ flag แต่ละตัว**
| flag | ทำอะไร |
|---|---|
| `HttpOnly` | JavaScript ในหน้าเว็บอ่าน cookie นี้ไม่ได้ |
| `SameSite=Lax` | เว็บอื่นส่ง `POST`/`fetch` มาที่เว็บเรา browser จะไม่แนบ cookie ไปด้วย |
| `Secure` | ส่ง cookie เฉพาะ HTTPS (เปิดตอน production, ตอน dev ใช้ http จึงปิดไว้) |
| `Max-Age=86400` | หมดอายุใน 1 วัน (requirement ของ STARTER) |
| `Path=/` | ใช้ได้ทุก path ของเว็บ |

---

## 2. 🔧 เตรียมตาราง admins และ secret

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

สร้าง secret สุ่มยาวๆ (Mac/Linux/Git Bash)
```bash
openssl rand -base64 48
```
เพิ่มใน `server/.env` (และใส่ชื่อตัวแปรใน `.env.example` โดยไม่ใส่ค่าจริง)
```
JWT_SECRET=<ค่าที่สุ่มได้>
ADMIN_EMAIL=admin@bitcafe.local
ADMIN_PASSWORD=<รหัสผ่านทดสอบ อย่างน้อย 12 ตัว>
```

`src/env.ts` เพิ่ม
```ts
  JWT_SECRET: z.string().min(32, "JWT_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร"),
```

เพิ่มท้าย `src/db/seed.ts` (ก่อน `process.exit`) สร้าง admin คนแรก
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
เปิด pgAdmin ดูคอลัมน์ `password_hash` จะเห็นประมาณ `$argon2id$v=19$m=65536,t=2,p=1$...` ไม่ใช่รหัสผ่านจริง ✅
(`Bun.password.hash` ใช้ **argon2id** เป็นค่าเริ่มต้น มี salt ในตัว เลือกความช้าให้เอง)

---

## 3. 🔧 Token + Cookie + Middleware

`src/auth/session.ts`
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

`src/middleware/requireAdmin.ts`
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

## 4. 🔧 Login / Logout / Me

`src/routes/auth.ts` (2 endpoint นี้ **ไม่ต้อง** login)
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

`src/routes/admin.ts` (ทุก endpoint ต้อง login)
```ts
import { Hono } from "hono";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { admins, categories, contactMessages, services } from "../db/schema";
import { AppError, ok, parse } from "../http/response";
import type { AdminEnv } from "../middleware/requireAdmin";

const IdParam = z.object({ id: z.coerce.number().int().positive() });

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

adminRoutes.get("/messages/:id", async (c) => {
  const { id } = parse(IdParam, c.req.param());
  const [message] = await db
    .update(contactMessages)
    .set({ isRead: true })                       // เปิดอ่าน = อ่านแล้วอัตโนมัติ
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

`src/index.ts` ต่อเข้าด้วยกัน
```ts
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { requireAdmin } from "./middleware/requireAdmin";

app.route("/api", publicRoutes);
app.route("/api/admin", authRoutes);         // ① login / logout ประกาศก่อน
app.use("/api/admin/*", requireAdmin);       // ② ทุก /api/admin/* ที่ประกาศหลังบรรทัดนี้ต้องผ่าน middleware
app.route("/api/admin", adminRoutes);        // ③ endpoint ที่ต้อง login
```
> ⚠️ **ลำดับสำคัญ:** Hono ทำงานตามลำดับที่ประกาศ `/api/admin/login` เจอ handler ① ก่อนและตอบกลับเลย จึงไม่ติด middleware ② ถ้าสลับลำดับ จะไม่มีใคร login ได้เลย

### 🔧 ทดสอบด้วย curl
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
👀 ดูบรรทัด `Set-Cookie` ใน ③ ต้องมี `HttpOnly` และ `SameSite=Lax`

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
👀 ไม่ต้องแนบ token เอง หน้าเว็บกับ API อยู่ origin เดียวกัน (Vite proxy) browser แนบ cookie ให้อัตโนมัติ

### RequireAuth: ยังไม่ login → เด้งไปหน้า login
`client/src/components/RequireAuth.tsx`
```tsx
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { getMe, type Admin } from "../api/auth";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<"checking" | "in" | "out">("checking");
  const [, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    getMe()
      .then((a) => { setAdmin(a); setState("in"); })
      .catch(() => setState("out"));
  }, [location.pathname]);                       // เช็คใหม่ทุกครั้งที่เปลี่ยนหน้า (session อาจหมดอายุ)

  if (state === "checking") return <p className="p-8">กำลังตรวจสอบสิทธิ์... ⏳</p>;
  if (state === "out") return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
```

### หน้า Login
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

### ปุ่ม Logout (ใน AdminLayout)
```tsx
const navigate = useNavigate();
<button onClick={async () => { await logout(); navigate("/admin/login", { replace: true }); }}>
  ออกจากระบบ
</button>
```

### session หมดอายุกลางทาง
เพิ่มใน `api()` ของ `client/src/api/client.ts` ก่อนบรรทัด `throw` ตัวสุดท้าย:
```ts
if (res.status === 401 && path.startsWith("/api/admin") && path !== "/api/admin/login") {
  window.location.assign("/admin/login");     // หมดอายุ → ส่งกลับไป login
}
```

---

## 6. 🛡️ Checklist ความปลอดภัยของ Auth

- [ ] ในตาราง `admins` ไม่มีรหัสผ่านจริง มีแต่ `password_hash`
- [ ] `JWT_SECRET` ยาว ≥ 32 ตัว สุ่มจริง อยู่ใน `.env` เท่านั้น (ไม่อยู่ใน Git)
- [ ] เรียก `/api/admin/*` ทุกตัวโดยไม่มี cookie ได้ `401` (ลองให้ครบทุก endpoint)
- [ ] login ผิดได้ข้อความเดียวกันทั้งอีเมลผิดและรหัสผิด
- [ ] login ถูก rate limit
- [ ] cookie มี `HttpOnly`, `SameSite=Lax` และ production มี `Secure`
- [ ] ไม่มีโค้ดไหนเก็บ token ใน `localStorage`
- [ ] logout แล้วเรียก `/api/admin/me` ได้ `401`

> 🤓 **ข้อจำกัดของ JWT:** logout ลบ cookie ในเครื่องเรา แต่ถ้ามีคนก๊อป token ไปก่อน token นั้นยังใช้ได้จนหมดอายุ (1 วัน) ระบบที่ต้องเตะผู้ใช้ออกทันทีจะใช้ session ใน DB/Redis แทน หรือเก็บ blacklist ([บทที่ 10: Session vs JWT](./10-security.md#login-แล้ว-server-จําเราได้ยังไง-session-vs-jwt))

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ทำไมเช็คสิทธิ์ใน React (RequireAuth) อย่างเดียวไม่พอ?</summary>

โค้ดหน้าเว็บอยู่ในเครื่องผู้ใช้ แก้หรือข้ามได้ และใครก็ยิง API ตรงด้วย curl ได้ ตัวตัดสินจริงต้องเป็น middleware ที่ server
</details>

<details><summary>2. ทำไมตอนไม่พบอีเมลยังต้องเรียก <code>Bun.password.verify</code> กับ hash หลอก?</summary>

verify ใช้เวลานาน (ตั้งใจให้ช้า) ถ้าไม่พบอีเมลแล้วตอบทันที คนร้ายจับเวลาได้ว่าอีเมลไหนมีบัญชีจริง การ verify hash หลอกทำให้เวลาตอบใกล้เคียงกันทุกกรณี
</details>

<details><summary>3. JWT ถูกเข้ารหัสไหม ใส่อะไรลงไปได้บ้าง?</summary>

ไม่ได้เข้ารหัส แค่ลงลายเซ็นกันแก้ ใครก็ถอดอ่านได้ ใส่แค่ข้อมูลที่ไม่ลับ เช่น id ของ admin และเวลาหมดอายุ
</details>

<details><summary>4. ถ้าหน้าเว็บอยู่ <code>shop.com</code> แต่ API อยู่ <code>api-shop.com</code> จะเกิดอะไรกับ cookie?</summary>

เป็นคนละเว็บ (cross-site) cookie `SameSite=Lax` จะไม่ถูกส่งไปกับ `fetch` ต้องตั้ง CORS + `credentials` + `SameSite=None; Secure` ซึ่งยุ่งและเสี่ยงกว่า จึงควรให้ API อยู่ใต้โดเมนเดียวกันที่ `/api` ด้วย reverse proxy ([บทที่ 20](./20-deploy-vps.md), [บทที่ 22](./22-deploy-managed.md))
</details>

---

## ✏️ แบบฝึกหัด

ทำหลังบ้าน Bit Café: หน้า login, Dashboard (ตัวเลขยังไม่อ่าน + ข้อความล่าสุด 5 รายการ), หน้าข้อความ (ตัวที่ยังไม่อ่านเป็นตัวหนา, กดแล้วเป็นอ่านแล้ว) และปุ่ม logout จากนั้นเขียนไฟล์ `.http` ที่ยิงทุก endpoint admin โดยไม่ login แล้วได้ `401` ครบทุกตัว

## ✅ ผ่านด่าน

- [ ] hash รหัสผ่านด้วย `Bun.password` และสร้าง admin คนแรกจาก seed ได้
- [ ] login แล้วได้ JWT ใน cookie `httpOnly` อายุ 1 วัน
- [ ] middleware ป้องกันทุก `/api/admin/*` และเข้าใจเรื่องลำดับการประกาศ
- [ ] หน้าเว็บมี login, RequireAuth, logout และจัดการ session หมดอายุ
- [ ] ผ่าน Checklist ความปลอดภัยข้อ 6 ครบ

---

[← บทที่ 14: Bun + Hono API](./14-hono-api.md) · [🏠 สารบัญ](./README.md) · [บทที่ 16: ทำงานคู่กับ AI →](./16-ai-pairing.md)
