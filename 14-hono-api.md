# บทที่ 14: Bun + Hono + Drizzle API 🔥

> ⏱ ประมาณ 5 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 5, 8 และ 11 · 🛠 ใช้: Bun, Hono, Drizzle, Zod, PostgreSQL (Docker)

> **⚡ สรุป 30 วินาที**
> - **Bun** รัน TypeScript ได้ตรงๆ ไม่ต้อง build / **Hono** = web framework เบาและเร็ว คล้าย Express ที่เรียนในบทที่ 5
> - วางโครง server ตาม STARTER: `routes/`, `db/`, `validators/`, `middleware/`
> - ทุก response รูปแบบเดียวกัน `{ success, data }` / `{ success, error }` และ **error 500 ไม่หลุด stack trace**
> - ต่อหน้าเว็บกับ API ด้วย **Vite proxy** ให้ทั้งคู่อยู่ origin เดียวกัน (สำคัญมากกับ cookie ในบทที่ 15)

---

## 📖 เรื่องเล่า

หน้าเว็บ Bit Café สวยแล้ว แต่ยังอ่านข้อมูลจากไฟล์ mock 😅
ลูกค้าถามว่า *"ถ้าผมเพิ่มเมนูใหม่ ต้องโทรหาบิตใช่ไหม?"*

พี่ไบต์: *"ถึงเวลาต่อของจริงแล้ว ฐานข้อมูล + API ที่หน้าเว็บกับหลังบ้านใช้ร่วมกัน"*

---

## 1. ภาพรวมระบบ

```
 Browser  ──>  Vite :5173  ──(/api/* proxy)──>  Hono API :3000  ──SQL──>  PostgreSQL :5432
  (React)       (หน้าเว็บ)                        (Bun)                     (Docker)
```

**Hono เทียบกับ Express (บทที่ 5)**
| | Express | Hono |
|---|---|---|
| ประกาศ route | `app.get("/x", (req, res) => res.json(...))` | `app.get("/x", (c) => c.json(...))` |
| อ่าน body | `req.body` (ต้องมี `express.json()`) | `await c.req.json()` |
| อ่าน query / param | `req.query.q` / `req.params.id` | `c.req.query("q")` / `c.req.param("id")` |
| ตั้ง status | `res.status(201).json(x)` | `c.json(x, 201)` |
| รันบน | Node | Bun, Node, Deno, Cloudflare Workers ฯลฯ |

---

## 2. 🔧 ตั้งโปรเจกต์

**ฐานข้อมูล (dev)** สร้าง `bit-cafe/compose.yaml`
```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: bitcafe
    ports:
      - "5432:5432"            # เปิดให้เครื่องเรา (และ pgAdmin) ต่อได้ ใช้ตอน dev เท่านั้น
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```
```bash
cd bit-cafe
docker compose up -d
```

**server**
```bash
mkdir server && cd server
bun init -y
bun add hono zod drizzle-orm pg
bun add -d drizzle-kit @types/pg typescript
mkdir -p src/routes src/db src/validators src/middleware src/http
```

