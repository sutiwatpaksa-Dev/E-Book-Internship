# STARTER: Timeline 10 วัน + Checklist 📅

> **⚡ สรุป 30 วินาที**
> - ลำดับคือ **ฐานข้อมูล → API → หน้าบ้าน → หลังบ้าน** เพราะน้องถนัด backend จาก Todo มาแล้ว ทำส่วนที่มั่นใจก่อนให้มีฐานแน่น
> - ทุกวันมี **"ควรศึกษาก่อน"** พร้อมลิงก์ไปบทในคู่มือนี้ อ่านก่อนลงมือ
> - ⚠️ **ถ้าวันไหนหลุด ห้ามข้ามไปทำต่อเงียบๆ ต้องแจ้งพี่เลี้ยงภายในวันนั้น**

---

## 🗓️ ภาพรวม

| วัน | งาน | ต้องเสร็จ |
|---|---|---|
| 1 | เลือกธุรกิจ, เขียน brief, ร่าง wireframe 3 หน้า (กระดาษก็ได้), setup repo | brief ผ่านพี่เลี้ยง |
| 2 | Drizzle schema, migration, seed, ER diagram | `bun run seed` แล้วมีข้อมูลใน pgAdmin |
| 3 | Public API + Zod + response format | ทดสอบทุก endpoint ผ่าน Postman/HTTPie |
| 4 | Auth (login/logout/middleware) + Admin API | เรียก admin API โดยไม่ login แล้วได้ 401 |
| 5 | Layout, Navbar/Footer, หน้า Home | **🔍 Review รอบที่ 1** (โครงสร้าง DB + API) |
| 6 | หน้า About/Services + Contact form | ส่งฟอร์มแล้วข้อมูลเข้า DB |
| 7 | Admin: login, dashboard, settings, pages | แก้ข้อมูลร้านแล้วหน้าบ้านเปลี่ยน |
| 8 | Admin: services, categories, messages | CRUD ครบ |
| 9 | SEO, responsive, loading/error state | **🔍 Review รอบที่ 2** (ทั้งระบบ) |
| 10 | แก้ตาม review, README, demo | นำเสนอ 15 นาที |

---

## วันที่ 1 · เตรียมโปรเจกต์ 🎒

