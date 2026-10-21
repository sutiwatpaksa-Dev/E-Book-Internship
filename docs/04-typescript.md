# บทที่ 4: JavaScript vs TypeScript 🟦

> ⏱ ประมาณ 5 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 3 · 🛠 ใช้: Node.js, VS Code

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
addVat("1500");   // "1500105.00000000000001" ❌ (ตอนข้อมูลมาจากฟอร์ม ซึ่งเป็นข้อความ)
```
`"1500" + 105.00000000000001` ใน JavaScript คือ **ต่อข้อความ** ไม่ใช่บวกเลข และไม่มี error ใดๆ เตือนเลย

> 🤓 **สังเกตไหม `1500 * 0.07` ได้ `105.00000000000001` ไม่ใช่ `105` พอดี?**
> คอมเก็บทศนิยมเป็นเลขฐาน 2 ซึ่งเก็บบางค่าได้ไม่เป๊ะ ลองพิมพ์ `0.1 + 0.2` ใน Console จะได้ `0.30000000000000004`
> 💰 **กฎเรื่องเงิน:** ห้ามเก็บเงินเป็นทศนิยม ให้เก็บเป็น **จำนวนเต็มหน่วยเล็กสุด** เช่น สตางค์ (`150000` = 1,500.00 บาท) แล้วปัดเศษ (`Math.round`) ทุกครั้งที่คูณหาร ค่อยแปลงเป็นบาทตอนแสดงผล
> งาน STARTER ก็เก็บราคาเป็นจำนวนเต็มด้วยเหตุผลนี้ (บทที่ 14) ดูตัวอย่างลงมือจริงในข้อ 4 หัวข้อ "💰 ลงมือ: คิด VAT ให้ถูก"

---

## 1. JavaScript: ยืดหยุ่นจนอันตราย

**JavaScript (JS)** เริ่มจากภาษาทำหน้าเว็บให้โต้ตอบได้ ปัจจุบันเขียนได้ทั้งเว็บ server แอปมือถือ เป็นภาษาที่คนใช้มากที่สุดในโลก

### ถ้ายังไม่เคยเขียนโปรแกรมเลย: คำศัพท์ 5 คำที่ต้องรู้ก่อน

| คำ | แปลว่า | 💡 เปรียบเทียบ |
|---|---|---|
| **ตัวแปร (variable)** | กล่องที่ตั้งชื่อ ไว้เก็บค่า | กล่องมีป้ายชื่อ |
| **ชนิดข้อมูล (type)** | ค่าในกล่องเป็นแบบไหน: ข้อความ ตัวเลข จริง/เท็จ | ป้ายบอกว่ากล่องนี้ใส่ของอะไรได้ |
| **ฟังก์ชัน (function)** | ชุดคำสั่งที่ตั้งชื่อไว้ เรียกใช้ซ้ำได้ | สูตรอาหาร: ใส่วัตถุดิบ (argument) ได้อาหารกลับมา (return) |
| **array** | รายการเรียงกัน เริ่มนับที่ **0** | แถวล็อกเกอร์ ช่องแรกคือเบอร์ 0 |
| **object** | ของที่มีหลายช่อง แต่ละช่องมีชื่อ | บัตรประจำตัว: ชื่อ, นามสกุล, เลขบัตร |

ลองรันดู (สร้างไฟล์ `try.js` แล้วรัน `node try.js`):
```js
const shopName = "Blicktech";      // const = ตั้งแล้วเปลี่ยนค่าไม่ได้
let stock = 5;                     // let = เปลี่ยนค่าได้
stock = stock - 1;
console.log(shopName, stock);

function add(a, b) { return a + b; }
console.log(add(2, 3), add("2", 3));

const laptop = { brand: "Lenovo", ramGb: 16 };   // object
console.log(laptop.brand, laptop["ramGb"]);

