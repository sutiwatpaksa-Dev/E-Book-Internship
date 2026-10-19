# บทที่ 4: JavaScript vs TypeScript 🟦

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 3 · 🛠 ใช้: Node.js, VS Code

> **⚡ สรุป 30 วินาที**
> - JavaScript ยืดหยุ่น แต่ **ปล่อยบั๊กผ่านเงียบๆ**
> - TypeScript = JavaScript + **type** ตรวจเจอบั๊กตั้งแต่ตอนพิมพ์
> - TS ต้องแปลงเป็น JS ก่อนรัน และ type **ไม่มีอยู่ตอนรัน** → ข้อมูลจากข้างนอกต้องตรวจด้วย **Zod**
> - **นโยบายบริษัท: TypeScript เป็นอย่างน้อย ไม่เขียน JavaScript ล้วนแล้ว**

---

## 📖 เรื่องเล่า

บิตเขียนฟังก์ชันคิด VAT ให้ระบบเช่าโน้ตบุ๊คด้วย JavaScript ทดสอบแล้วผ่าน ส่งงานอย่างภูมิใจ
สามวันต่อมาลูกค้าโทรมา: *"ทำไมใบแจ้งหนี้เขียนว่าต้องจ่าย **1,500,105** บาทคะ?"* 😱

```js
function addVat(price) {
  return price + price * 0.07;
}
addVat(1500);     // 1605 ✅  (ตอนบิตทดสอบ)
addVat("1500");   // "1500105" ❌ (ตอนข้อมูลมาจากฟอร์ม ซึ่งเป็นข้อความ)
```
`"1500" + 105` ใน JavaScript คือ **ต่อข้อความ** ไม่ใช่บวกเลข และไม่มี error ใดๆ เตือนเลย

---

## 1. JavaScript: ยืดหยุ่นจนอันตราย

**JavaScript (JS)** เริ่มจากภาษาทำหน้าเว็บให้โต้ตอบได้ ปัจจุบันเขียนได้ทั้งเว็บ server แอปมือถือ เป็นภาษาที่คนใช้มากที่สุดในโลก

จุดเด่นคือ **ตัวแปรเก็บอะไรก็ได้ เปลี่ยนเมื่อไหร่ก็ได้**
```js
let price = 100;
price = "ร้อยบาท";     // ได้! ไม่มีใครห้าม
```
ข้อเสียคือบั๊กหลุดง่าย:
```js
function calcTotal(price, qty) { return price * qty; }
calcTotal(100);              // NaN (ลืมส่ง qty)
calcTotal({ price: 100 }, 2); // NaN
```

> 🤓 **เกร็ด:** JavaScript เวอร์ชันแรกเขียนเสร็จใน **10 วัน** เมื่อปี 1995 และชื่อ "Java" ใส่ไว้เพื่อการตลาดล้วนๆ จริงๆ ไม่เกี่ยวกับภาษา Java เลย ☕❌

---

## 2. TypeScript คืออะไร

**TypeScript (TS)** = **JavaScript + ระบบ type** สร้างโดย Microsoft เราบอกล่วงหน้าว่าข้อมูลแต่ละตัว "ต้องเป็นชนิดไหน" แล้วเครื่องมือตรวจให้ตั้งแต่ตอนเขียน

```ts
function addVat(price: number): number {
  return price + price * 0.07;
}
addVat("1500");
// ❌ Argument of type 'string' is not assignable to parameter of type 'number'.
```
VS Code ขีด **เส้นแดง** ทันที ก่อนรันด้วยซ้ำ บั๊กของบิตจะไม่มีวันถึงมือลูกค้า

> 💡 **เปรียบเทียบ:** JavaScript = **เขียนจดหมายแล้วส่งเลย** ผิดตรงไหนผู้รับบอกทีหลัง
> TypeScript = **มีโปรแกรมตรวจคำผิด** ขีดเส้นแดงตั้งแต่พิมพ์ ✍️

**3 เรื่องที่ต้องเข้าใจ**
1. TS เป็น **superset** ของ JS = เรียน JS อะไรมาใช้ได้หมด
2. Browser และ Node **รู้จักแค่ JS** → TS ต้อง **แปลง (compile)** เป็น JS โดยตัด type ทิ้ง
3. type มีผล **แค่ตอนเขียน/build** ตอนรันความเร็วเท่า JS

```
  index.ts  --tsc (ตรวจ type + แปลง)-->  index.js  --node-->  โปรแกรมทำงาน
                       |
                 type ผิด → แจ้ง error ไม่ยอม build
```

