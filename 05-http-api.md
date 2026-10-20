# บทที่ 5: HTTP & REST API 🍽️

> ⏱ ประมาณ 5 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 2 และ 4 · 🛠 ใช้: Node.js, TypeScript, Docker, VS Code (REST Client)

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

**API** (Application Programming Interface) คือ "เมนู" ที่โปรแกรมหนึ่งเปิดให้โปรแกรมอื่นสั่งงาน ส่วน **HTTP** คือ "ภาษา" ที่ใช้เขียนใบสั่งและตอบกลับ เว็บ แอปมือถือ และระบบหลังบ้านคุยกันด้วยภาษานี้เกือบทั้งหมด

### พิมพ์ URL แล้วกด Enter เกิดอะไรขึ้น (ฉบับย่อ)

![แผนภาพลำดับ เบราว์เซอร์ถาม DNS ต่อสายกับ server แล้วส่ง HTTP request](/img/05-url-journey.svg)
*3 ขั้น: หา IP จากชื่อ (DNS) → ต่อสาย (TCP, และ TLS ถ้าเป็น https) → คุย HTTP*

1. **DNS:** เครื่องรู้จักแค่เลข IP (เช่น `203.0.113.10`) จึงถาม "สมุดโทรศัพท์" ว่าชื่อ `api.shop.test` คือ IP อะไร
2. **TCP (+ TLS):** ต่อสายไปที่ IP นั้น ที่ port ที่กำหนด (ถ้าเป็น `https` จะเข้ารหัสสายด้วย)
3. **HTTP:** ส่ง request (`GET /laptops`) แล้วรอ response

ถ้าพิมพ์ `localhost:3000` ขั้น 1 ไม่ต้องทำ เพราะ `localhost` คือ "เครื่องตัวเอง" รายละเอียดของแต่ละขั้นอยู่ใน [บทที่ 17 (เน็ตเวิร์ก)](./17-network.md) และ [บทที่ 18 (โดเมนและ DNS)](./18-domain-dns.md) ตอนนี้แค่เข้าใจภาพรวมก็พอ

### Request มีอะไรบ้าง

![ส่วนประกอบของ HTTP request และ response](/img/05-request-response.svg)
*Request และ Response โครงสร้างเหมือนกัน: บรรทัดแรก (start line) · headers · บรรทัดว่าง · body*

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
บรรทัดแรกของ response เรียก **status line** ประกอบด้วย เวอร์ชัน HTTP · **เลข status** (ให้โปรแกรมอ่าน) · **ข้อความ status** (ให้คนอ่าน)

> 💡 **HTTP ไม่จำอะไรเลย (stateless):** ทุก request เป็นเรื่องใหม่ server ไม่รู้ว่าคุณเคยมาแล้ว จึงต้องแนบ "บัตรประจำตัว" (cookie หรือ token) มากับทุก request ดูหัวข้อ 7 และ [บทที่ 15](./15-auth.md)

### ส่วนประกอบของ URL

![ส่วนประกอบของ URL: โปรโตคอล โดเมน port path และ query](/img/05-url-anatomy.svg)
*URL = ที่อยู่ของสิ่งที่ขอ แยกเป็นส่วนๆ ได้*

| ส่วน | ตัวอย่าง | ความหมาย |
|---|---|---|
| โปรโตคอล | `https` | ใช้ภาษาอะไร (`https` = HTTP เข้ารหัส) |
| โดเมน | `shop.test` | ชื่อของเครื่อง server |
| port | `:3000` | ประตูของโปรแกรมในเครื่องนั้น (ถ้าไม่เขียน `http` = 80, `https` = 443) |
| path | `/laptops/5` | ของที่ขอ |
| query | `?status=rented&page=2` | ตัวเลือก คู่ `ชื่อ=ค่า` คั่นด้วย `&` |

**Path param กับ Query param ต่างกันยังไง**

| | Path param | Query param |
|---|---|---|
| หน้าตา | `/laptops/5` | `/laptops?status=rented` |
| ใช้บอก | **"ตัวไหน"** (ระบุสิ่งของ 1 ชิ้น) | **"แบบไหน"** (กรอง เรียง แบ่งหน้า) |
| จำเป็นไหม | จำเป็น ไม่มีก็คนละ URL | ไม่ใส่ก็ได้ ใช้ค่าเริ่มต้น |
| ตัวอย่าง | `GET /customers/3` | `GET /laptops?brand=Dell&page=2` |

> ⚠️ ตัวอักษรพิเศษและภาษาไทยใน URL ต้อง "เข้ารหัส" (เช่น ช่องว่างเป็น `%20`) เครื่องมืออย่าง `fetch` หรือ `URLSearchParams` ทำให้เอง อย่านำข้อความมาต่อสตริง URL เองโดยไม่เข้ารหัส

### JSON: รูปแบบข้อมูลที่ API ใช้ส่งกัน

