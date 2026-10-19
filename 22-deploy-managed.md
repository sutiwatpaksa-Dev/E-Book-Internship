# บทที่ 22: Deploy แบบ Managed (Vercel + Cloud) ☁️

> ⏱ ประมาณ 2 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 18 และ 20 · 🛠 ใช้: Vercel, Render (หรือ Railway / Fly.io), Neon (หรือ Supabase)

> **⚡ สรุป 30 วินาที**
> - **Managed** = ให้ผู้ให้บริการดูแลเครื่อง, OS, HTTPS, scale ให้ เราแค่ส่งโค้ด
> - หน้าเว็บ (static) → **Vercel** / API (Docker) → **Render** / PostgreSQL → **Neon**
> - หัวใจคือ **rewrite `/api/*` ผ่าน Vercel** ให้ browser เห็นโดเมนเดียว cookie login จึงทำงานเหมือนบทที่ 20
> - สะดวกกว่า VPS แต่ควบคุมได้น้อยกว่า และ free tier มีข้อจำกัด (หลับ, โควตา)

---

## 📖 เรื่องเล่า

ลูกค้ารายใหม่บอกว่า *"ผมไม่อยากจ่ายค่าดูแล server รายเดือน มีทางที่ไม่ต้องมีใครคอยอัปเดต Ubuntu ไหม?"*
พี่ไบต์: *"มี แต่ต้องเข้าใจว่าเรายกงานอะไรให้คนอื่น และแลกกับอะไร"*

คู่มือที่น้องกำลังอ่านอยู่นี้ก็ deploy แบบนี้: push ขึ้น GitHub แล้ว Vercel build และอัปเดตเว็บให้เอง 📖

---

## 1. VPS vs Managed

| | 🖥️ VPS (บทที่ 19–21) | ☁️ Managed (บทนี้) |
|---|---|---|
| ใครดูแล OS, security patch | เรา | ผู้ให้บริการ |
| HTTPS / certificate | Caddy (ตั้งครั้งเดียว) | อัตโนมัติ |
| deploy | เราเขียน CI/CD | push แล้ว deploy เอง + ได้ **preview URL ต่อ PR** |
| ค่าใช้จ่าย | คงที่รายเดือน ถูกเมื่อมีหลายเว็บในเครื่องเดียว | free tier เริ่มง่าย แต่โตแล้วคิดตามการใช้งาน |
| ควบคุมได้ | ทุกอย่าง | ตามที่แพลตฟอร์มอนุญาต |
| ข้อจำกัด | ต้องมีความรู้ดูแล server | free tier หลับเมื่อไม่มีคนใช้, ผูกกับแพลตฟอร์ม |
| ได้เรียนรู้ | network, Linux, Docker ลึก | เร็ว โฟกัสที่แอป |

> 💡 ไม่มีแบบไหน "ดีกว่า" เสมอ dev ที่ดี **อธิบายข้อแลกเปลี่ยนให้ลูกค้าเลือกได้**

---

## 2. ภาพระบบ

```
 Browser ── https://example.com ──> Vercel
                                     ├─ /assets/*, /index.html  → ไฟล์ React ที่ build แล้ว
                                     ├─ /about, /contact ...    → index.html (SPA fallback)
                                     └─ /api/*  ──(rewrite)──> https://bitcafe-api.onrender.com/api/*  (Hono ใน Docker)
                                                                       │
                                                                       └──SSL──> Neon (PostgreSQL)
```
👀 browser คุยกับ `example.com` ที่เดียว cookie ที่ API ตั้งจึงเป็นของ `example.com` ไม่ต้องตั้ง CORS หรือ `SameSite=None` (บทที่ 15 ข้อ 4)

---

## 3. 🔧 ฐานข้อมูล: Neon

1. สมัคร neon.tech → **Create project** → region **Singapore** (ใกล้ไทย) → PostgreSQL 17
2. ก๊อป **connection string** หน้าตาแบบ
   ```
   postgresql://<user>:<password>@<host>.neon.tech/<db>?sslmode=require
   ```
   `sslmode=require` = บังคับเข้ารหัสระหว่าง API กับ DB (คนละเครื่อง คนละศูนย์ข้อมูล ต้องเข้ารหัส)
