# บทที่ 8: Drizzle vs Prisma vs Sequelize 🌉

> ⏱ ประมาณ 5 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 4, 5, 6 · 🛠 ใช้: TypeScript, Docker, PostgreSQL

> **⚡ สรุป 30 วินาที**
> - เขียน SQL เป็นข้อความในโค้ด = ไม่มี type, พิมพ์ผิดไม่รู้, เสี่ยง **SQL injection**
> - **ORM** แปลงโค้ด TypeScript เป็น SQL ให้ ได้ type ครบและปลอดภัย (แต่ยังต้องรู้ SQL!)
> - **Migration** = ประวัติการเปลี่ยนโครงสร้าง DB ทุกการเปลี่ยนต้องผ่าน migration และ **ห้ามแก้ไฟล์ที่รันไปแล้ว**
> - ระวัง **N+1** ดึงข้อมูลที่เกี่ยวข้องพร้อมกันด้วย `with` / `include`
> - **Seed** = สคริปต์ใส่ข้อมูลตัวอย่าง ให้ทุกคนในทีมมีข้อมูลทดสอบเหมือนกัน
> - งานใหม่ใช้ **Drizzle หรือ Prisma** · Sequelize รู้จักไว้สำหรับระบบเก่า

---

## 📖 เรื่องเล่า

บิตเขียนหน้าค้นหาลูกค้าแบบนี้:
```ts
const result = await pool.query(`SELECT * FROM customers WHERE name = '${name}'`);
```
ทดสอบด้วยชื่อ "สมชาย" ผ่าน ✅ แต่พี่ไบต์ลองพิมพ์ในช่องค้นหาว่า:
```
' OR '1'='1
```
หน้าจอแสดง **ลูกค้าทุกคนในระบบ** พร้อมเบอร์โทร 😱 พี่ไบต์บอกว่า *"ถ้าพิมพ์อีกแบบ ตารางหายทั้งตารางได้เลยนะ"*

---

## 1. ปัญหาของการเขียน SQL ตรงๆ ในโค้ด

```ts
const result = await pool.query(`SELECT * FROM custmers WHERE name = '${name}'`);
```
บรรทัดเดียวมี 3 ปัญหา:
1. **พิมพ์ชื่อตารางผิด** (`custmers`) TS ไม่รู้ เพราะ SQL เป็นแค่ข้อความ 📝
2. **`result.rows` เป็น `any`** ไม่รู้ว่าข้างในมีอะไร เสีย type safety ที่อุตส่าห์เรียนมา
3. **SQL Injection** 💉 ค่าจากผู้ใช้ถูก "ต่อเป็นคำสั่ง" เลยสั่งฐานข้อมูลได้ตามใจ

> ⚠️ ถ้าจำเป็นต้องเขียน SQL เอง **ห้ามต่อข้อความ** ให้ใช้ parameter เสมอ:
> `pool.query("SELECT * FROM customers WHERE name = $1", [name])`

**ทำไม parameter ปลอดภัย?** เพราะ "คำสั่ง" กับ "ข้อมูล" ถูกส่งแยกกันไปให้ฐานข้อมูล
```text
ต่อข้อความ:  SELECT * FROM customers WHERE name = '' OR '1'='1'
                                                   └─ ข้อมูลของผู้ใช้กลายเป็นส่วนหนึ่งของคำสั่ง 💥

parameter:   SELECT * FROM customers WHERE name = $1      +      $1 = "' OR '1'='1"
                                                                     └─ ฐานข้อมูลมองเป็น "ชื่อที่แปลกๆ" ค้นแล้วไม่เจอใคร ✅
```
รายละเอียดการโจมตีและวิธีกันอื่นๆ อยู่ใน [บทที่ 10](./10-security.md)

---

## 2. ORM คืออะไร

**ORM (Object-Relational Mapping)** = library ที่ **แปลงระหว่างตารางกับ object ในโค้ด** ให้อัตโนมัติ

> 💡 **เปรียบเทียบ:** ORM = **ล่ามแปลภาษา** 🧑‍🏫 เราพูด TypeScript ล่ามแปลเป็น SQL ให้ฐานข้อมูล และแปลคำตอบกลับมาเป็น object พร้อมใช้

```ts
const found = await db.select().from(customers).where(eq(customers.name, name));
//    ^ TS รู้ว่าเป็น { id: number; name: string; phone: string | null }[]
```
- พิมพ์ชื่อผิด → **เส้นแดงทันที**
- ผลลัพธ์ **มี type ครบ**
- ค่าจากผู้ใช้ส่งเป็น parameter อัตโนมัติ → **กัน SQL injection**

![แผนภาพชั้นของ ORM: โค้ด TypeScript, ORM, driver และ pool, ฐานข้อมูล พร้อมตัวอย่างโค้ดที่เขียนกับ SQL ที่ถูกส่งไป](/img/08-orm-layers.svg)
*ORM แปลโค้ดเป็น SQL (พร้อม parameter) ส่งผ่าน driver ไปยังฐานข้อมูล แล้วแปลแถวที่ได้กลับเป็น object ที่มี type*

### คำศัพท์ที่จะเจอในบทนี้

| คำ | ความหมาย |
|---|---|
| **Schema** (ใน ORM) | ไฟล์ที่เราประกาศว่ามีตารางอะไร คอลัมน์อะไร ชนิดอะไร (ORM เอาไปสร้าง type และ SQL) |
| **Model** | ตัวแทนของ 1 ตารางในโค้ด (Prisma/Sequelize ใช้คำนี้) |
| **Query builder** | วิธีเขียน query ด้วยฟังก์ชันต่อกัน `select().from().where()` หน้าตาใกล้ SQL |
| **Driver** | library ที่คุยกับฐานข้อมูลจริง (`pg` สำหรับ Postgres) ORM เรียกใช้อยู่เบื้องหลัง |
| **Connection pool** | สระ connection ที่เปิดค้างไว้ใช้ซ้ำ (ดูข้อ 9) |
| **Migration** | ไฟล์ที่บันทึกการเปลี่ยนโครงสร้างฐานข้อมูล (ข้อ 3) |
| **Seed** | สคริปต์ใส่ข้อมูลตัวอย่าง (ขั้นที่ 8 ในข้อ 6) |

### ข้อดี-ข้อเสีย: ORM เทียบกับ SQL ดิบ

| | ✍️ SQL ดิบ (`pool.query`) | 🌉 ORM |
|---|---|---|
| Type safety | ❌ ผลลัพธ์เป็น `any` | ✅ รู้ type จาก schema |
| พิมพ์ชื่อตาราง/คอลัมน์ผิด | รู้ตอนรันจริง | ✅ เส้นแดงตอนเขียน |
| SQL injection | ต้องระวังเอง | ✅ ใช้ parameter ให้อัตโนมัติ |
| เปลี่ยนโครงสร้าง DB | เขียน `ALTER TABLE` และตามแก้ type เอง | ✅ แก้ schema แล้ว generate migration |
| Query ซับซ้อนมาก (window function, CTE) | ✅ เขียนตรงๆ ง่ายสุด | บางทีเขียนยาก ต้องใช้ SQL ดิบแทรก |
| รู้ว่ารัน SQL อะไร | ✅ เห็นเต็มตา | ต้องเปิด log ดูเอง |
| ความเร็ว (ภาพรวมในแอปทั่วไป) | ใกล้เคียงกัน | ใกล้เคียงกัน (ที่ช้าคือ query แย่ๆ ไม่ใช่ตัว ORM) |
| ต้องเรียนรู้เพิ่ม | น้อย | ต้องเรียนวิธีใช้ของแต่ละตัว |