**JSON** คือข้อความที่จัดรูปแบบให้ทุกภาษาโปรแกรมอ่านออก หน้าตาเหมือน object ของ JavaScript แต่ **เข้มงวดกว่า**
```json
{
  "id": 7,
  "brand": "Lenovo",
  "available": true,
  "note": null,
  "tags": ["pos", "rental"],
  "spec": { "ramGb": 16 }
}
```
| ชนิด | ตัวอย่าง |
|---|---|
| ข้อความ | `"Lenovo"` (ต้องใช้ **ฟันหนู `"` เท่านั้น**) |
| ตัวเลข | `7`, `3.14` |
| จริง/เท็จ | `true`, `false` |
| ไม่มีค่า | `null` |
| array | `["a", "b"]` |
| object | `{ "ramGb": 16 }` |

**กฎที่ทำให้ JSON พังบ่อยที่สุด:** ชื่อ key ต้องมี `"` ครอบ · ห้ามใช้ `'` · ห้ามมี comma ท้ายสุด (`[1, 2,]` ผิด) · ห้ามมี comment · `undefined` ไม่มีใน JSON

ลองดูตอนมันพัง (รัน `node -e` ใน Terminal ได้เลย):
```bash
node -e 'JSON.parse("{brand: \"Lenovo\"}")'
```
**ควรเห็น** (ข้อความอาจต่างเล็กน้อยตามเวอร์ชัน Node)
```
SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)
```
ที่บอกว่า `position 1` เพราะ `brand` ไม่มี `"` ครอบ

### Headers ที่ต้องรู้จัก

Headers คือ "หมายเหตุหน้าใบสั่ง" เป็นคู่ `ชื่อ: ค่า`

| Header | ใช้ใน | บอกอะไร |
|---|---|---|
| `Content-Type` | request/response | **body นี้เป็นชนิดอะไร** เช่น `application/json` (JSON), `text/html`, `multipart/form-data` (อัปโหลดไฟล์) |
| `Accept` | request | client อยากได้ชนิดไหนกลับ เช่น `application/json` |
| `Authorization` | request | บัตรประจำตัว เช่น `Bearer eyJhbGci...` (token) |
| `Cookie` / `Set-Cookie` | request / response | ให้ server ฝากข้อมูลไว้ที่เบราว์เซอร์ แล้วเบราว์เซอร์ส่งกลับมาเองทุกครั้ง |
| `Access-Control-Allow-Origin` | response | อนุญาตเว็บอื่นเรียก API นี้จากเบราว์เซอร์ (CORS ดูหัวข้อ 7) |
| `Content-Length` | ทั้งคู่ | body ยาวกี่ byte |

> 💡 **ข้อเดียวที่มือใหม่พลาดบ่อยที่สุด:** ส่ง JSON ต้องใส่ `Content-Type: application/json` เสมอ ไม่งั้น server ไม่รู้ว่าต้องอ่าน body เป็น JSON (ลองดูในหัวข้อ "ลองพังมันดู")

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

### สองคำที่ควรรู้: Safe และ Idempotent

![ตารางแสดงว่า method ไหน safe และ idempotent](/img/05-methods-safety.svg)
*Safe = เรียกแล้วไม่เปลี่ยนข้อมูล · Idempotent = เรียกซ้ำกี่ครั้งผลสุดท้ายเท่ากับเรียกครั้งเดียว*

- **Safe (ปลอดภัย):** แค่ดู ไม่เปลี่ยนอะไร → `GET`
- **Idempotent (ยิงซ้ำผลเท่าเดิม):** `DELETE /laptops/5` สองครั้ง เครื่อง 5 ก็หายอยู่ดี (ครั้งที่สองอาจได้ `404` แต่ข้อมูลสุดท้ายเหมือนกัน) · `PUT` ใส่ค่าเดิมซ้ำก็ได้ผลเดิม
- **`POST` ไม่ idempotent:** ยิงสองครั้งได้ของใหม่สองชิ้น! นี่คือเหตุผลที่ปุ่ม "สั่งซื้อ" ควรถูกปิดหลังกดครั้งแรก ไม่งั้นเน็ตช้าแล้วลูกค้ากดซ้ำ จะได้ออเดอร์ซ้ำ
- **`PATCH`:** ขึ้นกับวิธีเขียน ("ตั้งสถานะเป็น rented" ซ้ำได้ผลเดิม แต่ "เพิ่มจำนวน +1" ซ้ำไม่ได้ผลเดิม)

> 💡 **ทำไมต้องสนใจ?** เน็ตหลุดกลางทางแล้วระบบ/ผู้ใช้ "ลองใหม่" ถ้าเป็น method ที่ idempotent ก็ลองใหม่ได้ปลอดภัย ส่วน `POST` ต้องระวังเป็นพิเศษ

**PUT ต่างจาก PATCH ยังไง:** `PUT` = ส่งข้อมูล **ครบทั้งก้อน** ไปแทนของเดิม (ช่องที่ไม่ส่ง = หาย) · `PATCH` = ส่ง **เฉพาะช่องที่จะแก้** ส่วนใหญ่ในงานจริงใช้ `PATCH`

---

## 3. Status code: บอกผลลัพธ์

