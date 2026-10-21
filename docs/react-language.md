# บทเสริม: ภาษาและคำสั่งที่ใช้เขียน React 🧰

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 4 และ 11 · 🛠 ใช้: Bun, TypeScript, VS Code, DevTools ของเบราว์เซอร์

> **⚡ สรุป 30 วินาที**
> - ไฟล์ React ทุกไฟล์คือ **JavaScript/TypeScript + JSX** ถ้าอ่านสัญลักษณ์ไม่ออก (`=>`, `...`, `?.`, `??`, `{ a, b }`) ก็อ่านโค้ดไม่ออก บทนี้รวมสัญลักษณ์เหล่านั้นไว้ทีละตัว
> - **JSX** = เขียนหน้าตาเว็บในไฟล์ `.tsx` มีกฎไม่กี่ข้อ: ห่อก้อนเดียว, `className`, `{}` ใส่ค่า, แท็กต้องปิด, `map` ต้องมี `key`
> - **Hook** = ฟังก์ชันที่ชื่อขึ้นต้นด้วย `use` ให้ component ทำสิ่งพิเศษ (จำค่า, ทำงานหลังวาด, อ่าน URL) ที่ต้องใช้จริงมี 5-6 ตัว และ **ต้องเรียกที่ระดับบนสุดของ component เท่านั้น**
> - เจอ error แดงให้เปิด **หัวข้อ 6** (ตารางข้อความ error จริง → สาเหตุ → วิธีแก้) ก่อนถามใคร
> - คำสั่ง terminal (git, bun, npm, docker) อยู่ในบทอื่นแล้ว บทนี้ไม่พูดถึง