**ข้อเสียที่ต้องรู้**
- ต้องเรียนวิธีใช้ของแต่ละตัว
- query ซับซ้อนมาก บางทีเขียน SQL เองง่ายกว่า (ORM ส่วนใหญ่ให้เขียน SQL ดิบได้)
- ไม่รู้ว่า ORM สร้าง SQL อะไร อาจได้ query ช้าโดยไม่รู้ตัว → **ORM ไม่ได้แทนการรู้ SQL**

> 💡 **เคล็ดลับ:** ตอนเรียนให้เปิด log ของ ORM ให้เห็น SQL ที่ถูกส่งไปเสมอ (ทำยังไงดูข้อ 5) จะเริ่มเข้าใจว่าโค้ดแต่ละบรรทัดกลายเป็น SQL อะไร

---

## 3. Migration

**Migration** = **ไฟล์บันทึกการเปลี่ยนโครงสร้างฐานข้อมูล** ทีละขั้นตามลำดับ

```
migrations/
├── 0001_create_customers.sql
├── 0002_create_rentals.sql
└── 0003_add_email_to_customers.sql
```

> 💡 **เปรียบเทียบ:** migration = **Git ของโครงสร้างฐานข้อมูล** หรือ **บันทึกการต่อเติมบ้าน** 🏗️ ช่างคนใหม่อ่านแล้วสร้างบ้านหน้าตาเดียวกันได้เป๊ะ

**ทำไมสำคัญ**
- เพื่อนรันคำสั่งเดียวได้ DB โครงสร้างเดียวกับเรา
- dev / test / production ตรงกันเสมอ
- รู้ว่าใครเปลี่ยนอะไรเมื่อไหร่ (อยู่ใน Git)

> ⚠️ **กฎเหล็ก 2 ข้อ**
> 1. **ห้ามแก้โครงสร้างตารางบน production ด้วยมือ** ทุกการเปลี่ยนผ่าน migration
> 2. migration ที่รันไปแล้ว **ห้ามแก้ไฟล์เดิม** จะเปลี่ยนให้สร้างไฟล์ใหม่

### Flow: schema → migration → ฐานข้อมูล

![ผัง flow ของ migration: แก้ schema.ts, drizzle-kit generate สร้างไฟล์ SQL, drizzle-kit migrate รันกับฐานข้อมูล และ push ที่ข้ามขั้นตอนไว้ทดลอง](/img/08-migration-flow.svg)
*แก้ schema → generate (สร้างไฟล์ SQL) → migrate (รันกับ DB) → commit ทั้ง schema และไฟล์ migration เข้า Git*

**ทำไมห้ามแก้ไฟล์ migration ที่รันไปแล้ว?** เพราะฐานข้อมูลจำไว้ว่า "ไฟล์ไหนรันไปแล้ว" (ใน Drizzle เก็บไว้ที่ตาราง `drizzle.__drizzle_migrations` พร้อมค่า hash ของไฟล์) ถ้าไปแก้ไฟล์เก่า:
- เครื่องที่รันไปแล้ว **ไม่รันซ้ำ** → ได้ DB ไม่เหมือนเครื่องที่เพิ่งรัน (โครงสร้างเพี้ยนกันระหว่างคนในทีม)
- ประวัติ (hash) ไม่ตรงกับของจริง ทำให้ตรวจสอบย้อนหลังไม่ได้
ทางที่ถูก: สร้าง migration ใหม่ที่แก้ต่อจากของเดิม

### คำสั่ง 3 แบบ: generate / migrate / push

| คำสั่ง (Drizzle) | ทำอะไร | ใช้เมื่อ |
|---|---|---|
| `drizzle-kit generate` | อ่าน schema เทียบกับ snapshot เดิม แล้ว **สร้างไฟล์ SQL** (ยังไม่แตะ DB) | ทุกครั้งที่เปลี่ยน schema |
| `drizzle-kit migrate` | **รันไฟล์ SQL** ที่ยังไม่เคยรันกับ DB จริง และบันทึกว่ารันแล้ว | หลัง generate · ตอน deploy |
| `drizzle-kit push` | ดัน schema เข้า DB **ตรงๆ ไม่สร้างไฟล์** | ทดลองเร็วๆ ใน DB ส่วนตัวเท่านั้น ⚠️ ห้ามใช้กับ production หรือ DB ที่ใช้ร่วมกัน |
| `prisma migrate dev` | (Prisma) สร้างไฟล์ + รันให้ในคำสั่งเดียว | ตอนพัฒนา |
| `prisma migrate deploy` | (Prisma) รันเฉพาะไฟล์ที่มี ไม่สร้างใหม่ | บน production / CI |

> 💡 ทีมเราเลือกใช้ `generate` + `migrate` เป็นหลัก เพราะได้ไฟล์ SQL ให้เพื่อนร่วมทีมรีวิวใน Merge Request ก่อนรันจริง

### เวิร์กโฟลว์เปลี่ยนโครงสร้างทีละขั้น (ใช้ทุกครั้ง)
1. อัปเดตโค้ดล่าสุด (`git pull`) แล้วรัน `npx drizzle-kit migrate` ให้ DB เราตามทัน migration ของเพื่อน
2. แก้ `schema.ts` (เช่น เพิ่มคอลัมน์)
3. `npx drizzle-kit generate` → ได้ไฟล์ใหม่ใน `drizzle/`
4. **เปิดไฟล์ SQL อ่าน** ว่าตรงกับที่ตั้งใจ (โดยเฉพาะ `DROP` ที่ทำให้ข้อมูลหาย!)
5. `npx drizzle-kit migrate`
6. ทดสอบโค้ดที่ใช้โครงสร้างใหม่
7. `git add` ทั้ง `schema.ts`, ไฟล์ `.sql` และโฟลเดอร์ `drizzle/meta` แล้ว commit

> ⚠️ **เปลี่ยนชื่อคอลัมน์ระวังข้อมูลหาย** ถ้าแค่แก้ชื่อใน schema แล้ว generate เครื่องมืออาจเข้าใจว่า "ลบคอลัมน์เก่า + สร้างคอลัมน์ใหม่" ซึ่งข้อมูลเดิมจะหาย drizzle-kit มักถามว่าเป็น *rename* หรือ *create* ให้อ่านและตอบให้ถูก แล้วดูไฟล์ SQL ว่าเป็น `RENAME COLUMN` (ปลอดภัย) หรือ `DROP` + `ADD` (ข้อมูลหาย)

---

## 4. รู้จักทั้ง 3 ตัว

| | 🌧️ **Drizzle** | 🔺 **Prisma** | 🐢 **Sequelize** |
|---|---|---|---|
| บุคลิก | "รู้ SQL ก็ใช้เป็น" | ใช้ง่ายสุด เครื่องมือครบ | รุ่นพี่ที่อยู่มานาน |
| เขียน schema ที่ | ไฟล์ TypeScript | `schema.prisma` (ภาษาของ Prisma) | class TS ที่ extend `Model` |
| ได้ type ยังไง | อัตโนมัติจาก schema | รัน `prisma generate` | ประกาศเองซ้ำกับคอลัมน์ |
| Migration | `drizzle-kit generate` + `migrate` | `prisma migrate dev` | `sequelize-cli` เขียนเอง |
| น้ำหนัก | เบามาก | หนักกว่า มี **Prisma Studio** | ปานกลาง |
| จุดเด่น | ใกล้ SQL, เร็ว, เหมาะ serverless | มือใหม่เริ่มง่าย เอกสารดีมาก | ตัวอย่างเก่าเยอะ หลายฐานข้อมูล |
| จุดด้อย | ต้องรู้ SQL พอสมควร | ซ่อน SQL มาก, setup เปลี่ยนตามเวอร์ชันบ่อย | TS ไม่ใช่จุดแข็ง, pattern เก่า |
| เหมาะกับ | โปรเจกต์ TS ใหม่ที่อยากคุม SQL | ทีมที่อยากเริ่มเร็ว | ดูแลระบบเก่า |