จำแค่หลักแรกก่อน:

![กลุ่มของ HTTP status code 2xx 3xx 4xx 5xx](/img/05-status-families.svg)
*เห็นเลขขึ้นต้นด้วยอะไร ก็รู้ทันทีว่าใครต้องแก้*

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

### เลือก status ยังไง: ถามตัวเองตามลำดับ

| คำถาม | ตอบ |
|---|---|
| สำเร็จไหม? | `200` ดู/แก้ · `201` สร้างใหม่ · `204` สำเร็จแต่ไม่มีอะไรให้ส่งกลับ (เช่น ลบ) |
| client ส่งมาผิดรูป/ข้อมูลไม่ครบ? | `400` (เช่น JSON พัง, ลืมช่อง, อีเมลไม่ถูกรูปแบบ) |
| ไม่ได้ login? | `401` |
| login แล้วแต่ไม่มีสิทธิ์? | `403` |
| ไม่มีของที่ขอ? | `404` |
| ของมีอยู่ แต่ทำตามสั่งไม่ได้เพราะสถานะตอนนี้? | `409` (เช่น เช่าเครื่องที่ถูกเช่าอยู่) |
| ขอถี่เกินไป? | `429 Too Many Requests` |
| ฝั่งเราเขียนพลาด/ฐานข้อมูลล่ม? | `500` (หรือ `502`/`503` ถ้า server หลังบ้านไม่พร้อม) |

> 💡 **`400` กับ `422` ต่างกันยังไง?** `400` = ส่งมาผิดรูป (อ่านไม่ออก) · `422 Unprocessable Content` = อ่านออก แต่ข้อมูลไม่ผ่านกติกา (เช่น ราคาติดลบ) บางทีมแยกใช้ทั้งสองตัว **ทีมเราใช้ `400` ทั้งสองกรณี** (ให้ `details` บอกว่าช่องไหนผิด) เพื่อให้จำง่าย ขอแค่ทุก endpoint ทำเหมือนกัน

> ⚠️ **ห้ามส่ง `200` แล้วเขียนว่า `"success": false`** แบบเรื่องเล่าของบิต เพราะระบบกลาง เช่น monitor, cache, หน้าเว็บ ดูแค่เลข status

