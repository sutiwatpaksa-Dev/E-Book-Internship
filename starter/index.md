# Requirement: โปรเจกต์ฝึกงาน เว็บไซต์ STARTER (Mini Project) 🏪

> ⏱ 10 วันทำงาน (ยืดหยุ่น) · 👤 ทำคนเดียว · 🧩 ต้องผ่านก่อน: บทที่ 0–16 · 🛠 ใช้: React, Tailwind, Bun, Hono, Drizzle, PostgreSQL

> **⚡ สรุป 30 วินาที**
> - สร้างเว็บไซต์ธุรกิจสมมติ 1 เว็บ **ครบวงจร**: หน้าบ้าน + หลังบ้าน + ฐานข้อมูล ตามสเปกแพ็กเกจ **STARTER**
> - ทำงาน **เหมือนรับงานลูกค้าจริง** ไม่ใช่แค่ฝึกเขียนโค้ด ธุรกิจเลือกเอง แต่สเปกขั้นต่ำต้องครบ
> - พี่เลี้ยง review 2 รอบ (วันที่ 5 และ 9) และ demo สด 15 นาทีในวันที่ 10
> - ผ่าน = **70 คะแนนขึ้นไป** และไม่ติดข้อตกทันที ([ดูเกณฑ์](./submission.md))

---

## 📖 เรื่องเล่า

บิตผ่านด่าน 5 มาแล้ว ทำ Bit Café เล็กๆ ได้ทั้งหน้าบ้าน API และ login พี่ไบต์ยื่นงานชิ้นจริงให้:
*"ลูกค้ารายนี้อยากได้เว็บร้านของตัวเอง แก้ข้อมูลเองได้ ไม่ต้องโทรหาเราทุกครั้งที่จะเปลี่ยนเบอร์โทร งบแพ็กเกจ STARTER นะ"*

บิตถาม: *"แล้วร้านอะไรครับ?"*
พี่ไบต์ยิ้ม: *"เลือกเอง แล้วเขียน brief มาให้พี่ดูก่อนเริ่มโค้ด เหมือนคุยกับลูกค้าจริง"*

---

## 🧗 ต่อยอดจากงานก่อนหน้า

| แบบฝึกแรก (Todo) | STARTER | ทบทวนที่ |
|---|---|---|
| ตารางเดียว | หลายตารางที่มีความสัมพันธ์กัน | [บทที่ 6 SQL](../06-sql-nosql.md) |
| CRUD ธรรมดา | มีระบบ login แยกสิทธิ์ admin | [บทที่ 15 Login](../15-auth.md) |
| หน้าเดียว | หลายหน้า มี routing และ SEO | [บทที่ 13 Router + SEO](../13-router-seo.md) |
| Prisma | **Drizzle ORM** (ได้เห็นว่า ORM คนละตัวคิดต่างกันยังไง) | [บทที่ 8 ORM](../08-orm.md), [บทที่ 14](../14-hono-api.md) |
| งานทดลอง | งานที่ต้องส่งมอบให้ "ลูกค้า" ใช้ต่อได้จริง | [การส่งงาน](./submission.md), [บทที่ 23 ส่งมอบ](../23-go-live.md) |

---

## 1. เลือกธุรกิจและเขียน Brief (วันที่ 1)

**ขั้นแรก ต้องเลือกธุรกิจสมมติ 1 ประเภท** แล้วเขียน brief สั้นๆ ส่งพี่เลี้ยงก่อนเริ่มโค้ด
ตัวอย่าง: ร้านกาแฟ ☕, คลินิกทำฟัน 🦷, ร้านซ่อมมือถือ 📱, สตูดิโอถ่ายภาพ 📷, โฮมสเตย์ 🏡, ร้านเช่าชุด 👗

**Brief ต้องมี**
- ชื่อแบรนด์
- กลุ่มลูกค้า
- สีหลัก 2–3 สี
- โลโก้ (ทำเองง่ายๆ ได้)
- สินค้า/บริการ **อย่างน้อย 6 รายการ**

> ⚠️ **ข้อห้าม:** ห้ามเลือกธุรกิจที่ต้องมีระบบ **ตะกร้าสินค้า/ชำระเงิน** เพราะเกินแพ็กเกจ STARTER

---

## 2. ฟีเจอร์ตามแพ็กเกจ → สิ่งที่น้องต้องทำจริง