### โจทย์เดียวกัน เขียน 3 แบบเทียบกัน

โจทย์: "มีตาราง customers กับ rentals (1 ลูกค้า มีหลาย rental) → เพิ่มสมชายพร้อม rental 1 รายการ → ดึงลูกค้าทุกคนพร้อม rental"

**① ประกาศโครงสร้าง (schema)**

🌧️ Drizzle (`schema.ts`)
```ts
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});
export const rentals = pgTable("rentals", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  laptop: text("laptop").notNull(),
});
export const customersRelations = relations(customers, ({ many }) => ({ rentals: many(rentals) }));
export const rentalsRelations = relations(rentals, ({ one }) => ({
  customer: one(customers, { fields: [rentals.customerId], references: [customers.id] }),
}));
```
🔺 Prisma (`schema.prisma`)
```prisma
model Customer {
  id      Int      @id @default(autoincrement())
  name    String
  rentals Rental[]
  @@map("customers")
}
model Rental {
  id         Int      @id @default(autoincrement())
  customer   Customer @relation(fields: [customerId], references: [id])
  customerId Int      @map("customer_id")
  laptop     String
  @@map("rentals")
}
```
🐢 Sequelize (class + ประกาศคอลัมน์ซ้ำ + ความสัมพันธ์)
```ts
class Customer extends Model<InferAttributes<Customer>, InferCreationAttributes<Customer>> {
  declare id: CreationOptional<number>;
  declare name: string;
}
class Rental extends Model<InferAttributes<Rental>, InferCreationAttributes<Rental>> {
  declare id: CreationOptional<number>;
  declare customerId: ForeignKey<Customer["id"]>;
  declare laptop: string;
}
Customer.init({ id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, name: { type: DataTypes.STRING, allowNull: false } },
  { sequelize, tableName: "customers" });
Rental.init({ id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, laptop: { type: DataTypes.STRING, allowNull: false } },
  { sequelize, tableName: "rentals" });
Customer.hasMany(Rental, { foreignKey: "customerId", as: "rentals" });
Rental.belongsTo(Customer, { foreignKey: "customerId" });
```

**② เพิ่มข้อมูลสมชายพร้อม rental**

🌧️ Drizzle
```ts
const [c] = await db.insert(customers).values({ name: "สมชาย" }).returning();
await db.insert(rentals).values({ customerId: c!.id, laptop: "Lenovo T14" });
```
🔺 Prisma
```ts
await prisma.customer.create({
  data: { name: "สมชาย", rentals: { create: [{ laptop: "Lenovo T14" }] } },
});
```
🐢 Sequelize
```ts
const c = await Customer.create({ name: "สมชาย" });
await Rental.create({ customerId: c.id, laptop: "Lenovo T14" });
```

**③ ดึงลูกค้าทุกคนพร้อม rental**

🌧️ Drizzle
```ts
await db.query.customers.findMany({ with: { rentals: true } });
```
🔺 Prisma
```ts
await prisma.customer.findMany({ include: { rentals: true } });
```
🐢 Sequelize
```ts
await Customer.findAll({ include: "rentals" });   // ใช้ชื่อ alias ที่ตั้งใน hasMany
```
ผลลัพธ์ของทั้งสาม (หน้าตา object เหมือนกัน):
```json
[{ "id": 1, "name": "สมชาย", "rentals": [{ "id": 1, "customerId": 1, "laptop": "Lenovo T14" }] }]
```
(Sequelize เพิ่ม `createdAt`/`updatedAt` ให้ทุกแถวเองโดยค่าตั้งต้น)

**สังเกต:** Drizzle/Prisma/Sequelize แต่ละตัวคิดต่างกันที่ "จุดประกาศ" แต่โจทย์เดียวกันได้ผลเดียวกัน ความรู้ SQL ที่เรียนบทที่ 6 (PK/FK/JOIN) ใช้ได้กับทุกตัว

---

## 5. ปัญหา N+1 (ต้องรู้!)

อยากแสดงลูกค้าทุกคนพร้อมรายการเช่า:
```ts
const all = await getAllCustomers();          // query ที่ 1: ได้ 100 คน
for (const c of all) {
  c.rentals = await getRentalsOf(c.id);       // query อีก 100 ครั้ง!
}
// รวม 101 queries 🐌
```

> 💡 เหมือนไปซูเปอร์มาร์เก็ต **ซื้อของทีละชิ้น ขับกลับบ้าน แล้วออกไปซื้อชิ้นต่อไป** 🚗🚗🚗 แทนที่จะจดรายการแล้วซื้อทีเดียว

![เปรียบเทียบ N+1 (ถาม DB 101 รอบ) กับการดึงพร้อมกันด้วย with หรือ include (1–2 query)](/img/08-n-plus-one.svg)
*ซ้าย: ถามทีละคน รอบเพิ่มตามจำนวนคน · ขวา: บอก ORM ว่าจะเอา rentals ด้วย ให้ดึงมาทีเดียว*

**ทางแก้:** สั่งให้ดึงข้อมูลที่เกี่ยวข้องมาพร้อมกัน
```ts
await db.query.customers.findMany({ with: { rentals: true } });      // Drizzle
await prisma.customer.findMany({ include: { rentals: true } });      // Prisma
await Customer.findAll({ include: Rental });                         // Sequelize
```

### 🔧 จับ N+1 ด้วย log: เห็นกับตา

เปิด log ของ Drizzle ด้วย `logger: true`
```ts
const db = drizzle(process.env.DATABASE_URL!, { schema, logger: true });
```
**แบบ N+1** (วนลูป query ทีละคน) log จะเต็มไปด้วยบรรทัดที่หน้าตาซ้ำกัน ต่างแค่ `params`
```text
Query: select "id", "name", "phone" from "customers"
Query: select "id", "customer_id", "laptop", "price_per_month" from "rentals" where "rentals"."customer_id" = $1 -- params: [1]
Query: select "id", "customer_id", "laptop", "price_per_month" from "rentals" where "rentals"."customer_id" = $1 -- params: [2]
Query: select "id", "customer_id", "laptop", "price_per_month" from "rentals" where "rentals"."customer_id" = $1 -- params: [3]
```
**แบบ `with`** ได้ query เดียวที่ join ให้เสร็จ (Drizzle กับ Postgres ใช้ `left join lateral`)
```text
Query: select "customers"."id", "customers"."name", "customers"."phone", "customers_rentals"."data" as "rentals" from "customers" "customers" left join lateral (select coalesce(json_agg(...), '[]'::json) as "data" from "rentals" "customers_rentals" where "customers_rentals"."customer_id" = "customers"."id") "customers_rentals" on true
```
Prisma เปิด log ด้วย `new PrismaClient({ adapter, log: ["query"] })` แล้วจะเห็น `include` ใช้ **2 query** (ดึง customers แล้วดึง rentals ด้วย `WHERE customer_id IN (...)`) ซึ่งก็ยังนับว่าไม่ใช่ N+1 เพราะจำนวน query คงที่ ไม่เพิ่มตามจำนวนคน

