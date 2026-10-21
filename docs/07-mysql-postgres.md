# บทที่ 7: MySQL vs PostgreSQL 🐬🐘

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 6 · 🛠 ใช้: Docker Compose

> **⚡ สรุป 30 วินาที**
> - ทั้งคู่เป็น **SQL** ใช้ภาษาเดียวกันเกือบหมด ความรู้ย้ายข้ามกันได้
> - **MySQL:** ง่าย แพร่หลาย ยืดหยุ่น · **PostgreSQL:** เคร่งครัด ฟีเจอร์ครบ ต่อยอดได้
> - ความต่างที่เจอในงานจริง: การแปลงชนิดข้อมูล, ตัวพิมพ์เล็กใหญ่, `RETURNING`, rollback การแก้ตาราง
> - ต่อฐานข้อมูลด้วย **connection string** · แอปควรใช้ **user ของตัวเอง** ไม่ใช่ root/postgres
> - สำรองข้อมูลด้วย `pg_dump` / `mysqldump` และ **ต้องลอง restore จริง**
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
| port มาตรฐาน | `3306` | `5432` |
| โปรแกรมพิมพ์คำสั่ง (CLI) | `mysql` | `psql` |
| โปรแกรมสำรองข้อมูล | `mysqldump` | `pg_dump` |

> 🤓 **เกร็ด:** MySQL ตั้งชื่อตาม **My** ลูกสาวของผู้สร้าง และต่อมาผู้สร้างคนเดิมแยกมาทำ **MariaDB** ตั้งชื่อตาม Maria ลูกสาวอีกคน 👧👧

> 💡 **ทบทวนคำ:** ทั้งสองตัวคือ **database server** (โปรแกรมที่รันค้างอยู่) ส่วน `psql`, `mysql`, DBeaver, และโค้ดของเรา คือ **client** ที่ต่อเข้าไปส่งคำสั่ง
> ผู้ให้บริการ **MariaDB** ใช้งานเหมือน MySQL เกือบทั้งหมด (แต่บางฟีเจอร์ต่างกัน เช่น MariaDB มี `RETURNING`)

---

## 2. ความต่างที่สำคัญ (ลองพิมพ์ดูจริงในข้อ 4)

### ① ความเคร่งครัดเรื่องชนิดข้อมูล
```sql
SELECT 'abc' = 0;
-- 🐬 MySQL:      1 (true!) แปลง 'abc' เป็นตัวเลข 0 เงียบๆ
-- 🐘 PostgreSQL: ERROR: invalid input syntax for type integer: "abc"
```
💡 Postgres = ครูที่ไม่รับงานผิด format / MySQL = ครูที่พยายาม "เข้าใจที่จะสื่อ" ซึ่งบางทีก็เข้าใจผิด

ตัวอย่างที่อันตรายกว่า: เทียบ **คอลัมน์ข้อความ** กับตัวเลขโดยพลาด
```sql
SELECT * FROM customers WHERE name = 0;
-- 🐬 MySQL:      ได้ "ทุกแถว" ที่ชื่อขึ้นต้นด้วยตัวอักษร (ข้อความถูกแปลงเป็น 0 แล้ว 0 = 0)
-- 🐘 PostgreSQL: ERROR: operator does not exist: text = integer
```
Postgres ที่ฟ้องทันทีช่วยจับบั๊กได้ตั้งแต่ตอนพัฒนา

### ② ตัวพิมพ์เล็กใหญ่ในการเทียบข้อความ
```sql
SELECT 'Somchai' = 'somchai';
-- 🐬 MySQL:      1 (ค่าตั้งต้นไม่สนตัวพิมพ์เล็กใหญ่)
-- 🐘 PostgreSQL: false (ต้องตรงทุกตัว ถ้าไม่สนให้ใช้ ILIKE หรือ lower())
```
🔍 **เฉลยเรื่องเล่า:** MySQL เทียบอีเมลแบบไม่สนตัวพิมพ์เล็กใหญ่ แต่ Postgres สน → วิธีแก้คือเก็บอีเมลเป็นตัวพิมพ์เล็กเสมอ และแปลงเป็นตัวเล็กก่อนค้นหา

```sql
-- 🐘 PostgreSQL: ไม่สนตัวพิมพ์ใหญ่เล็ก 2 วิธี
SELECT 'Somchai' ILIKE 'somchai';                    -- true
SELECT lower('Somchai@Mail.com') = 'somchai@mail.com';  -- true

-- 🐬 MySQL: อยากให้สนตัวพิมพ์ ให้กำหนด collation แบบ binary
SELECT 'Somchai' = 'somchai' COLLATE utf8mb4_bin;    -- 0
```
(*collation* = กติกาเทียบ/เรียงข้อความ ของ MySQL 8 ค่าตั้งต้นคือ `utf8mb4_0900_ai_ci` โดย `ci` = case-insensitive)

### ③ ได้ข้อมูลกลับทันทีหลังเพิ่ม
```sql
INSERT INTO customers (name) VALUES ('ปิติ') RETURNING id;
-- 🐘 PostgreSQL: ได้ id ใหม่กลับมาเลย
-- 🐬 MySQL:      ไม่รองรับ (ERROR 1064 ที่คำว่า RETURNING) ต้องถามแยกด้วย SELECT LAST_INSERT_ID()
```
💡 ORM (บทที่ 8) ใช้ `RETURNING` ให้เมื่อต่อ Postgres ส่วน MySQL มันต้องหา id กลับมาด้วยวิธีอื่น

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
ที่เจอบ่อยอีกสามอย่าง:

| | 🐬 MySQL | 🐘 PostgreSQL |
|---|---|---|
| ต่อข้อความ | `CONCAT('a', 'b')` (`'a' \|\| 'b'` ได้ `0` เพราะ `\|\|` คือ OR) | `'a' \|\| 'b'` |
| ครอบชื่อตาราง/คอลัมน์ | `` `name` `` (backtick) | `"name"` (เครื่องหมายคำพูดคู่) |
| `"abc"` คืออะไร | ข้อความ (ยอมให้) | **ชื่อคอลัมน์** ถ้าไม่มี → error |