const list = ["a", "b"];                          // array
list.push("c");
console.log(list.length, list[0], list);
```
**ควรเห็น**
```
Blicktech 4
5 23
Lenovo 16
3 a [ 'a', 'b', 'c' ]
```
สังเกตบรรทัดที่ 2: `add("2", 3)` ได้ `"23"` (ข้อความ) ไม่ใช่ `5` และไม่มี error ใดๆ นี่คือปัญหาแบบเดียวกับที่บิตเจอ

> 💡 **ใช้ `const` เป็นค่าเริ่มต้น** เปลี่ยนเป็น `let` ก็ต่อเมื่อต้องเปลี่ยนค่าจริงๆ (ไม่ใช้ `var` ซึ่งเป็นแบบเก่า)

จุดเด่นของ JS คือ **ตัวแปรเก็บอะไรก็ได้ เปลี่ยนเมื่อไหร่ก็ได้**
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

![แผนภาพ TypeScript ผ่าน tsc ตรวจ type และตัด type เป็น JavaScript แล้ว node รัน](/img/04-compile-flow.svg)
*ไฟล์ .ts ผ่าน tsc: ตรวจ type แล้วตัด type ทิ้งเหลือ .js ธรรมดาให้ node รัน ส่วน tsx/Bun ข้ามขั้นตรวจ type ไปเลย*

> 🔎 **tsc = "TypeScript Compiler"** ทำสองหน้าที่ในคำสั่งเดียว: (1) ตรวจ type (2) แปลงเป็น `.js` ถ้าอยากให้ตรวจอย่างเดียวไม่สร้างไฟล์ ใช้ `tsc --noEmit`

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

**ขั้นที่ 1: สร้างโฟลเดอร์และติดตั้งเครื่องมือ**
```bash
mkdir ts-basic && cd ts-basic
npm init -y
npm install -D typescript tsx @types/node
```
**ควรเห็น** (ตัวเลขจำนวน package อาจต่างกัน)
```
added 7 packages, and audited 8 packages in 1s
found 0 vulnerabilities
```
และมีไฟล์ `package.json`, `node_modules/` เพิ่มในโฟลเดอร์

| package | คืออะไร |
|---|---|
| `typescript` | compiler ชื่อคำสั่ง `tsc` |
| `tsx` | รันไฟล์ `.ts` ได้ทันทีตอน dev |
| `@types/node` | คำอธิบาย type ของ Node (ให้ TS รู้จัก `process`, `console`) ต้องเปิดใช้ใน `tsconfig.json` ด้วย ดู `types` ในขั้นที่ 2 |

> 💡 `-D` = ติดตั้งเป็น **devDependencies** (ใช้ตอนพัฒนาเท่านั้น ไม่ต้องติดไปกับของที่ส่งขึ้น server)

**ขั้นที่ 2: สร้าง `tsconfig.json`** (ไฟล์ตั้งค่าของ compiler ไว้ที่โฟลเดอร์หลัก)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmitOnError": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
```
| ค่า | ความหมาย |
|---|---|
| `target` | แปลงเป็น JS เวอร์ชันไหน (`ES2022` = Node รุ่นใหม่รันได้หมด) |
| `strict: true` | **เปิดตรวจแบบเข้มทั้งหมด (บริษัทบังคับ)** |
| `noUncheckedIndexedAccess` | เตือนว่า `arr[5]` อาจเป็น `undefined` |
| `noEmitOnError` | ถ้ามี type error **ไม่สร้างไฟล์ `.js`** (กันเผลอเอาโค้ดที่ผิดไปรัน) |
| `outDir` / `rootDir` | โค้ดอยู่ `src/` ผลลัพธ์ไป `dist/` |
| `module` / `moduleResolution` | ระบบ import แบบที่ Node ใช้ |
| `include` | บอกว่าให้ตรวจไฟล์ในโฟลเดอร์ไหน |
| `types: ["node"]` | โหลด type ของ Node จาก `@types/node` (ให้ TS รู้จัก `process`, `Buffer`) TypeScript 7 ไม่โหลด `@types/*` ให้เองอีกแล้ว ถ้าไม่ใส่จะเจอ `TS2591: Cannot find name 'process'` แม้ติดตั้ง `@types/node` แล้ว |

> 🔎 **`strict: true` เป็นสวิตช์รวม** เปิดการตรวจเข้มหลายข้อ ที่สำคัญที่สุด 2 ข้อสำหรับมือใหม่คือ
> - **`noImplicitAny`**: ห้ามปล่อย parameter ไม่ใส่ type จน TS ต้อง "ยอมรับว่าเป็น any"
> - **`strictNullChecks`**: `null`/`undefined` ไม่ใช่ค่าที่ใส่ใน `string` หรือ `number` ได้เงียบๆ ต้องเช็คก่อนใช้
> ถ้าปิด `strict` เส้นแดงจะหายไปเกือบหมด แต่บั๊กไม่ได้หายไปด้วย

**ขั้นที่ 3: ตั้ง `package.json`** เพิ่ม `"type": "module"` และ `scripts`
```json
"type": "module",
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "typecheck": "tsc --noEmit"
}
```
**ขั้นที่ 4: เขียนโค้ด** สร้าง `src/index.ts`
```ts
const shop: string = "Blicktech";
console.log(`Hello from ${shop}`);
```
**ขั้นที่ 5: รันและตรวจ**
```bash
npm run dev          # รันทันที แก้ไฟล์แล้วรันใหม่เอง (Ctrl+C หยุด)
```
**ควรเห็น**
```
Hello from Blicktech
```
```bash
npm run typecheck    # ตรวจ type ไม่มี output = ผ่าน ✅
```
**ควรเห็น** (มีแค่สองบรรทัดที่ npm พิมพ์ชื่อคำสั่ง ไม่มี error)
```
> ts-basic@1.0.0 typecheck
> tsc --noEmit
```
```bash
npm run build        # สร้าง dist/index.js
npm start
```
**ควรเห็น**
```
Hello from Blicktech
```
เปิด `dist/index.js` ดู 👀
```js
const shop = "Blicktech";
console.log(`Hello from ${shop}`);
export {};
```
`: string` หายไป เหลือ JS ธรรมดา (บรรทัด `export {};` คือ TS ทำเครื่องหมายว่าไฟล์นี้เป็น module ไม่ต้องสนใจ)

---

## 4. พื้นฐาน TypeScript 10 เรื่อง

