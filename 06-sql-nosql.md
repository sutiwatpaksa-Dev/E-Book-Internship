# บทที่ 6: SQL vs NoSQL 🗄️

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 2 · 🛠 ใช้: Docker, PostgreSQL, MongoDB

> **⚡ สรุป 30 วินาที**
> - **SQL** เก็บเป็นตารางที่เชื่อมกันด้วย key มีกฎเข้ม ไว้ใจได้เรื่องเงิน (ACID)
> - **NoSQL** ไม่ใช่ตาราง มีหลายแบบ (document, key-value ฯลฯ) ยืดหยุ่นและขยายง่าย
> - คำสั่ง SQL หลัก: `SELECT` `INSERT` `UPDATE` `DELETE` `JOIN` `GROUP BY`
> - งานหลายขั้นที่ต้องสำเร็จพร้อมกัน ใช้ **transaction**
> - ไม่แน่ใจ → **เริ่มที่ SQL (PostgreSQL)**

---

## 📖 เรื่องเล่า

ร้านเช่าโน้ตบุ๊คของลูกค้าเคยใช้ Excel ไฟล์เดียว พนักงาน 3 คนเปิดแก้พร้อมกัน
วันหนึ่งเครื่อง Lenovo T14 **ถูกปล่อยเช่าให้ลูกค้า 2 คนในวันเดียวกัน** เพราะต่างคนต่างเห็นว่า "ว่าง" 🙃
และพอลูกค้าเปลี่ยนเบอร์โทร ต้องตามแก้ 14 แถว แก้ไม่ครบ 2 แถว

พี่ไบต์บอกบิตว่า *"นี่ไม่ใช่ปัญหาของพนักงาน แต่เป็นงานที่ Excel ไม่ได้ถูกสร้างมาให้ทำ"*

---

## 1. ทำไมต้องมีฐานข้อมูล

เมื่อระบบจริงต้อง:
- ค้นข้อมูลหลักล้านแถวในเสี้ยววินาที ⚡
- ให้หลายคนบันทึกพร้อมกันโดยไม่ชน 👥
- กันข้อมูลผิด เช่น rental ของลูกค้าที่ไม่มีอยู่จริง 🛡️
- ไฟดับกลางทางแล้วข้อมูลไม่เสีย 🔌

นี่คืองานของ **Database** ซึ่งมี 2 ตระกูลใหญ่: **SQL** และ **NoSQL**

---

## 2. SQL (Relational Database)

เก็บเป็น **ตาราง** คล้าย Excel แต่ **มีกฎเข้มงวด** และ **ตารางเชื่อมกันได้**

| คำ | ความหมาย | 💡 เทียบ Excel |
|---|---|---|
| **Table** | ตารางเก็บเรื่องเดียวกัน | 1 sheet |
| **Row** | 1 รายการ | 1 แถว |
| **Column** | คุณสมบัติ มีชนิดข้อมูลกำหนด | 1 คอลัมน์ (แต่ใส่มั่วไม่ได้) |
| **Schema** | โครงสร้าง: ตารางอะไร คอลัมน์อะไร ชนิดอะไร | หัวตารางที่ล็อกไว้ |
| **Primary Key (PK)** | คอลัมน์ระบุแถวแบบไม่ซ้ำ | เลขบัตรประชาชน 🪪 |
| **Foreign Key (FK)** | คอลัมน์ที่ชี้ไป PK ของอีกตาราง | การอ้างอิงเลขบัตรของคนอื่น |

**ตัวอย่าง: ร้านเช่าโน้ตบุ๊ค**

`customers`
| id (PK) | name | phone |
|---|---|---|
| 1 | สมชาย | 081-111-1111 |
| 2 | สมหญิง | 082-222-2222 |
| 3 | มานี | 083-333-3333 |

`rentals`
| id (PK) | customer_id (FK) | laptop | price_per_month |
|---|---|---|---|
| 1 | 1 | Lenovo T14 | 1500 |
| 2 | 1 | Dell 5420 | 1200 |
| 3 | 2 | HP 840 | 1300 |

`customer_id` ชี้ไปที่ `customers.id` → สมชายเช่า 2 เครื่อง สมหญิง 1 เครื่อง มานียังไม่เคยเช่า