> ⚠️ ใน SQL ข้อความต้องครอบด้วย `'...'` (single quote) เสมอ เป็นนิสัยที่ใช้ได้ทั้งสองค่าย
> Postgres ยังแปลงชื่อที่ไม่ครอบเป็นตัวพิมพ์เล็กให้ (`MyTable` → `mytable`) ถ้าสร้างตารางด้วย `"MyTable"` แล้วค้นด้วย `MyTable` จะหาไม่เจอ **แนะนำตั้งชื่อเป็น `snake_case` ตัวเล็กทั้งหมด**

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

### ขั้นที่ 1: สร้างโฟลเดอร์และไฟล์ `compose.yaml`
```bash
mkdir db-compare && cd db-compare
```
สร้างไฟล์ `compose.yaml` (ใน VS Code หรือ editor ใดก็ได้)
```yaml
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: shop
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
  postgres:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: shop
    ports:
      - "5432:5432"
    volumes:
      - pg-data:/var/lib/postgresql/data

volumes:
  mysql-data:
  pg-data:
```
อ่านทีละบรรทัด:

| บรรทัด | ความหมาย |
|---|---|
| `image: postgres:17` | ใช้ image Postgres เวอร์ชัน 17 (ระบุเวอร์ชันเสมอ ไม่ใช้ `latest`) |
| `POSTGRES_PASSWORD` / `MYSQL_ROOT_PASSWORD` | รหัสผ่านของผู้ใช้หลัก (`postgres` / `root`) ตั้งแค่ **ตอนสร้างครั้งแรก** |
| `POSTGRES_DB` / `MYSQL_DATABASE` | ชื่อ database ที่ให้สร้างไว้เลย |
| `ports: "5432:5432"` | เปิดทางจากเครื่องเรา (ซ้าย) เข้าไปที่ port ในคอนเทนเนอร์ (ขวา) |
| `volumes:` | ที่เก็บข้อมูลถาวร ลบคอนเทนเนอร์แล้วข้อมูลยังอยู่ (ไม่ใส่ = ข้อมูลหายเมื่อลบคอนเทนเนอร์) |

![แผนภาพ port mapping: port 5432 และ 3306 ของเครื่องเราโยงไปยัง port ในคอนเทนเนอร์ และทางเลือก 5433:5432](/img/07-docker-port.svg)
*`"5432:5432"` = port เครื่องเรา : port ในคอนเทนเนอร์ · ถ้า 5432 ถูกใช้อยู่ เปลี่ยนเลขซ้ายเป็น 5433 ได้*

### ขั้นที่ 2: เริ่มระบบ
```bash
docker compose up -d
```
ครั้งแรกจะโหลด image ใช้เวลาสักพัก ควรเห็น
```text
 Network db-compare_default       Created
 Volume db-compare_mysql-data     Created
 Volume db-compare_pg-data        Created
 Container db-compare-postgres-1  Started
 Container db-compare-mysql-1     Started
```
ตรวจสถานะ
```bash
docker compose ps
```
```text
NAME                  IMAGE         SERVICE    STATUS          PORTS
db-compare-mysql-1    mysql:8.4     mysql      Up 25 seconds   0.0.0.0:3306->3306/tcp, [::]:3306->3306/tcp
db-compare-postgres-1 postgres:17   postgres   Up 25 seconds   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
```
ถ้า `STATUS` ไม่ใช่ `Up` ให้ดู log: `docker compose logs postgres` (ถ้าเห็นบรรทัด `database system is ready to accept connections` แปลว่าพร้อมแล้ว MySQL ใช้เวลาเตรียมตัวนานกว่า รอประมาณ 10–30 วินาที)

### ขั้นที่ 3: เปิด Terminal 2 หน้าต่างคู่กัน
```bash
docker compose exec mysql mysql -uroot -psecret --default-character-set=utf8mb4 shop   # ซ้าย 🐬 (ออก: exit)
docker compose exec postgres psql -U postgres shop                                     # ขวา 🐘 (ออก: \q)
```
ควรเห็น prompt
```text
mysql>            (ฝั่ง MySQL)
shop=#            (ฝั่ง Postgres)
```
> ⚠️ **`--default-character-set=utf8mb4` สำคัญมากถ้าจะพิมพ์ภาษาไทย** ไม่ใส่ client ของ MySQL ในคอนเทนเนอร์อาจใช้ `latin1` ทำให้ไทยกลายเป็นตัวอักษรเพี้ยนตอนเก็บ (ดูหัวข้อแก้ปัญหา: encoding)
> และ MySQL แสดงคำเตือนเรื่อง "password on the command line" นั่นเป็นแค่คำเตือน ใช้ต่อได้

### ขั้นที่ 4: สร้างตาราง `customers` ทั้งสองฝั่ง
```sql
-- 🐬 MySQL (ฝั่งซ้าย)
CREATE TABLE customers (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100));
-- 🐘 PostgreSQL (ฝั่งขวา)
CREATE TABLE customers (id SERIAL PRIMARY KEY, name TEXT);
```
ทั้งสองฝั่งควรเห็น
```text
Query OK, 0 rows affected          (MySQL)
CREATE TABLE                       (PostgreSQL)
```

### ขั้นที่ 5: ทดลอง ①–④ ทีละข้อ
พิมพ์ตัวอย่าง ①–④ จากข้อ 2 ทีละข้อ ดูผลเทียบกันสดๆ 🍿 สิ่งที่ควรเห็นจริง:

**① ชนิดข้อมูล**
```text
🐬 mysql>  SELECT 'abc' = 0;         →  1
🐘 shop=#  SELECT 'abc' = 0;         →  ERROR:  invalid input syntax for type integer: "abc"
```
**② ตัวพิมพ์เล็กใหญ่**
```text
🐬  SELECT 'Somchai' = 'somchai';    →  1
🐘  SELECT 'Somchai' = 'somchai';    →  f
```
**③ RETURNING**
```text
🐘  INSERT INTO customers (name) VALUES ('ปิติ') RETURNING id;
 id
----
  1

🐬  INSERT INTO customers (name) VALUES ('ปิติ') RETURNING id;
ERROR 1064 (42000): You have an error in your SQL syntax; ... near 'RETURNING id' at line 1
🐬  INSERT INTO customers (name) VALUES ('ปิติ');  SELECT LAST_INSERT_ID();     →  1
```
**④ ALTER TABLE ใน transaction** (ใช้ `DESCRIBE customers;` ฝั่ง MySQL หรือ `\d customers` ฝั่ง Postgres ดูผล)
```text
🐘  \d customers   → มีแค่ id, name              (ALTER ถูกยกเลิก)
🐬  DESCRIBE customers;  → มี id, name, email    (ALTER ไม่ถูกยกเลิก)
```

### ขั้นที่ 6: ปิดและเก็บกวาด (ตอนเลิกงาน)
**ยังไม่ต้องปิดตอนนี้** ข้อ 5, 7 และ 9 ยังใช้คอนเทนเนอร์ชุดนี้และข้อมูลแถว "ปิติ" ต่อ ให้รู้ไว้ว่าเวลาเลิกงานปิดยังไง:
```bash
docker compose down          # หยุดและลบคอนเทนเนอร์ (ข้อมูลใน volume ยังอยู่)
docker compose down -v       # ลบ volume ด้วย = ข้อมูลหายหมด (ใช้ตอนอยากเริ่มใหม่)
```
ทำไมสองคำสั่งนี้ต่างกัน: คอนเทนเนอร์คือ "โปรแกรมที่กำลังรัน" ลบแล้วสร้างใหม่ได้ ส่วนข้อมูลจริงของฐานข้อมูลเก็บอยู่ใน **volume** แยกออกมา (ดูบทที่ 2) `down` ลบแค่คอนเทนเนอร์ `down -v` ลบ volume ไปด้วย

ถ้าเผลอ `down` ไปแล้ว ให้ `docker compose up -d` อีกครั้งก่อนทำข้อถัดไป คอนเทนเนอร์ใหม่จะต่อกับ volume เดิม ข้อมูลกลับมาครบ แต่ถ้าใช้ `down -v` ไปแล้ว ข้อมูลหายจริง ต้องกลับไปทำขั้นที่ 4–5 ใหม่
> ⚠️ `down -v` คือลบข้อมูลทิ้งถาวร ห้ามใช้กับฐานข้อมูลที่มีข้อมูลสำคัญ

---

## 5. ต่อเข้าฐานข้อมูลด้วยเครื่องมือ

มี 3 วิธีหลัก เลือกตามความถนัด

### วิธีที่ 1: CLI ผ่าน `docker compose exec` (ไม่ต้องติดตั้งอะไรเพิ่ม)
ที่เราทำมาในข้อ 4 โปรแกรม `psql`/`mysql` มีอยู่ในคอนเทนเนอร์แล้ว

### วิธีที่ 2: CLI จากเครื่องเราเอง
ติดตั้ง client (macOS: `brew install libpq` หรือ `brew install postgresql@17`, Windows/Linux: ติดตั้ง PostgreSQL client) แล้วต่อผ่าน port ที่เปิดไว้

> 💡 บน Mac ถ้าติด `libpq` แล้วพิมพ์ `psql` ขึ้น `command not found` เป็นเพราะ Homebrew ติดตั้ง `libpq` แบบ keg-only (ไม่เอาคำสั่งไปไว้ใน PATH ให้ เพื่อไม่ชนกับ PostgreSQL ตัวเต็ม) แก้ด้วย `brew link --force libpq` หรือทำตามคำแนะนำที่ `brew info libpq` แสดง
```bash
psql "postgres://postgres:secret@localhost:5432/shop"
```
```text
Type "help" for help.

shop=#
```
(ถ้าเห็น `WARNING: psql major version ..., server major version ...` แปลว่าเวอร์ชัน client กับ server ต่างกัน ส่วนใหญ่ยังใช้งานได้ แต่คำสั่ง `\d` บางอย่างอาจแสดงผลไม่ครบ)
ตรวจว่าต่อกับอะไรอยู่: `\conninfo`