> ✅ **กฎจับ N+1:** ถ้ามี `await` ที่ยิง query อยู่ **ในลูป** (`for`, `.map`) ให้สงสัยไว้ก่อน แล้วเปิด log นับว่า 1 หน้าจอยิงกี่ query

---

## 6. 🔧 ลงมือ: Drizzle ตั้งแต่ศูนย์

```bash
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:17

mkdir drizzle-demo && cd drizzle-demo
npm init -y
npm install drizzle-orm pg dotenv
npm install -D drizzle-kit typescript tsx @types/node @types/pg
```
ใส่ `tsconfig.json` + `"type": "module"` ตาม [บทที่ 4](./04-typescript.md) แล้วสร้าง `.env`:
```
DATABASE_URL=postgres://postgres:secret@localhost:5432/postgres
```
> 💡 ถ้า `docker run` ขึ้น `port is already allocated` หรือต่อไม่ได้ ดูวิธีแก้ใน [บทที่ 7 ข้อ 11](./07-mysql-postgres.md) (และอย่าลืมแก้ port ใน `DATABASE_URL` ให้ตรง)
> (ตัวอย่างในบทนี้ทดสอบกับ `drizzle-orm` 0.45 และ `drizzle-kit` 0.31 · ถ้าติดตั้งรุ่นที่ใหม่กว่ามากและ API ไม่ตรง ให้ดู docs ที่ [orm.drizzle.team](https://orm.drizzle.team) ของรุ่นนั้น)

### ขั้นที่ 1: schema `src/db/schema.ts`
```ts
import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").unique(),
});

export const rentals = pgTable("rentals", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  laptop: text("laptop").notNull(),
  pricePerMonth: integer("price_per_month").notNull(),
});

// บอกความสัมพันธ์ เพื่อใช้ `with` ดึงพร้อมกันได้
export const customersRelations = relations(customers, ({ many }) => ({
  rentals: many(rentals),
}));
export const rentalsRelations = relations(rentals, ({ one }) => ({
  customer: one(customers, { fields: [rentals.customerId], references: [customers.id] }),
}));
```
👀 หน้าตาคล้าย `CREATE TABLE` ในบทที่ 6 มาก

อ่านทีละส่วน:
- `pgTable("customers", {...})` → ตารางชื่อ `customers` ใน DB (ชื่อ string ตัวแรก = ชื่อจริงใน DB)
- `serial("id").primaryKey()` → คอลัมน์ `id` เลขรัน เป็น PK · ชื่อตัวแปรฝั่งซ้าย (`customerId`) คือชื่อที่ใช้ในโค้ด ส่วน `"customer_id"` คือชื่อจริงในฐานข้อมูล
- `.notNull()` = `NOT NULL` · `.unique()` = `UNIQUE` · `.references(() => customers.id)` = FK
- `relations(...)` ไม่ได้สร้างอะไรใน DB เพียงบอก Drizzle ให้รู้ว่าตารางสัมพันธ์กันยังไง เพื่อให้ใช้ `with` ได้ (ถ้าลืม จะเจอ error ข้อ 9)

### ขั้นที่ 2: config `drizzle.config.ts` (วางนอก `src/`)
```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```
(`!` = บอก TS ว่า "มีค่าแน่นอน" ใช้ได้กับ config ที่เราคุมเอง)

### ขั้นที่ 3: สร้างและรัน migration
```bash
npx drizzle-kit generate      # อ่าน schema → สร้างไฟล์ SQL ใน drizzle/
npx drizzle-kit migrate       # รันไฟล์ SQL กับ DB จริง
```
ควรเห็น
```text
2 tables
customers 3 columns 0 indexes 0 fks
rentals 4 columns 0 indexes 1 fks

[✓] Your SQL migration file ➜ drizzle/0000_lucky_invisible_woman.sql 🚀
...
[✓] migrations applied successfully!
```
(ชื่อไฟล์หลัง `0000_` สุ่มได้ ต่างจากนี้ไม่ผิด)

เปิดไฟล์ใน `drizzle/` ดู → เป็น SQL ที่อ่านเข้าใจได้จากบทที่ 6 🎉
```sql
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"laptop" text NOT NULL,
	"price_per_month" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
```
โฟลเดอร์ `drizzle/` มีอะไรบ้าง:
```text
drizzle/
├── 0000_lucky_invisible_woman.sql   ← SQL ที่จะรัน
└── meta/
    ├── _journal.json                ← รายการ migration ตามลำดับ
    └── 0000_snapshot.json           ← ภาพ schema ณ ตอนนั้น (ใช้เทียบครั้งหน้า) ห้ามลบ!
```
ตรวจใน DB: เข้า psql แล้วลอง `\dt` จะเห็น `customers`, `rentals` และดูประวัติด้วย `SELECT id, created_at FROM drizzle.__drizzle_migrations;`

### ขั้นที่ 4: ใช้งาน `src/index.ts`
```ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "./db/schema.js";      // ESM ต้องใส่ .js

const db = drizzle(process.env.DATABASE_URL!, { schema });

const [somchai] = await db
  .insert(schema.customers)
  .values({ name: "สมชาย", phone: "081-111-1111" })
  .returning();

if (somchai) {
  await db.insert(schema.rentals).values([
    { customerId: somchai.id, laptop: "Lenovo T14", pricePerMonth: 1500 },
    { customerId: somchai.id, laptop: "Dell 5420", pricePerMonth: 1200 },
  ]);
}

const found = await db.select().from(schema.customers).where(eq(schema.customers.name, "สมชาย"));
console.log(found);

const withRentals = await db.query.customers.findMany({ with: { rentals: true } });
console.log(JSON.stringify(withRentals, null, 2));

process.exit(0);
```
```bash
npx tsx src/index.ts
```
ควรเห็น
```text
[ { id: 1, name: 'สมชาย', phone: '081-111-1111' } ]
[
  {
    "id": 1,
    "name": "สมชาย",
    "phone": "081-111-1111",
    "rentals": [
      { "id": 1, "customerId": 1, "laptop": "Lenovo T14", "pricePerMonth": 1500 },
      { "id": 2, "customerId": 1, "laptop": "Dell 5420", "pricePerMonth": 1200 }
    ]
  }
]
```
(รันซ้ำอีกรอบจะ error `duplicate key value violates unique constraint "customers_phone_unique"` เพราะเบอร์โทร `UNIQUE` ไม่ใช่บั๊ก)

💥 **ลองพังมันดู:** พิมพ์ `schema.customers.nmae` หรือใส่ `pricePerMonth: "แพง"` แล้วดูเส้นแดง
```text
error TS2339: Property 'nmae' does not exist on type 'PgTableWithColumns<...>'.
```
(ข้อความ type error ของ Drizzle ยาวและอ่านยาก ให้มองหาชื่อ field ที่มีเส้นแดงและข้อความ `does not exist` / `not assignable`) ตรวจทั้งโปรเจกต์ด้วย `npx tsc --noEmit`

### ขั้นที่ 5: เพิ่มคอลัมน์ด้วย migration ครั้งที่ 2
เพิ่ม `email: text("email")` ใน `customers` → `npx drizzle-kit generate` → ได้ไฟล์ใหม่ที่มี `ALTER TABLE ... ADD COLUMN` → `npx drizzle-kit migrate`
```text
drizzle/0001_bizarre_king_bedlam.sql
```
```sql
ALTER TABLE "customers" ADD COLUMN "email" text;
```
สังเกต: ไฟล์ `0000_...` ไม่ถูกแตะเลย เราได้ไฟล์ใหม่ต่อท้าย นี่คือหลัก "ไม่แก้ migration เก่า"

### ขั้นที่ 6: transaction
```ts
await db.transaction(async (tx) => {
  await tx.insert(schema.rentals).values({ customerId: 1, laptop: "Asus", pricePerMonth: 1100 });
  await tx.update(schema.customers).set({ phone: "089-000-0000" }).where(eq(schema.customers.id, 1));
  // ถ้ามี error ตรงไหน ทุกอย่างในนี้ถูกยกเลิกทั้งหมด
});
```
ฝั่งใน transaction ต้องใช้ **`tx`** ไม่ใช่ `db` (ถ้าไปเรียก `db` จะอยู่นอก transaction และไม่ถูกย้อนกลับ)

💥 **ลองพังมันดู:** ทำให้ขั้นที่ 2 ผิดกฎ (เช่น ตั้ง `phone` เป็นเบอร์ที่คนอื่นใช้อยู่แล้ว) แล้วดูว่า rental ที่เพิ่งใส่หายไปด้วยไหม
```ts
try {
  await db.transaction(async (tx) => {
    await tx.insert(schema.rentals).values({ customerId: 1, laptop: "Asus", pricePerMonth: 1100 });
    await tx.update(schema.customers).set({ phone: "083-333-3333" }).where(eq(schema.customers.id, 1));
  });
} catch (e) {
  console.log("ยกเลิกทั้งหมดแล้ว:", (e as Error).message.split("\n")[0]);
}
```
(สมมติว่า `083-333-3333` เป็นเบอร์ของลูกค้าอีกคนอยู่แล้ว) เมื่อเปิด `logger: true` ควรเห็น
```text
Query: begin
Query: insert into "rentals" ... -- params: [1, "Asus", 1100]
Query: update "customers" set "phone" = $1 where "customers"."id" = $2 -- params: ["083-333-3333", 1]
Query: rollback
ยกเลิกทั้งหมดแล้ว: Failed query: update "customers" set ...
```
`rollback` โผล่เอง และ rental "Asus" ไม่ถูกบันทึก (เช็คด้วย `select().from(schema.rentals)`) ถ้าอยากยกเลิกเองให้เรียก `tx.rollback()` ซึ่งจะ throw error ออกมาจาก `db.transaction` ให้ `catch` ไว้

> 💡 ตัวอย่างนี้ตรงกับ transaction ที่ทำด้วย SQL ในบทที่ 6 ข้อ 4 (เช่า laptop + เปลี่ยนสถานะ) ส่วนเรื่อง "2 คนกดพร้อมกัน" ก็ใช้วิธีเดียวกันได้ เช่น `tx.update(laptops).set({ status: "rented" }).where(and(eq(laptops.serial, "AS-01"), eq(laptops.status, "available"))).returning()` ถ้าได้ array ว่าง = มีคนเช่าไปก่อน

### ขั้นที่ 7: relations และ join

ดึงข้อมูลที่สัมพันธ์กันมี 2 แบบ เลือกตามความถนัด

**แบบ A: relational query (`db.query`)** ได้ผลเป็น object ซ้อนกัน ใช้ง่าย เหมาะกับหน้าจอ
```ts
// ลูกค้า 1 คน พร้อม rental
const one = await db.query.customers.findFirst({
  where: eq(schema.customers.id, 1),
  with: { rentals: true },
});

// เลือกเฉพาะคอลัมน์ + กรอง rental ที่แพงกว่า 1250
const some = await db.query.customers.findMany({
  columns: { name: true },
  with: {
    rentals: { columns: { laptop: true }, where: (r, { gt }) => gt(r.pricePerMonth, 1250) },
  },
});
console.log(JSON.stringify(some));
```
```text
[{"name":"สมชาย","rentals":[{"laptop":"Lenovo T14"}]},{"name":"สมหญิง","rentals":[{"laptop":"HP 840"}]},{"name":"มานี","rentals":[]}]
```
(คนที่ไม่มี rental ที่เข้าเงื่อนไข ยังอยู่ แค่ `rentals` เป็น array ว่าง)

**แบบ B: join แบบ SQL (`innerJoin` / `leftJoin`)** ได้ผลเป็น "แถวแบน" เหมาะกับรายงานและ GROUP BY
```ts
import { eq, count, sum } from "drizzle-orm";

const rows = await db
  .select({ name: schema.customers.name, laptop: schema.rentals.laptop })
  .from(schema.customers)
  .leftJoin(schema.rentals, eq(schema.rentals.customerId, schema.customers.id));
console.log(rows);
```
```text
[
  { name: 'สมชาย', laptop: 'Lenovo T14' },
  { name: 'สมชาย', laptop: 'Dell 5420' },
  { name: 'สมหญิง', laptop: 'HP 840' },
  { name: 'มานี', laptop: null }
]
```
`leftJoin` ให้ฝั่งขวาเป็น `null` ได้ (TS จะรู้ว่า `laptop: string | null`) ส่วน `innerJoin` ตัดคนที่ไม่มีคู่ออก เหมือน JOIN/LEFT JOIN ในบทที่ 6

**สรุปผล (GROUP BY)**
```ts
const summary = await db
  .select({
    name: schema.customers.name,
    total: count(schema.rentals.id),
    price: sum(schema.rentals.pricePerMonth),
  })
  .from(schema.customers)
  .leftJoin(schema.rentals, eq(schema.rentals.customerId, schema.customers.id))
  .groupBy(schema.customers.id, schema.customers.name)
  .orderBy(schema.customers.id);
console.log(summary);
```
```text
[
  { name: 'สมชาย', total: 2, price: '2700' },
  { name: 'สมหญิง', total: 1, price: '1300' },
  { name: 'มานี', total: 0, price: null }
]
```
⚠️ สังเกต `price` เป็น **string** (`'2700'`) หรือ `null` ไม่ใช่ number เพราะ Postgres คืน `SUM` เป็นชนิด numeric ที่อาจใหญ่เกิน number ของ JS ถ้าจะใช้คำนวณต้องแปลงเอง (`Number(row.price ?? 0)`) หรือใช้ `.mapWith(Number)` ใน Drizzle
ส่วน `count` ได้ number ปกติ

**เลือกแบบไหน?** ต้องการ "ลูกค้า 1 คน + รายการของเขาเป็นก้อน" → แบบ A · ต้องการตารางสรุป/รายงาน/เงื่อนไขซับซ้อน → แบบ B

### ขั้นที่ 8: Seed ข้อมูลตัวอย่าง

**Seed** = สคริปต์ที่ใส่ข้อมูลตัวอย่างให้ DB ทุกเครื่องในทีมได้ข้อมูลทดสอบเหมือนกัน (ไม่ต้องกดกรอกเองทีละแถว) สร้าง `src/seed.ts`
```ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./db/schema.js";

const db = drizzle(process.env.DATABASE_URL!, { schema });

// 1) ล้างของเก่า (เฉพาะ dev!) และให้เลข id เริ่มที่ 1 ใหม่
await db.execute(sql`TRUNCATE TABLE rentals, customers RESTART IDENTITY`);

// 2) ใส่ลูกค้า แล้วเอา id ที่ได้ไปใช้กับ rentals
const insertedCustomers = await db
  .insert(schema.customers)
  .values([
    { name: "สมชาย", phone: "081-111-1111" },
    { name: "สมหญิง", phone: "082-222-2222" },
    { name: "มานี", phone: "083-333-3333" },
  ])
  .returning();

const [somchai, somying] = insertedCustomers;
if (!somchai || !somying) throw new Error("seed customers failed");

await db.insert(schema.rentals).values([
  { customerId: somchai.id, laptop: "Lenovo T14", pricePerMonth: 1500 },
  { customerId: somchai.id, laptop: "Dell 5420", pricePerMonth: 1200 },
  { customerId: somying.id, laptop: "HP 840", pricePerMonth: 1300 },
]);

console.log("seed เสร็จ:", insertedCustomers.length, "ลูกค้า");
process.exit(0);
```
เพิ่มคำสั่งลัดใน `package.json`
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/seed.ts"
  }
}
```
```bash
npm run db:seed
```
```text
seed เสร็จ: 3 ลูกค้า
```
รันซ้ำกี่ครั้งก็ได้ผลเดิม (เพราะ `TRUNCATE` ล้างก่อน) นี่คือคุณสมบัติที่ดีของ seed คือ **รันซ้ำได้ (idempotent)**

> ⚠️ **กฎของ seed**
> - ใช้ **เฉพาะ dev/test** ห้ามรัน `TRUNCATE` บน production · ควรเช็คตัวแปรสภาพแวดล้อมก่อน (เช่น `if (process.env.NODE_ENV === "production") throw ...`)
> - ใส่ **ข้อมูลปลอม** เท่านั้น ห้ามคัดลอกข้อมูลลูกค้าจริงมาเป็น seed
> - ลำดับ: ใส่ตารางที่ถูกอ้างถึง (customers) ก่อนตารางที่มี FK (rentals) · ล้างย้อนกลับกัน (หรือ `TRUNCATE` ทั้งสองในคำสั่งเดียวอย่างข้างบน)
> - อยากเพิ่มแบบไม่ลบของเดิม ใช้ `.onConflictDoNothing()` ต่อท้าย `.values(...)` จะข้ามแถวที่ชนกฎ UNIQUE

> 💡 ข้อมูลเยอะๆ ให้ลอง library สร้างข้อมูลปลอม เช่น `@faker-js/faker` (ชื่อ อีเมล ที่อยู่ ปลอมๆ)

---

## 7. 🔧 Prisma ฉบับย่อ

> ⚠️ Prisma เปลี่ยนวิธี setup ค่อนข้างบ่อย ถ้าไม่ตรงให้ยึด **Quickstart ใน prisma.io/docs** ของเวอร์ชันที่ติดตั้ง
> ตัวอย่างนี้ทดสอบกับ Prisma 7 (`@prisma/client` 7.x) ให้ติดตั้ง `prisma@7` ให้เวอร์ชันตรงกับ client เพราะรุ่น `latest` ของแพ็กเกจ CLI อาจกระโดดไปรุ่นใหม่กว่า client ได้

```bash
mkdir prisma-demo && cd prisma-demo
npm init -y
npm install @prisma/client @prisma/adapter-pg pg dotenv
npm install -D prisma@7 typescript tsx @types/node @types/pg
npx prisma init --datasource-provider postgresql --output ../src/generated/prisma
```
คำสั่ง `init` สร้าง `prisma/schema.prisma`, ไฟล์ config ของ Prisma (`prisma.config.ts` — บางรุ่นตั้งชื่อ `prisma7.config.ts`) และ `.env` (แก้ `DATABASE_URL` ให้ตรง และตรวจว่า config โหลด `dotenv/config` แล้ว)

**schema** ต่อท้าย `prisma/schema.prisma`
```prisma
model Customer {
  id      Int      @id @default(autoincrement())
  name    String
  phone   String?  @unique
  rentals Rental[]
  @@map("customers")
}