> 💡 **ทำไมไม่เขียนชื่อลูกค้าซ้ำลงใน rentals เลย?**
> เพราะพอเปลี่ยนเบอร์ต้องตามแก้ทุกแถว (ปัญหาในเรื่องเล่า!) การเก็บแต่ละเรื่องไว้ **ที่เดียว** แล้วอ้างอิงกัน เรียกว่า **Normalization**
> และ FK ยังกันไม่ให้สร้าง rental ของลูกค้า id 99 ที่ไม่มีจริง

**ความสัมพันธ์ 3 แบบ**
| แบบ | ตัวอย่าง |
|---|---|
| **1 : 1** | คน 1 คน ↔ บัตรประชาชน 1 ใบ |
| **1 : N** ⭐ เจอบ่อยสุด | ลูกค้า 1 คน → หลาย rental |
| **N : M** | ออเดอร์มีหลายสินค้า สินค้าอยู่ในหลายออเดอร์ → ต้องมีตารางกลาง `order_items` |

---

## 3. 🔧 ลงมือ: SQL พื้นฐาน

```bash
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:17
docker exec -it pg psql -U postgres
```
(คำสั่ง psql: `\dt` ดูตาราง · `\d ชื่อตาราง` ดูโครงสร้าง · `\q` ออก)
> 💡 ไม่ถนัด Terminal? ใช้ Adminer จาก [บทที่ 2](./02-docker.md) หรือโปรแกรม **DBeaver** ได้

### CREATE: สร้างตาราง
```sql
CREATE TABLE customers (
  id    SERIAL PRIMARY KEY,           -- เลขรันอัตโนมัติ 1, 2, 3...
  name  TEXT NOT NULL,                -- ห้ามว่าง
  phone TEXT UNIQUE                   -- ห้ามซ้ำ
);

CREATE TABLE rentals (
  id              SERIAL PRIMARY KEY,
  customer_id     INT NOT NULL REFERENCES customers(id),   -- FK
  laptop          TEXT NOT NULL,
  price_per_month INT NOT NULL CHECK (price_per_month > 0) -- กฎเพิ่มเติม
);
```

### INSERT: เพิ่มข้อมูล
```sql
INSERT INTO customers (name, phone) VALUES
  ('สมชาย', '081-111-1111'), ('สมหญิง', '082-222-2222'), ('มานี', '083-333-3333');

INSERT INTO rentals (customer_id, laptop, price_per_month) VALUES
  (1, 'Lenovo T14', 1500), (1, 'Dell 5420', 1200), (2, 'HP 840', 1300);
```

**ลองทำผิดกฎ** 💥
```sql
INSERT INTO rentals (customer_id, laptop, price_per_month) VALUES (99, 'Mac', 2000);
-- ERROR: ... violates foreign key constraint
INSERT INTO rentals (customer_id, laptop, price_per_month) VALUES (1, 'Mac', -5);
-- ERROR: ... violates check constraint
```
ฐานข้อมูล **ปฏิเสธข้อมูลผิดให้เอง** 🛡️ นี่คือจุดแข็งใหญ่ของ SQL

### SELECT: ดึงข้อมูล
```sql
SELECT * FROM customers;
SELECT name, phone FROM customers WHERE id = 1;
SELECT * FROM rentals WHERE price_per_month >= 1300 ORDER BY price_per_month DESC;
SELECT * FROM customers WHERE name LIKE 'สม%';      -- ขึ้นต้นด้วย "สม"
```

### UPDATE / DELETE
```sql
UPDATE customers SET phone = '089-999-9999' WHERE id = 1;
DELETE FROM rentals WHERE id = 2;
```
> ⚠️ **ห้ามลืม `WHERE`!** ไม่มี WHERE = **แก้/ลบทุกแถว** มีคนทำ production พังด้วยเรื่องนี้มานับไม่ถ้วน 💀
> 💡 ทริค: เขียน `SELECT * FROM ... WHERE ...` ดูก่อนว่าได้แถวที่ต้องการ แล้วค่อยเปลี่ยนเป็น UPDATE/DELETE

### JOIN: รวมหลายตาราง
```sql
SELECT c.name, r.laptop, r.price_per_month
FROM rentals r
JOIN customers c ON c.id = r.customer_id;
```
| name | laptop | price_per_month |
|---|---|---|
| สมชาย | Lenovo T14 | 1500 |
| สมหญิง | HP 840 | 1300 |

- `JOIN` = เอาเฉพาะแถวที่จับคู่ได้
- `LEFT JOIN` = เอาทุกแถวจากตารางซ้าย แม้ไม่มีคู่