**คำสั่ง psql ที่ใช้บ่อย** (ขึ้นต้นด้วย `\` ไม่ต้องจบด้วย `;`)

| คำสั่ง | ทำอะไร |
|---|---|
| `\l` | ดูรายชื่อ database |
| `\c ชื่อ` | สลับไปใช้ database อื่น |
| `\dt` | ดูตารางใน database นี้ |
| `\d ชื่อตาราง` | ดูโครงสร้างตาราง |
| `\du` | ดูรายชื่อ role (ผู้ใช้) |
| `\conninfo` | ดูว่าต่ออยู่ที่ไหน ด้วยใคร |
| `\q` | ออก |

**คำสั่ง mysql ที่ใช้บ่อย** (ต้องจบด้วย `;`)

| คำสั่ง | ทำอะไร |
|---|---|
| `SHOW DATABASES;` | ดูรายชื่อ database |
| `USE ชื่อ;` | สลับ database |
| `SHOW TABLES;` | ดูตาราง |
| `DESCRIBE ชื่อตาราง;` | ดูโครงสร้างตาราง |
| `SELECT user, host FROM mysql.user;` | ดูผู้ใช้ |
| `exit` | ออก |

### วิธีที่ 3: โปรแกรม GUI (DBeaver / pgAdmin)
GUI ช่วยดูตารางและข้อมูลเป็นหน้าตาเหมือน Excel เหมาะตอนสำรวจข้อมูล

| โปรแกรม | ใช้กับ | หมายเหตุ |
|---|---|---|
| **DBeaver** (Community, ฟรี) | ทั้ง MySQL และ PostgreSQL (และอื่นๆ) | ตัวเดียวจบ เหมาะกับทีมที่ใช้ทั้งสองค่าย |
| **pgAdmin** | PostgreSQL เท่านั้น | เครื่องมือทางการของ Postgres |
| **Adminer** | ทั้งคู่ | เป็น container เล็กๆ เปิดผ่านเบราว์เซอร์ (ดูบทที่ 2) |

ขั้นตอนทั่วไป (หน้าตาแต่ละเวอร์ชันอาจต่างกันเล็กน้อย แต่ช่องที่ต้องกรอกเหมือนกัน):
1. ดาวน์โหลดและติดตั้งโปรแกรมจากเว็บทางการ
2. กดสร้างการเชื่อมต่อใหม่ (DBeaver: **Database → New Database Connection**, pgAdmin: คลิกขวา **Servers → Register → Server...**)
3. เลือกชนิดฐานข้อมูล (PostgreSQL หรือ MySQL)
4. กรอกค่าให้ตรงกับที่ตั้งไว้ใน `compose.yaml`

| ช่อง | ค่าสำหรับตัวอย่างของเรา (Postgres) | MySQL |
|---|---|---|
| Host | `localhost` | `localhost` |
| Port | `5432` | `3306` |
| Database | `shop` | `shop` |
| Username | `postgres` | `root` |
| Password | `secret` | `secret` |

5. กด **Test Connection** (DBeaver จะถามขอโหลด driver ครั้งแรก กด Download) ถ้าขึ้นสำเร็จกด **Finish/Save**
6. ดูตารางที่ `shop → Schemas → public → Tables` (Postgres) หรือ `shop → Tables` (MySQL) ดับเบิลคลิกตารางแล้วเปิดแท็บ **Data**
7. เปิด SQL Editor (DBeaver: `Ctrl/Cmd + ]`) พิมพ์ SQL แล้วกดรัน (`Ctrl/Cmd + Enter`)

> 💡 สำหรับ MySQL 8 บางเครื่อง DBeaver แจ้ง `Public Key Retrieval is not allowed` ให้เข้า **Driver properties** แล้วตั้ง `allowPublicKeyRetrieval=true` (ใช้เฉพาะตอน dev ในเครื่องเรา)

---

## 6. Connection String: ที่อยู่ของฐานข้อมูล

โค้ดและเครื่องมือส่วนใหญ่ต่อฐานข้อมูลด้วย **connection string** (หรือเรียก **DATABASE_URL**) บรรทัดเดียวที่รวมข้อมูลทั้งหมดไว้

```text
postgres://postgres:secret@localhost:5432/shop
mysql://root:secret@localhost:3306/shop
```

![ส่วนประกอบของ connection string: protocol, user, password, host, port และชื่อ database](/img/07-connection-string.svg)
*อ่านจากซ้ายไปขวา: ใครเป็นผู้ใช้ (user:password) @ เครื่องไหน (host:port) / database ชื่ออะไร*

| ส่วน | ความหมาย | ตัวอย่าง |
|---|---|---|
| protocol | ชนิดฐานข้อมูล | `postgres` (หรือ `postgresql`) / `mysql` |
| user | ผู้ใช้ | `postgres` |
| password | รหัสผ่าน | `secret` |
| host | เครื่องที่รันฐานข้อมูล | `localhost`, `db.example.com` |
| port | ประตูของโปรแกรม | `5432` / `3306` |
| database | ฐานข้อมูลที่จะใช้ | `shop` |
| `?ตัวเลือก` (ไม่บังคับ) | ตั้งค่าเพิ่ม | `?sslmode=require` (บังคับ SSL) |

**กฎที่ต้องรู้**
1. **เก็บใน `.env` เท่านั้น** ห้ามเขียนลงในโค้ดหรือ commit ขึ้น Git (มีรหัสผ่านอยู่ข้างใน ดู [บทที่ 10](./10-security.md))
```text
# .env
DATABASE_URL=postgres://postgres:secret@localhost:5432/shop
```
2. **รหัสผ่านมีอักขระพิเศษ ต้อง URL-encode** เช่น `p@ss:word/1` ต้องเขียน `p%40ss%3Aword%2F1` ไม่งั้นโปรแกรมแยก string ผิด
3. **`localhost` ขึ้นกับว่าโค้ดรันที่ไหน**

| โค้ดรันที่ | host ที่ใช้ |
|---|---|
| บนเครื่องเรา (เช่น `npx tsx src/index.ts`) | `localhost` + port ที่ map ไว้ (เช่น 5432) |
| ใน Docker Compose เดียวกับฐานข้อมูล | **ชื่อ service** เช่น `postgres` + port ภายใน (5432) ไม่ใช่ `localhost` |
| ฐานข้อมูลบน cloud/เซิร์ฟเวอร์อื่น | ชื่อเครื่องที่ผู้ให้บริการให้มา (มัก **ต้องใส่ SSL**) |

เพราะ `localhost` ในคอนเทนเนอร์ = ตัวคอนเทนเนอร์เอง ไม่ใช่เครื่องเรา

---

## 7. Database, User, Role และสิทธิ์

![โครงสร้าง server ที่มีหลาย database, schema public ที่เก็บตาราง และ role ที่ได้สิทธิ์ต่างกัน](/img/07-server-structure.svg)
*ชั้นของ Postgres: server → database → schema → table · ส่วน role (ผู้ใช้) อยู่ระดับ server แล้วได้สิทธิ์เข้า database แต่ละตัวต่างกัน*

- **1 server มีได้หลาย database** (แยกข้อมูลโปรเจกต์ออกจากกัน) ข้ามกันไม่ได้ ต้องต่อใหม่ (psql: `\c ชื่อ`)
- **Role / User** = บัญชีผู้ใช้ฐานข้อมูล (Postgres เรียก role MySQL เรียก user) แยกจากผู้ใช้ในแอปของเรา
- **Schema** (Postgres) = โฟลเดอร์ในโฟลเดอร์ ค่าตั้งต้นคือ `public` ตารางที่เราสร้างอยู่ในนั้น

> ⚠️ **หลักการ:** `postgres` / `root` เป็น **superuser** ทำได้ทุกอย่างรวมถึงลบทิ้งทุก database ให้ใช้เฉพาะตอนจัดการเอง
> **แอปต้องมี user ของตัวเอง** ที่มีสิทธิ์เท่าที่จำเป็น (หลักสิทธิ์ขั้นต่ำ) ถ้ารหัสหลุด ความเสียหายจะจำกัดอยู่แค่ database นั้น

### 🔧 สร้าง database + user สำหรับแอป (PostgreSQL)
```bash
docker compose exec postgres psql -U postgres
```
```sql
CREATE DATABASE bitcafe;
CREATE ROLE app_user WITH LOGIN PASSWORD 'app_pw';
GRANT ALL PRIVILEGES ON DATABASE bitcafe TO app_user;
\c bitcafe
GRANT ALL ON SCHEMA public TO app_user;
\du
```
ควรเห็น
```text
CREATE DATABASE
CREATE ROLE
GRANT
You are now connected to database "bitcafe" as user "postgres".
GRANT
                             List of roles
 Role name |                         Attributes