model Rental {
  id            Int      @id @default(autoincrement())
  customer      Customer @relation(fields: [customerId], references: [id])
  customerId    Int      @map("customer_id")
  laptop        String
  pricePerMonth Int      @map("price_per_month")
  @@map("rentals")
}
```
```bash
npx prisma migrate dev --name init     # สร้าง + รัน migration
npx prisma generate                    # สร้าง client พร้อม type
npx prisma studio                      # 🎁 เปิดเว็บดู/แก้ข้อมูล
```
ควรเห็น
```text
Applying migration `20261020042055_init`

The following migration(s) have been created and applied from new schema changes:

prisma/migrations/
  └─ 20261020042055_init/
    └─ migration.sql

Your database is now in sync with your schema.
```
(ชื่อโฟลเดอร์ขึ้นต้นด้วยวันเวลาที่รัน ต่างจากนี้ไม่ผิด)

**ใช้งาน** `src/index.ts`
```ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

await prisma.customer.create({
  data: {
    name: "สมชาย",
    rentals: { create: [{ laptop: "Lenovo T14", pricePerMonth: 1500 }] },  // สร้างพร้อม rental
  },
});

const all = await prisma.customer.findMany({ include: { rentals: true } });
console.log(JSON.stringify(all, null, 2));

await prisma.$disconnect();
```
```bash
npx tsx src/index.ts
```
```text
[
  {
    "id": 1,
    "name": "สมชาย",
    "phone": null,
    "rentals": [
      { "id": 1, "customerId": 1, "laptop": "Lenovo T14", "pricePerMonth": 1500 }
    ]
  }
]
```
**Seed ใน Prisma:** เขียน `prisma/seed.ts` แล้วบอกคำสั่งในไฟล์ config
```ts
// ในไฟล์ config ของ Prisma
export default defineConfig({
  // ...
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
});
```
แล้วรัน `npx prisma db seed` ควรเห็น `The seed command has been executed.`

---

## 8. Sequelize ฉบับรู้จัก

ไม่ต้องลงมือ อ่านให้รู้หน้าตาเผื่อเจอในระบบเก่า
```ts
import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