- [ ] เลือกธุรกิจสมมติ 1 ประเภท + เขียน brief (ชื่อแบรนด์ / กลุ่มลูกค้า / สี / โลโก้ / สินค้าอย่างน้อย 6 รายการ) ([รายละเอียด brief](./index.md#_1-เลือกธุรกิจและเขียน-brief-วันที่-1))
- [ ] ร่าง wireframe 3 หน้า
- [ ] Setup repo (client + server)

**📚 ควรศึกษาก่อน:** การเขียน brief/wireframe เบื้องต้น, โครงสร้างโฟลเดอร์แบบ monorepo (client/server แยกกัน)
- [บทที่ 16 ทำงานคู่กับ AI](../16-ai-pairing.md) ขั้น ①–④: สรุปโจทย์, ถามกลับ, ออกแบบ, แตกงาน + เขียน `CLAUDE.md`
- [บทที่ 1 Git](../01-git.md) สร้าง repo, `.gitignore`, workflow ของทีม
- [บทที่ 3 Node vs Yarn vs Bun](../03-node-yarn-bun.md) ตั้งโปรเจกต์ด้วย Bun, lock file
- [โครงสร้างโฟลเดอร์ขั้นต่ำ](./index.md#_4-โครงสร้างโฟลเดอร์ขั้นต่ํา)

---

## วันที่ 2 · ฐานข้อมูล 🗄️

- [ ] ออกแบบ Drizzle schema + รัน migration
- [ ] เขียน seed script (admin 1, หมวด 2, service 6, settings 1, pages 3)
- [ ] ทำ ER Diagram

**📚 ควรศึกษาก่อน:** พื้นฐาน SQL (primary key / foreign key), แนวคิด ORM และ migration, syntax เบื้องต้นของ Drizzle schema
- [บทที่ 6 SQL vs NoSQL](../06-sql-nosql.md) PK, FK, JOIN
- [บทที่ 7 MySQL vs PostgreSQL](../07-mysql-postgres.md) `JSONB` และ syntax ของ Postgres
- [บทที่ 8 ORM](../08-orm.md) migration และ "ลงมือ: Drizzle ตั้งแต่ศูนย์"
- [บทที่ 2 Docker](../02-docker.md) เปิด PostgreSQL ใน container พร้อม volume
- [บทที่ 14 ข้อ 2–3](../14-hono-api.md) ตั้งโปรเจกต์ server, schema, migration, seed ที่รันซ้ำได้
- [ตารางที่ต้องมี](./database-api.md#_1-ฐานข้อมูลขั้นต่ํา)

---

## วันที่ 3 · Public API 🍽️

- [ ] `GET /api/settings`, `/api/pages/:slug`, `/api/categories`, `/api/services`
- [ ] `POST /api/contact`
- [ ] Validate ด้วย Zod ทุก endpoint + response format ตรง spec
- [ ] ทดสอบผ่าน Postman/HTTPie

**📚 ควรศึกษาก่อน:** REST API คืออะไร, HTTP method / status code เบื้องต้น
- [บทที่ 5 HTTP & REST API](../05-http-api.md) method, status code, ตั้งชื่อ endpoint
- [บทที่ 4 TypeScript ข้อ 5](../04-typescript.md#_5-ข้อจํากัด-typescript-ไม่ได้ตรวจข้อมูลตอนรัน) ทำไมต้อง Zod
- [บทที่ 14 ข้อ 4–5](../14-hono-api.md) response format, onError, Zod, rate limit, ไฟล์ `.http`
- [API Spec + รูปแบบ response](./database-api.md#_2-api-spec)

---

## วันที่ 4 · Auth + Admin API 🔐

- [ ] Login/logout + hash password ด้วย `Bun.password`
- [ ] JWT เก็บใน httpOnly cookie (`sameSite=lax`)
- [ ] Middleware เช็ค token ทุก `/api/admin/*`
- [ ] Admin API ครบ: dashboard / settings / pages / services / categories / messages
- [ ] ทดสอบเรียก admin API โดยไม่ login ต้องได้ `401`

**📚 ควรศึกษาก่อน:** JWT คืออะไรทำงานยังไง, httpOnly cookie ต่างจาก localStorage ยังไง, ทำไมต้อง hash password ก่อนเก็บ, concept ของ middleware
- [บทที่ 10 ข้อ 2: Hash ไม่ใช่ Encrypt](../10-security.md#_2-เก็บรหัสผ่านผู้ใช้-hash-ไม่ใช่-encrypt)
- [บทที่ 10 ข้อ 3: Authentication vs Authorization, Session vs JWT](../10-security.md#_3-authentication-vs-authorization)
- [บทที่ 10: XSS และ cookie HttpOnly](../10-security.md#🧪-xss-cross-site-scripting)
- [บทที่ 15 Login (JWT + Cookie)](../15-auth.md) ทั้ง server และหน้าเว็บ + Checklist ความปลอดภัย

---

## วันที่ 5 · Layout + Home 🏠 · Review รอบที่ 1

- [ ] **Review รอบที่ 1** กับพี่เลี้ยง (โครงสร้าง DB + API)
- [ ] Navbar / Footer / ปุ่ม LINE ลอย
- [ ] หน้า Home: Hero, บริการเด่น 3 รายการ, จุดเด่นร้าน
- [ ] เช็ค Responsive 375 / 768 / 1280

**📚 ควรเตรียม:** สรุปปัญหาที่เจอมาให้ชัดก่อนคุยกับพี่เลี้ยง ([บทที่ 9: ถามคนอื่นยังไงให้ได้คำตอบเร็ว](../09-debugging.md#_6-🙋-ถามคนอื่นยังไงให้ได้คําตอบเร็ว))
**📚 ควรศึกษาก่อน:** React component พื้นฐาน, การทำ responsive ด้วย Tailwind breakpoint
- [บทที่ 11 React](../11-react.md), [บทที่ 12 Tailwind + Responsive](../12-tailwind.md) (theme, Navbar, Hero, ปุ่ม LINE)
- [บทที่ 13 ข้อ 2–3](../13-router-seo.md) Route + Layout + 404
- [Requirement หน้าบ้าน](./requirements.md#_1-หน้าบ้าน-public)

---

## วันที่ 6 · About/Services + Contact ✉️

- [ ] หน้า About/Services: การ์ดสินค้า + กรองตามหมวด
- [ ] หน้า Contact: ฟอร์ม + validate + Google Maps embed, ส่งแล้วเข้า DB

**📚 ควรศึกษาก่อน:** controlled form ใน React, client-side validation เบื้องต้น, วิธี embed Google Maps iframe
- [บทที่ 11 ข้อ 7](../11-react.md) ฟอร์ม + validate, [บทที่ 14 ข้อ 6](../14-hono-api.md) ส่งฟอร์มเข้า API จริง
- [บทที่ 13 ข้อ 4](../13-router-seo.md) กรองหมวดด้วย `useSearchParams`
- [Google Maps: Embed a map](https://developers.google.com/maps/documentation/embed/get-started)

---

## วันที่ 7–8 · หลังบ้าน (Admin) 🛠️

**วันที่ 7**
- [ ] หน้า login, dashboard, settings, pages
- [ ] แก้ข้อมูลร้านแล้วหน้าบ้านเปลี่ยน

**วันที่ 8**
- [ ] services (ค้นหา, กรอง, แบ่งหน้า, ยืนยันก่อนลบ), categories, messages
- [ ] CRUD ครบ

**📚 ควรศึกษาก่อน:** การทำ CRUD UI (list / add / edit / delete), การจัดการ state ของฟอร์มและตาราง
- [บทที่ 13 ข้อ 5](../13-router-seo.md) route หลังบ้าน, [บทที่ 15 ข้อ 5](../15-auth.md) login / RequireAuth / logout
- [บทที่ 12 ข้อ 5](../12-tailwind.md) ตาราง admin ที่ scroll ในกรอบบนมือถือ
- [Requirement หลังบ้าน](./requirements.md#_2-หลังบ้าน-admin)

---

## วันที่ 9 · ตรวจความเรียบร้อย 🔍 · Review รอบที่ 2

- [ ] SEO: title / meta / OG ต่อหน้า, `robots.txt`, `sitemap.xml`
- [ ] Responsive ครบ 3 ขนาด
- [ ] Loading / error / 404 ทุกหน้า
- [ ] **Review รอบที่ 2** (ทั้งระบบ)

**📚 ควรศึกษาก่อน:** พื้นฐาน SEO (title / meta / OG tag), แนวคิด rate limiting, วิธี handle error ไม่ให้หลุด stack trace
- [Non-functional Requirement ทั้งหมด](./quality.md), [บทที่ 13 ข้อ 6–7](../13-router-seo.md) SEO
- [บทที่ 10: Brute force / rate limit](../10-security.md#🔁-ลองรหัสผ่านรัวๆ-brute-force), [บทที่ 10: Error ที่บอกมากเกินไป](../10-security.md#📣-error-ที่บอกมากเกินไป)
- [บทที่ 9 Debugging](../09-debugging.md)

---

## วันที่ 10 · แก้ไข + ส่งงาน 🎤

- [ ] แก้ตาม review รอบที่ 2
- [ ] README ครบ
- [ ] ซ้อม demo 15 นาที

**📚 ควรศึกษาก่อน:** การเขียน README ที่ดี (setup steps ชัดเจน ทำตามได้จริง), การเตรียม demo สั้นๆ ให้ตรงประเด็น
- README ที่ดี: คนอื่น clone แล้วรันตามได้ภายใน 5 นาที (ติดตั้ง, `.env`, migrate/seed, รัน, บัญชี admin ทดสอบ)
- [บทที่ 16 ข้อ 6](../16-ai-pairing.md) ใช้ AI ช่วย review + เช็คความปลอดภัยก่อนส่ง
- [สิ่งที่ต้องส่ง + เกณฑ์ประเมิน](./submission.md)

---

[← Non-functional Requirement](./quality.md) · [🏠 สารบัญ](../README.md) · [การส่งงาน + เกณฑ์ประเมิน →](./submission.md)