-----------+------------------------------------------------------------
 app_user  |
 postgres  | Superuser, Create role, Create DB, Replication, Bypass RLS
```
ลองต่อด้วย user ใหม่ (เปิดอีกหน้าต่าง)
```bash
psql "postgres://app_user:app_pw@localhost:5432/bitcafe" -c "CREATE TABLE t (id int); INSERT INTO t VALUES (1); SELECT * FROM t;"
```
```text
CREATE TABLE
INSERT 0 1
 id
----
  1
(1 row)
```
> ⚠️ **กับดัก PostgreSQL 15 ขึ้นไป:** `GRANT ALL ON DATABASE` อย่างเดียว **ไม่พอ** ถ้าไม่ได้ `GRANT ALL ON SCHEMA public` (ในขณะที่เชื่อมต่อ database นั้น) user จะสร้างตารางไม่ได้ และเจอ
> ```text
> ERROR:  permission denied for schema public
> ```
> ทางลัดที่สะอาดอีกแบบ: สร้าง database โดยให้ user เป็นเจ้าของเลย `CREATE DATABASE bitcafe OWNER app_user;`

### 🔧 สร้าง database + user สำหรับแอป (MySQL)
```bash
docker compose exec mysql mysql -uroot -psecret --default-character-set=utf8mb4
```
```sql
CREATE DATABASE bitcafe;
CREATE USER 'app'@'%' IDENTIFIED BY 'app_pw';
GRANT ALL ON bitcafe.* TO 'app'@'%';
SHOW GRANTS FOR 'app'@'%';
```
```text
Grants for app@%
GRANT USAGE ON *.* TO `app`@`%`
GRANT ALL PRIVILEGES ON `bitcafe`.* TO `app`@`%`
```
(`'app'@'%'` = ผู้ใช้ชื่อ app ที่ต่อมาจากเครื่องไหนก็ได้ · `%` คือ "ที่ไหนก็ได้" ใน production ควรระบุให้แคบกว่านี้)

ใน MySQL คำว่า `database` กับ `schema` คือสิ่งเดียวกัน ส่วน Postgres เป็นคนละชั้น

---

## 8. ชนิดข้อมูลที่ต่างกัน: เวลาเขียนตารางสำหรับทั้งสองค่าย

| งาน | 🐘 PostgreSQL | 🐬 MySQL | หมายเหตุ |
|---|---|---|---|
| เลขรันอัตโนมัติ | `SERIAL` หรือ `GENERATED ALWAYS AS IDENTITY` | `AUTO_INCREMENT` | |
| ข้อความสั้น | `TEXT` หรือ `VARCHAR(n)` | `VARCHAR(n)` (ต้องระบุ n) | Postgres `TEXT` ไม่จำกัดความยาวและไม่ช้ากว่า VARCHAR |
| ข้อความยาว | `TEXT` | `TEXT` (สูงสุด ~64 KB) / `LONGTEXT` | |
| เงิน/ทศนิยมแม่นยำ | `NUMERIC(10,2)` | `DECIMAL(10,2)` | **ห้ามใช้ FLOAT กับเงิน** |
| จริง/เท็จ | `BOOLEAN` (`true`/`false`) | `BOOLEAN` (เป็นชื่อเล่นของ `TINYINT(1)` เก็บ 1/0) | |
| วันเวลา | `TIMESTAMPTZ` (เก็บเวลาพร้อม time zone) | `DATETIME` (ไม่มี time zone) หรือ `TIMESTAMP` | ระบบที่มีผู้ใช้หลาย time zone ควรเก็บเป็น UTC |
| JSON | `JSONB` | `JSON` | |
| UUID | `UUID` (ใช้ `gen_random_uuid()` สร้าง) | `CHAR(36)` / `BINARY(16)` (+ `UUID()`) | |

> 💡 ถ้าใช้ ORM (บทที่ 8) มันแปลงชนิดให้เองตามค่ายที่ต่อ แต่ต้องเลือก dialect ให้ถูก (`pgTable` กับ `mysqlTable` ใน Drizzle)

ตัวอย่างที่ใช้ได้ทั้งสองค่ายโดยไม่ต้องแก้ (เขียนแบบกลางๆ):
```sql
-- ใช้ได้ทั้ง Postgres และ MySQL (id ต้องเขียนต่างกัน จึงยกออกมา)
CREATE TABLE products (
  name  VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0)
);
```

---

## 9. 🔧 สำรองข้อมูล (Backup) และกู้คืน (Restore)

ฐานข้อมูลจริงต้องมี backup เสมอ เพราะ: ลบผิด (ลืม `WHERE`), ย้ายเครื่อง, อัปเกรดเวอร์ชัน, หรือเครื่องเสีย 😱
> 💡 Docker volume **ไม่ใช่ backup** (ถ้าเครื่องเสีย volume หายไปด้วย) backup ต้องเป็นไฟล์ที่เก็บ **นอกเครื่อง** อีกที่

![ผัง backup: dump จาก database เป็นไฟล์ shop.sql แล้ว restore เข้า database ใหม่ พร้อมคำสั่งของ PostgreSQL และ MySQL](/img/07-backup-flow.svg)
*backup = dump ออกเป็นไฟล์ · restore = อ่านไฟล์นั้นเข้า database ปลายทาง · ไฟล์ที่ยังไม่เคยลอง restore ถือว่ายังไม่ใช่ backup*

### 🐘 PostgreSQL: `pg_dump`
```bash
# 1) dump ออกเป็นไฟล์ SQL ธรรมดา (บนเครื่องเรา)
docker compose exec -T postgres pg_dump -U postgres --no-owner shop > shop.sql