> 💡 แนะนำให้เปิด **[TypeScript Playground](https://www.typescriptlang.org/play)** แล้วลองพิมพ์ตามไปด้วย เห็นเส้นแดงทันทีโดยไม่ต้องตั้งโปรเจกต์ (หรือสร้างไฟล์ `src/lesson.ts` ในโปรเจกต์ข้อ 3 แล้วรัน `npx tsx src/lesson.ts`)

### ① Type พื้นฐาน

![การ์ดชนิดข้อมูลพื้นฐานของ TypeScript](/img/04-types-boxes.svg)
*ตัวแปรเหมือนกล่องที่มีป้าย type บอกว่าใส่อะไรได้ ใส่ผิดชนิด TS จะขีดแดง*

```ts
let name: string = "บิต";
let age: number = 21;            // ไม่แยก int/float ทุกอย่างคือ number
let isActive: boolean = true;
let tags: string[] = ["pos", "rental"];
```
| type | เก็บอะไร | ตัวอย่างค่า |
|---|---|---|
| `string` | ข้อความ | `"บิต"`, `'abc'`, `` `Hello ${name}` `` |
| `number` | ตัวเลขทุกแบบ | `21`, `3.14`, `-5` |
| `boolean` | จริง/เท็จ | `true`, `false` |
| `string[]` | รายการข้อความ | `["a", "b"]` |
| `null` / `undefined` | "ไม่มีค่า" (สองแบบ) | `null` = ตั้งใจให้ว่าง · `undefined` = ยังไม่ได้ใส่ค่า |

ใส่ผิดชนิดก็ขีดแดง:
```ts
let age: number = 21;
age = "ยี่สิบเอ็ด";   // ❌ Type 'string' is not assignable to type 'number'.
```
ตัวแปร `const` เปลี่ยนค่าไม่ได้ TS จับให้:
```ts
const shop = "Blicktech";
shop = "x";   // ❌ Cannot assign to 'shop' because it is a constant.
```

### ② ไม่ต้องเขียน type ทุกที่ (inference)
```ts
let city = "Hat Yai";      // TS เดาเองว่าเป็น string
city = 5;                  // ❌
```
> หลักง่ายๆ: **เขียน type ที่ parameter ของฟังก์ชันเสมอ** ตัวแปรทั่วไปให้ TS เดาเอง

> 💡 เอาเมาส์ชี้ที่ชื่อตัวแปรใน VS Code จะเห็น type ที่ TS เดาไว้ เป็นวิธีที่ดีที่สุดในการ "เรียนรู้ว่า TS คิดอะไรอยู่"

### ③ Object ด้วย interface และ array ของ object
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
lp.ramgb;   // ❌ Property 'ramgb' does not exist on type 'Laptop'. Did you mean 'ramGb'?
```
พิมพ์ผิด (ตัวพิมพ์เล็ก/ใหญ่ก็นับ) TS บอก และ **แนะนำชื่อที่ถูกให้ด้วย**

ลืมช่องที่จำเป็น หรือใส่ช่องที่ไม่มีใน interface ก็ถูกจับ:
```ts
const a: Laptop = { id: 1 };
// ❌ Type '{ id: number; }' is missing the following properties from type 'Laptop': brand, model, serial, ramGb
const b: Laptop = { id: 1, brand: "x", model: "y", serial: "z", ramGb: 8, colour: "red" };
// ❌ Object literal may only specify known properties, and 'colour' does not exist in type 'Laptop'.
```
**Array ของ object** กับ 3 เมธอดที่ใช้บ่อยที่สุด (`map` แปลงทุกตัว · `filter` คัดบางตัว · `find` หาตัวแรก) ลองสร้าง `src/lesson.ts`:
```ts
interface Laptop {
  id: number;
  brand: string;
  ramGb: number;
  note?: string;
}

const laptops: Laptop[] = [
  { id: 1, brand: "Lenovo", ramGb: 16 },
  { id: 2, brand: "Dell", ramGb: 8, note: "จอร้าว" },
];

const brands = laptops.map((l) => l.brand);          // เอาเฉพาะยี่ห้อ
const bigRam = laptops.filter((l) => l.ramGb >= 16); // เลือกเฉพาะที่แรมตั้งแต่ 16
const found = laptops.find((l) => l.id === 99);      // หาตัวแรกที่ตรงเงื่อนไข

console.log(brands);
console.log(bigRam);
console.log(found);
console.log(found?.brand ?? "ไม่พบเครื่องนี้");
console.log(laptops[0]?.note ?? "ไม่มีหมายเหตุ");
```
```bash
npx tsx src/lesson.ts
```
**ควรเห็น**
```
[ 'Lenovo', 'Dell' ]
[ { id: 1, brand: 'Lenovo', ramGb: 16 } ]
undefined
ไม่พบเครื่องนี้
ไม่มีหมายเหตุ
```
(`found` เป็น `undefined` เพราะไม่มี id 99 ส่วน `?.` กับ `??` อธิบายในข้อ ⑦)

### ④ Union และ Literal: เป็นได้หลายแบบ แต่ต้องอยู่ในรายการ
```ts
type LaptopStatus = "available" | "rented" | "repair";

let status: LaptopStatus = "available";   // ✅
status = "avaliable";                     // ❌ พิมพ์ผิด (ตก i) จับได้ทันที
```
TS บอกชัดเจน: `Type '"avaliable"' is not assignable to type 'LaptopStatus'. Did you mean '"available"'?`

- `"available"` (ค่าตายตัวเป็นข้อความ) เรียกว่า **literal type**
- เครื่องหมาย `|` อ่านว่า "หรือ" รวมกันเรียกว่า **union type**
- union ใช้กับชนิดต่างกันได้ด้วย เช่น `string | number` (รับได้ทั้งข้อความและเลข)

> 💡 **เทียบกับ enum ใน database:** ถ้าคอลัมน์ `status` มีได้แค่ 3 ค่า ให้ประกาศ union เดียวกันนี้ใน TS จะได้ไม่มีใครใส่ค่าอื่น

### ⑤ `type` vs `interface`
บอกรูปร่าง object ได้ทั้งคู่ มือใหม่จำแค่นี้พอ: **object → `interface` / union → `type`**

| | `interface` | `type` (type alias) |
|---|---|---|
| บอกรูปร่าง object | ✅ | ✅ |
| ตั้งชื่อ union (`"a" \| "b"`) | ❌ | ✅ |
| ต่อยอดจากของเดิม | `extends` | `&` (intersection) |
| ใช้บ่อยกับ | object ของ domain เช่น `Laptop`, `Customer` | union, ชื่อเรียก type สั้นๆ |

```ts
interface Item { id: number }
interface Product extends Item { price: number }   // Product มี id และ price

type Base = { id: number };
type Rental = Base & { days: number };             // Rental มี id และ days
```
ใช้ผิดแบบไหนก็ไม่พัง ขอแค่ **ทั้งโปรเจกต์ใช้แนวเดียวกัน** (ทีมเราใช้ตามตารางข้างบน)

### ⑥ Function
```ts
function addVat(price: number, rate: number = 0.07): number {
  return price + price * rate;
}
const formatBaht = (n: number): string => `${n.toLocaleString("th-TH")} บาท`;
```
อ่านโครงสร้าง: `function ชื่อ(parameter: type): type ที่คืนค่า`
- `rate: number = 0.07` คือ parameter ที่มีค่าเริ่มต้น เรียกโดยไม่ส่งก็ได้
- `price?: number` (ใส่ `?`) คือ parameter ที่ส่งหรือไม่ส่งก็ได้ ค่าข้างในจะเป็น `number | undefined`
- ฟังก์ชันที่ไม่คืนค่าอะไรให้ใช้ `: void`
- `(n) => ...` เรียกว่า **arrow function** เขียนสั้นกว่า มักใช้กับ `map`/`filter`

ส่งผิดจำนวนก็ถูกจับ:
```ts
function calcTotal(price: number, qty: number): number { return price * qty; }
calcTotal(100);   // ❌ Expected 2 arguments, but got 1.
```
(ใน JS เดิม `calcTotal(100)` ได้ `NaN` เงียบๆ)

### ⑦ `undefined` / `null`: การเช็คก่อนใช้ (narrowing)
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
found?.brand ?? "ไม่พบ";   // ✅ ?? = ถ้าซ้ายเป็น undefined/null ให้ใช้ค่าขวาแทน
```
> 🤓 `Cannot read properties of undefined` คือ error อันดับต้นๆ ของ JavaScript ทั้งโลก TS บังคับให้คิดเรื่องนี้ทุกครั้ง

**การเช็คเพื่อให้ type แคบลงเรียกว่า narrowing** TS อ่านเงื่อนไข `if` ของเราแล้ว "จำ" ว่าในบล็อกนั้นตัวแปรเป็นชนิดอะไรแน่

![แผนภาพ type narrowing ของตัวแปรที่เป็น string, number หรือ null](/img/04-narrowing.svg)
*เช็คทีละเงื่อนไข type ค่อยๆ แคบลง จนใน else สุดท้ายเหลือ number ตัวเดียว*

เพิ่มลงใน `src/lesson.ts`:
```ts
function describe(v: string | number | null): string {
  if (v === null) return "ว่าง";
  if (typeof v === "string") return `ข้อความยาว ${v.length} ตัว`;
  return `ตัวเลข ${v.toFixed(1)}`;
}
console.log(describe(null));
console.log(describe("abc"));
console.log(describe(3));
```
**ควรเห็น**
```
ว่าง
ข้อความยาว 3 ตัว
ตัวเลข 3.0
```
ถ้าไม่เช็คก่อน แล้วเรียก `v.toUpperCase()` ตรงๆ TS จะไม่ยอม 2 ข้อ: `'v' is possibly 'null'.` (ถ้าเป็น `null` จะเรียกเมธอดอะไรก็พัง) และ `Property 'toUpperCase' does not exist on type 'string | number'.` (ถ้า `v` เป็นเลขก็ไม่มีเมธอดนี้) TS ไล่ดูทุกชนิดที่ `v` อาจเป็น แล้วเตือนทุกกรณีที่พังได้

| วิธีเช็ค | ใช้กับ | ตัวอย่าง |
|---|---|---|
| `if (x)` | มีค่า/ไม่มีค่า | `if (found) {...}` |
| `x === null` / `x === undefined` | เช็คเฉพาะ | `if (v === null) return` |
| `typeof x === "string"` | ชนิดพื้นฐาน | `typeof v === "number"` |
| `"field" in obj` | หน้าตา object | `if ("note" in lp) {...}` |
| ค่าตัวบอกชนิด (discriminant) | union ของ object | ดูด้านล่าง |

**Union ของ object แบบมีตัวบอกชนิด (discriminated union)** ใช้บ่อยมากเวลาตอบผลสำเร็จ/ล้มเหลว:
```ts
type Result =
  | { ok: true; data: Laptop }
  | { ok: false; error: string };

function show(r: Result) {
  if (r.ok) return r.data.brand;   // ในนี้ TS รู้ว่ามี data
  return r.error;                  // ในนี้ TS รู้ว่ามี error
}
```

### ⑧ `any` 🚫 vs `unknown` ✅
```ts
let a: any = getData();
a.foo.bar.baz();          // TS ไม่ตรวจอะไรเลย = กลับเป็น JavaScript

let u: unknown = getData();
u.foo;                    // ❌ 'u' is of type 'unknown'.  ต้องเช็คก่อน
if (typeof u === "string") u.toUpperCase();   // ✅
```
**บริษัทห้ามใช้ `any`** ไม่รู้ชนิดจริงๆ ให้ใช้ `unknown` แล้วเช็คก่อน

> 💡 `any` = "ปิดไฟตรวจของ TS" · `unknown` = "ยังไม่รู้ว่าคืออะไร ขอเช็คก่อนใช้" ผลคือปลอดภัยกว่ามาก

### ⑨ Generic: ช่องว่างให้เติม type ทีหลัง
> 💡 **เปรียบเทียบ:** กล่องพัสดุเปล่า 📦 ที่เขียนป้ายว่า "ใส่ได้ 1 ชนิด" ใส่ส้มก็เป็นกล่องส้ม ใส่แอปเปิลก็เป็นกล่องแอปเปิล ตัวกล่องเขียนครั้งเดียวใช้ได้ทุกผลไม้ `T` คือ "ช่องว่างสำหรับชนิดที่จะเติม"

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}
first([1, 2, 3]);       // number | undefined
first(["a", "b"]);      // string | undefined
```
เพิ่มลง `src/lesson.ts` แล้วรัน:
```ts
console.log(first([1, 2, 3]));
console.log(first(["a", "b"]));
console.log(first([]));
```
**ควรเห็น**
```
1
a
undefined
```
เจอบ่อยใน library เช่น `Promise<Laptop>`, `Array<string>` (= `string[]`) ตอนนี้แค่ **อ่านออก** ก็พอ ยังไม่ต้องเขียนเองเก่ง
```ts
type Box<T> = { value: T };
const b: Box<number> = { value: 5 };   // T = number
```

### ⑩ Utility types: สร้าง type ใหม่จาก type เดิม
```ts
type NewLaptop   = Omit<Laptop, "id">;               // ตอนสร้างยังไม่มี id
type LaptopPatch = Partial<NewLaptop>;               // แก้บาง field
type LaptopCard  = Pick<Laptop, "brand" | "model">;  // เลือกบาง field
```
| utility | ทำอะไร |
|---|---|
| `Omit<T, "x">` | เอา T มา ตัดช่อง x ทิ้ง |
| `Pick<T, "x" \| "y">` | เอา T มาเฉพาะช่อง x, y |
| `Partial<T>` | ทุกช่องกลายเป็น "ใส่หรือไม่ใส่ก็ได้" |
| `Required<T>` | ตรงข้ามกับ Partial ทุกช่องต้องมี |

### 💰 ลงมือ: คิด VAT ให้ถูก (เก็บเงินเป็นสตางค์)

กลับมาแก้บั๊กของบิต หลัก 3 ข้อ: **เก็บเป็นจำนวนเต็มสตางค์ · ปัดเศษด้วย `Math.round` · แปลงเป็นบาทตอนแสดงผลเท่านั้น**

สร้าง `src/money.ts`:
```ts
export function addVatSatang(priceSatang: number, ratePercent = 7): number {
  return Math.round(priceSatang + (priceSatang * ratePercent) / 100);
}