> 🤓 **เกร็ด:** มีเว็บ **[http.cat](https://http.cat)** ที่ทำรูปแมวประกอบทุก status code 🐱 และมี code `418 I'm a teapot` จริงๆ เกิดจากมุกวันเมษาหน้าโง่ปี 1998

---

## 4. REST: วิธีตั้งชื่อ endpoint ให้ทุกคนเดาได้

**REST** คือแนวทางออกแบบ API ที่นิยมที่สุด หลักง่ายๆ คือ **URL เป็นคำนาม (สิ่งของ) ส่วน method เป็นคำกริยา**

![แผนที่ REST: URL เป็นคำนาม method เป็นคำกริยา](/img/05-rest-map.svg)
*มี 2 ระดับหลัก: ทั้งกอง `/laptops` และชิ้นเดียว `/laptops/5` แต่ละระดับใช้ method ต่างกัน*

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

### Versioning: เปลี่ยน API โดยไม่ทำให้แอปเก่าพัง

แอปมือถือที่ลูกค้าติดตั้งไว้แล้วอัปเดตไม่พร้อมกัน ถ้าเราเปลี่ยนหน้าตา response แอปเก่าจะพัง วิธีที่นิยมคือ **ใส่เลขเวอร์ชันใน path**
```
GET /api/v1/laptops     ← แอปรุ่นเก่ายังใช้อยู่
GET /api/v2/laptops     ← รุ่นใหม่ เปลี่ยน response ได้
```
- เพิ่มช่องใหม่ใน response = ไม่ถือว่าทำลาย ไม่ต้องขึ้นเวอร์ชัน
- **ลบ/เปลี่ยนชื่อ/เปลี่ยนชนิด** ช่องเดิม = ต้องขึ้น `v2`
- งานเล็กที่มี client ของเราเองเจ้าเดียว (เช่น เว็บ + API ที่ deploy พร้อมกัน) เริ่มที่ `/api` เฉยๆ ก็พอ แต่ควรรู้แนวคิดนี้ไว้

### กรอง เรียง และแบ่งหน้า (filtering / sorting / pagination)

ถ้ามี 10,000 เครื่อง อย่าส่งกลับทั้งหมดในครั้งเดียว ให้ client บอกผ่าน query
```
GET /laptops?status=available                 ← กรอง
GET /laptops?sort=ramGb&order=desc            ← เรียง
GET /laptops?page=2&limit=20                  ← แบ่งหน้า: หน้าที่ 2 หน้าละ 20 รายการ
```
และ response ควรบอกข้อมูลสำหรับทำปุ่ม "หน้าถัดไป" ด้วย:
```json
{
  "items": [ { "id": 3, "brand": "B3", "status": "available" } ],
  "page": 1,
  "limit": 2,
  "total": 3
}
```
(ถ้าข้อมูลถูกเพิ่มบ่อยมากๆ มีวิธีขั้นสูงกว่า เรียก cursor pagination ตอนนี้รู้แค่ `page`/`limit` ก็พอ)

### รูปแบบ error ให้เหมือนกันทุก endpoint

client เขียนโค้ดจัดการ error ง่ายขึ้นมาก ถ้า error ทุกตัวหน้าตาเหมือนกัน เช่น
```json
{
  "error": "ข้อมูลไม่ถูกต้อง",
  "details": [ { "path": ["brand"], "message": "Too small: expected string to have >=1 characters" } ]
}
```
- `error` = ข้อความสั้นๆ ที่คนอ่านได้
- `details` = (ถ้ามี) บอกว่าช่องไหนผิดเพราะอะไร
- **ห้ามส่งรายละเอียดภายใน** เช่น stack trace, ข้อความ SQL, path ของไฟล์ ออกไปให้ client เก็บไว้ที่ log ฝั่ง server (บทที่ 10, 14)

> 💡 หน้าตาจะเป็นแบบไหนก็ได้ ขอแค่ **ทั้งระบบใช้แบบเดียวกัน** (บทที่ 14 ใช้โครงที่ห่อชั้นนอกเป็น `{ success, error: { code, message, details } }` ซึ่งใช้หลักคิดเดียวกัน) และต้องส่ง **status code ที่ถูกต้องควบคู่เสมอ**

---

## 5. 🔧 ลงมือ: สร้าง Laptop API

**ขั้นที่ 1: เตรียมโปรเจกต์**
```bash
mkdir laptop-api && cd laptop-api
npm init -y
npm install express zod
npm install -D typescript tsx @types/node @types/express
```
ใส่ `tsconfig.json`, `"type": "module"` และ `scripts` ตาม [บทที่ 4 ข้อ 3](./04-typescript.md)

**ขั้นที่ 2: เขียน `src/index.ts`**
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
อ่านโค้ดทีละส่วน:
- `app.get("/laptops/:id", ...)` : `:id` คือ **path param** ค่าที่ส่งมาอยู่ใน `req.params.id` (เป็นข้อความเสมอ จึงต้อง `Number(...)`)
- `req.body` คือ body ที่ client ส่งมา ต้องผ่าน `express.json()` ก่อนถึงจะเป็น object
- `safeParse` คือ Zod ตรวจ body ([บทที่ 4 ข้อ 5](./04-typescript.md)) ผิดก็ตอบ `400`
- ทุกจุดที่ตอบเสร็จใช้ `return;` เพื่อไม่ให้โค้ดตอบซ้ำสองรอบ

**ขั้นที่ 3: รัน**
```bash
npm run dev
```
**ควรเห็น**
```
🚀 API on http://localhost:3000
```
เปิด http://localhost:3000/health → `{"status":"ok"}` ✅

### ทดสอบด้วยไฟล์ `.http` (แนะนำ)
ติดตั้ง extension **REST Client** ใน VS Code แล้วสร้าง `requests.http`:
```http
@baseUrl = http://localhost:3000

### ดูทั้งหมด
GET {{baseUrl}}/laptops

### เพิ่มเครื่อง
POST {{baseUrl}}/laptops
Content-Type: application/json

{ "brand": "Lenovo", "model": "T14", "serial": "PF-001" }

### เพิ่มแบบข้อมูลผิด (ควรได้ 400)
POST {{baseUrl}}/laptops
Content-Type: application/json

{ "brand": "" }

### หาเครื่องที่ไม่มี (ควรได้ 404)
GET {{baseUrl}}/laptops/99

### ลบ (ควรได้ 204)
DELETE {{baseUrl}}/laptops/1
```
กดคำว่า **Send Request** ที่ขึ้นเหนือแต่ละ request ดูผลด้านขวา 👉 สังเกต status code ทุกครั้ง

- `###` คั่นระหว่าง request แต่ละอัน (และใช้เขียนชื่อได้)
- บรรทัด `@baseUrl = ...` คือตัวแปร เรียกใช้ด้วย `{{baseUrl}}` ตอนย้ายไปทดสอบ server จริง แก้ที่เดียว
- เว้น **บรรทัดว่าง** ระหว่าง headers กับ body (เหมือนโครงสร้าง HTTP ที่เห็นข้างบน)

**ควรเห็น** (ตอนกด Send ที่ "เพิ่มเครื่อง") ฝั่งขวาแสดง
```
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
...
{
  "id": 1,
  "status": "available",
  "brand": "Lenovo",
  "model": "T14",
  "serial": "PF-001"
}
```

### ทดสอบด้วย `curl` (ไม่ต้องลงอะไรเพิ่ม)

`curl` เป็นโปรแกรมใน Terminal ที่ส่ง request ได้ ใช้ได้ในเครื่อง server จริงที่ไม่มีหน้าจอด้วย
```bash
curl -i -s http://localhost:3000/laptops/99
```
(`-i` = แสดง status line และ headers ด้วย · `-s` = ซ่อนแถบความคืบหน้า)

**ควรเห็น** (บางบรรทัด เช่น `Date`, `ETag` จะต่างกัน)
```
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 57
...

{"error":"ไม่พบเครื่องนี้"}
```
สร้างเครื่องด้วย `POST`:
```bash
curl -s -X POST http://localhost:3000/laptops \
  -H "Content-Type: application/json" \
  -d '{"brand":"Lenovo","model":"T14","serial":"PF-001"}'
```
**ควรเห็น**
```
{"id":1,"status":"available","brand":"Lenovo","model":"T14","serial":"PF-001"}
```
| ตัวเลือก | ความหมาย |
|---|---|
| `-X POST` | เลือก method (ถ้าไม่ใส่ = `GET`) |
| `-H "ชื่อ: ค่า"` | ใส่ header (ใส่ได้หลายอัน) |
| `-d '...'` | ใส่ body |
| `-i` | แสดง status + headers ของ response |
| `-v` | แสดงทุกขั้นตอน (DNS, ต่อสาย, request, response) เหมาะตอนหาสาเหตุ |
| `-s -o /dev/null -w "%{http_code}\n"` | ไม่แสดง body แสดงแค่เลข status |

> 💡 ทางเลือกอื่น: **Postman**, **Bruno**, **Thunder Client** (extension ใน VS Code) ทำงานเหมือนกัน แค่คลิกแทนพิมพ์ ใช้ไฟล์ `.http` ได้เปรียบตรงที่ **เก็บใน Git ได้** ให้เพื่อนร่วมทีมรันตามได้

### ขั้นต่อยอด: ดัก route ที่ไม่มี และ error ที่หลุดมา

ตอนนี้ถ้าเรียก path ที่ไม่มี หรือ JSON พัง Express จะตอบเป็นหน้า **HTML** (ไม่ใช่ JSON) ซึ่งทำให้ client งง เพิ่มโค้ด 2 ชุดนี้ **ต่อท้ายสุดของไฟล์ ก่อน `app.listen`**
```ts
// ----- ท้ายสุด: จัดการ route ที่ไม่มี และ error ที่หลุดมา -----
app.use((_req, res) => {
  res.status(404).json({ error: "ไม่พบเส้นทางนี้" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof SyntaxError) {
    res.status(400).json({ error: "JSON ไม่ถูกต้อง" });   // body ที่ส่งมาไม่ใช่ JSON
    return;
  }
  console.error(err);                                     // รายละเอียดเก็บไว้ที่ log ไม่ส่งให้ client
  res.status(500).json({ error: "ระบบขัดข้อง ลองใหม่อีกครั้ง" });
});
```
ลองทดสอบ (ใช้ `PUT /laptops` ซึ่งเราไม่ได้ทำ และส่ง JSON พัง)
```bash
curl -s -i -X PUT http://localhost:3000/laptops | sed -n '1p;$p'
curl -s -i -X POST http://localhost:3000/laptops -H "Content-Type: application/json" -d '{brand: Lenovo}' | sed -n '1p;$p'
```
**ควรเห็น**
```
HTTP/1.1 404 Not Found
{"error":"ไม่พบเส้นทางนี้"}
HTTP/1.1 400 Bad Request
{"error":"JSON ไม่ถูกต้อง"}
```
> 💡 ฟังก์ชันที่มี **4 parameter** (`err, req, res, next`) คือ error handler ของ Express ต้องมีครบ 4 ตัวแม้ไม่ใช้ `next` ไม่งั้น Express ไม่รู้ว่าเป็นตัวจัดการ error

### 💥 ลองพังมันดู
รันคำสั่งเหล่านี้ (ก่อนเพิ่มโค้ดต่อยอดข้างบนก็ได้ จะเห็นว่าอะไรเปลี่ยน) แล้วดูว่า status และ body เป็นอะไร

**1. ส่ง body ที่ไม่ใช่ JSON**
```bash
curl -s -i -X POST http://localhost:3000/laptops -H "Content-Type: application/json" -d '{brand: Lenovo}'
```
ก่อนเพิ่มตัวดัก error จะได้ `HTTP/1.1 400 Bad Request` พร้อมหน้า **HTML** มี `SyntaxError: Expected property name or '}' in JSON at position 1 ...` (ซึ่งรั่วชื่อไฟล์ในเครื่อง server ออกมาด้วย จึงควรดักแบบข้างบน)

**2. ลืมใส่ `Content-Type: application/json`**
```bash
curl -s -i -X POST http://localhost:3000/laptops -d '{"brand":"A","model":"B","serial":"C"}'
```
**ควรเห็น**
```
HTTP/1.1 400 Bad Request
...
{"error":"ข้อมูลไม่ถูกต้อง","details":[{"expected":"object","code":"invalid_type","path":[],"message":"Invalid input: expected object, received undefined"}]}
```
(`curl -d` ใส่ `Content-Type: application/x-www-form-urlencoded` ให้เอง `express.json()` จึงไม่อ่าน body ทำให้ `req.body` เป็น `undefined`)

**3. ส่ง `serial` เป็นตัวเลข**
```bash
curl -s -X POST http://localhost:3000/laptops -H "Content-Type: application/json" -d '{"brand":"A","model":"B","serial":123}'
```
**ควรเห็น**
```
{"error":"ข้อมูลไม่ถูกต้อง","details":[{"expected":"string","code":"invalid_type","path":["serial"],"message":"Invalid input: expected string, received number"}]}
```
**4. ปิด server (Ctrl+C) แล้วเรียกอีกครั้ง**
```bash
curl http://localhost:3000/laptops
```
**ควรเห็น**
```
curl: (7) Failed to connect to localhost port 3000 after 1 ms: Couldn't connect to server
```
นี่คือ "ไม่มีใครรอรับสายอยู่" ไม่ใช่ error ของโค้ดเรา (ใน Node จะเห็นเป็น `ECONNREFUSED`)

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
ทดสอบ: `curl http://localhost:3000/health` ต้องได้ `{"status":"ok"}`

> 💡 **ทำไม COPY `package.json` ก่อนโค้ด?** Docker จำ (cache) แต่ละชั้นไว้ เราแก้โค้ดบ่อย แต่เพิ่ม package นานๆ ครั้ง แยกแบบนี้ตอนแก้โค้ด Docker จะข้าม `npm ci` (ขั้นที่ช้าที่สุด) build เร็วขึ้นมาก

> 💡 **ทำไมแบ่ง 2 ขั้น (multi-stage)?** ขั้นแรกต้องใช้ TypeScript และเครื่องมือ dev แต่ตอนรันไม่ต้องใช้ หยิบเฉพาะ `dist/` ไปใส่กล่องใหม่ image เล็กและปลอดภัยกว่า

---

## 7. CORS และ Cookie/Token: ของที่เบราว์เซอร์เกี่ยวข้อง

### CORS อธิบายแบบง่าย

ลองนึกภาพ: หน้าเว็บของเรา (`localhost:5173`) พยายามเรียก API ที่อยู่ `localhost:3000` เบราว์เซอร์ถือว่านี่คือ **"คนละเว็บ" (คนละ origin)** (origin = โปรโตคอล + โดเมน + port) เพื่อป้องกันเว็บแปลกปลอมแอบเรียก API ของธนาคารด้วยบัญชีของคุณ เบราว์เซอร์จึง **"ถามก่อน"**

![ลำดับ CORS preflight: เบราว์เซอร์ส่ง OPTIONS ถามก่อน server ตอบอนุญาต แล้วจึงส่งคำขอจริง](/img/05-cors-preflight.svg)
*เบราว์เซอร์ส่ง OPTIONS (preflight) ถามก่อน server ตอบ header อนุญาต เบราว์เซอร์จึงส่งคำขอจริง*

- **CORS (Cross-Origin Resource Sharing)** = กติกาที่ **server** บอกเบราว์เซอร์ว่า "เว็บ origin ไหนเรียกฉันได้" ผ่าน header `Access-Control-Allow-Origin`
- **คนที่บล็อกคือเบราว์เซอร์** ไม่ใช่ server (curl, Postman, แอปมือถือ ไม่มีเรื่อง CORS)
- **ที่แก้คือฝั่ง server** (ใส่ header) ไม่ใช่ฝั่งหน้าเว็บ ห้ามแก้ด้วยการปิดความปลอดภัยของเบราว์เซอร์หรือใส่ `*` ทุกที่ (อนุญาตให้ทุกเว็บ) ในงานจริงที่มี login (ดู [บทที่ 10](./10-security.md))

ลองดู header ที่ server ตอบตอนเบราว์เซอร์ถาม preflight (ตัวอย่างเขียน middleware เองให้เห็นกลไก งานจริงใช้ library เช่น `cors` ของ Express หรือ middleware ของ Hono ใน [บทที่ 14](./14-hono-api.md))
```ts
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }   // ตอบ preflight
  next();
});
```
```bash
curl -s -i -X OPTIONS http://localhost:3000/laptops \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```
**ควรเห็น**
```
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,PATCH,DELETE
Access-Control-Allow-Headers: Content-Type,Authorization
...
```
> 💡 ใน dev ที่หน้าเว็บกับ API คนละ port วิธีที่ง่ายกว่าคือให้ dev server ของหน้าเว็บ **proxy** `/api` ไปหา API ทำให้เบราว์เซอร์เห็นเป็น origin เดียวกัน (บทที่ 14)

### Cookie กับ Token (พรีวิว)

HTTP ไม่จำว่าคุณคือใคร จึงต้องแนบ "บัตร" ไปกับทุก request มี 2 แบบหลัก

| | Cookie | Token (เช่น JWT) |
|---|---|---|
| เก็บที่ | เบราว์เซอร์เก็บให้อัตโนมัติ | โค้ดฝั่ง client เก็บเอง |
| ส่งยังไง | เบราว์เซอร์แนบ header `Cookie` ให้เอง | โค้ดใส่ header `Authorization: Bearer ...` เอง |
| server ตั้งค่าด้วย | header `Set-Cookie` | ส่ง token กลับใน body |
| ใช้เด่นกับ | เว็บในเบราว์เซอร์ | API ที่มีหลาย client (มือถือ ฯลฯ) |
| ระวัง | CSRF, ต้องตั้ง `HttpOnly`/`Secure` | ถ้าเก็บผิดที่โดนขโมยได้ (XSS) |

รายละเอียดการทำ login จริงอยู่ใน [บทที่ 15](./15-auth.md) ตอนนี้จำแค่ว่า **บัตรเดินทางผ่าน header**

---

## 8. 📚 อ่านเอกสาร API ให้เป็น

เวลาต้องเรียก API ของคนอื่น (เช่น ระบบชำระเงิน, แผนที่) เปิดเอกสารแล้วหา 6 อย่างนี้ตามลำดับ

| หาอะไร | ตัวอย่าง |
|---|---|
| 1. **Base URL** | `https://api.example.com/v1` |
| 2. **การยืนยันตัวตน** | ใส่ `Authorization: Bearer <API_KEY>` (ขอ key ที่ไหน) |
| 3. **Endpoint ที่ต้องใช้** | `GET /laptops` , `POST /laptops` |
| 4. **Parameters** | path param, query param (อะไรจำเป็น/ไม่จำเป็น) |
| 5. **Request body** | ช่องไหนจำเป็น ชนิดอะไร ตัวอย่าง JSON |
| 6. **Response + error** | ตัวอย่างผลสำเร็จ และ status/รูปแบบ error ที่เป็นไปได้ |

**ทำตามนี้:** copy ตัวอย่าง `curl` ในเอกสารมาลองใน Terminal หรือแปลงเป็นไฟล์ `.http` ก่อน เห็นผลจริงแล้วค่อยเขียนโค้ด และมักมีเอกสารแบบ **OpenAPI/Swagger** ที่กด "Try it out" ลองยิงบนหน้าเว็บได้เลย

> ⚠️ **API key = รหัสผ่านของระบบ** ห้าม commit ลง Git (เก็บในไฟล์ `.env` ตาม [บทที่ 10](./10-security.md))

---

## 9. ⚠️ แก้ปัญหาที่เจอบ่อย

| อาการ | เกิดจากอะไร | วิธีแก้ |
|---|---|---|
| Console ในเบราว์เซอร์ขึ้น `blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource` | หน้าเว็บคนละ origin กับ API แต่ server ไม่บอกว่าอนุญาต | แก้ **ฝั่ง server** ให้ส่ง `Access-Control-Allow-Origin` (และตอบ `OPTIONS`) หรือใช้ proxy ตอน dev ดูหัวข้อ 7 |
| เรียกแล้วได้ `404` ทั้งที่ server รันอยู่ | URL/path ผิด (พิมพ์ผิด, ลืม `/api`, พหูพจน์) หรือไม่มี ID นั้นจริง | เช็คตัวสะกด · ดูว่า `404` มาจาก "ไม่มี route" (ข้อความ `Cannot GET /xxx`) หรือ "ไม่มีข้อมูล" (ข้อความของเราเอง) |
| ใช้ method ผิด เช่น `PUT /laptops` ได้ `404` (Express) หรือ `405 Method Not Allowed` (framework ที่รู้ว่า path มีแต่ไม่รับ method นั้น) | path ถูก แต่ไม่ได้เขียน handler ของ method นั้น | เพิ่ม handler ที่ method นั้น หรือเรียกด้วย method ที่ถูก (เช็ค header `Allow` ที่ server ตอบถ้ามี) |
| `415 Unsupported Media Type` | ส่ง body เป็นชนิดที่ server ไม่รับ (เช่น ส่งข้อความล้วนแต่ API รับ JSON) | ส่ง `Content-Type: application/json` พร้อม body เป็น JSON จริง · (Express ที่เราทำจะไม่ตอบ 415 แต่จะมอง body ว่าว่างแล้วตอบ `400`) |
| `400` พร้อม `details` | ข้อมูลที่ส่งผิดหรือไม่ครบ | อ่าน `details` ว่าช่องไหน (`path`) ผิดเพราะอะไร แล้วแก้ที่ client |
| `400` แต่ในทีมอื่นใช้ `422` | ข้อมูลอ่านออกแต่ผิดกติกา | ไม่ใช่บั๊ก แค่ตกลงกันในทีม ทีมเราใช้ `400` ทั้งสองกรณี |
| `401` / `403` | `401` ยังไม่ login/ token ผิดหรือหมดอายุ · `403` login แล้วแต่ไม่มีสิทธิ์ | เช็ค header `Authorization` ว่าส่งไปจริงและถูกต้อง · เช็คสิทธิ์ของบัญชี |
| `500 Internal Server Error` | โค้ด **server** พังระหว่างทำงาน (client ไม่ผิด) | เปิด **log ของ server** (ใน Terminal ที่รันอยู่) ดู error และ stack trace แล้วแก้โค้ด อย่าเดาจากฝั่ง client |
| `curl: (7) Failed to connect ...` / `ECONNREFUSED` | ไม่มี server รอที่ host:port นั้น (ยังไม่ได้รัน, port ผิด, ในคอนเทนเนอร์ไม่ได้ `-p`) | รัน server · เช็ค port · เช็ค `docker ps` ว่า map port แล้ว (ดู [บทที่ 17](./17-network.md)) |
| `SyntaxError: ... in JSON at position N` / `Unexpected token` | body ที่ส่ง (หรือที่ได้รับ) ไม่ใช่ JSON ที่ถูกต้อง | เช็คว่าชื่อ key มี `"` ครอบ ไม่มี comma ท้ายสุด ใช้ `"` ไม่ใช่ `'` · ถ้าได้รับกลับมาเป็น `<!DOCTYPE html>` แปลว่า server ตอบหน้า HTML (มักเป็น error page) ให้ดู status |
| `req.body` เป็น `undefined` | ลืม `app.use(express.json())` หรือ client ไม่ส่ง `Content-Type: application/json` | เพิ่ม middleware และใส่ header ให้ถูก |
| แก้โค้ดแล้ว API ยังตอบแบบเก่า | server ตัวเก่ายังรันอยู่ หรือเรียกผิด port | หยุดของเก่า (`Ctrl+C`) แล้วรันใหม่ · เช็ค port |

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

<details><summary>5. <code>/laptops/5</code> กับ <code>/laptops?status=rented</code> ส่วนที่ต่างกันเรียกว่าอะไร ใช้ต่างกันยังไง?</summary>

`5` คือ path param ใช้ระบุ "ตัวไหน" (ของชิ้นเดียว) ส่วน `status=rented` คือ query param ใช้ "กรอง/เรียง/แบ่งหน้า" ของกลุ่ม
</details>

<details><summary>6. <code>POST</code> กับ <code>PUT</code> ต่างกันเรื่อง idempotent ยังไง?</summary>

`PUT /laptops/5` ส่งซ้ำกี่ครั้งผลสุดท้ายเท่าเดิม (idempotent) ส่วน `POST /laptops` ส่งซ้ำ = สร้างเครื่องใหม่ซ้ำ จึงต้องระวังปุ่มที่ถูกกดซ้ำ
</details>

<details><summary>7. เบราว์เซอร์ฟ้อง CORS error แต่เรียกด้วย curl ได้ปกติ แปลว่าอะไร และต้องแก้ที่ไหน?</summary>

server ทำงานปกติ แต่ไม่ได้ส่ง `Access-Control-Allow-Origin` ที่อนุญาต origin ของหน้าเว็บ เบราว์เซอร์เป็นตัวบล็อก (curl ไม่มีกลไกนี้) ต้องแก้ที่ **server** ให้ส่ง header นั้น (หรือใช้ proxy ตอน dev)
</details>

<details><summary>8. ส่ง JSON ไปแต่ <code>req.body</code> เป็น <code>undefined</code> ตรวจอะไรเป็นอย่างแรก?</summary>

เช็คว่ามี `app.use(express.json())` และ client ส่ง header `Content-Type: application/json` ครบหรือไม่
</details>

---

## ✏️ แบบฝึกหัด

เพิ่ม `PATCH /laptops/:id` (แก้ brand/model ได้บาง field ใช้ `LaptopInput.partial()`) และ `GET /laptops?status=available` ทดสอบด้วยไฟล์ `.http` ให้ครบทั้งกรณีสำเร็จและกรณี error

เพิ่มเติม (ถ้าอยากไปไกลกว่านี้)
- เพิ่ม `?page=` และ `?limit=` ให้ `GET /laptops` แล้วตอบรูปแบบ `{ items, page, limit, total }`
- ให้ทุก error ใช้รูปแบบ `{ error, details? }` เหมือนกัน (รวม 404 ของ route ที่ไม่มี และ 500)
- เขียนไฟล์ `.http` ที่เก็บ request ทุกแบบรวมถึง `@baseUrl` และกรณีพัง เช่น JSON ผิด, ลืม `Content-Type`

## ✅ ผ่านด่าน

- [ ] อธิบายส่วนประกอบของ request/response ได้ (start line, headers, body)
- [ ] อธิบายส่วนประกอบของ URL, path param และ query param ได้
- [ ] เลือก method และ status code ได้ถูก รู้ว่า `GET` ห้ามเปลี่ยนข้อมูล
- [ ] ตั้งชื่อ endpoint แบบ REST ได้ และตอบ error รูปแบบเดียวกัน
- [ ] อธิบาย CORS ด้วยคำพูดง่ายๆ ได้ ว่าใครบล็อก และแก้ที่ไหน
- [ ] ทดสอบ API ด้วย `.http` หรือ `curl` ได้
- [ ] สร้าง API ด้วย TS + Zod และรันใน Docker ได้

---

[← บทที่ 4: TypeScript](./04-typescript.md) · [🏠 สารบัญ](/) · [บทที่ 6: SQL vs NoSQL →](./06-sql-nosql.md)