# 2) ดูหน้าตาไฟล์
head -20 shop.sql
```
> `-T` ปิด terminal แบบโต้ตอบ จำเป็นเมื่อใช้ `>` เปลี่ยนทางผลลัพธ์ไปเข้าไฟล์ ไม่ใส่ไฟล์อาจเสียหาย
> `--no-owner` ไม่ใส่คำสั่งตั้งเจ้าของ (ไม่งั้น restore ที่เครื่องอื่นอาจ error ว่าไม่มี role นั้น)

ในไฟล์จะเห็นคำสั่ง SQL เช่น
```text
CREATE TABLE public.customers (
    id integer NOT NULL,
    name text
);
...
COPY public.customers (id, name) FROM stdin;
1	ปิติ
\.
```
**restore** ไปยัง database ใหม่
```bash
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE shop_copy;"
docker compose exec -T postgres psql -U postgres -d shop_copy -v ON_ERROR_STOP=1 < shop.sql
docker compose exec -T postgres psql -U postgres -d shop_copy -c "SELECT count(*) FROM customers;"
```
```text
CREATE DATABASE
SET
...
CREATE TABLE
COPY 1
 count
-------
     1
```
`-v ON_ERROR_STOP=1` ให้หยุดทันทีเมื่อมี error ไม่งั้น psql จะวิ่งต่อและทำให้ข้อมูลครึ่งๆ กลางๆ

**รูปแบบ custom (`-Fc`)** เล็กกว่า และเลือก restore เฉพาะบางตารางได้
```bash
docker compose exec -T postgres pg_dump -U postgres -Fc -d shop > shop.dump
docker compose exec -T postgres pg_restore -U postgres -d shop_copy --clean --if-exists --no-owner < shop.dump
```
(ไฟล์ `.dump` แบบ custom อ่านด้วยตาไม่ได้ ต้อง restore ด้วย `pg_restore` ส่วนไฟล์ `.sql` ใช้ `psql`)

### 🐬 MySQL: `mysqldump`
```bash
docker compose exec -T mysql mysqldump -uroot -psecret --default-character-set=utf8mb4 shop > shop.sql
```
**restore**
```bash
docker compose exec -T mysql mysql -uroot -psecret -e "CREATE DATABASE shop_copy"
docker compose exec -T mysql mysql -uroot -psecret --default-character-set=utf8mb4 shop_copy < shop.sql
docker compose exec -T mysql mysql -uroot -psecret -e "SELECT COUNT(*) FROM shop_copy.customers"
```
```text
COUNT(*)
1
```
(จะเห็นคำเตือน `Using a password on the command line` ได้ ไม่ใช่ error)

### ✅ เช็คลิสต์ backup
- [ ] ตั้งเวลา backup อัตโนมัติ (เช่น cron ทุกคืน) และเก็บหลายชุด ไม่ทับกันหมด
- [ ] เก็บไฟล์ไว้ **นอกเครื่อง** (cloud storage/อีกเซิร์ฟเวอร์) และเข้ารหัสถ้ามีข้อมูลลูกค้า
- [ ] **ลอง restore จริงเป็นระยะ** ว่าไฟล์ใช้ได้
- [ ] ห้าม commit ไฟล์ dump ขึ้น Git (มีข้อมูลจริงข้างใน)
- [ ] ผู้ให้บริการ cloud (Supabase, Neon, RDS) มี backup อัตโนมัติให้ แต่ควรรู้ว่าเก็บกี่วันและกู้ยังไง

---

## 10. เลือกตัวไหนดี

| สถานการณ์ | เลือก | เหตุผล |
|---|---|---|
| โปรเจกต์ใหม่ของทีม ไม่มีข้อจำกัด | 🐘 **PostgreSQL** | เคร่งครัดจับบั๊กได้เร็ว ฟีเจอร์ครบ (JSONB, range, extension) |
| ระบบจอง/ห้องประชุม กันเวลาทับ | 🐘 PostgreSQL | มีชนิด range + constraint กันทับ |
| งานค้นหาเวกเตอร์/AI, แผนที่ | 🐘 PostgreSQL | pgvector, PostGIS |
| ลูกค้ามี MySQL/MariaDB อยู่แล้ว (WordPress, ระบบเก่า) | 🐬 MySQL | ไม่ต้องย้าย ทำงานได้ดี |
| โฮสติ้งราคาถูกที่ให้แต่ MySQL | 🐬 MySQL | ใช้ของที่มี |
| ไม่แน่ใจ | 🐘 PostgreSQL | บริการยุคใหม่ (Supabase, Neon) ล้วนใช้ Postgres |

> ✅ **ข้อควรจำ:** ถ้าเขียนโค้ดโดยใช้ ORM อย่างเดียว ความต่างส่วนใหญ่ถูกซ่อนไว้ แต่ **ความต่างข้อ ①② (ชนิดข้อมูล, ตัวพิมพ์เล็กใหญ่) ยังโผล่มาได้** เสมอเมื่อย้ายค่าย จึงควรมี test ครอบ

---

## 11. 🛠 แก้ปัญหาที่เจอบ่อย (Troubleshooting)

![แผนผังสาเหตุและวิธีแก้ของ error 4 แบบ ได้แก่ Connection refused, password authentication failed, database does not exist, port is already allocated](/img/07-troubleshoot.svg)
*อ่านข้อความ error ให้ครบก่อนเสมอ ส่วนใหญ่บอกสาเหตุไว้แล้ว*

### ❶ `Connection refused` / `ECONNREFUSED`
```text
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: Connection refused
Is the server running on that host and accepting TCP/IP connections?
```
**สาเหตุ:** ไม่มีโปรแกรมฟังอยู่ที่ host:port นั้น
1. `docker compose ps` / `docker ps` : คอนเทนเนอร์ยัง `Up` ไหม ถ้าไม่ ดู `docker compose logs postgres`
2. เพิ่ง `up` ใหม่ๆ? รอ 10–30 วินาทีให้ server พร้อม
3. **port ไม่ตรง** เช่น map ไว้เป็น `5433:5432` แต่ต่อที่ 5432
4. ในโค้ดที่รันใน Docker เดียวกัน ให้ใช้ชื่อ service ไม่ใช่ `localhost` (ดูข้อ 6)
5. บางเครื่อง `localhost` ถูกแปลงเป็น `::1` (IPv6) แต่ server ฟังแค่ IPv4 ลองใช้ `127.0.0.1` แทน (ถ้า `-p` ผูกไว้แค่ `127.0.0.1:5432:5432` จะเจอกรณีนี้)

### ❷ `password authentication failed for user "postgres"`
```text
FATAL:  password authentication failed for user "postgres"
```
MySQL: `ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: YES)`

**สาเหตุ:** ชื่อผู้ใช้หรือรหัสผ่านไม่ตรง (Postgres บอกข้อความเดียวกันแม้ชื่อผู้ใช้ไม่มีอยู่จริง เพื่อความปลอดภัย)
1. เทียบกับ `POSTGRES_PASSWORD` / `MYSQL_ROOT_PASSWORD` ใน `compose.yaml` และ `.env`
2. ⚠️ **ตัวแปรเหล่านี้มีผลเฉพาะตอนสร้าง volume ครั้งแรก** ถ้าเปลี่ยนรหัสใน compose ทีหลังแต่ volume เดิมยังอยู่ รหัสไม่เปลี่ยน ต้อง `docker compose down -v` (ลบข้อมูล) หรือเปลี่ยนด้วย `ALTER USER postgres PASSWORD '...'`
3. รหัสผ่านมีอักขระพิเศษ? ต้อง URL-encode ใน connection string
4. มีฐานข้อมูลอื่น (เช่น Postgres ที่ติดตั้งในเครื่อง) ใช้ port เดียวกัน จนเราต่อผิดตัว

### ❸ `database "xxx" does not exist`
```text
FATAL:  database "nodb" does not exist
```
MySQL: `ERROR 1049 (42000): Unknown database 'nodb'`

**สาเหตุ:** ชื่อ database ใน connection string ผิด หรือยังไม่ได้สร้าง
1. ดูรายชื่อที่มีจริง: `\l` (Postgres) / `SHOW DATABASES;` (MySQL)
2. สร้าง: `CREATE DATABASE xxx;`
3. ใน compose ตั้ง `POSTGRES_DB` ได้ แต่ก็มีผลแค่ตอนสร้าง volume ครั้งแรกเช่นกัน
4. ถ้ายังไม่แน่ใจ ต่อด้วย database `postgres` (ที่มีให้เสมอ) แล้วค่อยสร้างตัวใหม่

### ❹ `port is already allocated` / `address already in use`
```text
docker: Error response from daemon: ... Bind for 0.0.0.0:5432 failed: port is already allocated
```
**สาเหตุ:** port ฝั่งเครื่องเรามีโปรแกรมอื่นใช้อยู่ (เช่น Postgres ตัวอื่น หรือคอนเทนเนอร์เก่าที่ยังไม่ปิด)
1. หาว่าใครใช้: `docker ps` (ดูคอลัมน์ PORTS) หรือ `lsof -i :5432` (macOS/Linux) / `netstat -ano | findstr 5432` (Windows)
2. ปิดตัวเก่า (`docker stop ชื่อ`) **หรือ**
3. เปลี่ยนเลขฝั่งซ้ายเป็น port อื่น: `"5433:5432"` แล้วแก้ connection string เป็น `...@localhost:5433/...`

### ❺ ภาษาไทยเพี้ยน (Encoding)
อาการ: เก็บ "ปิติ" แล้วเห็นเป็น `à¸›à¸´à¸•à¸´` หรือ `???` · `CHAR_LENGTH` ของตัวไทย 1 ตัวได้ 3

**สาเหตุ:** ตัวอักษรไทย 1 ตัวใช้ 3 byte ใน UTF-8 ถ้าฝั่ง client บอกฐานข้อมูลว่าเป็น `latin1` ฐานข้อมูลจะนับเป็น 3 ตัวอักษรเดี่ยว
ทดสอบ (MySQL):
```bash
docker compose exec mysql mysql -uroot -psecret --default-character-set=latin1  -e "SELECT 'ก' AS t, CHAR_LENGTH('ก') AS chars"
docker compose exec mysql mysql -uroot -psecret --default-character-set=utf8mb4 -e "SELECT 'ก' AS t, CHAR_LENGTH('ก') AS chars"
```
```text
latin1  → chars = 3   (เพี้ยน)
utf8mb4 → chars = 1   (ถูก)
```
**วิธีแก้**
1. **ตัวเก็บ:** database/ตารางต้องเป็น UTF-8 (MySQL 8 ใช้ `utf8mb4` เป็นค่าตั้งต้นแล้ว · Postgres ใช้ `UTF8` ตรวจด้วย `\l` ดูคอลัมน์ Encoding)
2. **ตัวต่อ:** client ต้องใช้ UTF-8 ด้วย: ใส่ `--default-character-set=utf8mb4` ใน CLI, หรือ `?charset=utf8mb4` ใน connection string ของบาง driver ส่วนไดรเวอร์ในโค้ด (ORM) ปกติใช้ UTF-8 ให้เอง
3. ใน Postgres ตรวจ `SHOW client_encoding;` ต้องได้ `UTF8`
4. ⚠️ **ข้อมูลที่เก็บเพี้ยนไปแล้วแก้ไม่ได้ด้วยการเปลี่ยน setting** ต้องลบแล้วใส่ใหม่
5. MySQL: ใช้ `utf8mb4` ไม่ใช่ `utf8` (ซึ่งเป็นชื่อเก่าที่เก็บได้แค่ 3 byte ต่ออักขระ ทำให้ emoji 😀 เก็บไม่ได้)

### ❻ `permission denied for schema public`
เจอตอน user ใหม่สร้างตารางไม่ได้ใน Postgres 15 ขึ้นไป แก้ตามข้อ 7: `GRANT ALL ON SCHEMA public TO ชื่อ_user;` (ต่อเข้า database นั้นก่อน)

### ❼ `role "xxx" does not exist`
ชื่อ user ที่ใช้ใน connection string หรือใน `GRANT` ไม่มีอยู่ ดูรายชื่อด้วย `\du` แล้วสร้างด้วย `CREATE ROLE ...`

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ระบบจองห้องประชุมที่ต้องกันการจองเวลาทับกัน ควรใช้ตัวไหน?</summary>

PostgreSQL มีชนิดข้อมูลช่วงเวลา (range) และตั้งกฎกันจองทับในตัวฐานข้อมูลได้
</details>

<details><summary>2. ลูกค้ามีเว็บ WordPress บนโฮสติ้งที่ให้แต่ MySQL อยากเพิ่มระบบสมาชิก ควรทำยังไง?</summary>

ใช้ MySQL ที่มีอยู่ได้เลย ไม่จำเป็นต้องย้าย งานแบบนี้ MySQL ทำได้ดี
</details>

<details><summary>3. <code>"5433:5432"</code> ในไฟล์ compose หมายถึงอะไร และเมื่อไหร่ควรใช้?</summary>

เปิด port 5433 บนเครื่องเรา ส่งต่อไปยัง port 5432 ในคอนเทนเนอร์ ใช้เมื่อ 5432 บนเครื่องเรามีโปรแกรมอื่นใช้อยู่แล้ว (แล้ว connection string ต้องใช้ 5433)
</details>

<details><summary>4. connection string <code>postgres://app:p@ss@localhost:5432/shop</code> มีปัญหาอะไร?</summary>

รหัสผ่านมี `@` ปนอยู่ ทำให้แยกส่วนผิด ต้อง URL-encode เป็น `p%40ss` → `postgres://app:p%40ss@localhost:5432/shop`
</details>