| ฟีเจอร์ในแพ็กเกจ | ความหมายในโปรเจกต์นี้ |
|---|---|
| 🎨 ออกแบบตามแบรนด์ | ใช้สี/ฟอนต์/โลโก้ตาม brief ทั้งเว็บ ตั้งค่าใน Tailwind theme |
| 📄 สูงสุด 3 หน้า | หน้า Home, About/Services, Contact (หน้า admin ไม่นับ) |
| 📱 Responsive | ใช้งานได้ที่ 375px, 768px, 1280px |
| 🛠️ ระบบจัดการเนื้อหา | admin แก้ข้อมูลเว็บได้เองโดยไม่ต้องแก้โค้ด |
| ✉️ Contact Form | ฟอร์มส่งข้อความ บันทึกลง DB และดูได้ในหลังบ้าน |
| 💬 LINE / Social Media | ลิงก์/ปุ่ม LINE, Facebook, IG ที่ admin แก้ได้ |
| 🔎 Basic SEO | title, meta description, OG tags ต่อหน้า แก้ได้จากหลังบ้าน |
| 🔁 แก้ไขงาน 2 ครั้ง | พี่เลี้ยงจะ review 2 รอบ (วันที่ 5 และ 9) น้องต้องแก้ตาม |

---

## 3. Tech stack

| ส่วน | เครื่องมือ | ทบทวน / อ่านเพิ่ม |
|---|---|---|
| Frontend | React + TypeScript (Vite), Tailwind CSS, React Router | [บทที่ 11 React](../11-react.md), [บทที่ 12 Tailwind](../12-tailwind.md), [บทที่ 13 Router + SEO](../13-router-seo.md) |
| Backend | Bun + Hono | [บทที่ 14 Bun + Hono API](../14-hono-api.md), [บทที่ 5 API](../05-http-api.md) |
| ORM | Drizzle ORM + drizzle-kit (migration) | [บทที่ 8 ORM](../08-orm.md), [บทที่ 14 ข้อ 3](../14-hono-api.md) |
| Validation | Zod (ใช้ทั้ง backend และแชร์ type ให้ frontend) | [บทที่ 4 ข้อ 5](../04-typescript.md), [บทที่ 14 ข้อ 4–5](../14-hono-api.md) |
| Database | PostgreSQL, จัดการผ่าน pgAdmin | [บทที่ 7 PostgreSQL](../07-mysql-postgres.md), [บทที่ 2 Docker](../02-docker.md) |
| Auth | JWT เก็บใน httpOnly cookie, hash รหัสผ่านด้วย `Bun.password` | [บทที่ 15 Login](../15-auth.md), [บทที่ 10 Security](../10-security.md) |

> 💡 ด่าน 5 (บทที่ 11–15) สร้าง **Bit Café** ด้วย stack นี้ครบทุกชิ้นแล้ว แต่ฟีเจอร์น้อยกว่า STARTER ใช้เป็นแบบอย่างได้ แต่ **ต้องเขียนส่วนที่เหลือเองและอธิบายได้ทุกบรรทัด**
> 🤖 ก่อนเริ่มวันที่ 1 อ่าน [บทที่ 16 ทำงานคู่กับ AI](../16-ai-pairing.md) แล้วใช้ workflow 5 ขั้นตลอดโปรเจกต์

---

## 4. โครงสร้างโฟลเดอร์ขั้นต่ำ

แยก client / server เหมือนโปรเจกต์ Todo

```
project/
├─ client/
│  └─ src/
│     ├─ pages/          # หน้าเว็บ public + admin
│     ├─ components/
│     ├─ api/            # ตัวกลางเรียก backend ทั้งหมด
│     └─ types/
├─ server/
│  ├─ src/
│  │  ├─ index.ts        # entry point
│  │  ├─ routes/         # แยกไฟล์ตาม resource
│  │  ├─ db/
│  │  │  ├─ schema.ts    # Drizzle schema
│  │  │  └─ index.ts     # db connection
│  │  ├─ validators/     # Zod schemas
│  │  └─ middleware/     # auth guard, error handler
│  ├─ drizzle/           # ไฟล์ migration
│  └─ .env.example
└─ README.md
```

> ⚠️ **กติกา:** ห้าม commit ไฟล์ `.env` ต้องมี `.env.example` บอกว่าต้องตั้งค่าอะไรบ้าง ([บทที่ 10 ข้อ 1](../10-security.md)) และต้องมี **seed script สร้าง admin คนแรก**

---

## 🗂️ อ่านต่อ

| หน้า | มีอะไร |
|---|---|
| [🖥️ Requirement หน้าบ้าน + หลังบ้าน](./requirements.md) | ทุกหน้า ทุกปุ่ม ทุกสถานะที่ต้องมี |
| [🗄️ ฐานข้อมูล + API Spec](./database-api.md) | 6 ตาราง, endpoint ทั้งหมด, รูปแบบ response |
| [🛡️ Non-functional Requirement](./quality.md) | Responsive, SEO, Security, Validation, Code quality |
| [📅 Timeline 10 วัน + Checklist](./timeline.md) | ทำอะไรวันไหน ต้องอ่านบทไหนก่อน |
| [📤 การส่งงาน + เกณฑ์ประเมิน](./submission.md) | สิ่งที่ต้องส่ง, 100 คะแนน, Bonus |

---

[← บทที่ 16: ทำงานคู่กับ AI](../16-ai-pairing.md) · [🏠 สารบัญ](../README.md) · [Requirement หน้าบ้าน + หลังบ้าน →](./requirements.md)
