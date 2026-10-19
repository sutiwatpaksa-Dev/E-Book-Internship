# บทที่ 8: Drizzle vs Prisma vs Sequelize 🌉

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 4, 5, 6 · 🛠 ใช้: TypeScript, Docker, PostgreSQL

> **⚡ สรุป 30 วินาที**
> - เขียน SQL เป็นข้อความในโค้ด = ไม่มี type, พิมพ์ผิดไม่รู้, เสี่ยง **SQL injection**
> - **ORM** แปลงโค้ด TypeScript เป็น SQL ให้ ได้ type ครบและปลอดภัย (แต่ยังต้องรู้ SQL!)
> - **Migration** = ประวัติการเปลี่ยนโครงสร้าง DB ทุกการเปลี่ยนต้องผ่าน migration
> - ระวัง **N+1** ดึงข้อมูลที่เกี่ยวข้องพร้อมกันด้วย `with` / `include`
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

**ข้อเสียที่ต้องรู้**
- ต้องเรียนวิธีใช้ของแต่ละตัว
- query ซับซ้อนมาก บางทีเขียน SQL เองง่ายกว่า (ORM ส่วนใหญ่ให้เขียน SQL ดิบได้)
- ไม่รู้ว่า ORM สร้าง SQL อะไร อาจได้ query ช้าโดยไม่รู้ตัว → **ORM ไม่ได้แทนการรู้ SQL**

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

**ทางแก้:** สั่งให้ดึงข้อมูลที่เกี่ยวข้องมาพร้อมกัน
```ts
await db.query.customers.findMany({ with: { rentals: true } });      // Drizzle
await prisma.customer.findMany({ include: { rentals: true } });      // Prisma
await Customer.findAll({ include: Rental });                         // Sequelize
```

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
เปิดไฟล์ใน `drizzle/` ดู → เป็น SQL ที่อ่านเข้าใจได้จากบทที่ 6 🎉

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
💥 **ลองพังมันดู:** พิมพ์ `schema.customers.nmae` หรือใส่ `pricePerMonth: "แพง"` แล้วดูเส้นแดง

### ขั้นที่ 5: เพิ่มคอลัมน์ด้วย migration ครั้งที่ 2
เพิ่ม `email: text("email")` ใน `customers` → `npx drizzle-kit generate` → ได้ไฟล์ใหม่ที่มี `ALTER TABLE ... ADD COLUMN` → `npx drizzle-kit migrate`

### ขั้นที่ 6: transaction
```ts
await db.transaction(async (tx) => {
  await tx.insert(schema.rentals).values({ customerId: 1, laptop: "Asus", pricePerMonth: 1100 });
  await tx.update(schema.customers).set({ phone: "089-000-0000" }).where(eq(schema.customers.id, 1));
  // ถ้ามี error ตรงไหน ทุกอย่างในนี้ถูกยกเลิกทั้งหมด
});
```

---

## 7. 🔧 Prisma ฉบับย่อ

> ⚠️ Prisma เปลี่ยนวิธี setup ค่อนข้างบ่อย ถ้าไม่ตรงให้ยึด **Quickstart ใน prisma.io/docs** ของเวอร์ชันที่ติดตั้ง

```bash
mkdir prisma-demo && cd prisma-demo
npm init -y
npm install @prisma/client @prisma/adapter-pg pg dotenv
npm install -D prisma typescript tsx @types/node @types/pg
npx prisma init --datasource-provider postgresql --output ../src/generated/prisma
```
คำสั่ง `init` สร้าง `prisma/schema.prisma`, `prisma.config.ts` และ `.env` (แก้ `DATABASE_URL` ให้ตรง)

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

---

## ✏️ แบบฝึกหัด

ทำข้อ 6 (Drizzle) ให้ครบทั้ง 6 ขั้น แนบ screenshot ผลลัพธ์ลูกค้าพร้อม rental
มีเวลาเหลือ ลองข้อ 7 (Prisma) แล้วเขียน 3–5 บรรทัดว่าชอบตัวไหนกว่า เพราะอะไร

## ✅ ผ่านด่าน

- [ ] อธิบาย SQL injection และวิธีป้องกันได้
- [ ] อธิบายว่า ORM และ migration คืออะไร ทำไมต้องใช้
- [ ] ตั้งโปรเจกต์ Drizzle, สร้าง migration, query ได้
- [ ] รู้จักปัญหา N+1 และวิธีแก้

---

[← บทที่ 7: MySQL vs PostgreSQL](./07-mysql-postgres.md) · [🏠 สารบัญ](/) · [บทที่ 9: Debugging →](./09-debugging.md)
