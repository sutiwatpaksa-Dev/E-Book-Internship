# บทที่ 5: HTTP & REST API 🍽️

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 2 และ 4 · 🛠 ใช้: Node.js, TypeScript, Docker, VS Code (REST Client)

> **⚡ สรุป 30 วินาที**
> - HTTP คือ **ภาษาที่ client กับ server ใช้คุยกัน**: ส่ง **request** ไป ได้ **response** กลับ
> - **Method** บอกว่าจะทำอะไร (`GET` ดู, `POST` สร้าง, `PATCH` แก้, `DELETE` ลบ)
> - **Status code** บอกผลลัพธ์ (2xx สำเร็จ, 4xx ฝั่ง client ผิด, 5xx ฝั่ง server พัง)
> - บทนี้สร้าง **API ระบบเช่าโน้ตบุ๊คด้วย TypeScript** และแพ็กใส่ Docker

---

## 📖 เรื่องเล่า

บิตเขียน API ตัวแรก ทุก endpoint ตอบกลับแบบนี้:

```
200 OK
{ "success": false, "message": "ไม่พบข้อมูล" }
```

พี่ไบต์ถาม: *"ถ้าทุกอย่างตอบ 200 แล้วแอปมือถือจะรู้ได้ยังไงว่าสำเร็จหรือพัง?"*
บิต: *"ก็...อ่าน message เอา?"*
พี่ไบต์: *"ถ้า message เป็นภาษาไทย แล้วทีมแอปเป็นคนญี่ปุ่นล่ะ?"* 😅

HTTP มีภาษากลางที่ตกลงกันไว้ทั้งโลกแล้ว บทนี้จะพาไปรู้จัก

---

## 1. HTTP: การสั่งอาหารในร้าน

> 💡 **เปรียบเทียบ**
> - **Client** = ลูกค้า 🧑 · **Server** = ครัว 👨‍🍳 · **API** = เมนู 📜
> - **Request** = ใบสั่งอาหาร: สั่งอะไร (method + URL) · หมายเหตุ (headers) · รายละเอียด (body)
> - **Response** = อาหารที่มาเสิร์ฟ พร้อมบอกผล (status code): "ได้แล้วครับ" / "เมนูนี้หมด" / "ครัวไฟไหม้"

### Request มีอะไรบ้าง
```
POST /laptops?notify=true HTTP/1.1          ← method + path + query
Host: localhost:3000                        ← headers
Content-Type: application/json
Authorization: Bearer abc123

{ "brand": "Lenovo", "model": "T14" }       ← body
```
| ส่วน | หน้าที่ | ตัวอย่าง |
|---|---|---|
| **Method** | จะทำอะไร | `GET`, `POST` |
| **Path** | กับอะไร | `/laptops/5` |
| **Query** | ตัวเลือกเพิ่มเติม (หลัง `?`) | `?status=available&page=2` |
| **Headers** | ข้อมูลประกอบ | ชนิดข้อมูล, token ยืนยันตัวตน |
| **Body** | ข้อมูลที่ส่งไป (มักเป็น JSON) | `{ "brand": "Lenovo" }` |

### Response มีอะไรบ้าง
```
HTTP/1.1 201 Created                        ← status code
Content-Type: application/json              ← headers

{ "id": 7, "brand": "Lenovo", "model": "T14" }   ← body
```

---

## 2. Method: บอกว่าจะทำอะไร

| Method | ทำอะไร | ตัวอย่าง | มี body? |
|---|---|---|---|
| `GET` | ดูข้อมูล | `GET /laptops` | ❌ |
| `POST` | สร้างใหม่ | `POST /laptops` | ✅ |
| `PATCH` | แก้บางส่วน | `PATCH /laptops/5` | ✅ |
| `PUT` | แทนที่ทั้งก้อน | `PUT /laptops/5` | ✅ |
| `DELETE` | ลบ | `DELETE /laptops/5` | ❌ |

> ⚠️ `GET` ต้อง **ไม่เปลี่ยนข้อมูล** เด็ดขาด เพราะ browser และระบบ cache อาจเรียกซ้ำเองได้

---

## 3. Status code: บอกผลลัพธ์

จำแค่หลักแรกก่อน:

| กลุ่ม | ความหมาย | 💡 ในร้านอาหาร |
|---|---|---|
| **2xx** ✅ | สำเร็จ | "อาหารมาแล้วครับ" |
| **3xx** ↪️ | ย้ายไปที่อื่น | "ร้านย้ายสาขาแล้ว" |
| **4xx** 🙅 | **client ผิด** | "เมนูนี้ไม่มีครับ" / "สั่งไม่ครบ" |
| **5xx** 🔥 | **server พัง** | "ครัวไฟไหม้" |