export function formatBaht(satang: number): string {
  return (satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 2 }) + " บาท";
}
```
และ `src/index.ts` (แทนที่เนื้อหา Hello เดิม):
```ts
import { addVatSatang, formatBaht } from "./money.js";

console.log(1500 * 0.07, 0.1 + 0.2);      // ทศนิยม: เพี้ยน
console.log(addVatSatang(150000));        // จำนวนเต็ม: เป๊ะ
console.log(formatBaht(addVatSatang(150000)));
```
```bash
npx tsx src/index.ts
```
**ควรเห็น**
```
105.00000000000001 0.30000000000000004
160500
1,605.00 บาท
```
ส่วน `addVatSatang("150000")` ตอนนี้ **TS ขีดแดงทันที** (`Argument of type 'string' is not assignable to parameter of type 'number'`) ไม่มีวันเกิดเหตุการณ์ "1500105" อีก 🎉

> ⚠️ **ยังไม่จบ:** ถ้าตัวเลขมาจากฟอร์มบนเว็บ (เป็นข้อความเสมอ) TS ไม่รู้ ต้องให้ Zod ตรวจ/แปลงตอนรับข้อมูล (ดูข้อ 5)

### โบนัส A: async / await และ Promise

บางงานต้อง "รอ" เช่น ดึงข้อมูลจากเน็ต, อ่านไฟล์, query ฐานข้อมูล ถ้าโปรแกรมหยุดรอเฉยๆ ทุกอย่างจะค้าง JavaScript จึงใช้ **Promise** = **ใบรับของ** ที่ยังไม่ได้ของ แต่สัญญาว่าจะได้ (หรือแจ้งว่าพัง)

![สถานะของ Promise และเส้นเวลาของฟังก์ชันที่ใช้ await](/img/04-promise-timeline.svg)
*Promise เริ่มที่ pending แล้วเป็น fulfilled (ได้ค่า) หรือ rejected (พัง) ส่วน await คือการรอผลโดยไม่ทำให้ทั้งโปรแกรมค้าง*

```ts
async function getLaptop(id: number): Promise<Laptop | null> {
  const res = await fetch(`http://localhost:3000/laptops/${id}`);
  if (!res.ok) return null;
  return (await res.json()) as Laptop;   // ⚠️ as = "เชื่อฉัน" TS ไม่ได้ตรวจจริง (ดูข้อ 5)
}
```
- `async` = ฟังก์ชันที่ต้องรอ (network, DB) ผลเป็น `Promise`
- `await` = รอให้เสร็จก่อนไปบรรทัดถัดไป ใช้ได้ **เฉพาะใน `async` function** (หรือระดับบนสุดของไฟล์ module)
- `Promise<Laptop | null>` = "สัญญาว่าจะได้ Laptop หรือ null" (นี่คือ generic ข้อ ⑨)

ลองรันจริง สร้าง `src/async-demo.ts`:
```ts
function wait(ms: number): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve(`รอ ${ms} ms แล้ว`), ms));
}

