# บทที่ 7: MySQL vs PostgreSQL 🐬🐘

> ⏱ ประมาณ 1.5 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 6 · 🛠 ใช้: Docker Compose

> **⚡ สรุป 30 วินาที**
> - ทั้งคู่เป็น **SQL** ใช้ภาษาเดียวกันเกือบหมด ความรู้ย้ายข้ามกันได้
> - **MySQL:** ง่าย แพร่หลาย ยืดหยุ่น · **PostgreSQL:** เคร่งครัด ฟีเจอร์ครบ ต่อยอดได้
> - ความต่างที่เจอในงานจริง: การแปลงชนิดข้อมูล, ตัวพิมพ์เล็กใหญ่, `RETURNING`, rollback การแก้ตาราง
> - โปรเจกต์ใหม่ใช้ **PostgreSQL** · ลูกค้ามี MySQL อยู่แล้ว ใช้ MySQL ได้เลย

---

## 📖 เรื่องเล่า

ทีมย้ายระบบเก่าของลูกค้าจาก MySQL มา PostgreSQL ทุกอย่างดูปกติ...
จนลูกค้าโทรมา *"พนักงานพิมพ์อีเมล `Somchai@mail.com` แล้ว login ไม่ได้ ทั้งที่เมื่อวานยังได้"* 🤔

ทั้งที่โค้ดไม่ได้เปลี่ยนสักบรรทัด อ่านจบบทนี้จะรู้ว่าเกิดจากอะไร (เฉลยในข้อ 2)

---

## 1. ภาพรวม

> 💡 **เปรียบเทียบ:** เหมือนรถ **Toyota กับ Honda** 🚗 ขับเหมือนกัน พวงมาลัย คันเร่ง เบรกอยู่ที่เดิม เปลี่ยนคันไม่ยาก แต่แต่ละยี่ห้อมีจุดเด่นและรายละเอียดต่างกัน

| | 🐬 MySQL | 🐘 PostgreSQL ("Postgres") |
|---|---|---|
| เจ้าของ | Oracle (มี MariaDB เป็น fork ที่ชุมชนดูแล) | ชุมชน open source ไม่มีบริษัทเจ้าของ |
| บุคลิก | ใช้ง่าย เร็ว แพร่หลาย | ครบเครื่อง เคร่งครัด ต่อยอดได้ |
| เห็นบ่อยที่ | WordPress, เว็บ PHP, ระบบเดิมจำนวนมาก | Startup ยุคใหม่, Supabase, Neon |

> 🤓 **เกร็ด:** MySQL ตั้งชื่อตาม **My** ลูกสาวของผู้สร้าง และต่อมาผู้สร้างคนเดิมแยกมาทำ **MariaDB** ตั้งชื่อตาม Maria ลูกสาวอีกคน 👧👧

---

## 2. ความต่างที่สำคัญ (ลองพิมพ์ดูจริงในข้อ 4)

### ① ความเคร่งครัดเรื่องชนิดข้อมูล
```sql
SELECT 'abc' = 0;
-- 🐬 MySQL:      1 (true!) แปลง 'abc' เป็นตัวเลขได้ 0 พร้อม warning
-- 🐘 PostgreSQL: ERROR: invalid input syntax for type integer: "abc"
```
💡 Postgres = ครูที่ไม่รับงานผิด format / MySQL = ครูที่พยายาม "เข้าใจที่จะสื่อ" ซึ่งบางทีก็เข้าใจผิด

### ② ตัวพิมพ์เล็กใหญ่ในการเทียบข้อความ
```sql
SELECT 'Somchai' = 'somchai';
-- 🐬 MySQL:      1 (ค่าตั้งต้นไม่สนตัวพิมพ์เล็กใหญ่)
-- 🐘 PostgreSQL: false (ต้องตรงทุกตัว ถ้าไม่สนให้ใช้ ILIKE หรือ lower())
```
🔍 **เฉลยเรื่องเล่า:** MySQL เทียบอีเมลแบบไม่สนตัวพิมพ์เล็กใหญ่ แต่ Postgres สน → วิธีแก้คือเก็บอีเมลเป็นตัวพิมพ์เล็กเสมอ และแปลงเป็นตัวเล็กก่อนค้นหา

### ③ ได้ข้อมูลกลับทันทีหลังเพิ่ม
```sql
INSERT INTO customers (name) VALUES ('ปิติ') RETURNING id;
-- 🐘 PostgreSQL: ได้ id ใหม่กลับมาเลย
-- 🐬 MySQL:      ไม่รองรับ ต้องถามแยกด้วย SELECT LAST_INSERT_ID()
```