<details><summary>5. ทำไมไม่ควรให้แอปต่อฐานข้อมูลด้วย user <code>postgres</code> / <code>root</code>?</summary>

เป็น superuser ทำได้ทุกอย่าง ถ้าแอปโดนเจาะหรือรหัสหลุด ผู้โจมตีลบ/แก้ได้ทุก database ควรสร้าง user เฉพาะแอป ให้สิทธิ์เท่าที่จำเป็น
</details>

<details><summary>6. ตั้ง <code>POSTGRES_PASSWORD</code> ใหม่ใน compose แล้ว up อีกรอบ แต่ยังต่อด้วยรหัสใหม่ไม่ได้ เพราะอะไร?</summary>

ตัวแปรนี้มีผลเฉพาะตอนสร้าง volume ครั้งแรก volume เก่ายังเก็บรหัสเดิมไว้ ต้องเปลี่ยนด้วย `ALTER USER` หรือลบ volume (`down -v`) เมื่อไม่มีข้อมูลสำคัญ
</details>

<details><summary>7. backup ที่ยังไม่เคยลอง restore ไว้ใจได้ไหม?</summary>

ยังไม่ควรไว้ใจ ไฟล์อาจเสีย ไม่ครบ หรือ restore ไม่ผ่านเพราะ role/เวอร์ชันไม่ตรง ต้องลอง restore ลง database ทดสอบเป็นระยะ
</details>