| หัวข้อ | JavaScript | TypeScript |
|---|---|---|
| ตรวจชนิดข้อมูล | ตอนรัน | ก่อนรัน |
| เจอบั๊กตอนไหน | ตอนลูกค้าใช้ 😱 | ตอนพิมพ์โค้ด 😌 |
| Autocomplete | เดาๆ | แม่นมาก |
| เปลี่ยนชื่อตัวแปร/ฟังก์ชัน | เสี่ยงพลาดบางจุด | compiler บอกทุกจุด |
| ทำงานเป็นทีม | ต้องอ่านโค้ดทั้งหมดถึงรู้ว่ารับอะไร | type เป็นเอกสารในตัว |
| ต้อง build | ไม่ต้อง | ต้อง (หรือใช้ tsx/Bun รันตรง) |

> **ทำไมบริษัทบังคับ TypeScript?** งานลูกค้าต้องดูแลยาวหลายปี หลายคนแก้โค้ดชุดเดียวกัน และเกี่ยวกับเงิน/สต็อก ราคาของบั๊กแพงมาก

---

## 3. 🔧 ลงมือ: โปรเจกต์ TypeScript ตั้งแต่ศูนย์

```bash
mkdir ts-basic && cd ts-basic
npm init -y
npm install -D typescript tsx @types/node
```
| package | คืออะไร |
|---|---|
| `typescript` | compiler ชื่อคำสั่ง `tsc` |
| `tsx` | รันไฟล์ `.ts` ได้ทันทีตอน dev |
| `@types/node` | คำอธิบาย type ของ Node (ให้ TS รู้จัก `process`, `console`) |

สร้าง `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```
| ค่า | ความหมาย |
|---|---|
| `strict: true` | **เปิดตรวจแบบเข้มทั้งหมด (บริษัทบังคับ)** |
| `noUncheckedIndexedAccess` | เตือนว่า `arr[5]` อาจเป็น `undefined` |
| `outDir` / `rootDir` | โค้ดอยู่ `src/` ผลลัพธ์ไป `dist/` |
| `module` / `moduleResolution` | ระบบ import แบบที่ Node ใช้ |

ใน `package.json` เพิ่ม `"type": "module"` และ `scripts`:
```json
"type": "module",
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "typecheck": "tsc --noEmit"
}
```

`src/index.ts`
```ts
const shop: string = "Blicktech";
console.log(`Hello from ${shop}`);
```
```bash
npm run dev          # รันทันที แก้ไฟล์แล้วรันใหม่เอง (Ctrl+C หยุด)
npm run typecheck    # ตรวจ type ไม่มี output = ผ่าน ✅
npm run build        # สร้าง dist/index.js
npm start
```
เปิด `dist/index.js` ดู → `: string` หายไป เหลือ JS ธรรมดา 👀

---

## 4. พื้นฐาน TypeScript 10 เรื่อง