3. สร้างตาราง + ข้อมูลตั้งต้น **จากเครื่องเรา** (ครั้งแรก)
   ```bash
   cd server
   DATABASE_URL='postgresql://...neon.tech/...?sslmode=require' bun run db:migrate
   DATABASE_URL='postgresql://...' JWT_SECRET='<สุ่ม>' ADMIN_EMAIL='owner@example.com' ADMIN_PASSWORD='<รหัส>' bun run seed
   ```
   ⚠️ คำสั่งที่มีรหัสผ่านจะค้างอยู่ใน history ของ shell ลบด้วย `history -d` หรือขึ้นต้นคำสั่งด้วยช่องว่าง (zsh/bash ที่ตั้ง `HIST_IGNORE_SPACE`/`ignorespace` ไว้จะไม่บันทึก)

> 💡 ทางเลือก: **Supabase** (Postgres + ของแถม), **Railway** (มี Postgres ในโปรเจกต์เดียวกับ API)

---

## 4. 🔧 API: Render (Docker)

1. render.com → **New → Web Service** → เชื่อม GitHub repo
2. ตั้งค่า
   | ช่อง | ค่า |
   |---|---|
   | Root Directory | `server` |
   | Runtime | **Docker** (ใช้ `server/Dockerfile` จากบทที่ 20) |
   | Region | Singapore |
   | Health Check Path | `/api/health` |
3. **Environment Variables**
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | connection string จาก Neon |
   | `JWT_SECRET` | `openssl rand -base64 48` |
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
4. Deploy → ได้ URL เช่น `https://bitcafe-api.onrender.com` ลอง `curl https://bitcafe-api.onrender.com/api/health`

**migration ครั้งต่อๆ ไป** เลือกทางใดทางหนึ่ง:
- ตั้ง **Pre-Deploy Command** = `bun run db:migrate` (ถ้าแผนที่ใช้รองรับ) แพลตฟอร์มจะรันก่อนสลับเป็นเวอร์ชันใหม่ ลำดับเดียวกับบทที่ 20
- หรือให้ CI (บทที่ 21) รัน `bun run db:migrate` ด้วย `DATABASE_URL` จาก Secrets ก่อนสั่ง deploy

> ⚠️ **free tier ของหลายแพลตฟอร์มจะ "หลับ"** เมื่อไม่มีคนใช้สักพัก request แรกหลังหลับรอได้หลายสิบวินาที ใช้ demo ได้ แต่ **เว็บลูกค้าจริงควรใช้แผนที่ไม่หลับ** และแจ้งค่าใช้จ่ายลูกค้าตั้งแต่แรก
> 🔐 rate limit (บทที่ 14) อ่าน IP จาก `X-Forwarded-For` ซึ่งในแบบ managed มีหลายชั้น proxy และ URL ของ Render เรียกตรงได้โดยไม่ผ่าน Vercel จึงกันได้หลวมกว่าบน VPS ระดับ STARTER ยอมรับได้ ถ้าต้องการเข้มขึ้นใช้ rate limit / WAF ของแพลตฟอร์มหรือ Cloudflare

---

## 5. 🔧 หน้าเว็บ: Vercel

`client/vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://bitcafe-api.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
| rule | ทำอะไร |
|---|---|
| `/api/:path*` → Render | Vercel ส่ง request ต่อให้ API แล้วส่งคำตอบ (รวม `Set-Cookie`) กลับมาในนามของ `example.com` |
| `/(.*)` → `/index.html` | SPA fallback แบบ `try_files` ในบทที่ 20 (Vercel ตรวจไฟล์จริงก่อนเสมอ ไฟล์ใน `/assets` จึงไม่โดน rewrite) |

1. vercel.com → **Add New → Project** → import repo
2. **Root Directory** = `client` → Framework Preset ขึ้น **Vite** เอง (build `bun run build`, output `dist`)
3. **Deploy** → ได้ `https://bit-cafe-xxxx.vercel.app`
4. ทดสอบ: หน้าเว็บขึ้น, `/api/services` ได้ JSON, refresh `/about` ไม่ 404, login หลังบ้านได้

**ได้ฟรีทันที:** ทุก PR จะได้ **Preview URL** ของตัวเอง ส่งให้พี่เลี้ยง/ลูกค้าดูก่อน merge ได้

> ⚠️ Preview ทุกตัวชี้ไป API + DB **ตัวจริง** ตาม `vercel.json` ระวังการทดสอบที่แก้ข้อมูล ถ้าโปรเจกต์ใหญ่ขึ้นควรแยก API/DB สำหรับ preview

---

## 6. 🔧 ผูกโดเมน