async function main() {
  console.log("เริ่ม");
  const msg = await wait(300);          // รอ 0.3 วินาที
  console.log(msg);

  try {
    const res = await fetch("http://localhost:1/x");   // พอร์ตนี้ไม่มีใครรอ
    console.log(res.status);
  } catch (e) {
    console.log("จับ error ได้:", e instanceof Error ? e.message : e);
  }

  const [a, c] = await Promise.all([wait(200), wait(200)]);   // รอพร้อมกัน รวม 0.2 วินาที
  console.log(a, c);
}

main();
console.log("บรรทัดนี้ขึ้นก่อน (ไม่รอ main)");
```
```bash
npx tsx src/async-demo.ts
```
**ควรเห็น**
```
เริ่ม
บรรทัดนี้ขึ้นก่อน (ไม่รอ main)
รอ 300 ms แล้ว
จับ error ได้: fetch failed
รอ 200 ms แล้ว รอ 200 ms แล้ว
```
สิ่งที่ต้องสังเกต
1. "บรรทัดนี้ขึ้นก่อน" ออกก่อนผลของ `await` เพราะ `main()` หยุดรอ แต่โปรแกรมส่วนที่เหลือไม่ค้าง
2. การรอที่พังต้องใช้ **`try / catch`** ถ้าไม่ครอบ error จะหลุดจนโปรแกรมล้ม
3. `Promise.all([...])` รอหลายงานพร้อมกัน เร็วกว่ารอทีละงาน

> ⚠️ ลืม `await` เป็นบั๊กคลาสสิก: ตัวแปรจะได้ `Promise` แทนที่จะเป็นค่าจริง (เช่น พิมพ์ออกมาเป็น `Promise { <pending> }`)

### โบนัส B: แยกไฟล์ด้วย `export` / `import`

โปรเจกต์จริงมีหลายสิบไฟล์ ไฟล์ละเรื่อง ไฟล์ไหนอยากให้คนอื่นใช้ ให้ใส่ `export` ไฟล์ที่จะใช้ก็ `import` มา

![ไฟล์ money.ts ส่งออกฟังก์ชัน ไฟล์ index.ts นำเข้ามาใช้](/img/04-modules.svg)
*export = เปิดให้ไฟล์อื่นหยิบไปใช้ · import = หยิบมาใช้ (ตัวอย่างจริงอยู่ที่หัวข้อ 💰 ด้านบน)*

```ts
// money.ts
export function formatBaht(satang: number): string { /* ... */ }
export const VAT_PERCENT = 7;