---

## ✏️ แบบฝึกหัด

1. ทำข้อ 4 ให้ครบ ①–④ สรุปผลเป็นตารางใน README พร้อม screenshot
2. ต่อด้วย DBeaver (หรือ pgAdmin) เข้าทั้ง Postgres และ MySQL ถ่าย screenshot ตารางที่สร้าง
3. สร้าง user `app_user` + database `bitcafe` ใน Postgres ตามข้อ 7 แล้วต่อด้วย user นั้นสำเร็จ
4. `pg_dump` database `shop` ออกเป็นไฟล์ แล้ว restore เข้า `shop_copy` และตรวจจำนวนแถวตรงกัน
5. ลองทำให้เกิด error ข้อ ❶ ❷ ❸ ❹ ด้วยตัวเอง (ปิดคอนเทนเนอร์, ใส่รหัสผิด, ใส่ชื่อ database ผิด, เปิด container ที่ port ซ้ำ) แล้วแก้ให้หาย

## ✅ ผ่านด่าน

- [ ] บอกความต่าง MySQL กับ PostgreSQL ได้อย่างน้อย 4 ข้อ
- [ ] รู้ว่าย้ายฐานข้อมูลแล้วต้องระวังเรื่องอะไร
- [ ] เปิดฐานข้อมูลด้วย Docker Compose และต่อด้วย psql/mysql และ GUI ได้
- [ ] อ่านและเขียน connection string ได้ (รวมเรื่อง `localhost` กับชื่อ service)
- [ ] สร้าง database + user ให้แอปโดยไม่ใช้ superuser ได้
- [ ] backup และ restore ได้ด้วย `pg_dump` / `mysqldump`
- [ ] แก้ error ต่อฐานข้อมูล 4 แบบหลักได้
- [ ] เลือกฐานข้อมูลให้เหมาะกับโปรเจกต์ได้

---

[← บทที่ 6: SQL vs NoSQL](./06-sql-nosql.md) · [🏠 สารบัญ](/) · [บทที่ 8: ORM →](./08-orm.md)