> 💡 แนะนำให้เปิด **[TypeScript Playground](https://www.typescriptlang.org/play)** แล้วลองพิมพ์ตามไปด้วย เห็นเส้นแดงทันทีโดยไม่ต้องตั้งโปรเจกต์

### ① Type พื้นฐาน
```ts
let name: string = "บิต";
let age: number = 21;            // ไม่แยก int/float ทุกอย่างคือ number
let isActive: boolean = true;
let tags: string[] = ["pos", "rental"];
```

### ② ไม่ต้องเขียน type ทุกที่ (inference)
```ts
let city = "Hat Yai";      // TS เดาเองว่าเป็น string
city = 5;                  // ❌
```
> หลักง่ายๆ: **เขียน type ที่ parameter ของฟังก์ชันเสมอ** ตัวแปรทั่วไปให้ TS เดาเอง

### ③ Object ด้วย interface
```ts
interface Laptop {
  id: number;
  brand: string;
  model: string;
  serial: string;
  ramGb: number;
  note?: string;           // ? = มีหรือไม่มีก็ได้
}

const lp: Laptop = { id: 1, brand: "Lenovo", model: "T14", serial: "PF-001", ramGb: 16 };
lp.ram;   // ❌ Property 'ram' does not exist on type 'Laptop'. Did you mean 'ramGb'?
```
พิมพ์ผิด TS บอก และ **แนะนำชื่อที่ถูกให้ด้วย**

### ④ Union: เป็นได้หลายแบบ แต่ต้องอยู่ในรายการ
```ts
type LaptopStatus = "available" | "rented" | "repair";

let status: LaptopStatus = "available";   // ✅
status = "avaliable";                     // ❌ พิมพ์ผิด (ตก i) จับได้ทันที
```

### ⑤ `type` vs `interface`
บอกรูปร่าง object ได้ทั้งคู่ มือใหม่จำแค่นี้พอ: **object → `interface` / union → `type`**

### ⑥ Function
```ts
function addVat(price: number, rate: number = 0.07): number {
  return price + price * rate;
}
const formatBaht = (n: number): string => `${n.toLocaleString("th-TH")} บาท`;
```

### ⑦ `undefined` และการเช็คก่อนใช้
```ts
function findLaptop(id: number): Laptop | undefined {
  return laptops.find((l) => l.id === id);
}

const found = findLaptop(99);
found.brand;        // ❌ 'found' is possibly 'undefined'.
if (found) {
  found.brand;      // ✅ ในนี้ TS รู้แล้วว่ามีค่า
}
found?.brand;       // ✅ ?. = ไม่มีก็ได้ undefined ไม่พัง
```
> 🤓 `Cannot read properties of undefined` คือ error อันดับต้นๆ ของ JavaScript ทั้งโลก TS บังคับให้คิดเรื่องนี้ทุกครั้ง

### ⑧ `any` 🚫 vs `unknown` ✅
```ts
let a: any = getData();
a.foo.bar.baz();          // TS ไม่ตรวจอะไรเลย = กลับเป็น JavaScript

let u: unknown = getData();
u.foo;                    // ❌ ต้องเช็คก่อน
if (typeof u === "string") u.toUpperCase();   // ✅
```
**บริษัทห้ามใช้ `any`** ไม่รู้ชนิดจริงๆ ให้ใช้ `unknown` แล้วเช็คก่อน

### ⑨ Generic: ช่องว่างให้เติม type ทีหลัง
```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}
first([1, 2, 3]);       // number | undefined
first(["a", "b"]);      // string | undefined
```
เจอบ่อยใน library เช่น `Promise<Laptop>`, `Array<string>`

### ⑩ Utility types: สร้าง type ใหม่จาก type เดิม
```ts
type NewLaptop   = Omit<Laptop, "id">;               // ตอนสร้างยังไม่มี id
type LaptopPatch = Partial<NewLaptop>;               // แก้บาง field
type LaptopCard  = Pick<Laptop, "brand" | "model">;  // เลือกบาง field
```

**โบนัส: async / await**
```ts
async function getLaptop(id: number): Promise<Laptop | null> {
  const res = await fetch(`http://localhost:3000/laptops/${id}`);
  if (!res.ok) return null;
  return (await res.json()) as Laptop;   // ⚠️ as = "เชื่อฉัน" TS ไม่ได้ตรวจจริง (ดูข้อ 5)
}
```
- `async` = ฟังก์ชันที่ต้องรอ (network, DB) ผลเป็น `Promise`
- `await` = รอให้เสร็จก่อนไปบรรทัดถัดไป

---

## 5. ข้อจำกัด: TypeScript ไม่ได้ตรวจข้อมูลตอนรัน

type ถูกตัดทิ้งตอน build ข้อมูลที่มาจาก **ข้างนอก** (ฟอร์ม, API อื่น, ไฟล์) TS ไม่รู้หน้าตาจริง ถ้ามีคนส่ง `{ "ramGb": "สิบหก" }` มา TS ช่วยไม่ได้

ทางแก้: **Zod** ตรวจข้อมูลจริงตอนรัน
```bash
npm install zod
```
```ts
import { z } from "zod";

const LaptopSchema = z.object({
  brand: z.string().min(1),
  model: z.string(),
  serial: z.string(),
  ramGb: z.number().int().positive(),
});

type NewLaptop = z.infer<typeof LaptopSchema>;   // ได้ type จาก schema ไม่ต้องเขียนซ้ำ