`server/.env` (อย่าลืม `.env` อยู่ใน `.gitignore`)
```
DATABASE_URL=postgres://app:secret@localhost:5432/bitcafe
PORT=3000
```
`server/.env.example` = ก๊อปเดียวกันแต่ใส่ค่าตัวอย่าง แล้ว commit ไฟล์นี้แทน ([บทที่ 10 ข้อ 1](./10-security.md#_1-ความลับ-secrets-และไฟล์-env))

`server/package.json` เพิ่ม scripts:
```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun src/db/migrate.ts",
    "seed": "bun src/db/seed.ts"
  }
}
```
> 💡 Bun อ่านไฟล์ `.env` ให้เองตอน `bun run ...` ไม่ต้องติดตั้ง `dotenv`

`src/env.ts` ตรวจค่าตั้งค่าตอนเริ่มแอป ขาดตัวไหนหยุดทันที
```ts
import { z } from "zod";

const Env = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),   // bun test ตั้ง "test" ให้เอง
});

export const env = Env.parse(process.env);
```

---

## 3. 🔧 ฐานข้อมูลด้วย Drizzle

`src/db/schema.ts` (ตัดมา 3 ตารางจาก [6 ตารางของ STARTER](./starter/database-api.md#_1-ฐานข้อมูลขั้นต่ํา))
```ts
import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// ทุกตารางต้องมี created_at / updated_at เขียนครั้งเดียวแล้วกระจายใส่
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),   // ห้ามลบหมวดที่ยังมีบริการ
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price"),                                          // null = ไม่แสดงราคา
  imageUrl: text("image_url").notNull().default(""),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  subject: text("subject"),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  ...timestamps,
});
```

`drizzle.config.ts` (วางที่ `server/` นอก `src/`)
```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

`src/db/index.ts`
```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../env";
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });
```

`src/db/migrate.ts` รัน migration จากโค้ด (ตอน deploy ใช้ตัวนี้ ไม่ต้องติดตั้ง drizzle-kit บน server)
```ts
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("✅ migrate เสร็จ");
process.exit(0);
```

`src/db/seed.ts` รันซ้ำได้โดยไม่สร้างข้อมูลซ้ำ (สำคัญ เพราะจะใช้บน production ด้วย)
```ts
import { db } from "./index";
import { categories, services } from "./schema";

await db
  .insert(categories)
  .values([
    { name: "เครื่องดื่ม", slug: "drinks", sortOrder: 1 },
    { name: "จัดเลี้ยง", slug: "catering", sortOrder: 2 },
  ])
  .onConflictDoNothing({ target: categories.slug });       // มี slug นี้แล้ว = ข้าม

const existing = await db.$count(services);
if (existing === 0) {
  const all = await db.select().from(categories);
  const id = (slug: string) => all.find((c) => c.slug === slug)!.id;
  await db.insert(services).values([
    { categoryId: id("drinks"), name: "ลาเต้", description: "นมสดหอมมัน", price: 65, isFeatured: true },
    { categoryId: id("drinks"), name: "มอคค่า", description: "ช็อกโกแลตเข้มข้น", price: 70, isFeatured: true },
    { categoryId: id("catering"), name: "Coffee Break 50 ที่", description: "สอบถามราคา", price: null, isFeatured: true },
  ]);
}

console.log("🌱 seed เสร็จ");
process.exit(0);
```

```bash
bun run db:generate     # อ่าน schema → สร้างไฟล์ SQL ใน drizzle/
bun run db:migrate      # สร้างตารางใน DB จริง
bun run seed            # ใส่ข้อมูลตัวอย่าง
```
เปิด pgAdmin (หรือ Adminer จากบทที่ 2) ต่อที่ `localhost:5432` user `app` / `secret` ควรเห็น 3 ตารางพร้อมข้อมูล 🎉

---

## 4. 🔧 รูปแบบ response และ error ที่เดียว

`src/http/response.ts`
```ts
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";

export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ success: true, data }, status);
}

export function okList<T>(c: Context, data: T[], meta: { page: number; limit: number; total: number }) {
  return c.json({ success: true, data, meta });
}

// error ที่ "ตั้งใจ" ส่งกลับ client (400, 401, 404, 409, 429)
export class AppError extends Error {
  status: ContentfulStatusCode;
  code: string;
  details: unknown;

  constructor(status: ContentfulStatusCode, code: string, message: string, details: unknown = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ตรวจข้อมูลด้วย Zod ไม่ผ่าน → 400 พร้อมบอกว่าช่องไหนผิด
export function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", "ข้อมูลไม่ถูกต้อง", z.flattenError(result.error).fieldErrors);
  }
  return result.data;
}
```

`src/index.ts`
```ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import { env } from "./env";
import { AppError } from "./http/response";
import { publicRoutes } from "./routes/public";