// index.ts
import { formatBaht, VAT_PERCENT } from "./money.js";   // ไฟล์ของเรา: ขึ้นต้น ./ และลงท้าย .js
import { z } from "zod";                                // package ที่ติดตั้ง: ใส่แค่ชื่อ
```
- `./` = โฟลเดอร์เดียวกับไฟล์นี้ · `../` = ขึ้นไปหนึ่งชั้น
- **เขียน `.js` แม้ไฟล์จริงเป็น `.ts`** (เพราะ Node ดูชื่อไฟล์หลังแปลงแล้ว) ถ้าลืมจะเจอ `Relative import paths need explicit file extensions`
- `export default` ก็มี แต่ทีมเราเลือกใช้ `export` ชื่อตรงๆ เพราะค้นหาและเปลี่ยนชื่อง่ายกว่า

---

## 5. ข้อจำกัด: TypeScript ไม่ได้ตรวจข้อมูลตอนรัน

type ถูกตัดทิ้งตอน build ข้อมูลที่มาจาก **ข้างนอก** (ฟอร์ม, API อื่น, ไฟล์) TS ไม่รู้หน้าตาจริง ถ้ามีคนส่ง `{ "ramGb": "สิบหก" }` มา TS ช่วยไม่ได้

![TypeScript ตรวจโค้ดตอน build ส่วน Zod ตรวจข้อมูลจากข้างนอกตอนรัน](/img/04-compile-vs-runtime.svg)
*TypeScript อยู่ฝั่ง "ตอนเขียน" ส่วนข้อมูลจากข้างนอกมาตอน "รันจริง" ต้องให้ Zod ซึ่งเป็นโค้ดที่รันจริงตรวจให้*

**ลองให้เห็นกับตา** ว่า `as` โกหกได้ (สร้าง `src/cast-demo.ts`)
```ts
interface Spec { ramGb: number }
const fromOutside = JSON.parse('{"ramGb":"สิบหก"}') as Spec;   // as = สั่งให้ TS เชื่อ
console.log(typeof fromOutside.ramGb);   // TS เชื่อว่า number แต่จริงๆ คือ...
```
**ควรเห็น**
```
string
```
TS ไม่ขีดแดงสักเส้น แต่ค่าจริงเป็น `string` นี่คือเหตุผลที่ต้องมี Zod

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
ลองส่งข้อมูลผิดเข้าไป (ให้ `input` เป็น `{ brand: "Lenovo", model: "T14", serial: "PF-1", ramGb: "สิบหก" }` ที่ได้จาก `JSON.parse` และพิมพ์ `JSON.stringify(result.error.issues, null, 2)`)

**ควรเห็น**
```json
[
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "ramGb"
    ],
    "message": "Invalid input: expected number, received string"
  }
]
```
อ่านได้ว่า: ช่อง `ramGb` (`path`) ต้องเป็น `number` แต่ได้ `string` ส่วนข้อมูลที่ถูกต้องจะได้ `success: true` และ `result.data` ที่มี type ครบ

> 💡 **TypeScript ตรวจโค้ดของเรา / Zod ตรวจข้อมูลจากข้างนอก** 🛂 ใช้คู่กันเสมอ

| | TypeScript (type) | Zod (schema) |
|---|---|---|
| ตรวจตอนไหน | ตอนเขียน/build | ตอนรันจริง |
| อยู่ใน JS ที่รัน | ❌ ถูกลบทิ้ง | ✅ เป็นโค้ดจริง |
| ตรวจอะไร | โค้ดของเราเอง | ข้อมูลจากข้างนอก (ฟอร์ม, API, ไฟล์, `JSON.parse`) |
| ถ้าผิด | เส้นแดง / build ไม่ผ่าน | `success: false` + บอกว่าช่องไหนผิด |

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

> 💡 ถ้าข้อความยาวหลายบรรทัด ให้อ่าน **บรรทัดสุดท้าย** ก่อน มักเป็นสาเหตุจริง ส่วนบรรทัดแรกเป็นแค่ภาพรวม

### ตาราง error ที่เจอบ่อย (ข้อความจริงจาก `tsc`)

| ข้อความ / รหัส | แปลเป็นภาษาคน | วิธีแก้ |
|---|---|---|
| `TS2322` `Type 'string' is not assignable to type 'number'` | "ใส่ค่าผิดชนิดลงตัวแปร/ช่อง" | แก้ค่าให้ตรง type หรือแก้ type ถ้า type เดิมผิด (เช่น แปลงด้วย `Number(x)`) |
| `TS2345` `Argument of type 'string' is not assignable to parameter of type 'number'` | "ส่งค่าผิดชนิดเข้าฟังก์ชัน" | ส่งค่าชนิดที่ฟังก์ชันต้องการ |
| `TS2339` `Property 'ram' does not exist on type 'Laptop'` | "ไม่มีช่องชื่อนี้ใน type" | เช็คชื่อ (ตัวพิมพ์เล็ก/ใหญ่) หรือเพิ่มช่องใน interface ถ้าตั้งใจให้มี |
| `TS2551` `... Did you mean 'ramGb'?` | เหมือน TS2339 แต่ TS เดาชื่อที่ถูกให้แล้ว | ใช้ชื่อที่ TS แนะนำ |
| `TS2741` `Property 'brand' is missing in type ...` | "ลืมใส่ช่องที่จำเป็น" | เติมช่องนั้น หรือทำให้เป็น optional (`brand?: string`) ถ้ามีหรือไม่มีก็ได้จริง |
| `TS2554` `Expected 2 arguments, but got 1` | "ส่ง argument ไม่ครบ/เกิน" | ส่งให้ครบตามที่ประกาศ |
| `TS18048` `'found' is possibly 'undefined'` (หรือ `TS18047 ... 'null'`) | "อาจไม่มีค่า ยังไม่ได้เช็ค" | เช็คก่อนใช้ (`if (found)`) หรือใช้ `found?.brand` |
| `TS7006` `Parameter 'x' implicitly has an 'any' type` | "ไม่ได้บอก type ของ parameter TS เลยเดาไม่ได้" | ใส่ type เช่น `(x: number)` (ห้ามแก้ด้วยการใส่ `any`) |
| `TS18046` `'x' is of type 'unknown'` | "ยังไม่รู้ว่าเป็นอะไร ห้ามใช้ตรงๆ" | เช็คด้วย `typeof` หรือให้ Zod ตรวจก่อน |
| `TS2307` `Cannot find module './nothing.js' or its corresponding type declarations` | "หาไฟล์/package ที่ import ไม่เจอ" | ไฟล์ของเรา: เช็ค path และสะกดชื่อไฟล์ · package: `npm install ชื่อ` |
| `TS7016` `Could not find a declaration file for module 'x'` | "package นี้ไม่มีคำอธิบาย type มาให้" | `npm install -D @types/x` |
| `TS2834` `Relative import paths need explicit file extensions...` | "import ไฟล์ของเราต้องลงท้ายนามสกุล" | เขียน `from "./utils.js"` (ใส่ `.js` แม้ไฟล์จริงเป็น `.ts`) |
| `TS2588` `Cannot assign to 'x' because it is a constant` | "พยายามเปลี่ยนค่า `const`" | เปลี่ยนเป็น `let` ถ้าจำเป็นต้องเปลี่ยนค่าจริงๆ |

**กฎของทีม** 📏
- `"strict": true` ทุกโปรเจกต์
- ห้าม `any` (ใช้ `unknown`)
- ห้าม `// @ts-ignore` ถ้าจำเป็นจริงใช้ `// @ts-expect-error` พร้อมเหตุผล
- ห้ามมีไฟล์ `.js` ใน `src/`