> **📖 คำใหม่ในบทนี้**
> [React](./glossary.md#react) · [Component](./glossary.md#component) · [Props](./glossary.md#props) · [State](./glossary.md#state)

---

## 0. อ่านหน้านี้ยังไง

บทที่ 11 สอนให้ **สร้างหน้าเว็บได้** บทนี้เป็น **พจนานุกรมไวยากรณ์** ไว้เปิดเทียบตอนอ่านโค้ดของพี่ๆ หรือโค้ดที่ AI เขียนให้ ไม่ต้องอ่านรวดเดียวจบ

ทุกหัวข้อมี 5 ส่วนเหมือนกัน:

| ส่วน | ความหมาย |
|---|---|
| **ทำอะไร** | มีไว้แก้ปัญหาอะไร (พร้อมเปรียบเทียบ) |
| **ไวยากรณ์** | เขียนยังไง |
| **ตัวอย่างสั้น** | โค้ดที่ copy ไปลองได้ |
| **ควรเห็น** | ผลลัพธ์ที่ถูกต้อง (ผลที่ขึ้นว่า "ควรเห็น" ในส่วน JavaScript เรารันจริงด้วย Bun แล้ว) |
| **ข้อผิดพลาดที่เจอบ่อย** | พลาดแล้วจะเจออะไร |

ตัวอย่างทั้งหมดใช้ข้อมูลร้านเช่าโน้ตบุ๊ก (`Laptop`) ตามที่ใช้ในเล่มนี้ ชื่อไฟล์ใช้ตัวพิมพ์เล็กคั่นด้วย `-` (เช่น `src/components/laptop-card.tsx`) ส่วนชื่อ component ในโค้ดเป็นตัวพิมพ์ใหญ่ตัวแรก (`LaptopCard`)

ข้อมูลตัวอย่างที่ใช้ซ้ำในหัวข้อ 1:

```ts
interface Laptop {
  id: number;
  model: string;
  price: number;
  status: "available" | "rented";
  spec?: { ram: number };      // ? = บางเครื่องไม่มี
}

const laptops: Laptop[] = [
  { id: 1, model: "ThinkPad X1", price: 45000, status: "available", spec: { ram: 16 } },
  { id: 2, model: "MacBook Air", price: 36000, status: "rented" },
  { id: 3, model: "Dell XPS", price: 52000, status: "available", spec: { ram: 32 } },
];
```

---

## 1. ไวยากรณ์ JavaScript / TypeScript ที่เจอในทุกไฟล์

### 1.1 `const` และ `let`

**ทำอะไร:** ตั้งชื่อให้ค่า เหมือนติดป้ายชื่อบนกล่อง `const` = ป้ายติดถาวร (ห้ามย้ายป้ายไปกล่องอื่น) `let` = ป้ายที่ย้ายได้

```ts
const shop = "Bit Rental";   // ใช้ const เป็นค่าเริ่มต้นเสมอ
let count = 0;               // ใช้ let เมื่อต้องกำหนดค่าใหม่จริงๆ
count = count + 1;
console.log(shop, count);
```

**ควรเห็น:** `Bit Rental 1`

> ⚠️ **เจอบ่อย:** `const` ห้ามกำหนดค่าใหม่ (`shop = "x"` ขึ้น error) แต่ **แก้ข้างในกล่องได้** ถ้าเป็น array/object (`arr.push(...)` ไม่ error แต่ใน React ห้ามทำกับ state ดูหัวข้อ 4.1) ไม่ต้องใช้ `var` เลย

### 1.2 Arrow function `=>`

**ทำอะไร:** เขียนฟังก์ชันแบบสั้น ใช้ทั้ง event handler และ callback ของ `map`

**ไวยากรณ์:** `(ตัวรับ) => ผลลัพธ์` ถ้าเขียน `{ }` ต้องมี `return` เอง

```ts
const double = (n: number) => n * 2;                   // ไม่มี {} = return ให้อัตโนมัติ
const hello = (name: string) => { return `สวัสดี ${name}`; };  // มี {} = ต้องเขียน return
console.log(double(4), hello("บิต"));
```

**ควรเห็น:** `8 สวัสดี บิต`

> ⚠️ **เจอบ่อย:** `map(x => { x * 2 })` ได้ array ของ `undefined` เพราะมี `{}` แต่ลืม `return` ถ้าจะ return object ทันทีต้องห่อด้วยวงเล็บ: `x => ({ id: x })`

### 1.3 Template literal (เครื่องหมาย ` ` `)

**ทำอะไร:** ใส่ค่าลงในข้อความ เหมือนกรอกช่องว่างในแบบฟอร์ม

**ไวยากรณ์:** ข้อความอยู่ในเครื่องหมายแบ็กทิก แล้วใช้ `${ค่า}` แทรก

```ts
const l = laptops[0];
console.log(`${l.model} ราคา ${l.price.toLocaleString("en-US")} บาท`);
```

**ควรเห็น:** `ThinkPad X1 ราคา 45,000 บาท`

> ⚠️ **เจอบ่อย:** ใช้ `'` หรือ `"` แล้วเขียน `${...}` จะได้ข้อความตัวอักษร `${...}` ออกมาตรงๆ ต้องใช้แบ็กทิก (ปุ่มซ้ายของเลข 1)

### 1.4 Destructuring: แกะของออกจากกล่อง

![เปรียบเทียบ destructuring ของ object กับ array](/img/react-lang-destructuring.svg)
*object แกะตามชื่อ array แกะตามลำดับ*

**ทำอะไร:** ดึงค่าข้างใน object/array ออกมาเป็นตัวแปรในบรรทัดเดียว ใน React เจอทุกไฟล์ (props, `useState`)

```ts
const l = laptops[0];

// object: แกะตามชื่อ
const { model, price } = l;
console.log(model, price);

// เปลี่ยนชื่อตัวแปร (model → name)
const { model: name } = l;
console.log(name);

// ค่าเริ่มต้น: ถ้าไม่มี (undefined) ให้ใช้ค่านี้
const { spec: { ram } = { ram: 8 } } = laptops[1];
console.log(ram);

// array: แกะตามลำดับ (ตั้งชื่อเองได้)
const [first, second] = laptops;
console.log(first.model, second.model);

// ข้ามบางตัวด้วยจุลภาคเปล่า
const [, , third] = laptops;
console.log(third.model);
```

**ควรเห็น:**
```
ThinkPad X1 45000
ThinkPad X1
8
ThinkPad X1 MacBook Air
Dell XPS
```

ใน React จะเจอแบบนี้:
```tsx
function LaptopCard({ laptop, onRent }: Props) { ... }   // แกะ props ตั้งแต่ในวงเล็บ
const [open, setOpen] = useState(false);                  // useState คืน array 2 ช่อง
```

> ⚠️ **เจอบ่อย:** object แกะ **ด้วยชื่อ** สะกดผิด 1 ตัวก็ได้ `undefined` เงียบๆ ส่วน array แกะ **ด้วยลำดับ** สลับที่ไม่ได้ ค่าเริ่มต้น (`= ...`) ใช้เฉพาะเมื่อค่าเป็น `undefined` ถ้าเป็น `null` จะไม่ใช้ค่าเริ่มต้น

### 1.5 Spread `...`: กางของออกมาวางใหม่

**ทำอะไร:** ทำสำเนา แล้วแก้บางจุด เหมือนถ่ายเอกสารแล้วใช้ปากกาแก้เฉพาะบรรทัดที่ต้องการ ใช้ตลอดเวลาที่ต้องเปลี่ยน state

```ts
// object: คัดลอกแล้วเปลี่ยน price
const l = laptops[0];
const updated = { ...l, price: 40000 };
console.log(updated.price, l.price);          // ของเดิมไม่เปลี่ยน

// array: เพิ่มของ ได้ array ใหม่
const more = [...laptops, { id: 4, model: "Asus", price: 1, status: "available" as const }];
console.log(laptops.length, more.length);
```

**ควรเห็น:**
```
40000 45000
3 4
```

ใช้กับ props (ส่งทุกค่าใน object ไปให้ลูกทีเดียว):
```tsx
const props = { laptop: l, onRent: handleRent };
<LaptopCard {...props} />      // เหมือนเขียน laptop={l} onRent={handleRent}
```

> ⚠️ **เจอบ่อย:** ลำดับสำคัญ: `{ ...l, price: 1 }` ราคาใหม่ชนะ แต่ `{ price: 1, ...l }` ค่าเดิมของ `l` ทับ นอกจากนี้ spread คัดลอกแค่ชั้นแรก object ที่ซ้อนข้างในยังเป็นตัวเดิม (`spec` ยังชี้ที่เดียวกัน)

### 1.6 `map`: แปลงทุกตัว ได้ array ใหม่

![map แปลงทุกตัว filter คัดบางตัว](/img/react-lang-map-filter.svg)
*map ได้จำนวนเท่าเดิม filter ได้จำนวนเท่าเดิมหรือน้อยกว่า ทั้งคู่ไม่แตะ array เดิม*

**ทำอะไร:** เอาของแต่ละชิ้นเข้าเครื่อง ได้ของชิ้นใหม่ออกมา ใน React ใช้ **สร้างรายการหน้าเว็บจากข้อมูล**

```ts
console.log(laptops.map((x) => x.model));
```
**ควรเห็น:** `[ "ThinkPad X1", "MacBook Air", "Dell XPS" ]`

ใน JSX (ต้องใส่ `key`):
```tsx
<ul>
  {laptops.map((l) => (
    <li key={l.id}>{l.model}</li>     // key = ตัวระบุที่ไม่ซ้ำกัน (ใช้ id จากข้อมูล)
  ))}
</ul>
```
**ควรเห็นบนหน้าเว็บ:** รายการจุด 3 บรรทัด ThinkPad X1, MacBook Air, Dell XPS

> ⚠️ **เจอบ่อย:** ลืม `key` → Console เตือน `Each child in a list should have a unique "key" prop.` / ใช้ `key={index}` แล้วรายการเรียงใหม่หรือลบกลางรายการ ข้อมูลในช่องกรอกจะสลับผิดตัว ใช้ `id` จากข้อมูลเสมอ / `map` ใช้ได้กับ array เท่านั้น ถ้าตัวแปรเป็น `undefined` จะเจอ `Cannot read properties of undefined (reading 'map')` (หัวข้อ 6)

### 1.7 `filter`: คัดเฉพาะตัวที่ผ่านเงื่อนไข

**ทำอะไร:** ได้ array ใหม่ที่เหลือเฉพาะตัวที่เงื่อนไขเป็น `true` ใช้ทำช่องค้นหา ตัวกรอง และลบรายการ

```ts
const availableIds = laptops.filter((x) => x.status === "available").map((x) => x.id);
console.log(availableIds);

// ลบรายการ id = 1 ออกจากรายการ (ได้ array ใหม่ ไม่ใช้ splice)
console.log(laptops.filter((x) => x.id !== 1).length);
```
**ควรเห็น:**
```
[ 1, 3 ]
2
```

> ⚠️ **เจอบ่อย:** ลืม `return` ถ้าเขียนปีกกา (`x => { x.id !== 1 }`) ได้ array ว่างเสมอ / ผลของ `filter` ยังเป็น array (แม้เหลือ 1 ตัว) ถ้าต้องการ "ตัวเดียว" ใช้ `find`

### 1.8 `find`, `some`, `every`

**ทำอะไร:** `find` = หาตัวแรกที่ตรง (ได้ตัวเดียว หรือ `undefined`) · `some` = มีสักตัวไหม (`true/false`) · `every` = ทุกตัวไหม

```ts
console.log(laptops.find((x) => x.id === 2)?.model, laptops.find((x) => x.id === 99));
console.log(laptops.some((x) => x.status === "rented"), laptops.every((x) => x.price > 40000));
```
**ควรเห็น:**
```
MacBook Air undefined
true false
```

> ⚠️ **เจอบ่อย:** `find` อาจได้ `undefined` เสมอ ต้องเช็คก่อนใช้ ไม่งั้น TypeScript ขึ้น `'x' is possibly 'undefined'` และตอนรันจะเจอ `Cannot read properties of undefined` (ใช้ `?.` ดูข้อ 1.10)

### 1.9 `reduce`: รวมทั้ง array เป็นค่าเดียว (สั้นๆ)

**ทำอะไร:** เหมือนกวาดเหรียญใส่กระปุกทีละเหรียญ ใช้หาผลรวม ตัวอย่างนี้ไม่ต้องจำ เห็นแล้วรู้ว่าคืออะไรก็พอ

**ไวยากรณ์:** `array.reduce((ยอดสะสม, ตัวปัจจุบัน) => ยอดใหม่, ค่าเริ่มต้น)`

```ts
const total = laptops.reduce((sum, x) => sum + x.price, 0);
console.log(total);
```
**ควรเห็น:** `133000`

> ⚠️ **เจอบ่อย:** ลืมใส่ค่าเริ่มต้น (`0`) หรือ return ยอดสะสมไม่ครบ จะได้ค่าเพี้ยน (`NaN`) ถ้าอ่านไม่ออก ใช้ `for ... of` ธรรมดาก็ได้ผลเหมือนกัน

### 1.10 `?.` Optional chaining: ถามก่อนเปิดกล่อง

**ทำอะไร:** ถ้าสิ่งที่อยู่ซ้ายมือเป็น `null`/`undefined` ให้หยุดและได้ `undefined` แทนที่จะ error เหมือนเคาะประตูก่อนเปิด ถ้าไม่มีใครอยู่ก็ไม่เข้าไป

**ไวยากรณ์:** `a?.b` · `a?.[0]` · `a?.()`

```ts
console.log(laptops[0].spec?.ram, laptops[1].spec?.ram);
```
**ควรเห็น:** `16 undefined`

ใน React ใช้กับข้อมูลที่ยังโหลดไม่เสร็จ: `{data?.map(...)}` (เจอในบทที่ 11)

> ⚠️ **เจอบ่อย:** ใส่ `?.` ทุกที่เพื่อกัน error ทำให้ซ่อนบั๊กจริง (ข้อมูลที่ควรจะมีแต่ไม่มี) ใช้เมื่อค่า "อาจไม่มี" จริงๆ เท่านั้น

### 1.11 `??` กับ `||` (ค่าสำรอง)

![?? กับ || ต่างกันตรงค่า 0 และข้อความว่าง](/img/react-lang-nullish.svg)
*ถ้าค่า 0 หรือ "" มีความหมาย ให้ใช้ ??*

**ทำอะไร:** "ถ้าซ้ายไม่มีค่า ให้ใช้ขวาแทน" ต่างกันที่นิยามคำว่า "ไม่มีค่า"

| ตัวดำเนินการ | ถือว่า "ไม่มีค่า" เมื่อ |
|---|---|
| `\|\|` | `0`, `""`, `false`, `null`, `undefined`, `NaN` (ทุกอย่างที่ "ดูว่างๆ") |
| `??` | `null` และ `undefined` เท่านั้น |

```ts
const discount = 0;
console.log(discount || 5, discount ?? 5);
console.log("" || "ว่าง", "" ?? "ว่าง", null ?? "ค่าเริ่มต้น");
console.log(laptops[1].spec?.ram ?? "ไม่ระบุ");
```
**ควรเห็น** (บรรทัดที่ 2 มีช่องว่างตรงตำแหน่งของ `""`):
```
5 0
ว่าง  ค่าเริ่มต้น
ไม่ระบุ
```

> ⚠️ **เจอบ่อย:** ใช้ `||` กับตัวเลข เช่น `quantity || 1` พอผู้ใช้ตั้งค่า 0 กลับกลายเป็น 1 ใช้ `quantity ?? 1`

### 1.12 Ternary และ `&&` ใน JSX

**ทำอะไร:** เลือกว่าจะแสดงอะไร ใน JSX เขียน `if` ตรงๆ ไม่ได้ ต้องใช้ 2 แบบนี้

| ต้องการ | ใช้ | ไวยากรณ์ |
|---|---|---|
| เลือก 1 จาก 2 | ternary | `เงื่อนไข ? ถ้าจริง : ถ้าเท็จ` |
| แสดงหรือไม่แสดง | `&&` | `เงื่อนไข && <ของที่จะแสดง />` |

```tsx
<p>{l.status === "available" ? "ว่าง 🟢" : "ถูกเช่า 🔴"}</p>
{error && <p className="error">{error}</p>}
```
**ควรเห็น:** ถ้า `status` เป็น `"available"` เห็น `ว่าง 🟢` / ถ้า `error` เป็น `null` ไม่เห็นอะไรเลย

**กับดักเลข 0 (`0 &&`)** เรารัน React จริงแล้ว:
```tsx
const items: Laptop[] = [];
<div>{items.length && <p>มีของ</p>}</div>        // ❌ หน้าเว็บขึ้นเลข 0 !
<div>{items.length > 0 && <p>มีของ</p>}</div>    // ✅ ไม่ขึ้นอะไร
```
**ควรเห็น:** แบบ ❌ ได้ `<div>0</div>` (เลข 0 โผล่บนหน้าจอ) เพราะ `0 && ...` ได้ค่า `0` และ React วาดเลข `0` ให้ (ต่างจาก `false`/`null` ที่ไม่วาด)

> ⚠️ **เจอบ่อย:** เอา `&&` กับตัวเลขหรือ `length` ตรงๆ ให้เขียนเป็นการเปรียบเทียบ (`> 0`) หรือ `Boolean(x)` เสมอ

### 1.13 `async` / `await`, `try` / `catch` / `finally`

![ไทม์ไลน์ async await: รอผลโดยหน้าเว็บไม่ค้าง](/img/react-lang-async-timeline.svg)
*await หยุดรอเฉพาะฟังก์ชันนี้ ส่วน finally ทำงานเสมอ*

**ทำอะไร:** จัดการงานที่ต้อง "รอ" เช่น ดึงข้อมูลจากเซิร์ฟเวอร์ เหมือนสั่งอาหารแล้วรอเรียกคิว ระหว่างรอคนอื่นยังใช้ร้านได้ (หน้าเว็บไม่ค้าง)

**ไวยากรณ์:**
- ฟังก์ชันที่มี `await` ข้างในต้องประกาศ `async`
- `await` ใช้หน้า Promise (ของที่ "จะเสร็จทีหลัง") เพื่อรอเอาผลจริง
- `try` = ลองทำ · `catch` = ถ้าพังมาทำตรงนี้ · `finally` = ทำเสมอ ไม่ว่าสำเร็จหรือพัง

```ts
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function load(fail: boolean) {
  try {
    console.log("เริ่มโหลด");
    await wait(10);
    if (fail) throw new Error("เน็ตหลุด");
    console.log("โหลดเสร็จ");
    return "ok";
  } catch (err) {
    console.log("พัง:", err instanceof Error ? err.message : "unknown");
    return "fail";
  } finally {
    console.log("ปิดไฟโหลด");
  }
}
console.log(await load(false));
console.log(await load(true));
```
**ควรเห็น:**
```
เริ่มโหลด
โหลดเสร็จ
ปิดไฟโหลด
ok
เริ่มโหลด
พัง: เน็ตหลุด
ปิดไฟโหลด
fail
```

**Promise พื้นฐาน:** `async function` คืน Promise เสมอ ใช้ได้ 2 สไตล์ให้ผลเหมือนกัน

```ts
console.log("ก่อน");
const p = wait(10).then(() => console.log("then"));   // สไตล์ .then (เจอในโค้ดเก่า/useFetch)
console.log("หลัง");
await p;
const results = await Promise.all([wait(5).then(() => 1), wait(5).then(() => 2)]);  // รอหลายงานพร้อมกัน
console.log(results);
```
**ควรเห็น:**
```
ก่อน
หลัง
then
[ 1, 2 ]
```
สังเกต: `หลัง` มาก่อน `then` เพราะโค้ดไม่รอ ถ้าไม่ `await`

> ⚠️ **เจอบ่อย:** 
> - ลืม `await` แล้วได้ `Promise` แทนข้อมูลจริง (พิมพ์ออกมาเห็น `Promise {...}`) จากนั้น `.map` พัง
> - `await` ใน function ที่ไม่ได้ประกาศ `async` → error
> - `fetch` **ไม่ error ตอนได้ 404/500** ต้องเช็ค `if (!res.ok) throw ...` เอง (ดูตัวอย่างใน [บทที่ 11](./11-react.md))
> - `useEffect(async () => {...})` ใช้ตรงๆ ไม่ได้ ให้ประกาศ `async function` ข้างในแล้วเรียกใช้ หรือใช้ `.then` (ดูข้อ 4.2)
> - รายละเอียดเพิ่มดูที่ [บทที่ 4 โบนัส A](./04-typescript.md)

### 1.14 `import` / `export`: default กับ named

**ทำอะไร:** แยกโค้ดเป็นไฟล์ แล้วหยิบมาใช้ เหมือนแยกเครื่องมือเป็นลิ้นชัก

| แบบ | ฝั่ง export | ฝั่ง import |
|---|---|---|
| **default** (ต่อไฟล์ได้ 1 ตัว) | `export default function LaptopCard() {}` | `import LaptopCard from "./laptop-card";` (ตั้งชื่อเองได้ ไม่มี `{}`) |
| **named** (ได้หลายตัว) | `export function useFetch() {}` | `import { useFetch } from "../api/use-fetch";` (ชื่อต้องตรง ต้องมี `{}`) |

```tsx
// src/components/laptop-card.tsx
export default function LaptopCard() { return <article>...</article>; }

// src/app.tsx
import LaptopCard from "./components/laptop-card";
import { useState } from "react";                 // named จากแพ็กเกจ
```

> ⚠️ **เจอบ่อย:** `import { LaptopCard } from ...` ทั้งที่ไฟล์ export default → ได้ `undefined` แล้ว React ขึ้น `Element type is invalid: expected a string ... but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.` (เรารันจริงได้ข้อความนี้) / path ผิดตัวพิมพ์เล็กใหญ่ (ดู [บทเสริมจัดโครงสร้าง](./project-structure.md#_2-กฎตั้งชื่อ-ภาษาอังกฤษ-ตัวพิมพ์เล็ก))

### 1.15 Type ที่เจอใน props: `interface`, `type`, `?`, union, generic, `as const`

**ทำอะไร:** บอก TypeScript ว่าข้อมูลหน้าตาแบบไหน เพื่อให้ VS Code เตือนก่อนรันจริง (พื้นฐานดู [บทที่ 4](./04-typescript.md))

```tsx
import type { ReactNode } from "react";            // type-only import (ดูข้างล่าง)

type Status = "available" | "rented";               // union: เป็นได้แค่ 2 ค่านี้

interface Props {
  laptop: Laptop;                                   // บังคับต้องส่ง
  onRent?: (id: number) => void;                    // ? = ไม่บังคับ ฟังก์ชันรับ id ไม่ return อะไร
  children?: ReactNode;                             // ของที่ครอบอยู่ระหว่างแท็ก
}

export default function LaptopCard({ laptop, onRent, children }: Props) { ... }
```

| เห็นแบบนี้ | อ่านว่า |
|---|---|
| `price: number \| null` | ราคาเป็นตัวเลข **หรือ** `null` |
| `onRent?: ...` | ใส่หรือไม่ใส่ก็ได้ (ได้ `undefined` ถ้าไม่ใส่) ต้องเรียกด้วย `onRent?.(id)` |
| `useState<Laptop[]>([])` | state เก็บ array ของ `Laptop` เริ่มจากว่าง (ตัวเล็กๆ `<...>` = generic คือ "ช่องเติม type") |
| `useState<Laptop \| null>(null)` | เริ่มเป็น `null` แล้วค่อยเป็น `Laptop` |
| `["a", "b"] as const` | ล็อกให้เป็นค่าตายตัว (type เป็น `"a" \| "b"` ไม่ใช่ `string`) |
| `import type { X } from ...` | import **เฉพาะ type** ถูกลบตอน build ไม่มีผลตอนรัน |

```ts
const statuses = ["available", "rented"] as const;
type Status = (typeof statuses)[number];       // "available" | "rented"
const s: Status = "rented";
console.log(s, statuses);
```
**ควรเห็น:** `rented [ "available", "rented" ]`

**type-only import:** เมื่อ import ของที่เป็น type อย่างเดียว (interface/type) ให้เขียน `import type { Laptop } from "../types/laptop";` เพื่อบอกชัดว่าไม่ได้ใช้ตอนรัน (บทที่ 11 ก็ใช้แบบนี้) บางโปรเจกต์ตั้งค่า `verbatimModuleSyntax` ไว้ ถ้าลืม `type` จะขึ้น error ให้ใช้ `import type` (ข้อนี้เราไม่ได้ทดลอง ดูที่ `tsconfig` ของโปรเจกต์)

ข้อความ error ที่เราลองรัน `tsc` ได้จริง:

| โค้ด | ข้อความ error |
|---|---|
| `const a: number = "5"` | `Type 'string' is not assignable to type 'number'.` |
| `<LaptopCard />` ลืมส่ง prop | `Property 'laptop' is missing in type '{}' but required in type 'Props'.` |
| ส่ง `status: "broken"` | `Type '"broken"' is not assignable to type '"available" \| "rented"'.` |
| `useState([])` แล้ว `setList([{ id: 1 }])` | `Type '{ id: number; }' is not assignable to type 'never'.` (แก้: `useState<Laptop[]>([])`) |
| `u.length` เมื่อ `u: string \| undefined` | `'u' is possibly 'undefined'.` |

> ⚠️ **เจอบ่อย:** ลืมใส่ generic ตอน `useState([])` แล้วเจอ `never` (ตัวอย่างข้างบน) / ใช้ `any` ให้ error หายไป ซึ่งเท่ากับปิดไฟเตือนทั้งหมด ถามพี่ก่อน

---

## 2. กฎของ JSX (ละเอียด)

**JSX** = โค้ดหน้าตาคล้าย HTML ในไฟล์ `.tsx` ตัวแปลงจะเปลี่ยนเป็นโค้ด JavaScript ให้ (ภาพรวมดู [บทที่ 11 ข้อ 3](./11-react.md))

| กฎ | ผิด ❌ | ถูก ✅ | เหตุผล |
|---|---|---|---|
| ส่งกลับ **ก้อนเดียว** (หรือใช้ fragment `<>...</>`) | `return <h1/><p/>` | `return <><h1/><p/></>` | ฟังก์ชัน return ได้ค่าเดียว |
| `class` → `className` | `<div class="card">` | `<div className="card">` | `class` เป็นคำสงวนของ JS |
| `for` → `htmlFor` | `<label for="kw">` | `<label htmlFor="kw">` | `for` เป็นคำสงวนของ JS |
| แท็กต้องปิดเสมอ | `<img src="a.png">` | `<img src="a.png" alt="" />` | JSX เข้มกว่า HTML |
| ค่าจากโค้ดอยู่ใน `{}` | `<p>price บาท</p>` | `<p>{price} บาท</p>` | `{}` = "ตรงนี้คือ JS" |
| `style` รับ **object** | `style="color:red"` | <code v-pre>style={{ color: "red", marginTop: 8 }}</code> | <code v-pre>{{ }}</code> = `{}` ของ JSX ครอบ object |
| attribute เป็น camelCase | `onclick`, `tabindex` | `onClick`, `tabIndex` | ตามชื่อใน DOM API |
| คอมเมนต์ใน JSX | `<!-- ... -->` | `{/* ... */}` | JSX ไม่ใช่ HTML |
| รายการต้องมี `key` | `<li>` ไม่มี key | `<li key={l.id}>` | ให้ React ตามได้ว่าตัวไหนคือตัวไหน |

```tsx
export default function LaptopCard({ laptop }: Props) {
  const { model, price } = laptop;
  return (
    <article className="card" style={{ padding: 16, backgroundColor: "#fff" }}>
      {/* คอมเมนต์ใน JSX เขียนแบบนี้ */}
      <label htmlFor="note">หมายเหตุ</label>
      <input id="note" />
      <h3>{model}</h3>
      {price !== null && <p>{price.toLocaleString()} บาท</p>}
      <img src="/laptop.png" alt="" />
    </article>
  );
}
```
**ควรเห็น:** การ์ดที่มีช่องกรอก ชื่อรุ่น ราคา (ถ้ามี) และรูป (เรา compile โค้ดนี้ด้วย `tsc` ผ่าน ไม่มี error)

**เรื่องที่ต้องรู้เพิ่ม**
- `{}` ใส่ได้เฉพาะ **expression** (ค่า): ตัวแปร, `a + b`, ternary, `map(...)` ใส่ `if`, `for` ตรงๆ ไม่ได้
- ค่าที่ React **ไม่วาด**: `false`, `null`, `undefined`, `true` (เลย `{cond && <X/>}` ถึงซ่อนได้) แต่ `0` และ `""` ... `0` ถูกวาด (กับดักข้อ 1.12) ใส่ **object** เป็นลูกตรงๆ ไม่ได้
- ชื่อ component ต้องขึ้นต้นด้วย **ตัวพิมพ์ใหญ่** (`<LaptopCard />`) ตัวเล็ก (`<laptopCard />`) React จะมองเป็นแท็ก HTML
- Conditional แบบยาว: เขียน `if (...) return ...;` ก่อน `return` หลักได้ (เหมือน `if (loading) return <p>...</p>` ในบทที่ 11)

**รายการ + เงื่อนไขรวมกัน**
```tsx
{laptops.length === 0 ? (
  <p>ยังไม่มีเครื่องให้เช่า</p>
) : (
  laptops.filter((l) => l.status === "available").map((l) => <LaptopCard key={l.id} laptop={l} />)
)}
```
**ควรเห็น:** ถ้า array ว่าง เห็นข้อความ "ยังไม่มีเครื่องให้เช่า" ถ้าไม่ว่าง เห็นการ์ดเฉพาะเครื่องที่ว่าง

> ⚠️ **เจอบ่อย (JSX)**
> - ใช้ `class="..."` → React เตือน `` Invalid DOM property `class`. Did you mean `className`? ``
> - `style="color:red"` → error `` The `style` prop expects a mapping from style properties to values, not a string. ``
> - วาง `{ name: "x" }` ลงในแท็กตรงๆ → `Objects are not valid as a React child` (ข้อ 6)

---

## 3. ภาพรวม props และ callback

![props ไหลลง callback ไหลขึ้น](/img/react-lang-props-flow.svg)
*ข้อมูลไหลลงทาง props ส่วนเหตุการณ์ (คลิก พิมพ์) ส่งขึ้นผ่านฟังก์ชันที่แม่ส่งมา*

```tsx
// src/pages/laptop-list-page.tsx (แม่)
const [laptops, setLaptops] = useState<Laptop[]>([]);
const handleRent = (id: number) =>
  setLaptops(laptops.map((l) => (l.id === id ? { ...l, status: "rented" } : l)));

<LaptopCard laptop={l} onRent={handleRent} />

// src/components/laptop-card.tsx (ลูก)
<button onClick={() => onRent?.(laptop.id)}>เช่า</button>
```
**ควรเห็น:** กดปุ่ม "เช่า" ในการ์ด → state ที่แม่เปลี่ยน → การ์ดนั้นวาดใหม่ด้วยสถานะ `rented`

(เราสร้าง array ใหม่ด้วย `map` + spread ทุกครั้ง: ถ้า `l.id === id` ก็คัดลอกแล้วเปลี่ยน `status` ตัวอื่นคืนค่าเดิม)

---

## 4. Hooks

**Hook** = ฟังก์ชันที่ชื่อขึ้นต้นด้วย `use` เป็น "ช่องเสียบ" ให้ component ที่เป็นแค่ฟังก์ชันธรรมดาได้ความสามารถพิเศษ เช่น จำค่า หรือรู้ว่า URL คืออะไร

![แผนที่เลือก hook ตามความต้องการ](/img/react-lang-hook-map.svg)
*เลือก hook จากสิ่งที่อยากทำ ไม่ใช่จากชื่อ*

| Hook | มาจาก | ใช้เมื่อ | ต้องรู้ตอนฝึกงาน |
|---|---|---|---|
| `useState` | react | จำค่าที่เปลี่ยนแล้วหน้าจอต้องเปลี่ยน | ใช้ทุกวัน |
| `useEffect` | react | ทำงานนอกหน้าจอหลังวาดเสร็จ (ดึง API) | ใช้บ่อย |
| `useRef` | react | จับ DOM หรือเก็บค่าที่ไม่ต้องวาดใหม่ | ใช้บางครั้ง |
| `useMemo` | react | จำผลคำนวณหนักๆ | แทบไม่ต้องใช้ |
| `useCallback` | react | จำฟังก์ชัน | แทบไม่ต้องใช้ |
| `useContext` | react | ใช้ค่าร่วมทั้งแอป (เช่น ผู้ใช้ที่ล็อกอิน) | รู้ไว้ |
| `useNavigate` | react-router | เปลี่ยนหน้าด้วยโค้ด | ใช้บ่อย |
| `useParams` | react-router | อ่านค่าใน path (`/laptops/7`) | ใช้บ่อย |
| `useSearchParams` | react-router | อ่าน/เขียนค่าหลัง `?` | ใช้บ่อย |
| `useLocation` | react-router | รู้ว่าตอนนี้อยู่ path ไหน | ใช้บางครั้ง |
| `useFetch` (เขียนเอง) | custom | ดึงข้อมูลซ้ำได้ทุกหน้า | มีใน [บทที่ 11](./11-react.md) |

### 4.0 กฎของ Hooks (สำคัญที่สุด)

![กฎของ Hooks: เรียกที่ระดับบนสุดเท่านั้น](/img/react-lang-hook-rules.svg)
*React จำ hook จาก "ลำดับการเรียก" ถ้าลำดับเปลี่ยน มันจะสับสน*

1. เรียก hook **ที่ระดับบนสุดของ component** เท่านั้น ห้ามอยู่ใน `if`, ลูป, หรือฟังก์ชันซ้อน
2. เรียกได้เฉพาะใน **component** หรือ **custom hook** (ฟังก์ชันที่ชื่อขึ้นต้น `use`)
3. `return` ก่อนเมื่อไหร่ก็ได้ **หลังจาก** เรียก hook ครบแล้ว

เรารัน React จริงด้วยโค้ดที่เรียก hook ใน `if` แล้วเงื่อนไขเปลี่ยนระหว่างรอบ ได้ error:

```
Rendered more hooks than during the previous render.
```
และถ้าเรียก hook นอก component เลย:
```
Invalid hook call. Hooks can only be called inside of the body of a function component.
```
ถ้าเรียก hook ของ router (`useNavigate`) นอก `<BrowserRouter>`: `useNavigate() may be used only in the context of a <Router> component.`

ผิด/ถูก:
```tsx
function Card({ open }: { open: boolean }) {
  if (open) {
    const [n, setN] = useState(0);   // ❌ hook ใน if
  }
  // ...
}

function Card({ open }: { open: boolean }) {
  const [n, setN] = useState(0);      // ✅ เรียกก่อนเสมอ
  if (!open) return null;             // ✅ return หลัง hook ได้
  return <p>{n}</p>;
}
```

### 4.1 `useState`: จำค่า

**ทำอะไร:** กระดานไวท์บอร์ดของ component เขียนค่าใหม่ → React วาดหน้าใหม่ให้

**ไวยากรณ์:** `const [ค่า, ฟังก์ชันตั้งค่า] = useState<ชนิด>(ค่าเริ่มต้น)`

```tsx
import { useState } from "react";

const [keyword, setKeyword] = useState("");                    // string
const [laptops, setLaptops] = useState<Laptop[]>([]);          // array ต้องบอก type
const [selected, setSelected] = useState<Laptop | null>(null); // เริ่มเป็น null

setLaptops([...laptops, newLaptop]);                           // เพิ่ม
setLaptops(laptops.filter((l) => l.id !== 1));                 // ลบ
setLaptops(laptops.map((l) => (l.id === 2 ? { ...l, status: "available" } : l)));  // แก้
setCount((prev) => prev + 1);                                  // ค่าใหม่ขึ้นกับค่าเก่า ใช้รูปแบบฟังก์ชัน
```
**ควรเห็น:** เรียก `setX` แล้วหน้าจอที่ใช้ค่านั้นเปลี่ยนทันที

**ใช้เมื่อ:** ข้อมูลที่ผู้ใช้เปลี่ยนได้และมีผลต่อหน้าตา (ข้อความในช่องกรอก, เปิด/ปิดเมนู, ผลจาก API)
**ไม่ใช้เมื่อ:** ค่าที่คำนวณจาก state/props อื่นได้ (เขียนเป็นตัวแปรธรรมดาเลย เช่น `const total = items.length`) และค่าที่ไม่กระทบหน้าจอ (ใช้ `useRef`)

> ⚠️ **เจอบ่อย:**
> - แก้ตรงๆ (`laptops.push(x)`) หน้าจอไม่เปลี่ยน → สร้างค่าใหม่เสมอ
> - เรียก `setX` ตอนวาด (ไม่ใช่ในตัวจัดการ event) → `Too many re-renders. React limits the number of renders to prevent an infinite loop.` (เรารันจริง)
> - เขียน `onClick={setOpen(!open)}` แทน `onClick={() => setOpen(!open)}` → ฟังก์ชันถูกเรียกทันทีตอนวาด → error ข้างบนเหมือนกัน
> - `setX(v)` ไม่เปลี่ยนค่า `x` ในบรรทัดถัดไปทันที ค่าใหม่จะมาในการวาดรอบหน้า

### 4.2 `useEffect`: ทำงานหลังวาดเสร็จ

อธิบายเต็มและตัวอย่าง `useFetch` อยู่ใน [บทที่ 11 (ดึงข้อมูลจาก API)](./11-react.md) นี่คือฉบับย่อ

**ทำอะไร:** "พอวาดเสร็จแล้ว ช่วยทำสิ่งนี้ด้วย" เหมือนสั่งไว้ว่าเปิดร้านเสร็จแล้วให้โทรเช็กสต็อก

**ไวยากรณ์:** `useEffect(() => { งาน; return () => เก็บกวาด }, [ตัวที่ถ้าเปลี่ยนให้รันใหม่])`

| ท้าย `useEffect` | ทำงานเมื่อ |
|---|---|
| `[]` | ครั้งเดียวตอนแสดงครั้งแรก |
| `[url]` | ครั้งแรก + ทุกครั้งที่ `url` เปลี่ยน |
| ไม่ใส่ | **ทุกครั้งที่วาด** (มักผิด) |

```tsx
useEffect(() => {
  document.title = `ว่าง ${laptops.length} เครื่อง`;
}, [laptops]);
```
**ควรเห็น:** ชื่อแท็บเบราว์เซอร์เปลี่ยนเมื่อ `laptops` เปลี่ยน

**ใช้เมื่อ:** ดึง API, ตั้ง timer, ผูก event ของ `window`, เปลี่ยนชื่อแท็บ (ของที่อยู่ "นอก React")
**ไม่ใช้เมื่อ:** แค่คำนวณค่าจาก state (เขียนตัวแปรตรงๆ) หรือจัดการการคลิก (ใส่ใน `onClick`) หลายคนใช้ `useEffect` เกินจำเป็น

> ⚠️ **เจอบ่อย:**
> - ใน effect เรียก `setX` โดยไม่ใส่ dependency หรือ dependency เปลี่ยนทุกรอบ → วนไม่จบ React เตือน `Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.` (เรารันจริง)
> - ตอนพัฒนา (React StrictMode) effect รัน 2 รอบเพื่อจับบั๊ก ไม่ใช่บั๊กของเรา
> - ลืม cleanup (`return () => ...`) ใน timer / การดึงข้อมูล → ทำงานต่อหลังออกจากหน้า

### 4.3 `useRef`: จับ DOM หรือเก็บค่าที่ไม่ต้องวาดใหม่

**ทำอะไร:** กล่องเก็บของที่ **เปลี่ยนแล้วหน้าจอไม่วาดใหม่** ใช้บ่อยสุดคือ "จับ" ช่องกรอกมา `focus()`

```tsx
import { useRef, useEffect } from "react";

const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => { inputRef.current?.focus(); }, []);

<input ref={inputRef} />
```
**ควรเห็น:** เปิดหน้าแล้วเคอร์เซอร์ไปอยู่ในช่องกรอกเลย

**ใช้เมื่อ:** สั่ง DOM ตรงๆ (`focus`, เลื่อนจอ) หรือเก็บค่าชั่วคราว (เลข timer) ที่ไม่ต้องแสดงผล
**ไม่ใช้เมื่อ:** ค่านั้นต้องแสดงบนหน้าจอ ให้ใช้ `useState`

> ⚠️ **เจอบ่อย:** อ่านค่าผ่าน `ref.current` ลืมใส่ `?.` ในตอนที่ยังเป็น `null` (ก่อนวาดเสร็จ) / เปลี่ยน `ref.current` แล้วหวังให้หน้าจอเปลี่ยนจะไม่เปลี่ยน

### 4.4 `useMemo`: จำผลคำนวณ

**ทำอะไร:** จดคำตอบไว้ ถ้าโจทย์ (dependency) ไม่เปลี่ยนก็ไม่คิดใหม่

```tsx
const shown = useMemo(
  () => laptops.filter((l) => l.model.includes(keyword)),
  [laptops, keyword],
);
```
**ใช้เมื่อ:** คำนวณช้าจริง (วัดแล้ว) เช่น กรอง/เรียงข้อมูลหลายพันรายการ
**ไม่ใช้เมื่อ:** ปกติทั้งหมด **บทนี้ขอพูดตรงๆ: ผู้เริ่มต้นแทบไม่ต้องใช้** array ไม่กี่สิบตัว `filter` ตรงๆ ในตัว component เร็วพออยู่แล้ว การใส่ `useMemo` ทั่วไปทำให้โค้ดอ่านยากขึ้นโดยไม่ได้อะไร ใช้เมื่อพี่บอก หรือเมื่อเห็นว่าช้าจริง

### 4.5 `useCallback`: จำฟังก์ชัน

**ทำอะไร:** จำ "ตัวฟังก์ชัน" ไม่ให้ถูกสร้างใหม่ทุกครั้งที่วาด

```tsx
const handleRent = useCallback((id: number) => { navigate(`/laptops/${id}`); }, [navigate]);
```
**ใช้เมื่อ:** ส่งฟังก์ชันให้ component ลูกที่ห่อด้วย `React.memo` หรือฟังก์ชันนั้นอยู่ใน dependency ของ `useEffect`
**ไม่ใช้เมื่อ:** ส่วนใหญ่ **ไม่ต้องใช้** เขียน `const handleRent = (id: number) => {...}` ธรรมดาได้เลย (เหมือน `useMemo` ที่เกินจำเป็นสำหรับผู้เริ่มต้น)

### 4.6 `useContext`: ค่ากลางทั้งแอป (สั้นๆ)

**ทำอะไร:** ตู้ประกาศกลางที่ component ไหนก็เปิดดูได้ โดยไม่ต้องส่ง props ต่อกันหลายชั้น (เช่น ข้อมูลผู้ใช้ที่ล็อกอิน บทที่ 15)

```tsx
const user = useContext(AuthContext);      // อ่านค่าที่ Provider ด้านบนส่งลงมา
```
**ใช้เมื่อ:** ค่านั้นต้องใช้ในหลายหน้า/หลายชั้น **ไม่ใช้เมื่อ:** ส่ง props 1-2 ชั้นก็พอ ตอนนี้ให้อ่านออกก็พอ งานที่ได้รับมอบหมายมักมีคนเขียน Provider ให้แล้ว

### 4.7 `useNavigate`, `useParams`, `useSearchParams`, `useLocation` (React Router)

ติดตั้งและตั้งค่าเส้นทางดู [บทที่ 13](./13-router-seo.md) ต่อไปนี้ใช้ได้เฉพาะ **ในหน้าที่อยู่ใต้ router**

| Hook | ได้อะไร | ตัวอย่าง |
|---|---|---|
| `useNavigate()` | ฟังก์ชันเปลี่ยนหน้า | `navigate("/laptops/7")` |
| `useParams()` | ค่าจาก path (**เป็น string เสมอ**) | `const { id } = useParams()` |
| `useSearchParams()` | ค่าหลัง `?` + ตัวตั้งค่า | `const [sp, setSp] = useSearchParams()` |
| `useLocation()` | ข้อมูล URL ปัจจุบัน | `loc.pathname`, `loc.search` |

เราทดสอบด้วย `MemoryRouter` ที่ URL `/laptops/7?brand=dell&page=2` และ route `/laptops/:id`:

```tsx
const { id } = useParams();                 // "7"
const [sp, setSp] = useSearchParams();
sp.get("brand");                            // "dell"
sp.get("x");                                // null (ไม่มี key นี้)
setSp({ brand: "lenovo" });                 // เปลี่ยน URL เป็น ?brand=lenovo (ไม่รีโหลดหน้า)
const loc = useLocation();                  // loc.pathname = "/laptops/7", loc.search = "?brand=dell&page=2"
const navigate = useNavigate();
navigate("/laptops");                       // ไปหน้ารายการ
navigate(-1);                               // ย้อนกลับ 1 หน้า
```
**ควรเห็น** (ผลจริงจากการรัน): `id` = `"7"`, `brand` = `"dell"`, `sp.get("x")` = `null`, `pathname` = `/laptops/7`, `search` = `?brand=dell&page=2`

> ⚠️ **เจอบ่อย:**
> - `useParams` คืน **string** เสมอ ต้องแปลงเองถ้าต้องการเลข: `Number(id)` (และ `id` อาจเป็น `undefined`)
> - ใช้ hook ของ router นอก router → `useNavigate() may be used only in the context of a <Router> component.` (เรารันจริง)
> - ลิงก์ธรรมดาใช้ `<Link to="/x">` ไม่ต้อง `useNavigate` (ใช้ `navigate` เมื่อต้องเปลี่ยนหน้าหลังทำอย่างอื่นเสร็จ เช่น ส่งฟอร์มสำเร็จ)

### 4.8 Custom hook: เขียน hook ของตัวเอง

ชื่อต้องขึ้นต้น `use` และข้างในเรียก hook อื่นได้ `useFetch` ใน [บทที่ 11](./11-react.md) คือตัวอย่างที่ดีที่สุด

```tsx
const { data, error, loading } = useFetch<Laptop[]>("/mock/laptops.json");
```
**ใช้เมื่อ:** ตรรกะเดียวกัน (state + effect) ถูกคัดลอกไปใช้ซ้ำหลายหน้า
**ไม่ใช้เมื่อ:** ใช้ที่เดียวและสั้น เขียนในตัว component เลย

---

## 5. Event handler cheat list

**Event handler** = ฟังก์ชันที่ทำงานเมื่อผู้ใช้ทำอะไรสักอย่าง ส่งผ่าน attribute ที่ขึ้นต้นด้วย `on`

| Event | เกิดเมื่อ | ตัวอย่าง | ชนิดของ event ใน TS |
|---|---|---|---|
| `onClick` | คลิก | `onClick={() => setOpen(!open)}` | `React.MouseEvent<HTMLButtonElement>` |
| `onChange` | ค่าในช่องกรอกเปลี่ยน | `onChange={(e) => setKeyword(e.target.value)}` | `React.ChangeEvent<HTMLInputElement>` |
| `onSubmit` | ส่งฟอร์ม | `onSubmit={handleSubmit}` | `React.SubmitEvent<HTMLFormElement>` |

> 💡 บทความเก่าๆ มักเขียน `React.FormEvent` ให้ฟอร์ม ตอนนี้ `@types/react` ประกาศว่าเลิกใช้แล้ว (VS Code จะขีดฆ่าชื่อ) ให้ใช้ `SubmitEvent` แทน

```tsx
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setKeyword(e.target.value);              // e.target = ช่องกรอก, .value = ข้อความที่พิมพ์
};

const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
  e.preventDefault();                      // ห้ามเบราว์เซอร์รีโหลดหน้า (ค่าเริ่มต้นของฟอร์ม)
  // ตรวจข้อมูล แล้วส่งไป API
};

<form onSubmit={handleSubmit}>
  <input value={keyword} onChange={handleChange} />
  <button type="submit">ค้นหา</button>
</form>
```
**ควรเห็น:** พิมพ์ในช่องแล้วตัวอักษรขึ้นตามทุกตัว / กดปุ่มแล้วหน้า **ไม่รีโหลด**

> ⚠️ **เจอบ่อย:**
> - ลืม `e.preventDefault()` → หน้าเว็บรีโหลดทุกครั้งที่ส่งฟอร์ม state หายหมด
> - `onClick={handleRent(1)}` (มีวงเล็บเรียกเลย) ต้องเป็น `onClick={() => handleRent(1)}` ไม่งั้นเรียกตอนวาด
> - `<input value={x} />` ไม่มี `onChange` → ช่องพิมพ์ไม่ได้ React เตือน `` You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`. `` (เรารันจริง)
> - ปุ่มใน `<form>` ที่ไม่ใช่ปุ่มส่ง ใส่ `type="button"` ไม่งั้นมันส่งฟอร์มด้วย
> - ไม่ต้องจำชนิด event ทั้งหมด: เอาเมาส์ชี้ `e` ใน `onChange={(e) => ...}` VS Code จะบอกชนิดให้เอง

ฟอร์มเต็มพร้อมตรวจข้อมูลอยู่ใน [บทที่ 11 ข้อ 7](./11-react.md)

---

## 6. ⚠️ ตารางแก้ error ที่เจอบ่อย

ข้อความด้านล่างเป็นข้อความจริง ที่เรารันกับ React 19 (และ `tsc` ของ TypeScript) เองแล้ว เว้นแต่ที่ระบุว่า "ไม่ได้ทดลอง"

| ข้อความ error | สาเหตุ | วิธีแก้ |
|---|---|---|
| `Objects are not valid as a React child (found: object with keys {name}). If you meant to render a collection of children, use an array instead.` | เอา **object** ไปวางใน JSX ตรงๆ เช่น `{laptop}` หรือ `{spec}` | วาดเป็นรายฟิลด์ `{laptop.model}` หรือใช้ `map` ถ้าเป็น array |
| `Each child in a list should have a unique "key" prop.` (เตือนใน Console ไม่ใช่ error ที่ทำให้พัง) | ใช้ `map` สร้างรายการแต่ไม่ใส่ `key` | ใส่ `key={l.id}` ที่ตัวนอกสุดของ `map` |
| `Cannot read properties of undefined (reading 'map')` | เรียก `.map` กับค่าที่ยังเป็น `undefined` (ข้อมูลยังไม่โหลดเสร็จ / ชื่อฟิลด์ผิด) | ตั้งค่าเริ่มต้น `useState<Laptop[]>([])` หรือ `data?.map(...)` และมี `if (loading)` ก่อน |
| `Cannot read properties of null (reading 'x')` | อ่านค่าข้างในตัวแปรที่เป็น `null` (เช่น `selected.model` ตอนยังไม่ได้เลือก) | เช็คก่อน `selected && ...` หรือ `selected?.model` (ข้อความรูปแบบนี้เป็นของ JavaScript ไม่ได้รันกับ React โดยตรง) |
| `Rendered more hooks than during the previous render.` | เรียก hook ใน `if`/ลูป หรือ `return` ก่อนเรียก hook ครบ | ย้าย hook ทั้งหมดไปบนสุด ก่อน `return` และ `if` |
| `Invalid hook call. Hooks can only be called inside of the body of a function component.` (ข้อความยาวกว่านี้ ขึ้นต้นประโยคนี้) | เรียก hook นอก component, ในฟังก์ชันธรรมดา, หรือมี React 2 ชุดในโปรเจกต์ | เรียกใน component/custom hook เท่านั้น ถ้าไม่ได้ทำผิด ลองถามพี่ว่ามี React ซ้ำหรือเปล่า |
| `Too many re-renders. React limits the number of renders to prevent an infinite loop.` | เรียก `setX(...)` ตอนวาดโดยตรง รวมถึง `onClick={setX(1)}` | เรียกใน handler: `onClick={() => setX(1)}` หรือใน `useEffect` |
| `Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, ...` | `useEffect` เรียก `setState` โดยไม่มี dependency array หรือ dependency เปลี่ยนทุกรอบ | ใส่ `[]` หรือ dependency ที่เปลี่ยนจริง |
| `Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component ...` | import ผิดแบบ (default กับ named สลับกัน) หรือไฟล์ไม่ได้ export | ตรวจว่า `export default` ตรงกับ `import X from` และ `export function X` ตรงกับ `import { X }` |
| `useNavigate() may be used only in the context of a <Router> component.` | ใช้ hook ของ react-router นอก `<BrowserRouter>` | ห่อแอปด้วย router ใน `main.tsx` ([บทที่ 13](./13-router-seo.md)) |
| `` The `style` prop expects a mapping from style properties to values, not a string. `` | เขียน `style="color:red"` | <code v-pre>style={{ color: "red" }}</code> |
| `` Invalid DOM property `class`. Did you mean `className`? `` (คำเตือน) | เขียน `class` ใน JSX | ใช้ `className` |
| `Type 'string' is not assignable to type 'number'.` | ใส่ชนิดข้อมูลผิด (เช่น `Number` vs `string` จากช่องกรอก/`useParams`) | แปลงชนิด (`Number(x)`) หรือแก้ type ให้ถูก |
| `Type '"broken"' is not assignable to type '"available" \| "rented"'.` | ค่าไม่อยู่ในรายการ union | ใช้ค่าที่อนุญาต หรือเพิ่มเข้าไปใน type |
| `Property 'laptop' is missing in type '{}' but required in type 'Props'.` | ลืมส่ง props ที่บังคับ | ส่ง prop ให้ครบ หรือทำให้ไม่บังคับด้วย `?` ถ้าตั้งใจ |
| `Property 'nam' does not exist on type '{ name: string; }'. Did you mean 'name'?` | สะกดชื่อฟิลด์ผิด | แก้ตามที่ TypeScript แนะนำ |
| `'u' is possibly 'undefined'.` | ใช้ค่าที่อาจเป็น `undefined` (เช่น ผล `find`, `useParams`) ทันที | เช็คก่อน (`if (!u) return`) หรือ `u?.length` |
| `Type '{ id: number; }' is not assignable to type 'never'.` | `useState([])` ไม่ได้ใส่ type | `useState<Laptop[]>([])` |
| หน้าขาวทั้งหน้า ไม่มีข้อความ | error ตอนวาดทำให้ทั้งแอปล้ม | เปิด Console (F12) อ่านบรรทัดแดงบนสุด ([บทที่ 9](./09-debugging.md)) |

> 💡 **วิธีอ่าน:** อ่านบรรทัดแรกของ error → แล้วดูบรรทัด `at ...` ตัวแรกที่เป็นชื่อไฟล์ของเรา (เช่น `laptop-card.tsx:12`) แล้วไปดูบรรทัดนั้น ไม่ต้องอ่านทั้งก้อน

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. <code>const [a, setA] = useState(0)</code> เรียกว่าอะไร และทำไมตั้งชื่อ <code>a</code> เป็นอย่างอื่นได้?</summary>

เรียกว่า destructuring แบบ array `useState` คืน array 2 ช่องเสมอ (ค่า, ฟังก์ชันตั้งค่า) การแกะ array ใช้ **ลำดับ** ไม่ใช่ชื่อ จึงตั้งชื่อเองได้ ต่างจาก object ที่แกะตามชื่อ
</details>

<details><summary>2. <code>{items.length && &lt;p&gt;มีของ&lt;/p&gt;}</code> เมื่อ <code>items</code> ว่าง หน้าจอขึ้นอะไร และแก้ยังไง?</summary>

ขึ้นเลข `0` เพราะ `0 && ...` ได้ค่า `0` และ React วาดเลข 0 แก้เป็น `items.length > 0 && ...`
</details>

<details><summary>3. <code>quantity || 1</code> กับ <code>quantity ?? 1</code> ต่างกันยังไง เมื่อ <code>quantity</code> เป็น 0?</summary>

`||` ให้ผล `1` (มองว่า 0 คือไม่มีค่า) `??` ให้ผล `0` (ถือว่าไม่มีค่าเฉพาะ `null` / `undefined`) ถ้า 0 เป็นค่าที่ถูกต้อง ใช้ `??`
</details>

<details><summary>4. ทำไม <code>setLaptops(laptops.push(x))</code> ผิด แล้วควรเขียนยังไง?</summary>

`push` แก้ array เดิมและคืนค่าเป็น **ความยาว** (ตัวเลข) ไม่ใช่ array ใหม่ React จึงไม่เห็นว่ามีอะไรเปลี่ยน ต้องเขียน `setLaptops([...laptops, x])` สร้าง array ใหม่
</details>

<details><summary>5. ทำไมห้ามเรียก hook ใน <code>if</code>?</summary>

React จำว่า hook ตัวไหนเป็นของ component จาก **ลำดับการเรียก** ถ้ารอบหนึ่งเรียก 2 ตัว อีกรอบเรียก 1 ตัว ลำดับจะเลื่อน จึงเกิด error `Rendered more hooks than during the previous render.`
</details>

<details><summary>6. <code>useParams()</code> ได้ <code>id</code> เป็น <code>"7"</code> แล้วอยากเอาไปเทียบกับ <code>laptop.id</code> (number) ต้องทำอะไร?</summary>

แปลงเป็นตัวเลขก่อน: `Number(id)` เพราะ `useParams` คืน string เสมอ ถ้าเทียบ `"7" === 7` ได้ `false`
</details>

<details><summary>7. อยากให้ช่องค้นหาไม่รีโหลดหน้าตอนกด Enter ต้องทำอะไร?</summary>

ใส่ `onSubmit` ที่ฟอร์ม แล้วเรียก `e.preventDefault()` ในนั้น
</details>

---

## ✏️ แบบฝึกหัด

1. **ไวยากรณ์:** เขียนสคริปต์ `.ts` ที่ใช้ข้อมูล `laptops` ในบทนี้ แล้วหา (ก) รุ่นของเครื่องที่ว่างทั้งหมด (`filter` + `map`) (ข) เครื่องที่ราคาสูงสุด (`reduce`) (ค) สรุปเป็นข้อความด้วย template literal รันด้วย `bun file.ts` แล้วเทียบผลกับที่คิดไว้
2. **ลองพังมันดู:** ในโปรเจกต์ React ของบทที่ 11 ลองทำให้เกิด error ต่อไปนี้ทีละตัวแล้วอ่านข้อความเทียบกับหัวข้อ 6: (ก) ลบ `key` ออกจาก `map` (ข) `onClick={setOpen(!open)}` (ค) เรียก `useState` ใน `if` แล้วสลับเงื่อนไข (ง) เปลี่ยน `export default` เป็น `export` แต่ยัง `import` แบบเดิม
3. **หน้ารายการโน้ตบุ๊ก:** สร้างหน้าที่มีช่องค้นหา (`useState` + `onChange`) ตัวกรองสถานะ "ว่าง/ทั้งหมด" ที่เก็บใน URL ด้วย `useSearchParams` (`?status=available`) และปุ่ม "เช่า" ที่เปลี่ยนสถานะเครื่องด้วย `map` + spread ห้ามใช้ `useMemo`/`useCallback` ถ้ายังไม่เห็นว่าช้า
4. **อ่านโค้ด AI:** ให้ AI เขียนหน้ารายการให้ แล้วไฮไลต์ทุกบรรทัดที่มี `?.`, `??`, `...`, `=>`, hook และอธิบายด้วยคำพูดตัวเองว่ามันทำอะไร ถ้าอธิบายไม่ได้ ให้กลับมาเปิดหัวข้อที่เกี่ยวข้องในบทนี้ (ดู [บทที่ 16](./16-ai-pairing.md))

> 📌 คำสั่ง terminal (git, bun, npm, docker) ไม่ได้อยู่ในบทนี้ ดูที่ [บทที่ 1](./01-git.md), [2](./02-docker.md), [3](./03-node-yarn-bun.md) และ [Cheat Sheet](./cheat-sheet.md)

## ✅ ผ่านด่าน

- [ ] อ่านออกว่า `const { a, b: c = 1 } = obj` และ `const [x, y] = arr` ได้ค่าอะไร
- [ ] ใช้ `map` / `filter` / `find` กับ array ของ `Laptop` ได้ และไม่แก้ state ตรงๆ (ใช้ spread)
- [ ] เลือกถูกระหว่าง `??` กับ `||` และไม่เจอเลข `0` โผล่จาก `&&`
- [ ] เขียน `try / catch / finally` กับ `await` ได้ และรู้ว่า `fetch` ต้องเช็ค `res.ok` เอง
- [ ] เขียน JSX ได้ถูกกฎ (`className`, `htmlFor`, <code v-pre>style={{ }}</code>, `key`) และบอกได้ว่า hook ไหนใช้เมื่อไหร่
- [ ] รู้กฎของ Hooks และเปิดตาราง error หัวข้อ 6 เพื่อแก้เองก่อนถามได้

---

[← บทที่ 16: ทำงานคู่กับ AI](./16-ai-pairing.md) · [🏠 สารบัญ](/) · [บทเสริม: จัดโครงสร้างโปรเจกต์ →](./project-structure.md)