const app = new Hono();
app.use(logger());                                          // log ทุก request ใน terminal

app.get("/api/health", (c) => c.json({ status: "ok" }));
app.route("/api", publicRoutes);

app.notFound((c) =>
  c.json({ success: false, error: { code: "NOT_FOUND", message: "ไม่พบ endpoint นี้", details: {} } }, 404),
);

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ success: false, error: { code: err.code, message: err.message, details: err.details } }, err.status);
  }
  console.error(err);                                       // stack trace อยู่ใน log ของเราเท่านั้น
  return c.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดในระบบ", details: {} } },
    500,
  );
});

export default { port: env.PORT, fetch: app.fetch };
```
> 🔐 `onError` ทำให้ requirement **"Error 500 ห้ามส่ง stack trace กลับไปให้ client"** เป็นจริงทุก endpoint โดยไม่ต้องเขียน try/catch ทุกที่

---

## 5. 🔧 Public routes

`src/validators/public.ts`
```ts
import { z } from "zod";

export const ServiceQuery = z.object({
  category: z.string().optional(),
  featured: z.enum(["true", "false"]).optional(),
});

export const ContactInput = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100),
  phone: z.string().regex(/^\d{9,10}$/, "เบอร์โทร 9–10 หลัก"),
  email: z.email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  subject: z.string().max(200).optional(),
  message: z.string().trim().min(1, "กรุณากรอกข้อความ").max(1000, "ไม่เกิน 1,000 ตัวอักษร"),
});
export type ContactInput = z.infer<typeof ContactInput>;   // หน้าเว็บ import type นี้ไปใช้ได้
```

`src/middleware/rateLimit.ts`
```ts
import { createMiddleware } from "hono/factory";
import { getConnInfo } from "hono/bun";
import { AppError } from "../http/response";

// จำ IP ไว้ใน memory: พอสำหรับ server ตัวเดียว (restart แล้วนับใหม่)
export function rateLimit({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return createMiddleware(async (c, next) => {
    // หลัง reverse proxy (บทที่ 20) IP จริงอยู่ใน X-Forwarded-For
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? getConnInfo(c).remote.address ?? "unknown";
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= limit) {
      throw new AppError(429, "RATE_LIMITED", "ส่งบ่อยเกินไป กรุณารอสักครู่");
    }
    recent.push(now);
    hits.set(ip, recent);
    await next();
  });
}
```

`src/routes/public.ts`
```ts
import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { categories, contactMessages, services } from "../db/schema";
import { ok, parse } from "../http/response";
import { rateLimit } from "../middleware/rateLimit";
import { ContactInput, ServiceQuery } from "../validators/public";

export const publicRoutes = new Hono();

publicRoutes.get("/categories", async (c) => {
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return ok(c, rows);
});

publicRoutes.get("/services", async (c) => {
  const q = parse(ServiceQuery, c.req.query());
  const rows = await db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      price: services.price,
      imageUrl: services.imageUrl,
      category: categories.slug,
    })
    .from(services)
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(
      and(
        eq(services.isActive, true),                                   // แสดงเฉพาะที่เปิดอยู่
        q.category ? eq(categories.slug, q.category) : undefined,     // undefined = ไม่กรอง
        q.featured === "true" ? eq(services.isFeatured, true) : undefined,
      ),
    )
    .orderBy(asc(services.sortOrder));
  return ok(c, rows);
});

publicRoutes.post("/contact", rateLimit({ limit: 5, windowMs: 10 * 60 * 1000 }), async (c) => {
  const body = parse(ContactInput, await c.req.json().catch(() => null));   // JSON พัง = 400 ไม่ใช่ 500
  const [row] = await db
    .insert(contactMessages)
    .values({ ...body, email: body.email || null })
    .returning({ id: contactMessages.id });
  return ok(c, row, 201);
});
```

```bash
bun run dev
```

### ทดสอบด้วยไฟล์ `.http` (เหมือนบทที่ 5)
`server/requests.http`
```http
### บริการทั้งหมด
GET http://localhost:3000/api/services