const result = LaptopSchema.safeParse(input);
if (!result.success) {
  console.log(result.error.issues);   // บอกว่าผิด field ไหน
} else {
  const laptop = result.data;         // มั่นใจได้ว่าถูกต้อง + มี type
}
```
> 💡 **TypeScript ตรวจโค้ดของเรา / Zod ตรวจข้อมูลจากข้างนอก** 🛂 ใช้คู่กันเสมอ

---

## 6. วิธีรัน TypeScript

| วิธี | คำสั่ง | ตรวจ type? | ใช้เมื่อ |
|---|---|---|---|
| `tsc` | `npx tsc` แล้ว `node dist/index.js` | ✅ | build ใช้งานจริง |
| `tsc --noEmit` | ตรวจอย่างเดียว | ✅ | ก่อน commit |
| `tsx` | `npx tsx src/index.ts` | ❌ | ตอน dev |
| Node รุ่นใหม่ | `node src/index.ts` | ❌ | script เล็กๆ |
| Bun | `bun src/index.ts` | ❌ | script / เมื่อทีมตกลงใช้ |

> ⚠️ **กับดักใหญ่:** `tsx`, Node, Bun แค่ **ตัด type ทิ้งแล้วรัน** โค้ดที่ type ผิดก็ยังรันได้! ต้องดูเส้นแดงใน VS Code และรัน `npm run typecheck` ก่อน commit เสมอ

---

## 7. ⚠️ อ่าน error ให้เป็น

```
src/index.ts:12:15 - error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```
| ส่วน | ความหมาย |
|---|---|
| `src/index.ts:12:15` | ไฟล์ · บรรทัด 12 · ตัวอักษรที่ 15 (คลิกใน VS Code ได้) |
| `TS2345` | รหัส error เอาไปค้น Google ได้ |
| ข้อความ | **อ่านจากหลังมาหน้า:** "ต้องการ number แต่ส่ง string มา" |

| ข้อความที่เจอบ่อย | แปลว่า |
|---|---|
| `is not assignable to type` | ชนิดข้อมูลไม่ตรง |
| `Property 'x' does not exist` | ไม่มี field นี้ (มักพิมพ์ผิด) |
| `is possibly 'undefined'` | อาจไม่มีค่า ต้องเช็คก่อน |
| `Cannot find module` | ยังไม่ติดตั้ง package หรือ path ผิด |
| `Could not find a declaration file` | ติดตั้ง `@types/ชื่อ package` เพิ่ม |
| `Relative import paths need explicit file extensions` | ต้องเขียน `import { x } from "./utils.js"` (ใส่ `.js` แม้ไฟล์จริงเป็น `.ts`) |

**กฎของทีม** 📏
- `"strict": true` ทุกโปรเจกต์
- ห้าม `any` (ใช้ `unknown`)
- ห้าม `// @ts-ignore` ถ้าจำเป็นจริงใช้ `// @ts-expect-error` พร้อมเหตุผล
- ห้ามมีไฟล์ `.js` ใน `src/`

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. TypeScript รันเร็วกว่า JavaScript ไหม?</summary>

ไม่ สุดท้ายแปลงเป็น JS แล้วรันเหมือนกัน ข้อดีอยู่ที่ตอนเขียน: เจอบั๊กเร็ว อ่านง่าย แก้ไขปลอดภัย
</details>

<details><summary>2. ทำไม <code>any</code> อันตราย?</summary>

ปิดการตรวจ type ของตัวนั้นทั้งหมด และลามไปตัวแปรอื่นที่รับค่าต่อ กลับไปเจอบั๊กแบบ JS
</details>

<details><summary>3. มี interface แล้ว ทำไมต้องใช้ Zod ตรวจข้อมูลจากผู้ใช้อีก?</summary>

interface หายไปตอน build ไม่มีอยู่ตอนรัน ตรวจข้อมูลจริงไม่ได้ Zod เป็นโค้ดที่รันตรวจจริง
</details>

---

## ✏️ แบบฝึกหัด

เขียน `src/cart.ts` มี `interface CartItem` และฟังก์ชัน `addItem`, `removeItem`, `calcTotal` (ส่วนลด % + VAT 7%) ต้องผ่าน `npm run typecheck`
ใน README จด **บั๊กอย่างน้อย 2 แบบที่ JavaScript จะปล่อยผ่าน แต่ TypeScript จับได้**

## ✅ ผ่านด่าน

- [ ] ตั้งโปรเจกต์ TS + `tsconfig.json` เองได้
- [ ] ใช้ interface, union, optional, generic ได้
- [ ] รู้ว่าทำไมห้าม `any` และ `unknown` ใช้ยังไง
- [ ] รู้ว่า TS ไม่ได้ตรวจข้อมูลตอนรัน และใช้ Zod แทน

---

[← บทที่ 3: Node vs Yarn vs Bun](./03-node-yarn-bun.md) · [🏠 สารบัญ](./README.md) · [บทที่ 5: HTTP & REST API →](./05-http-api.md)