const sequelize = new Sequelize(process.env.DATABASE_URL!);

class Customer extends Model<InferAttributes<Customer>, InferCreationAttributes<Customer>> {
  declare id: CreationOptional<number>;    // ประกาศ type รอบที่ 1...
  declare name: string;
}
Customer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },   // ...ประกาศคอลัมน์อีกรอบ
    name: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: "customers" },
);

const c = await Customer.findOne({ where: { name: "สมชาย" } });
```
👀 ต้องเขียนข้อมูลเดียวกัน **2 รอบ** แก้ที่หนึ่งลืมอีกที่ = บั๊ก นี่คือเหตุผลที่ทีมเลือก Drizzle/Prisma

ข้อควรรู้เมื่อเจอ Sequelize ในระบบเก่า:
- ความสัมพันธ์ต้องประกาศเอง (`hasMany` / `belongsTo`) แล้วถึงใช้ `include` ได้ (ดูตัวอย่างเทียบในข้อ 4)
- `sequelize.sync()` สร้างตารางจาก model ให้ได้ แต่ **ไม่ใช่ migration** (ใช้ทดลองเท่านั้น ระบบจริงใช้ `sequelize-cli` migration)
- เพิ่มคอลัมน์ `createdAt` / `updatedAt` ให้เองทุกตาราง (ปิดได้ด้วย `timestamps: false`)

---

## 9. 🛠 แก้ปัญหาที่เจอบ่อย (Troubleshooting)

### ❶ Migration drift: โครงสร้าง DB ไม่ตรงกับประวัติ migration

![แผนภาพ migration drift: ประวัติ migration ใน Git ไม่ตรงกับฐานข้อมูลจริงที่ถูกแก้ด้วยมือ ทำให้ migrate ล้มเหลว](/img/08-migration-drift.svg)
*drift = ฐานข้อมูลถูกแก้นอกระบบ migration (หรือลืมรัน migration) จนสถานะจริงไม่ตรงกับไฟล์*

**อาการ:** `migrate` ล้มเหลวด้วย error จากฐานข้อมูล เช่น
```text
column "email" of relation "customers" already exists
relation "customers" already exists
```
(drizzle-kit บางเวอร์ชันอาจจบด้วย exit code 1 โดยแสดงข้อความสั้นหรือไม่แสดงเลย ถ้าไม่เห็น error ให้เปิดไฟล์ SQL ล่าสุดแล้วรันตรงๆ ใน psql จะเห็นข้อความเต็มของ Postgres)

**สาเหตุที่พบบ่อย**
1. เพื่อน (หรือเรา) **แก้โครงสร้างด้วยมือ** ใน DB (psql/GUI) แทนที่จะผ่าน migration
2. ใช้ `drizzle-kit push` กับ DB แล้วค่อยมาใช้ `migrate` ทีหลัง
3. **ลืมรัน migration ล่าสุด** หลัง `git pull` (อาการกลับกัน: โค้ดใช้คอลัมน์ที่ DB ยังไม่มี → `column "xxx" does not exist`)
4. ลบ/แก้ไฟล์ migration ที่รันไปแล้ว

**วิธีแก้ (DB ทดลอง/dev ที่ข้อมูลไม่สำคัญ):**
1. ลบ DB แล้วเริ่มใหม่: `docker compose down -v` (หรือ `DROP DATABASE`) → สร้างใหม่ → `npx drizzle-kit migrate` → `npm run db:seed`
2. หรือย้อนการแก้มือให้ตรง (เช่น `ALTER TABLE customers DROP COLUMN email;`) แล้ว `migrate`

**ถ้าเป็น production:** อย่าลบ! ให้ backup ก่อน (ดู [บทที่ 7 ข้อ 9](./07-mysql-postgres.md)) แล้วสร้าง migration ที่ "ทำให้ตรงกับของจริง" อย่างระวัง และให้พี่ดูก่อนรัน

**กันไว้ก่อน:** ห้ามแก้โครงสร้างด้วยมือ · ทุกคนรัน `migrate` หลัง `git pull` · ใส่ `migrate` เป็นขั้นตอนใน deploy

### ❷ "relation not found": `Cannot read properties of undefined`
ในบริบทของ Drizzle คำว่า "relation" มี 2 ความหมาย:

**(ก) ตารางไม่มีใน DB** (error ของ Postgres)
```text
error: relation "customers" does not exist
```
→ ยังไม่ได้รัน migration กับ DB ตัวนี้ หรือต่อผิด database (ดู `DATABASE_URL`) แก้: `npx drizzle-kit migrate` และตรวจชื่อ DB ด้วย `\l` / `\dt`

**(ข) ความสัมพันธ์ใน Drizzle ยังไม่ถูกประกาศ** เมื่อใช้ `with: { rentals: true }`
```text
TypeError: Cannot read properties of undefined (reading 'referencedTable')
```
หรือ ถ้าลืมส่ง `schema` ตอนสร้าง `db`:
```text
TypeError: Cannot read properties of undefined (reading 'findMany')
```
แก้:
1. ตรวจว่ามี `relations(...)` ประกาศ **ทั้งสองฝั่ง** (`customersRelations` และ `rentalsRelations`) และ `export` ออกมา
2. ตรวจว่า `drizzle(url, { schema })` ส่ง `* as schema` ที่รวม `relations` ด้วย (ไม่ใช่ส่งแค่ตาราง)
3. ชื่อใน `with` ต้องตรงกับชื่อที่ประกาศใน `relations` (`rentals`) ถ้าพิมพ์ผิด (`rentalz`) TS จะฟ้อง `Object literal may only specify known properties ... Did you mean to write 'rentals'?`

### ❸ Type error ที่เจอบ่อย

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| `Property 'xxx' does not exist on type ...` | พิมพ์ชื่อคอลัมน์ผิด หรือ schema ยังไม่มีคอลัมน์นั้น | แก้ชื่อ / เพิ่มใน schema แล้ว generate |
| `No overload matches this call` ตอน `insert().values(...)` | ขาดฟิลด์ที่ `notNull` หรือชนิดไม่ตรง (เช่น ส่ง string ให้ `integer`) | ดูบรรทัดที่เป็นเส้นแดง เทียบกับ schema |
| ผลลัพธ์ `price` เป็น `string` ไม่ใช่ number | `SUM`/`NUMERIC` ของ Postgres คืนเป็น string | `Number(...)` หรือ `.mapWith(Number)` |
| `x` เป็น `... \| null` แล้ว TS ไม่ให้ใช้ | คอลัมน์ไม่ได้ `notNull` หรือมาจาก `leftJoin` | ตรวจ `null` ก่อนใช้ (`if (x)` หรือ `x ?? ค่าสำรอง`) |
| (Prisma) เพิ่ม/แก้ schema แล้ว type ไม่อัปเดต | ยังไม่ได้ `prisma generate` | รัน `npx prisma generate` (และ restart editor ถ้าจำเป็น) |
| `Cannot find module './db/schema'` ตอน `tsx` | ESM ต้องใส่นามสกุล | `import ... from "./db/schema.js"` |

### ❹ Connection pool exhausted: connection ไม่พอ

![แผนภาพ connection pool ที่ connection ถูกใช้หมด ทำให้คำขอถัดไปต้องรอจนเกิด timeout](/img/08-connection-pool.svg)
*pool เป็นสระ connection ที่จำกัดจำนวน ยืมแล้วต้องคืน ถ้าไม่คืนหรือ query ค้าง คำขอถัดไปจะรอจนหมดเวลา*

**อาการ 2 แบบ**
```text
timeout exceeded when trying to connect          ← แอปรอ connection ใน pool ไม่ไหว (เห็นจาก node-postgres)
FATAL:  sorry, too many clients already          ← ฝั่ง Postgres รับ connection เกินกำหนด (ค่าตั้งต้น max_connections = 100)
```
เราทดลองให้เห็นเองได้: pool ขนาด 2, ยืมไว้ 2 อันไม่คืน แล้วสั่ง query
```ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 1000 });
const db = drizzle({ client: pool });