### เฉพาะบริการเด่นในหมวดเครื่องดื่ม
GET http://localhost:3000/api/services?category=drinks&featured=true

### ส่งข้อความ (ควรได้ 201)
POST http://localhost:3000/api/contact
Content-Type: application/json

{ "name": "บิต", "phone": "0812345678", "message": "สนใจจัดเลี้ยงครับ" }

### ข้อมูลผิด (ควรได้ 400 พร้อม details บอกช่องที่ผิด)
POST http://localhost:3000/api/contact
Content-Type: application/json

{ "name": "", "phone": "123" }

### ไม่มี endpoint นี้ (ควรได้ 404)
GET http://localhost:3000/api/nope
```
💥 **ลองพังมันดู:** ส่ง `/api/contact` 6 ครั้งติดกัน ครั้งที่ 6 ต้องได้ `429`
💥 ปิด DB (`docker compose stop db`) แล้วเรียก `/api/services` ต้องได้ 500 พร้อมข้อความกลางๆ ส่วน stack trace อยู่ใน terminal ของ server เท่านั้น

---

## 6. 🔧 ต่อหน้าเว็บกับ API

### Vite proxy
`client/vite.config.ts`
```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { "/api": "http://localhost:3000" },   // request ที่ขึ้นต้น /api ส่งต่อไปให้ Hono
  },
});
```
ตอนนี้หน้าเว็บเรียก `fetch("/api/services")` ได้เลย ไม่ต้องใส่ `http://localhost:3000`

> 💡 **ทำไมใช้ proxy แทนการเรียก `:3000` ตรงๆ?**
> browser มองว่า `localhost:5173` กับ `localhost:3000` เป็นคนละ **origin** ต้องตั้ง CORS และ cookie login (บทที่ 15) จะยุ่งขึ้นมาก
> proxy ทำให้ทุกอย่างอยู่ origin เดียว และตอน deploy เราจะทำแบบเดียวกันด้วย reverse proxy ([บทที่ 20](./20-deploy-vps.md))

### ตัวกลางเรียก API ที่เดียว
`client/src/api/client.ts`
```ts
type ApiBody<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: Record<string, string[]> } };

export class ApiError extends Error {
  status: number;
  code: string;
  details: Record<string, string[]>;

  constructor(status: number, code: string, message: string, details: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "เชื่อมต่อ server ไม่ได้");
  }

  const body = (await res.json().catch(() => null)) as ApiBody<T> | null;
  if (!body) throw new ApiError(res.status, "BAD_RESPONSE", "server ตอบกลับไม่ถูกต้อง");
  if (!body.success) throw new ApiError(res.status, body.error.code, body.error.message, body.error.details);
  return body.data;
}
```

แก้ `useFetch` ในบทที่ 11 ให้เรียก `api<T>(url, { signal: controller.signal })` แทน `fetch` และเปลี่ยน URL จาก `/mock/services.json` เป็น `/api/services`

ส่งฟอร์มติดต่อของจริง (แทน `setTimeout` ในบทที่ 11):
```ts
import { api, ApiError } from "../api/client";

try {
  await api("/api/contact", { method: "POST", body: JSON.stringify(form) });
  setDone(true);
  setForm(empty);
} catch (err) {
  if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
    // server ส่ง details มาว่าช่องไหนผิด แสดงใต้ช่องนั้นได้เลย
    setErrors(Object.fromEntries(Object.entries(err.details).map(([k, v]) => [k, v[0]])));
  } else {
    setServerError(err instanceof Error ? err.message : "ส่งไม่สำเร็จ");
  }
}
```

---

