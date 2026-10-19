# STARTER: ฐานข้อมูล + API Spec 🗄️

> **⚡ สรุป 30 วินาที**
> - อย่างน้อย **6 ตาราง** ทุกตารางมี `id`, `created_at`, `updated_at`
> - ทุก endpoint ขึ้นต้นด้วย `/api` แบ่งเป็น **public** (ใครก็เรียกได้) กับ **admin** (ต้องมี cookie login)
> - response **หน้าตาเหมือนกันทุก endpoint** และใช้ status code ให้ถูก

---

## 1. ฐานข้อมูลขั้นต่ำ

มีอย่างน้อย 6 ตาราง ทุกตารางต้องมี `id`, `created_at`, `updated_at` น้องเพิ่มฟิลด์ตามธุรกิจได้ แต่ **ห้ามตัดฟิลด์ข้างล่าง**

| ตาราง | ฟิลด์หลัก | หมายเหตุ |
|---|---|---|
| `admins` | `email` (unique), `password_hash`, `name` | ห้ามเก็บรหัสผ่านตรงๆ ([บทที่ 10 ข้อ 2](../10-security.md#_2-เก็บรหัสผ่านผู้ใช้-hash-ไม่ใช่-encrypt)) |
| `site_settings` | `shop_name`, `logo_url`, `phone`, `email`, `address`, `opening_hours`, `line_url`, `facebook_url`, `instagram_url`, `map_url` | มีแถวเดียวทั้งระบบ |
| `pages` | `slug` (unique: home/about/contact), `seo_title`, `seo_description`, `og_image_url`, `content` (jsonb) | `content` เก็บข้อความ hero/จุดเด่น/about |
| `categories` | `name`, `slug` (unique), `sort_order` | |
| `services` | `category_id` (FK), `name`, `description`, `price` (nullable), `image_url`, `is_featured`, `is_active`, `sort_order` | FK ห้ามลบ category ทิ้งถ้ายังมี service |
| `contact_messages` | `name`, `phone`, `email`, `subject`, `message`, `is_read` | |

```
categories 1 ──── * services          (category_id FK)
admins / site_settings / pages / contact_messages   (ตารางเดี่ยว ไม่มี FK)
```

> 💡 **ทำไม `pages.content` เป็น jsonb:** แต่ละหน้ามีโครงสร้างต่างกัน ถ้าแตกเป็นตารางย่อยจะเยอะเกินสำหรับ 3 หน้า แต่ **ต้องมี Zod schema คุม shape ของ jsonb ทุกครั้งที่บันทึก**
> ทบทวน: `JSONB` ของ PostgreSQL ใน [บทที่ 7](../07-mysql-postgres.md#_5-ชนิดข้อมูลพิเศษ) และ "NoSQL ยืดหยุ่นแต่ต้องตรวจเอง" ใน [บทที่ 6](../06-sql-nosql.md#_5-nosql)

> ⚠️ **กับดัก FK:** Drizzle ตั้งค่า `onDelete` ได้ ถ้าตั้งเป็น `cascade` ลบหมวดแล้ว service หายไปด้วย 😱 requirement ต้องการ **ห้ามลบ** ให้ใช้ `restrict` แล้วตอบ `409` กลับไป

> 📚 ตัวอย่าง schema, migration และ seed ที่รันซ้ำได้: [บทที่ 14 ข้อ 3](../14-hono-api.md)

**ต้องส่ง**
- ไฟล์ `schema.ts`
- migration ที่รันได้ ([บทที่ 8: Migration](../08-orm.md#_3-migration))
- seed script: admin 1 คน, หมวด 2, service 6, settings 1, pages 3
- รูป ER Diagram (export จาก pgAdmin หรือวาดเองก็ได้)

---

## 2. API Spec

ทุก endpoint ขึ้นต้นด้วย `/api` แบ่งเป็น public (ใครก็เรียกได้) กับ admin (ต้องมี cookie login)
ทบทวน method และ status code ใน [บทที่ 5](../05-http-api.md)

### Public

| Method | Endpoint | ใช้ทำอะไร |
|---|---|---|
| `GET` | `/api/settings` | ข้อมูลร้าน (ใช้ใน navbar/footer) |
| `GET` | `/api/pages/:slug` | เนื้อหา + SEO ของหน้านั้น |
| `GET` | `/api/categories` | หมวดหมู่ทั้งหมด |
| `GET` | `/api/services?category=&featured=` | บริการที่เปิดแสดงผล |
| `POST` | `/api/contact` | ส่งข้อความติดต่อ |

### Admin

| Method | Endpoint | ใช้ทำอะไร |
|---|---|---|
| `POST` | `/api/admin/login` | login ตั้ง cookie |
| `POST` | `/api/admin/logout` | ลบ cookie |
| `GET` | `/api/admin/me` | เช็คว่ายัง login อยู่ไหม |
| `GET` | `/api/admin/dashboard` | ตัวเลขสรุปหน้า dashboard |
| `PUT` | `/api/admin/settings` | แก้ข้อมูลร้าน |
| `PUT` | `/api/admin/pages/:slug` | แก้เนื้อหา/SEO |
| `GET` / `POST` | `/api/admin/categories` | ดู / เพิ่มหมวด |
| `PATCH` / `DELETE` | `/api/admin/categories/:id` | แก้ / ลบหมวด |
| `GET` / `POST` | `/api/admin/services?q=&category=&page=` | ดู (มี search + pagination) / เพิ่ม |
| `PATCH` / `DELETE` | `/api/admin/services/:id` | แก้ / ลบ |
| `GET` | `/api/admin/messages` | รายการข้อความ |
| `GET` / `DELETE` | `/api/admin/messages/:id` | เปิดอ่าน (mark read) / ลบ |

### รูปแบบ response ต้องเหมือนกันทุก endpoint

```jsonc
// สำเร็จ
{ "success": true, "data": { } }

// list ที่มีแบ่งหน้า
{ "success": true, "data": [ ], "meta": { "page": 1, "limit": 10, "total": 42 } }

// ผิดพลาด
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { } } }
```

> 💡 เขียน helper `ok()` / `AppError` ไว้ที่เดียวแล้วเรียกใช้ทุก route ดีกว่าพิมพ์ object เองทุกที่ ลืมฟิลด์ทีเดียว frontend พังทั้งเว็บ ([ตัวอย่างในบทที่ 14 ข้อ 4](../14-hono-api.md))

### Status code ที่ต้องใช้ให้ถูก

| Code | ใช้เมื่อ |
|---|---|
| `200` | สำเร็จ |
| `201` | สร้างใหม่ |
| `400` | validate ไม่ผ่าน |
| `401` | ไม่ได้ login |
| `404` | ไม่พบ |
| `409` | ซ้ำ เช่น slug ซ้ำ, ลบหมวดที่มีสินค้า |
| `500` | server พัง (ห้ามส่ง stack trace กลับไป) |

---

## ✅ เช็คตัวเองก่อน Review รอบที่ 1

- [ ] `bun run seed` แล้วเปิด pgAdmin เห็นข้อมูลครบทุกตาราง
- [ ] ลบ DB ทิ้งแล้วรัน migration + seed ใหม่ได้โดยไม่ error
- [ ] ทุก endpoint ทดสอบผ่าน Postman/HTTPie ทั้งกรณีสำเร็จและ error
- [ ] เรียก `/api/admin/*` โดยไม่ login แล้วได้ `401`
- [ ] ลบหมวดที่ยังมี service แล้วได้ `409`

---

[← Requirement หน้าบ้าน + หลังบ้าน](./requirements.md) · [🏠 สารบัญ](../README.md) · [Non-functional Requirement →](./quality.md)