const a = await pool.connect();   // ยืมแล้วไม่คืน
const b = await pool.connect();   // ยืมแล้วไม่คืน
try {
  await db.execute("select 1");   // pool หมดแล้ว ต้องรอ...
} catch (e) {
  console.log((e as any).cause?.message);
}
a.release(); b.release();         // คืน connection
await pool.end();
```
```text
timeout exceeded when trying to connect
```
**สาเหตุที่พบบ่อย**
1. **ยืม connection แล้วไม่คืน** (`pool.connect()` แล้วลืม `client.release()`, โดยเฉพาะตอนเกิด error ให้ใช้ `try/finally`) · ใช้ `db.query...`/`db.select()` ปกติ ORM จัดการคืนให้เอง
2. **สร้าง pool/client ใหม่ทุก request** (เช่น เรียก `drizzle(...)` ใน handler) แทนที่จะสร้างครั้งเดียวไว้ระดับ module → connection ล้นเร็วมาก ⚠️ แก้: สร้าง `db` ไฟล์เดียว (`src/db/index.ts`) แล้ว import ไปใช้
3. query ช้า/ค้าง (ไม่มี index, transaction ที่เปิดแล้วไม่จบ) ทำให้ connection ไม่ถูกคืน
4. รันหลายสำเนาของแอป (หลาย container) ที่แต่ละตัวมี pool ของตัวเอง ผลรวมเกิน `max_connections`
5. ตอน dev ใช้ hot reload (`tsx watch`, Next.js) สร้าง pool ซ้ำทุกครั้งที่โค้ดรีโหลดโดยไม่ปิดของเก่า

**วิธีแก้/กัน**
- สร้าง db/pool **ครั้งเดียว** ทั้งแอป
- กำหนด `max` ของ pool ให้พอเหมาะ (ค่าตั้งต้นของ `pg` คือ 10) · จำนวนแอป x `max` ต้องไม่เกิน `max_connections` ของ Postgres
- ตั้ง `connectionTimeoutMillis` ให้ error ชัด ไม่ค้างเงียบ
- ถ้าใช้ serverless ที่เปิดแอปใหม่ทีละมากๆ ให้ใช้ pooler ของบริการ (เช่น PgBouncer / connection pooling ของ Supabase, Neon)
- ปิด pool ให้เรียบร้อยเมื่อสคริปต์จบ (`await pool.end()` หรือ `process.exit(0)` อย่างในตัวอย่าง) ไม่งั้นสคริปต์อาจค้างไม่จบ

### ❺ ปัญหาอื่นที่เจอบ่อย

| อาการ | แก้ |
|---|---|
| `Cannot read properties of undefined` ที่ `process.env.DATABASE_URL` / ต่อ DB ไม่ได้ | ลืม `import "dotenv/config"` หรือไฟล์ `.env` ไม่อยู่ที่รากโปรเจกต์ หรือสะกดชื่อตัวแปรผิด |
| `drizzle-kit` ไม่เจอ schema | ตรวจ path ใน `drizzle.config.ts` (`schema: "./src/db/schema.ts"`) ว่าถูกและรันจากรากโปรเจกต์ |
| `generate` แล้วบอก "No schema changes" ทั้งที่แก้แล้ว | ลืมบันทึกไฟล์ / แก้ผิดไฟล์ / schema ตรงกับ snapshot อยู่แล้ว |
| ต่อ DB แล้ว `password authentication failed` / `connection refused` | ดู [บทที่ 7 ข้อ 11](./07-mysql-postgres.md) |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ทำไม ORM กัน SQL injection ได้?</summary>

ส่งค่าจากผู้ใช้เป็น parameter แยกจากคำสั่ง ฐานข้อมูลจึงมองเป็น "ข้อมูล" เสมอ ไม่ใช่ "คำสั่ง"
</details>

<details><summary>2. เพื่อนเพิ่มคอลัมน์ใน DB เครื่องตัวเองด้วยมือ แล้ว push โค้ดที่ใช้คอลัมน์นั้น เกิดอะไร?</summary>

เครื่องคนอื่นและ production ไม่มีคอลัมน์นั้น โค้ด error ตอนรัน ต้องทำเป็น migration แล้ว commit ไปด้วย
</details>

<details><summary>3. หน้ารายการลูกค้า 50 คนช้ามาก log มี query 51 ครั้ง คืออะไร?</summary>

N+1 แก้ด้วย `with` (Drizzle) / `include` (Prisma, Sequelize)
</details>

<details><summary>4. migration ไฟล์ <code>0001_...sql</code> รันไปแล้วแต่พบว่าตั้งชื่อคอลัมน์ผิด จะแก้ยังไง?</summary>

ห้ามแก้ไฟล์ `0001` ให้แก้ `schema.ts` แล้ว `generate` เป็นไฟล์ใหม่ (`0002`) ที่เปลี่ยนชื่อคอลัมน์ แล้ว `migrate` (อ่านไฟล์ SQL ว่าเป็น `RENAME` ไม่ใช่ `DROP` + `ADD`)
</details>

<details><summary>5. <code>generate</code> กับ <code>migrate</code> ต่างกันยังไง? ทำไมแยก 2 คำสั่ง?</summary>

`generate` สร้างไฟล์ SQL จากความต่างของ schema (ยังไม่แตะ DB) `migrate` เอาไฟล์ไปรันกับ DB จริง แยกกันเพื่อให้เรา (และเพื่อนร่วมทีม) อ่านรีวิว SQL ก่อนรัน และให้ทุกสภาพแวดล้อมรันไฟล์ชุดเดียวกัน
</details>

<details><summary>6. เรียก <code>db.insert(...)</code> ข้างใน <code>db.transaction(async (tx) =&gt; ...)</code> ผิดตรงไหน?</summary>

ต้องใช้ `tx.insert(...)` ถ้าใช้ `db` คำสั่งนั้นจะรันนอก transaction ไม่ถูก rollback เมื่อเกิด error
</details>

<details><summary>7. โค้ดเรียก <code>drizzle(...)</code> ภายใน handler ของทุก request แล้วเจอ <code>sorry, too many clients already</code> เกิดจากอะไร แก้ยังไง?</summary>

สร้าง pool/connection ใหม่ทุก request จนเกิน `max_connections` ของ Postgres แก้โดยสร้าง `db` ครั้งเดียวระดับ module แล้ว import ใช้ซ้ำ
</details>

<details><summary>8. <code>SUM(price_per_month)</code> ผ่าน Drizzle ได้ค่าเป็น string และมานี (ไม่มี rental) ได้ <code>null</code> ควรจัดการยังไง?</summary>

แปลงเอง `Number(row.price ?? 0)` (หรือ `.mapWith(Number)` และ `COALESCE` ใน SQL) เพราะ `SUM` ของ numeric คืนเป็น string และ `SUM` ของแถวว่างเป็น NULL
</details>

---

## ✏️ แบบฝึกหัด

ทำข้อ 6 (Drizzle) ให้ครบทั้ง 8 ขั้น แนบ screenshot ผลลัพธ์ลูกค้าพร้อม rental
มีเวลาเหลือ ลองข้อ 7 (Prisma) แล้วเขียน 3–5 บรรทัดว่าชอบตัวไหนกว่า เพราะอะไร

โจทย์เสริม:
1. เปิด `logger: true` แล้วเขียนโค้ด N+1 แบบตั้งใจ (วนลูป query) เทียบ log กับแบบ `with` นับจำนวน query
2. ทำให้เกิด migration drift ในเครื่องตัวเอง (เพิ่มคอลัมน์ด้วย psql ก่อน แล้วเพิ่มใน schema + `generate` + `migrate`) อ่าน error และแก้ให้หาย
3. ทำให้เกิด `timeout exceeded when trying to connect` ด้วย pool ขนาด 2 แล้วแก้ด้วยการคืน connection

## ✅ ผ่านด่าน

- [ ] อธิบาย SQL injection และวิธีป้องกันได้
- [ ] อธิบายว่า ORM และ migration คืออะไร ทำไมต้องใช้ (รวมข้อดี/ข้อเสียเทียบกับ SQL ดิบ)
- [ ] ตั้งโปรเจกต์ Drizzle, สร้าง migration, query ได้
- [ ] อธิบายความต่างของ `generate` / `migrate` / `push` และกฎ "ไม่แก้ migration ที่รันแล้ว"
- [ ] ดึงข้อมูลที่สัมพันธ์กันด้วย `with` และ `leftJoin` ได้
- [ ] เขียน transaction และเขียน seed script ได้
- [ ] รู้จักปัญหา N+1 และวิธีแก้ (และเปิด log ตรวจได้)
- [ ] แก้ปัญหา migration drift, relation ไม่เจอ และ connection pool หมดได้

---

[← บทที่ 7: MySQL vs PostgreSQL](./07-mysql-postgres.md) · [🏠 สารบัญ](/) · [บทที่ 9: Debugging →](./09-debugging.md)