---

## 💥 ลองพังมันดู

ทดลองทำให้ error ขึ้นเอง แล้วเทียบกับตารางในข้อ 7 (ใช้ `npm run typecheck` ตรวจ)

1. ใน `src/index.ts` เขียน `let n: number = "5";` → ควรเจอ `TS2322`
2. เรียก `addVatSatang("150000")` → ควรเจอ `TS2345`
3. เปลี่ยนชื่อ field ใน `Laptop` จาก `ramGb` เป็น `ram` แล้วดูว่า TS ชี้ทุกจุดที่ต้องแก้ให้ครบ
4. ลบ `"strict": true` ออกจาก `tsconfig.json` แล้วลองข้อ `found.brand` ใน ⑦ ว่าเส้นแดงหายไปไหม (แล้วอย่าลืมใส่คืน!)
5. รัน `npx tsx` กับไฟล์ที่ type ผิด ดูว่ายังรันได้ แต่ `npm run typecheck` ไม่ผ่าน (นี่คือกับดักในข้อ 6)

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

<details><summary>4. เก็บราคา 1,500.50 บาทใน database ควรเก็บเป็นเลขอะไร? ทำไม?</summary>

เก็บ `150050` (สตางค์ จำนวนเต็ม) เพราะทศนิยมแบบ `number` เก็บบางค่าไม่เป๊ะ (`0.1 + 0.2` ไม่เท่า `0.3`) ค่อยหาร 100 ตอนแสดงผล และปัดเศษด้วย `Math.round` เมื่อคูณ/หาร
</details>