ที่ใช้บ่อยจริงๆ:

| Code | ชื่อ | ใช้เมื่อ |
|---|---|---|
| `200` | OK | ดู/แก้สำเร็จ |
| `201` | Created | สร้างสำเร็จ (`POST`) |
| `204` | No Content | ลบสำเร็จ ไม่มีอะไรส่งกลับ |
| `400` | Bad Request | ข้อมูลที่ส่งมาผิดรูปแบบ |
| `401` | Unauthorized | ยังไม่ได้ login / token ผิด ("คุณเป็นใคร?") |
| `403` | Forbidden | login แล้วแต่ไม่มีสิทธิ์ ("รู้ว่าเป็นใคร แต่ห้ามเข้า") |
| `404` | Not Found | ไม่พบสิ่งที่ขอ |
| `409` | Conflict | ขัดกับสถานะปัจจุบัน เช่น เครื่องถูกเช่าไปแล้ว |
| `500` | Internal Server Error | โค้ด server พัง |

> 🤓 **เกร็ด:** มีเว็บ **[http.cat](https://http.cat)** ที่ทำรูปแมวประกอบทุก status code 🐱 และมี code `418 I'm a teapot` จริงๆ เกิดจากมุกวันเมษาหน้าโง่ปี 1998

---

## 4. REST: วิธีตั้งชื่อ endpoint ให้ทุกคนเดาได้

**REST** คือแนวทางออกแบบ API ที่นิยมที่สุด หลักง่ายๆ คือ **URL เป็นคำนาม (สิ่งของ) ส่วน method เป็นคำกริยา**

| ✅ ดี | ❌ ไม่ดี |
|---|---|
| `GET /laptops` | `GET /getAllLaptops` |
| `GET /laptops/5` | `GET /laptop?id=5&action=view` |
| `POST /laptops` | `POST /createLaptop` |
| `PATCH /laptops/5` | `POST /updateLaptop/5` |
| `DELETE /laptops/5` | `GET /deleteLaptop/5` 😱 |
| `GET /customers/3/rentals` | `GET /getRentalsByCustomer?cid=3` |
| `GET /laptops?status=available` | `GET /availableLaptops` |

**หลักจำ**
- ใช้ **พหูพจน์** (`/laptops`) และตัวพิมพ์เล็ก คั่นคำด้วย `-`
- ความสัมพันธ์ใช้ซ้อน: `/customers/3/rentals`
- ค้นหา/กรอง/แบ่งหน้าใช้ query: `?status=available&page=2`
- error ตอบรูปแบบเดียวกันทุกที่ เช่น `{ "error": "ข้อความ", "details": [...] }`

---

## 5. 🔧 ลงมือ: สร้าง Laptop API

```bash
mkdir laptop-api && cd laptop-api
npm init -y
npm install express zod
npm install -D typescript tsx @types/node @types/express
```
ใส่ `tsconfig.json`, `"type": "module"` และ `scripts` ตาม [บทที่ 4 ข้อ 3](./04-typescript.md)

`src/index.ts`
```ts
import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json());              // ให้ Express อ่าน body ที่เป็น JSON ได้

// ----- ข้อมูล (เก็บใน memory ไปก่อน บทที่ 8 จะย้ายไปฐานข้อมูล) -----
const LaptopInput = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  serial: z.string().min(1),
});
type Laptop = z.infer<typeof LaptopInput> & { id: number; status: "available" | "rented" };

const laptops: Laptop[] = [];
let nextId = 1;

// ----- endpoint -----
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/laptops", (_req, res) => {
  res.json(laptops);
});

app.get("/laptops/:id", (req, res) => {
  const laptop = laptops.find((l) => l.id === Number(req.params.id));
  if (!laptop) {
    res.status(404).json({ error: "ไม่พบเครื่องนี้" });
    return;
  }
  res.json(laptop);
});

app.post("/laptops", (req, res) => {
  const parsed = LaptopInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.issues });
    return;
  }
  const laptop: Laptop = { id: nextId++, status: "available", ...parsed.data };
  laptops.push(laptop);
  res.status(201).json(laptop);
});

app.delete("/laptops/:id", (req, res) => {
  const index = laptops.findIndex((l) => l.id === Number(req.params.id));
  if (index === -1) {
    res.status(404).json({ error: "ไม่พบเครื่องนี้" });
    return;
  }
  laptops.splice(index, 1);
  res.status(204).end();
});

app.listen(3000, () => console.log("🚀 API on http://localhost:3000"));
```
```bash
npm run dev
```
เปิด http://localhost:3000/health → `{"status":"ok"}` ✅

### ทดสอบด้วยไฟล์ `.http` (แนะนำ)
ติดตั้ง extension **REST Client** ใน VS Code แล้วสร้าง `requests.http`:
```http
### ดูทั้งหมด
GET http://localhost:3000/laptops

### เพิ่มเครื่อง
POST http://localhost:3000/laptops
Content-Type: application/json

{ "brand": "Lenovo", "model": "T14", "serial": "PF-001" }

### เพิ่มแบบข้อมูลผิด (ควรได้ 400)
POST http://localhost:3000/laptops
Content-Type: application/json

{ "brand": "" }

### หาเครื่องที่ไม่มี (ควรได้ 404)
GET http://localhost:3000/laptops/99

### ลบ (ควรได้ 204)
DELETE http://localhost:3000/laptops/1
```
กดคำว่า **Send Request** ที่ขึ้นเหนือแต่ละ request ดูผลด้านขวา 👉 สังเกต status code ทุกครั้ง

> 💡 ทางเลือกอื่น: **Postman**, **Bruno** หรือคำสั่ง `curl` ใน Terminal
> ```bash
> curl -i http://localhost:3000/laptops/99      # -i = แสดง status และ headers ด้วย
> ```

**ลองพังมันดู** 💥
- ส่ง body ที่ไม่ใช่ JSON
- ลืมใส่ `Content-Type: application/json` แล้วดูว่า `req.body` เป็นอะไร
- ส่ง `serial` เป็นตัวเลข

---

## 6. 🔧 แพ็ก API ใส่ Docker

ต่อยอดจาก [บทที่ 2](./02-docker.md) คราวนี้เป็นแอป TypeScript จริง

`Dockerfile`
```dockerfile
# ===== ขั้นที่ 1: build (แปลง TS → JS) =====
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# ===== ขั้นที่ 2: image สำหรับรันจริง =====
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

`.dockerignore`
```
node_modules
dist
.env
.git
```

```bash
docker build -t laptop-api .
docker run -d -p 3000:3000 --name api laptop-api
```

> 💡 **ทำไม COPY `package.json` ก่อนโค้ด?** Docker จำ (cache) แต่ละชั้นไว้ เราแก้โค้ดบ่อย แต่เพิ่ม package นานๆ ครั้ง แยกแบบนี้ตอนแก้โค้ด Docker จะข้าม `npm ci` (ขั้นที่ช้าที่สุด) build เร็วขึ้นมาก

> 💡 **ทำไมแบ่ง 2 ขั้น (multi-stage)?** ขั้นแรกต้องใช้ TypeScript และเครื่องมือ dev แต่ตอนรันไม่ต้องใช้ หยิบเฉพาะ `dist/` ไปใส่กล่องใหม่ image เล็กและปลอดภัยกว่า

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ลูกค้าส่งฟอร์มมาโดยไม่กรอกเบอร์โทร ควรตอบ status อะไร?</summary>

`400 Bad Request` เพราะข้อมูลที่ client ส่งมาไม่ครบ
</details>

<details><summary>2. ยืมเครื่องที่ถูกยืมไปแล้ว ควรตอบอะไร?</summary>

`409 Conflict` คำขอถูกรูปแบบ แต่ขัดกับสถานะปัจจุบันของข้อมูล
</details>

<details><summary>3. <code>401</code> กับ <code>403</code> ต่างกันยังไง?</summary>

401 = ไม่รู้ว่าเป็นใคร (ยังไม่ login) / 403 = รู้ว่าเป็นใคร แต่ไม่มีสิทธิ์ทำสิ่งนี้
</details>

<details><summary>4. ทำไม <code>GET /deleteLaptop/5</code> อันตราย?</summary>

GET ควรเป็นการดูอย่างเดียว browser, bot หรือระบบ preview ลิงก์อาจเรียก URL นี้เองโดยไม่ตั้งใจ แล้วข้อมูลถูกลบ
</details>

---

## ✏️ แบบฝึกหัด

เพิ่ม `PATCH /laptops/:id` (แก้ brand/model ได้บาง field ใช้ `LaptopInput.partial()`) และ `GET /laptops?status=available` ทดสอบด้วยไฟล์ `.http` ให้ครบทั้งกรณีสำเร็จและกรณี error

## ✅ ผ่านด่าน

- [ ] อธิบายส่วนประกอบของ request/response ได้
- [ ] เลือก method และ status code ได้ถูก
- [ ] ตั้งชื่อ endpoint แบบ REST ได้
- [ ] สร้าง API ด้วย TS + Zod และรันใน Docker ได้

---

[← บทที่ 4: TypeScript](./04-typescript.md) · [🏠 สารบัญ](./README.md) · [บทที่ 6: SQL vs NoSQL →](./06-sql-nosql.md)