## 7. ⚠️ ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `ZodError ... DATABASE_URL` ตอนเริ่ม | ไม่มี `.env` หรือรันนอกโฟลเดอร์ `server/` | `cd server` แล้วรันด้วย `bun run dev` |
| `ECONNREFUSED 127.0.0.1:5432` | DB ยังไม่เปิด | `docker compose up -d` แล้ว `docker compose ps` |
| `relation "services" does not exist` | ยังไม่ migrate | `bun run db:generate` แล้ว `bun run db:migrate` |
| หน้าเว็บได้ HTML แทน JSON | ไม่ได้ตั้ง proxy หรือ server ไม่ได้รัน | ตรวจ `vite.config.ts` แล้ว restart `bun run dev` ฝั่ง client |
| ได้ 500 ทั้งที่ส่งข้อมูลผิด | เรียก `.parse()` ของ Zod ตรงๆ แทน helper `parse` | ใช้ `parse(schema, input)` ที่โยน `AppError(400)` |
| แก้ schema แล้ว DB ไม่เปลี่ยน | ลืม generate ไฟล์ migration ใหม่ | `db:generate` → `db:migrate` ทุกครั้ง |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ทำไม seed ต้องรันซ้ำได้โดยไม่สร้างข้อมูลซ้ำ?</summary>

เพราะจะรันบน production ตอน deploy ด้วย ถ้ารันซ้ำแล้วข้อมูลซ้ำหรือถูกลบ ลูกค้าจะเสียข้อมูลจริง จึงใช้ `onConflictDoNothing` และเช็คก่อน insert
</details>

<details><summary>2. ทำไมใช้ <code>app.onError</code> ดีกว่าเขียน try/catch ทุก route?</summary>

รับประกันว่าทุก error ที่ไม่ได้ตั้งใจจะกลายเป็น 500 ข้อความกลางๆ เหมือนกันหมด ลืม try/catch สักที่ก็ไม่หลุด stack trace และโค้ดแต่ละ route สั้นลง
</details>

<details><summary>3. Rate limit แบบเก็บใน memory มีข้อจำกัดอะไร?</summary>

restart server แล้วตัวนับหาย และถ้ามี server หลายตัว แต่ละตัวนับแยกกัน ระบบใหญ่จึงเก็บใน Redis แทน สำหรับ STARTER ที่มี server ตัวเดียวถือว่าพอ
</details>

<details><summary>4. <code>onDelete: "restrict"</code> กับ <code>"cascade"</code> ต่างกันยังไง?</summary>

restrict = ห้ามลบหมวดถ้ายังมีบริการอ้างถึง (DB ตอบ error) / cascade = ลบหมวดแล้วบริการในหมวดถูกลบตามไปด้วย STARTER ต้องการแบบแรก และ API ควรเช็คก่อนแล้วตอบ `409`
</details>

---

## ✏️ แบบฝึกหัด

เพิ่ม `GET /api/settings` (ตาราง `site_settings` มีแถวเดียว) และ `GET /api/pages/:slug` (ตาราง `pages` มี `content` เป็น `jsonb`) ตามสเปก STARTER ถ้าไม่พบ slug ต้องได้ `404` รูปแบบ error เดียวกับข้อ 4 แล้วให้ Navbar/Footer ดึงข้อมูลร้านจาก `/api/settings`

## ✅ ผ่านด่าน

- [ ] ตั้งโปรเจกต์ Bun + Hono + Drizzle ตามโครงสร้าง STARTER ได้
- [ ] สร้างตารางด้วย migration และ seed ที่รันซ้ำได้
- [ ] ทุก response รูปแบบเดียวกัน และ 500 ไม่หลุด stack trace
- [ ] ตรวจ input ด้วย Zod แล้วตอบ 400 พร้อมบอกช่องที่ผิด
- [ ] rate limit ฟอร์มติดต่อ 5 ครั้ง / 10 นาที / IP
- [ ] หน้าเว็บเรียก API ผ่าน Vite proxy ได้

---

[← บทที่ 13: Router + SEO](./13-router-seo.md) · [🏠 สารบัญ](./README.md) · [บทที่ 15: Auth →](./15-auth.md)