### ④ ยกเลิกการแก้โครงสร้างตารางได้ไหม
```sql
BEGIN;
ALTER TABLE customers ADD COLUMN email TEXT;
ROLLBACK;
-- 🐘 PostgreSQL: ไม่มีคอลัมน์ email (ยกเลิกได้)
-- 🐬 MySQL:      มีคอลัมน์ email แล้ว (ALTER TABLE commit อัตโนมัติ)
```
💡 สำคัญตอน migration (บทที่ 8): ถ้าพังกลางทาง Postgres ย้อนกลับได้สะอาดกว่า

### ⑤ ชนิดข้อมูลพิเศษ
| | 🐬 MySQL | 🐘 PostgreSQL |
|---|---|---|
| JSON | `JSON` | `JSON` และ `JSONB` (binary ค้นเร็ว ทำ index ได้) |
| Array | ❌ | `TEXT[]`, `INT[]` |
| UUID | เก็บเป็นข้อความ/binary | มีชนิด `UUID` |
| ช่วงเวลา | ❌ | `daterange`, `tstzrange` (เหมาะกับระบบจอง) |

### ⑥ Extension
Postgres เพิ่มความสามารถได้ เช่น **PostGIS** (แผนที่/พิกัด) 🗺️ และ **pgvector** (ค้นหาสำหรับงาน AI) 🤖

### ⑦ Syntax เล็กๆ ที่ต่างกัน
```sql
-- 🐬 MySQL
CREATE TABLE t (id INT AUTO_INCREMENT PRIMARY KEY);
-- 🐘 PostgreSQL
CREATE TABLE t (id SERIAL PRIMARY KEY);   -- หรือ INT GENERATED ALWAYS AS IDENTITY
```

---

## 3. ตารางสรุป

| หัวข้อ | 🐬 MySQL | 🐘 PostgreSQL |
|---|---|---|
| เริ่มต้น | ง่ายมาก | ง่าย |
| ความเคร่งครัด | ยืดหยุ่น | เคร่งครัด |
| เทียบข้อความ | ไม่สนตัวพิมพ์เล็กใหญ่ (ค่าตั้งต้น) | สนตัวพิมพ์เล็กใหญ่ |
| `RETURNING` | ❌ | ✅ |
| Rollback `ALTER TABLE` | ❌ | ✅ |
| JSON | ดี | ดีมาก (`JSONB`) |
| Extension | น้อย | เยอะมาก |
| โฮสติ้ง | มีทุกที่ | เกือบทุกที่ + บริการยุคใหม่เยอะ |

---

## 4. 🔧 ลงมือ: เปิดทั้งสองตัวแล้วเทียบ

`compose.yaml`
```yaml
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: shop
    ports:
      - "3306:3306"
  postgres:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: shop
    ports:
      - "5432:5432"
```
```bash
docker compose up -d
```
เปิด Terminal **2 หน้าต่างคู่กัน**:
```bash
docker compose exec mysql mysql -uroot -psecret shop     # ซ้าย 🐬 (ออก: exit)
docker compose exec postgres psql -U postgres shop       # ขวา 🐘 (ออก: \q)
```
สร้างตาราง `customers` ทั้งสองฝั่ง (ใช้ `AUTO_INCREMENT` / `SERIAL` ตามข้อ ⑦) แล้วพิมพ์ตัวอย่าง ①–④ ทีละข้อ ดูผลเทียบกันสดๆ 🍿

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ระบบจองห้องประชุมที่ต้องกันการจองเวลาทับกัน ควรใช้ตัวไหน?</summary>

PostgreSQL มีชนิดข้อมูลช่วงเวลา (range) และตั้งกฎกันจองทับในตัวฐานข้อมูลได้
</details>

<details><summary>2. ลูกค้ามีเว็บ WordPress บนโฮสติ้งที่ให้แต่ MySQL อยากเพิ่มระบบสมาชิก ควรทำยังไง?</summary>

ใช้ MySQL ที่มีอยู่ได้เลย ไม่จำเป็นต้องย้าย งานแบบนี้ MySQL ทำได้ดี
</details>

---

## ✏️ แบบฝึกหัด

ทำข้อ 4 ให้ครบ ①–④ สรุปผลเป็นตารางใน README พร้อม screenshot

## ✅ ผ่านด่าน

- [ ] บอกความต่าง MySQL กับ PostgreSQL ได้อย่างน้อย 4 ข้อ
- [ ] รู้ว่าย้ายฐานข้อมูลแล้วต้องระวังเรื่องอะไร
- [ ] เลือกฐานข้อมูลให้เหมาะกับโปรเจกต์ได้

---

[← บทที่ 6: SQL vs NoSQL](./06-sql-nosql.md) · [🏠 สารบัญ](./README.md) · [บทที่ 8: ORM →](./08-orm.md)
