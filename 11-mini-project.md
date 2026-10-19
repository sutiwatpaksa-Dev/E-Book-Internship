# บทที่ 11: Mini Project ระบบเช่าโน้ตบุ๊ค 🏆

> ⏱ ประมาณ 1–2 วัน · 🧩 ต้องผ่านก่อน: บทที่ 1–10 · 🛠 ใช้: ทุกอย่างที่เรียนมา

> **⚡ สรุป 30 วินาที**
> - รวมทุกบทเป็นระบบเล็กๆ 1 ระบบ: **Mini Rental API**
> - ไม่ต้องสวยหรือครบทุกฟีเจอร์ ขอให้ **รันได้ และอธิบายได้**
> - ทำงานแบบทีมจริง: แตก branch → commit → เปิด Merge Request

---

## 📖 เรื่องเล่า

พี่ไบต์ส่งงานชิ้นแรกให้บิต:
*"ลูกค้าอยากเลิกใช้ Excel แล้ว ขอ API เล็กๆ สำหรับจัดการเครื่องและการยืม-คืน ทีมแอปจะต่อจากเราอีกที"*

บิตเปิดคู่มือย้อนดูทีละบท แล้วพบว่า... **รู้ทุกชิ้นที่ต้องใช้แล้ว** 😎

---

## 🗺️ แต่ละบทใช้ตรงไหน

| ชิ้นส่วน | มาจากบท |
|---|---|
| repo, branch, commit, MR | 1 Git |
| `compose.yaml`, volume, Dockerfile | 2 Docker, 5 HTTP |
| `package.json`, lock file | 3 Node |
| TypeScript `strict`, Zod | 4 TypeScript |
| endpoint, method, status code | 5 HTTP |
| ตาราง, FK, transaction | 6 SQL |
| เลือก PostgreSQL | 7 MySQL vs PG |
| ORM + migration | 8 ORM |
| อ่าน error, debugger | 9 Debugging |
| `.env`, ไม่เชื่อ input | 10 Security |

---

## 📋 สิ่งที่ต้องมี

**เทคนิค**
- API ด้วย **TypeScript `strict`** (Express หรือ Hono) ไม่มี `any`, `npm run typecheck` ผ่าน
- **PostgreSQL** ใน Docker ผ่าน `compose.yaml` (มี volume)
- ORM 1 ตัว (Drizzle หรือ Prisma) สร้างตารางด้วย **migration**
- ตรวจ input ทุก endpoint ด้วย **Zod**
- มี `.env.example` ไม่มี `.env` ใน Git

**ตาราง**
| ตาราง | คอลัมน์ขั้นต่ำ |
|---|---|
| `laptops` | `id`, `brand`, `model`, `serial` (ห้ามซ้ำ), `status` (`available` / `rented`) |
| `rentals` | `id`, `laptop_id` (FK), `customer_name`, `start_date`, `return_date` (ว่างได้ = ยังไม่คืน) |

**Endpoint**
| Method | Path | ทำอะไร | Status ที่ควรได้ |
|---|---|---|---|
| `GET` | `/laptops` | ดูเครื่องทั้งหมด (รองรับ `?status=available`) | 200 |
| `POST` | `/laptops` | เพิ่มเครื่อง | 201 / 400 / 409 (serial ซ้ำ) |
| `POST` | `/rentals` | ยืมเครื่อง | 201 / 400 / 404 / 409 (ถูกยืมอยู่) |
| `POST` | `/rentals/:id/return` | คืนเครื่อง | 200 / 404 / 409 (คืนไปแล้ว) |

> ⭐ **หัวใจของงาน:** `POST /rentals` ต้องใช้ **transaction**
> เช็คว่าเครื่องว่าง → สร้าง rental → เปลี่ยนสถานะเครื่อง ถ้าขั้นไหนพัง ต้องไม่มีอะไรถูกบันทึก (บทที่ 6 ข้อ 4)

---

## 🪜 แนะนำลำดับการทำ

ทำทีละขั้น ทุกขั้นให้ **commit + ทดสอบ** ก่อนไปต่อ