<details><summary>5. <code>found?.brand ?? "ไม่พบ"</code> ทำอะไร?</summary>

`?.` ถ้า `found` เป็น `undefined`/`null` จะไม่พัง ได้ `undefined` กลับมา แล้ว `??` เปลี่ยน `undefined` เป็น `"ไม่พบ"`
</details>

<details><summary>6. <code>await</code> ใช้ได้ที่ไหน และลืมใส่แล้วเกิดอะไร?</summary>

ใช้ใน `async` function (หรือระดับบนสุดของไฟล์ module) ถ้าลืมจะได้ `Promise` แทนค่าจริง แล้วโค้ดถัดไปทำงานผิด
</details>

<details><summary>7. รันด้วย <code>tsx</code> แล้วไม่มี error แปลว่า type ถูกต้องใช่ไหม?</summary>

ไม่ใช่ `tsx` ตัด type ทิ้งแล้วรันเลย ไม่ได้ตรวจ ต้องรัน `npm run typecheck` (`tsc --noEmit`) และดูเส้นแดงใน VS Code
</details>

---

## ✏️ แบบฝึกหัด

เขียน `src/cart.ts` มี `interface CartItem` และฟังก์ชัน `addItem`, `removeItem`, `calcTotal` (ส่วนลด % + VAT 7%) ต้องผ่าน `npm run typecheck`
ใน README จด **บั๊กอย่างน้อย 2 แบบที่ JavaScript จะปล่อยผ่าน แต่ TypeScript จับได้**

ข้อกำหนดเพิ่ม: ราคาเก็บเป็นสตางค์ (จำนวนเต็ม) · ใช้ union type สำหรับสถานะตะกร้า (`"open" | "paid"`) · แยก `calcTotal` ไปไว้ไฟล์ `src/money.ts` แล้ว `import` มาใช้ · เขียน Zod schema ตรวจ `CartItem` ที่รับเข้ามา

## ✅ ผ่านด่าน

- [ ] ตั้งโปรเจกต์ TS + `tsconfig.json` เองได้
- [ ] ใช้ interface, union, optional, generic ได้
- [ ] เช็คค่าที่อาจเป็น `undefined`/`null` ได้ (`if`, `?.`, `??`)
- [ ] รู้ว่าทำไมห้าม `any` และ `unknown` ใช้ยังไง
- [ ] อ่านและเขียน `async` / `await` ได้ และแยกไฟล์ด้วย `export` / `import` ได้
- [ ] รู้ว่า TS ไม่ได้ตรวจข้อมูลตอนรัน และใช้ Zod แทน
- [ ] เก็บเงินเป็นจำนวนเต็มสตางค์ ไม่ใช้ทศนิยม
- [ ] อ่านรหัส error ของ `tsc` แล้วเปิดตารางหาวิธีแก้ได้

---

[← บทที่ 3: Node vs Yarn vs Bun](./03-node-yarn-bun.md) · [🏠 สารบัญ](/) · [บทที่ 5: HTTP & REST API →](./05-http-api.md)