```sql
-- ลูกค้าที่ยังไม่เคยเช่า
SELECT c.name
FROM customers c
LEFT JOIN rentals r ON r.customer_id = c.id
WHERE r.id IS NULL;                -- ได้ "มานี"
```

### GROUP BY: สรุปผล
```sql
SELECT c.name, COUNT(r.id) AS total_rentals, SUM(r.price_per_month) AS total_price
FROM customers c
LEFT JOIN rentals r ON r.customer_id = c.id
GROUP BY c.id, c.name;     -- ใส่ id ด้วย เพราะลูกค้าชื่อซ้ำกันได้ (สมชาย 2 คน ต้องไม่ถูกรวมเป็นคนเดียว)
```

> 🎮 อยากฝึกเพิ่มแบบเกม? ลอง **[SQLBolt](https://sqlbolt.com)** (ฝึกในเว็บทีละด่าน) หรือ **[SQL Murder Mystery](https://mystery.knightlab.com)** (ใช้ SQL สืบหาฆาตกร 🕵️)

---

## 4. Transaction และ ACID: ทำไม SQL ไว้ใจได้เรื่องเงิน

**สถานการณ์:** ลูกค้าเช่าเครื่อง ระบบต้องทำ 2 อย่าง
1. สร้างรายการเช่า
2. เปลี่ยนสถานะเครื่องเป็น "ถูกเช่า"

ถ้าทำข้อ 1 แล้ว **ไฟดับก่อนข้อ 2** → มีรายการเช่า แต่เครื่องยังโชว์ว่าว่าง → ข้อมูลขัดกันเอง

เพิ่มตารางเครื่องก่อน (ตัวอย่างนี้ใช้ต่อจากตารางในข้อ 3)
```sql
CREATE TABLE laptops (
  serial TEXT PRIMARY KEY,
  model  TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented'))
);
INSERT INTO laptops (serial, model) VALUES ('AS-01', 'Asus'), ('LN-01', 'Lenovo T14');
```

**Transaction** = มัดหลายคำสั่งเป็นก้อนเดียว **"สำเร็จทั้งหมด หรือไม่เกิดอะไรเลย"**
```sql
BEGIN;
  INSERT INTO rentals (customer_id, laptop, price_per_month) VALUES (3, 'AS-01', 1100);
  UPDATE laptops SET status = 'rented' WHERE serial = 'AS-01';
COMMIT;       -- ยืนยัน (มีอะไรผิดพลาด → ROLLBACK ยกเลิกทั้งหมด)
```

💥 **ลองพังมันดู:** ให้ขั้นที่ 2 ผิดกฎ แล้วดูว่าขั้นที่ 1 หายไปด้วยไหม
```sql
BEGIN;
  INSERT INTO rentals (customer_id, laptop, price_per_month) VALUES (1, 'LN-01', 1500);
  UPDATE laptops SET status = 'broken' WHERE serial = 'LN-01';   -- ERROR: violates check constraint
COMMIT;                                                          -- ได้ ROLLBACK แทน
SELECT count(*) FROM rentals WHERE laptop = 'LN-01';             -- 0: รายการเช่าก็ไม่ถูกบันทึก ✅
```

| | ชื่อ | ความหมาย | 💸 ตัวอย่างโอนเงิน A → B 500 บาท |
|---|---|---|---|
| **A** | Atomicity | ทั้งหมดหรือไม่มีเลย | หัก A แล้วต้องเพิ่ม B ห้ามหักแล้วเงินหาย |
| **C** | Consistency | ข้อมูลถูกกฎเสมอ | ยอดเงินห้ามติดลบ ผิดกฎ = ยกเลิก |
| **I** | Isolation | ทำพร้อมกันไม่ชน | กดโอน 2 เครื่องพร้อมกัน ต้องไม่หักซ้อน |
| **D** | Durability | บันทึกแล้วไม่หาย | COMMIT แล้วไฟดับ ข้อมูลยังอยู่ |

### ⚠️ 2 คนกดพร้อมกัน: transaction อย่างเดียวไม่พอ

ปัญหาในเรื่องเล่า (พนักงาน 2 คนปล่อยเช่าเครื่องเดียวกัน) **ไม่ใช่เรื่องไฟดับ** แต่เป็นเรื่อง **ทำพร้อมกัน**
```
 เวลา   พนักงาน A                          พนักงาน B
 10:00  ดู: AS-01 ว่าง ✅                    ดู: AS-01 ว่าง ✅
 10:01  เช่าให้ลูกค้า 1 (transaction ผ่าน)    เช่าให้ลูกค้า 2 (transaction ผ่าน)  😱
```
ทั้งสองคน "ดูแล้วว่าง" ก่อนอีกคนจะเปลี่ยนสถานะ แต่ละ transaction ถูกต้องในตัวเอง แต่ผลรวมผิด ต้องเพิ่มอย่างใดอย่างหนึ่ง:

**วิธีที่ 1: เปลี่ยนสถานะแบบมีเงื่อนไข** (ง่ายที่สุด แนะนำ)
```sql
UPDATE laptops SET status = 'rented' WHERE serial = 'AS-01' AND status = 'available';
-- UPDATE 1 = เราได้เครื่อง ทำขั้นต่อไป / UPDATE 0 = มีคนเช่าไปก่อนแล้ว → ROLLBACK แล้วบอกผู้ใช้
```
ฐานข้อมูลรับประกันว่าคำสั่งนี้ทำทีละคน คนที่สองจะได้ `UPDATE 0` เสมอ

**วิธีที่ 2: ล็อกแถวไว้ก่อน (`SELECT ... FOR UPDATE`)**
```sql
BEGIN;
  SELECT status FROM laptops WHERE serial = 'AS-01' FOR UPDATE;  -- คนที่สองต้องรอตรงนี้จนคนแรกเสร็จ
  -- ถ้าเป็น 'available' ค่อย INSERT rentals + UPDATE laptops
COMMIT;
```
🧪 ลองเปิด psql 2 หน้าต่าง พิมพ์ `BEGIN;` + `SELECT ... FOR UPDATE` ทั้งคู่ จะเห็นหน้าต่างที่สองค้างรอจนหน้าต่างแรก `COMMIT`

> 💡 **สรุป:** transaction กัน "ทำไม่ครบ" / เงื่อนไขหรือการล็อกกัน "ทำซ้อนกัน" ระบบจริงต้องใช้ทั้งสองอย่าง (บทที่ 8 ข้อ 6 ทำ transaction เดียวกันนี้ผ่าน Drizzle)

---

## 5. NoSQL

**NoSQL** ("Not only SQL") = ฐานข้อมูลที่ **ไม่ได้เก็บเป็นตาราง** เกิดมาเพื่องานที่ตารางไม่ถนัด

| ประเภท | เก็บแบบไหน | 💡 เปรียบเทียบ | ตัวอย่าง | ใช้กับ |
|---|---|---|---|---|
| **Document** | เอกสาร JSON | แฟ้ม 1 แฟ้มต่อ 1 เรื่อง 📁 | MongoDB, Firestore | ข้อมูลรูปร่างหลากหลาย |
| **Key-Value** | กุญแจ → ค่า | ตู้ล็อกเกอร์ รู้เลขตู้เปิดได้ทันที 🔑 | Redis | cache, session |
| **Wide-Column** | แถวที่คอลัมน์ไม่เท่ากัน | สมุดที่แต่ละหน้าจดไม่เหมือนกัน | Cassandra | IoT, log มหาศาล |
| **Graph** | จุดและเส้นเชื่อม | แผนผังความสัมพันธ์ 🕸️ | Neo4j | เครือข่ายเพื่อน, ระบบแนะนำ |

**ข้อมูลชุดเดียวกันในแบบ Document**
```json
{
  "_id": "665f...",
  "name": "สมชาย",
  "phone": "081-111-1111",
  "rentals": [
    { "laptop": "Lenovo T14", "pricePerMonth": 1500 },
    { "laptop": "Dell 5420",  "pricePerMonth": 1200 }
  ]
}
```
rental **ฝังอยู่ในเอกสารลูกค้าเลย (embed)** ดึงครั้งเดียวได้ครบ ไม่ต้อง JOIN

> 💡 **Embed หรือ Reference?**
> - **Embed:** ข้อมูลที่อ่านพร้อมกันเสมอและไม่โตไม่จำกัด เช่น ที่อยู่ลูกค้า
> - **Reference (เก็บแค่ id):** ข้อมูลที่ใช้หลายที่ หรือโตเรื่อยๆ เช่น ประวัติสั่งซื้อหลายพันรายการ

### 🔧 ลองเล่น MongoDB
```bash
docker run -d --name mongo -p 27017:27017 mongo:8
docker exec -it mongo mongosh
```
```js
use shop
db.customers.insertOne({ name: "สมชาย", rentals: [{ laptop: "Lenovo T14", pricePerMonth: 1500 }] })
db.customers.insertOne({ name: "มานี", vip: true })
db.customers.find()
db.customers.find({ "rentals.laptop": "Lenovo T14" })
```
(mongosh เป็นเครื่องมือทดลองที่พิมพ์แบบ JS ได้ ส่วนโค้ดในโปรเจกต์ยังต้องเป็น TypeScript)

สังเกต: "มานี" มี `vip` แต่ไม่มี `rentals` MongoDB ก็ยอม = **ยืดหยุ่น** 🤸
แต่ก็แปลว่า **พิมพ์ชื่อ field ผิดก็ยอมเหมือนกัน** 😬 ต้องตรวจข้อมูลเองในโค้ด (Zod!)

---

## 6. เปรียบเทียบ

| หัวข้อ | SQL | NoSQL |
|---|---|---|
| รูปแบบ | ตาราง | เอกสาร / key-value / graph ฯลฯ |
| Schema | ตายตัว ต้อง migrate เมื่อเปลี่ยน | ยืดหยุ่น เพิ่ม field ได้เลย |
| ความสัมพันธ์ | JOIN เก่งมาก | มัก embed ไว้ด้วยกัน |
| ความถูกต้อง | ACID เต็มรูปแบบ มี FK/CHECK ช่วย | หลายตัวเน้นความเร็ว ความถูกต้องเป็นหน้าที่โค้ดเรามากขึ้น |
| การขยาย | ส่วนใหญ่ขยายแนวตั้ง (เครื่องแรงขึ้น) | ออกแบบมาขยายแนวนอน (เพิ่มเครื่อง) |
| ภาษา query | SQL มาตรฐานเดียวกันเกือบทุกยี่ห้อ | แต่ละยี่ห้อมีวิธีของตัวเอง |
| เหมาะกับ | เงิน, สต็อก, POS, ERP, การจอง | cache, session, log, แชท |

> **แนวทางของทีม:** ไม่แน่ใจ **เริ่มที่ SQL (PostgreSQL)** งานลูกค้าส่วนใหญ่ข้อมูลสัมพันธ์กัน
> ระบบจริงมัก **ใช้ทั้งสองแบบร่วมกัน** เช่น PostgreSQL เก็บข้อมูลหลัก + Redis เป็น cache

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ระบบ POS ร้านค้า ควรใช้ SQL หรือ NoSQL?</summary>

SQL เพราะเกี่ยวกับเงินและสต็อก ต้องการ transaction/ACID และข้อมูลสัมพันธ์กันชัด (สินค้า, บิล, รายการในบิล)
</details>

<details><summary>2. เก็บ "สินค้าที่ดูล่าสุด 10 ชิ้น" ของผู้ใช้ ควรใช้อะไร?</summary>

Key-Value อย่าง Redis ต้องการความเร็ว ข้อมูลหายก็ไม่ร้ายแรง รูปแบบง่าย
</details>

<details><summary>3. ลืม WHERE ในคำสั่ง DELETE จะเกิดอะไร?</summary>

ลบทั้งตาราง 💀
</details>

---

## ✏️ แบบฝึกหัด

เพิ่มข้อมูลให้มีลูกค้า 5 คน rental 8 รายการ แล้วเขียน SQL 3 ข้อ ใน `queries.sql`:
1. ค่าเช่ารวมต่อเดือนของลูกค้าแต่ละคน
2. ลูกค้าที่ยังไม่เคยเช่า
3. เครื่องที่ค่าเช่าแพงที่สุด 3 อันดับ

## ✅ ผ่านด่าน

- [ ] อธิบาย PK / FK และความสัมพันธ์ 1:N ได้
- [ ] เขียน SELECT, INSERT, UPDATE, DELETE, JOIN, GROUP BY ได้
- [ ] อธิบาย transaction และ ACID ด้วยตัวอย่างได้
- [ ] เลือก SQL หรือ NoSQL ให้เหมาะกับงานได้

---

[← บทที่ 5: HTTP & API](./05-http-api.md) · [🏠 สารบัญ](/) · [บทที่ 7: MySQL vs PostgreSQL →](./07-mysql-postgres.md)