1. 🌱 สร้าง repo และ branch `feat/mini-rental-api`
2. 🐳 `compose.yaml` เปิด PostgreSQL ได้
3. 🟦 ตั้งโปรเจกต์ TS + Express, `GET /health` ตอบได้
4. 🗄️ เขียน schema + migration ตาราง `laptops`
5. 🔌 `GET /laptops` และ `POST /laptops` ต่อ DB จริง
6. 🗄️ เพิ่มตาราง `rentals` ด้วย migration ครั้งที่ 2
7. 🔄 `POST /rentals` (transaction) และ `POST /rentals/:id/return`
8. 🧪 ไฟล์ `requests.http` ทดสอบทั้งกรณีสำเร็จและ error
9. 📝 เขียน README
10. 🚀 push และเปิด Merge Request

> 💡 ติดตรงไหนเกิน 30 นาที ถามได้เลยด้วยเทมเพลตใน [บทที่ 9](./09-debugging.md)

---

## 🎁 โบนัส (ไม่บังคับ)

ทำเสร็จแล้วยังสนุกอยู่ ลองเพิ่ม:
- 🐳 ให้ API รันใน Docker ด้วย เปิดทั้งระบบด้วย `docker compose up -d` คำสั่งเดียว
- ❤️ healthcheck ใน compose ให้ API รอ DB พร้อมก่อน (`depends_on` + `condition: service_healthy`)
- 🧪 test 3 เคสด้วย Vitest
- 📜 `GET /laptops/:id/rentals` ประวัติการยืมของเครื่อง (ระวัง N+1!)
- 🔐 ระบบ login จากบทที่ 10 และให้เฉพาะคนที่ login เพิ่มเครื่องได้

---

## 📤 การส่งงาน

**โครงสร้าง repo** `intern-basic-<ชื่อเล่น>`
```
intern-basic-<ชื่อเล่น>/
├── 01-git/
├── 02-docker/
├── 03-node-yarn-bun/
├── 04-typescript/
├── 05-http-api/
├── 06-sql-nosql/
├── 07-mysql-postgres/
├── 08-orm/
├── 09-debugging/
├── 10-security/
└── 11-mini-rental-api/
```
แต่ละโฟลเดอร์มี `README.md` สั้นๆ: **ทำอะไรไป · รันยังไง · เจอปัญหาอะไรและแก้ยังไง**

**กฎ**
- โค้ดเป็น **TypeScript** ทั้งหมด (`strict`, ไม่มี `any`, ไม่มี `.js` ใน `src/`) งาน JavaScript จะถูกส่งกลับให้แก้ก่อน
- ไม่มี `node_modules/`, `dist/`, `.env` ใน repo
- ผ่าน [Security Checklist](./10-security.md) ก่อนเปิด MR

**README ของ Mini Project ต้องมี**
- ระบบนี้ทำอะไร (2–3 บรรทัด)
- วิธีรันตั้งแต่ clone จนเรียก API ได้ (คนอื่นทำตามได้ภายใน 5 นาที)
- รายการ endpoint
- เลือก ORM ตัวไหน เพราะอะไร

---

## 🎤 วัน Demo

- demo 10 นาที: รันระบบให้ดู ยืม-คืนเครื่อง 1 รอบ และโชว์กรณี error
- ตอบคำถาม 5 นาที เช่น *"ถ้าสองคนกดยืมเครื่องเดียวกันพร้อมกันจะเกิดอะไร?"*

**สิ่งที่พี่ดู**
| | ดูอะไร |
|---|---|
| 🧠 **เข้าใจ** | อธิบายด้วยคำพูดตัวเองได้ว่าแต่ละส่วนทำอะไร ทำไมเลือกแบบนี้ |
| ▶️ **รันได้** | ทำตาม README แล้วรันได้จริง |
| 🤝 **ทำงานแบบทีม** | commit message อ่านรู้เรื่อง, MR อธิบายชัด |
| 🙋 **ซื่อตรง** | ใช้ AI ได้เต็มที่ แต่อธิบายโค้ดที่ส่งได้ทุกบรรทัด |

> 🎉 ผ่านบทนี้ = พร้อมรับงานจริงแล้ว ยินดีต้อนรับสู่ทีม Blicktech!

---

[← บทที่ 10: Security](./10-security.md) · [🏠 สารบัญ](./README.md) · [📋 Cheat Sheet →](./cheat-sheet.md)