**Vercel:** Project → Settings → **Domains** → Add `example.com` และ `www.example.com`
Vercel จะแสดง record ที่ต้องเพิ่ม (ปกติเป็น **A** สำหรับ root และ **CNAME** สำหรับ `www`) → ใส่ใน Cloudflare (บทที่ 18) **ตามค่าที่หน้าจอ Vercel แสดง** แบบ DNS only → รอสถานะ Valid แล้ว HTTPS มาเอง

**(ไม่บังคับ) โดเมนให้ API:** Render → Settings → Custom Domains → `api.example.com` → เพิ่ม CNAME ตามที่ Render บอก แล้วแก้ `destination` ใน `vercel.json` เป็น `https://api.example.com/api/:path*`

ตรวจ:
```bash
dig +short example.com
curl -I https://example.com/about                   # 200
curl -sS https://example.com/api/health             # {"status":"ok"}
curl -s -o /dev/null -w "%{http_code}\n" https://example.com/api/admin/me   # 401
```

---

## 7. ⚠️ ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `/api/...` ได้หน้า HTML | ลำดับ rewrite ผิด (`/(.*)` อยู่ก่อน `/api`) | ให้ `/api/:path*` อยู่บนสุด |
| refresh `/about` ได้ 404 | ไม่มี rewrite ไป `index.html` หรือ `vercel.json` ไม่อยู่ใน Root Directory | วาง `vercel.json` ใน `client/` |
| API ตอบช้ามากครั้งแรก | free tier หลับ | แผนที่ไม่หลับ / แจ้งลูกค้า |
| `self-signed certificate` / ต่อ DB ไม่ได้ | ไม่มี `sslmode=require` หรือก๊อป URL ไม่ครบ | ใช้ connection string จาก Neon ทั้งเส้น |
| login ผ่านแต่ cookie ไม่ติด | เรียก API ตรงที่ `onrender.com` จากหน้าเว็บ | หน้าเว็บต้องเรียก `/api/...` (relative) เสมอ |
| ZodError ตอน start บน Render | ขาด env | ใส่ให้ครบตามข้อ 4 |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ทำไม rewrite <code>/api/*</code> ผ่าน Vercel ดีกว่าให้หน้าเว็บเรียก <code>onrender.com</code> ตรงๆ?</summary>

browser จะเห็นแค่โดเมนเดียว cookie login เป็นของ `example.com` ใช้ `SameSite=Lax` ได้ ไม่ต้องตั้ง CORS และไม่ต้องใช้ `SameSite=None` ซึ่งเสี่ยงกว่า
</details>

<details><summary>2. ลูกค้ามีงบน้อย อยากได้เว็บเร็ว และไม่มีคนดูแล server ควรแนะนำแบบไหน? บอกข้อแลกเปลี่ยนด้วย</summary>

แบบ managed เหมาะกว่า: ไม่ต้องดูแล OS, deploy ง่าย แต่ต้องใช้แผนที่ไม่หลับสำหรับเว็บจริง ค่าใช้จ่ายขึ้นกับการใช้งาน และย้ายแพลตฟอร์มภายหลังต้องใช้แรง
</details>

<details><summary>3. Preview URL มีประโยชน์และความเสี่ยงอะไร?</summary>

ประโยชน์: ทุก PR มีเว็บให้ดูจริงก่อน merge / ความเสี่ยง: ถ้า preview ต่อ API และ DB ตัวจริง การทดสอบอาจแก้ข้อมูลจริงของลูกค้า
</details>

---

## ✏️ แบบฝึกหัด

deploy Bit Café แบบ managed ครบ 3 ส่วน (Vercel + Render + Neon) เปิด PR แก้ข้อความ 1 จุดแล้วส่ง Preview URL ให้พี่เลี้ยง จากนั้นเขียนตารางเปรียบเทียบสั้นๆ ว่าถ้าเป็นลูกค้าจริง จะแนะนำ VPS หรือ managed เพราะอะไร

## ✅ ผ่านด่าน

- [ ] อธิบายข้อแลกเปลี่ยน VPS vs managed ให้ลูกค้าเข้าใจได้
- [ ] ตั้ง Postgres บน Neon และรัน migration/seed ได้
- [ ] deploy API ด้วย Docker บน Render พร้อม env และ health check
- [ ] ตั้ง `vercel.json` ให้ `/api` rewrite และ SPA fallback ถูก
- [ ] ผูกโดเมนกับ Vercel และตรวจครบตามข้อ 6

---

[← บทที่ 21: CI/CD](./21-cicd.md) · [🏠 สารบัญ](./README.md) · [บทที่ 23: Go-live & ดูแลระบบ →](./23-go-live.md)
