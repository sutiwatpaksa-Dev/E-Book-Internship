# บทที่ 9: Debugging 🕵️

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 4 · 🛠 ใช้: VS Code, TypeScript, browser DevTools, curl, Docker (ข้อ 11)

> **⚡ สรุป 30 วินาที**
> - บั๊กไม่ใช่ศัตรู แต่คือ **ปริศนา** ที่มีเบาะแสให้เสมอ
> - ขั้นตอน: **ทำให้เกิดซ้ำ → อ่าน error → แคบขอบเขต → ตั้งสมมติฐาน → แก้ → ตรวจซ้ำ**
> - อ่าน stack trace: บรรทัดแรก = **เกิดอะไร** · บรรทัดแรกที่เป็นไฟล์ของเรา = **เกิดที่ไหน**
> - ใช้ **breakpoint** ใน VS Code แทนการเดาด้วย `console.log` อย่างเดียว
> - ปัญหาหน้าเว็บ/API: เปิด **DevTools แท็บ Network** ดูว่า request ออกไปอะไร และ server ตอบอะไร
> - ถามคนอื่นให้ได้คำตอบเร็ว: บอก **ทำอะไร คาดว่าจะได้อะไร ได้อะไรจริง ลองอะไรไปแล้ว** และ **ห้ามวางความลับให้ AI**

---

## 📖 เรื่องเล่า

บิตนั่งจ้องจอ 2 ชั่วโมง แก้โค้ดไปเรื่อยๆ แบบสุ่ม รันใหม่ 40 รอบ ก็ยังพัง 😩
พี่ไบต์เดินมาถามคำถามเดียว: *"error บอกว่าอะไร?"*
บิต: *"เอ่อ... ผมยังไม่ได้อ่านเลยครับ มันยาวมาก"*

พี่ไบต์อ่านให้ฟัง 10 วินาที ชี้บรรทัดที่ 23 แก้เสร็จใน 1 นาที 🫠

> 🤓 **เกร็ด:** คำว่า "bug" ในวงการคอมพิวเตอร์ มีบันทึกจริงในปี 1947 ว่าทีมของ Grace Hopper เจอ **แมลงเม่าติดอยู่ในเครื่อง** คอมพิวเตอร์ Harvard Mark II แล้วแปะแมลงตัวนั้นไว้ในสมุดบันทึกพร้อมเขียนว่า "first actual case of bug being found" 🦋

---

## 1. Mindset: เป็นนักสืบ ไม่ใช่นักเดา

โปรแกรมเมอร์ทุกคน (รวมถึงคนเก่งๆ) เสียเวลาไปกับ debug มากกว่าเขียนโค้ดใหม่ ดังนั้นทักษะนี้คุ้มค่าที่สุดอย่างหนึ่ง คำสำคัญคือ **ทำเป็นระบบ**: บั๊กเกิดจาก "โค้ดทำตามที่เราสั่ง แต่ไม่ตรงกับที่เราคิด" ดังนั้นหน้าที่ของเราคือหาว่า **ตรงไหนที่ความคิดกับความจริงเริ่มไม่ตรงกัน**

| ❌ นักเดา | ✅ นักสืบ |
|---|---|
| แก้มั่วๆ แล้วรันดูว่าหายไหม | อ่านเบาะแส (error) ก่อน |
| เปลี่ยนทีละ 5 จุด | เปลี่ยนทีละ 1 จุด แล้วดูผล |
| "มันพังเอง" | "มันพังเพราะ..." |
| แก้หายแล้วไม่รู้ว่าทำไม | เข้าใจว่าทำไมพังและทำไมหาย |

**5 ขั้นของนักสืบ** 🔍
1. **ทำให้เกิดซ้ำ** ได้ทุกครั้ง: ทำอะไร ใส่ข้อมูลอะไร ถึงพัง
2. **แคบขอบเขต:** เริ่มจากอ่าน error ให้จบ (ข้อ 2) แล้วหาว่าพังที่ฟังก์ชันไหน บรรทัดไหน ข้อมูลตัวไหนผิด
3. **ตั้งสมมติฐาน:** "น่าจะเพราะ X เป็น undefined"
4. **แก้ทีละอย่าง** แล้วทดสอบ
5. **ตรวจซ้ำ** ว่าหายจริง และไม่ทำของอื่นพัง

![วงจร debug 5 ขั้น: ทำให้เกิดซ้ำ แคบขอบเขต ตั้งสมมติฐาน แก้ทีละอย่าง ตรวจซ้ำ แล้ววนกลับถ้ายังไม่หาย](/img/09-debug-loop.svg)
*วงจรนักสืบ: ถ้าแก้แล้วยังไม่หาย แปลว่าสมมติฐานผิด ซึ่งไม่เป็นไร กลับไปตั้งสมมติฐานใหม่โดยใช้เบาะแสที่เพิ่งได้*

### 1.1 แต่ละขั้นทำอะไรจริงๆ

**ขั้น 1: ทำให้เกิดซ้ำ (Reproduce)**
บั๊กที่ "บางทีเกิดบางทีไม่เกิด" แก้ไม่ได้ เพราะเราไม่รู้ว่าแก้หายหรือแค่โชคดี ให้จดให้ได้ว่า **ทำอะไรตามลำดับ ใส่ข้อมูลอะไร** แล้วลดให้สั้นที่สุด (เรียกว่า *minimal reproduction*) เช่น แทนที่จะบอกว่า "หน้าสั่งซื้อพัง" ให้ลดเหลือ "เรียก `calcRent(1500, 3, 10)` แล้วได้ค่าติดลบ"

**ขั้น 2: แคบขอบเขต (Isolate)**
เป้าหมายคือเปลี่ยนจาก "ระบบทั้งระบบมีบั๊ก" เป็น "บั๊กอยู่ใน 5 บรรทัดนี้" มี 3 วิธีที่ใช้บ่อย
1. **ตามข้อมูล:** `console.log` หรือ breakpoint ดูค่าที่ **ทางเข้า** และ **ทางออก** ของแต่ละขั้น ค่ายังถูกที่ทางเข้า แต่ผิดที่ทางออก = บั๊กอยู่ในขั้นนั้น
2. **หารครึ่ง (bisect):** ตัดโค้ดครึ่งหนึ่งออก (ปิดด้วย comment) แล้วดูว่ายังพังไหน ยังพัง = อยู่ในครึ่งที่เหลือ หาย = อยู่ในครึ่งที่ตัดไป แล้วหารครึ่งซ้ำ โค้ด 1,000 บรรทัดหารครึ่งแค่ราว 10 ครั้งก็เจอ
3. **ถามว่า "ครั้งสุดท้ายที่ยังปกติคือเมื่อไหร่ และหลังจากนั้นเปลี่ยนอะไร"** → ใช้ `git bisect` (หัวข้อถัดไป)

**ขั้น 3: ตั้งสมมติฐานที่ทดสอบได้**
สมมติฐานที่ดีต้องพิสูจน์ว่าผิดได้ เช่น ❌ "น่าจะเป็นที่ database" (กว้างไป) ✅ "ถ้า `l` เป็น `undefined` ตอนบรรทัด 3 แปลว่า `find(99)` หาไม่เจอ" แล้วไปดูค่า `l` จริงๆ

**ขั้น 4-5: แก้ทีละจุด แล้วตรวจซ้ำ**
แก้แล้วรันขั้นตอนเดิมจากขั้น 1 ถ้าหาย ให้ถามต่ออีกข้อ: *"ทำไมมันถึงพังมาตั้งแต่แรก?"* ถ้าตอบไม่ได้ แปลว่ายังไม่เข้าใจ เสี่ยงที่บั๊กจะกลับมา และถ้าโปรเจกต์มี test ให้เพิ่ม test ที่จับบั๊กนี้ไว้ด้วย กันมันกลับมา

### 1.2 หารครึ่งด้วย `git bisect` (หา commit ที่ทำให้พัง)

เมื่อ "เมื่อวานยังใช้ได้ วันนี้พัง" และมีหลายสิบ commit ระหว่างนั้น ให้ Git หารครึ่งให้เอง

![commit C1-C4 ปกติ C5-C8 พัง bisect ทดสอบ C4, C6, C5 แล้วเจอว่า C5 คือตัวต้นเหตุ](/img/09-bisect.svg)
*Git ทดสอบ commit ตรงกลาง แล้วตัดทิ้งครึ่งหนึ่งทุกครั้ง*

ตัวอย่างนี้ลองได้ในโฟลเดอร์ทดลองของตัวเอง (สร้างโฟลเดอร์ใหม่ ไม่ต้องทำในโปรเจกต์จริง) มีไฟล์ `check.ts` ที่ตรวจว่าราคาต้องไม่ติดลบ (รับ exit code `0` = ปกติ, อื่นๆ = พัง) และมี 6 commit ซึ่งตั้งแต่ commit 4 ราคากลายเป็นติดลบ

```ts
// check.ts
import { price } from "./p.ts";
if (price < 0) { console.error("price negative"); process.exit(1); }
console.log("ok");
```

```bash
git bisect start
git bisect bad HEAD          # commit ปัจจุบันพังอยู่
git bisect good HEAD~5       # 5 commit ก่อนหน้ายังปกติ
git bisect run bun check.ts  # ให้ Git รันสคริปต์ตรวจเองอัตโนมัติ
```

**ควรเห็น** (ตัดบางบรรทัดออก)
```
Bisecting: 2 revisions left to test after this (roughly 1 step)
[a2a6cd5...] commit 3
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[4342ce1...] commit 4
running 'bun' 'check.ts'
price negative
4342ce1... is the first bad commit
...
bisect found first bad commit
```

จบแล้วต้องออกจากโหมด bisect เสมอ
```bash
git bisect reset
```
ถ้าไม่มีสคริปต์ตรวจอัตโนมัติ ก็ทำมือได้: Git จะ checkout commit กลางให้ เราทดสอบเอง แล้วพิมพ์ `git bisect good` หรือ `git bisect bad` ไปเรื่อยๆ จนเจอ

> 💡 พอรู้ว่า commit ไหนเป็นต้นเหตุ ให้เปิดดูว่ามันแก้อะไร (`git show <รหัส commit>`) บั๊กมักอยู่ในไม่กี่บรรทัดนั้น
> ⚠️ ทำ bisect ตอนไม่มีงานค้างที่ยังไม่ commit (มันสลับ commit ไปมา)

---

## 2. อ่าน Stack Trace

**stack trace** คือรายงานตอนโปรแกรมล้ม บอกว่า "ล้มที่ไหน และใครเรียกมาจนถึงตรงนั้น" น้องๆ ส่วนใหญ่กลัวเพราะมันยาว แต่จริงๆ ต้องอ่านแค่ 2-3 บรรทัด

```
TypeError: Cannot read properties of undefined (reading 'brand')
    at formatLaptop (/app/src/format.ts:3:22)
    at /app/src/routes/laptops.ts:15:18
    at Layer.handle (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
```

| ส่วน | บอกอะไร |
|---|---|
| `TypeError` | **ชนิด** ของ error |
| `Cannot read properties of undefined (reading 'brand')` | **เกิดอะไร:** พยายามอ่าน `.brand` จากสิ่งที่เป็น `undefined` |
| `at formatLaptop (src/format.ts:3:22)` | **เกิดที่ไหน:** ฟังก์ชัน `formatLaptop` ไฟล์ `format.ts` บรรทัด 3 |
| `at ... routes/laptops.ts:15:18` | **ใครเรียกมา:** บรรทัด 15 ของ `laptops.ts` |
| `node_modules/...` | โค้ดของ library **ข้ามไปได้เลย** |

![stack trace 5 บรรทัด ชี้ว่าบรรทัดแรกคือชนิดและสาเหตุ บรรทัดแรกที่เป็นไฟล์ของเราคือจุดเริ่มสืบ บรรทัดของ node_modules ข้ามได้](/img/09-stack-trace.svg)
*ตัวเลขในวงกลมคือลำดับที่ควรอ่าน*

> 💡 **อ่านจากบนลงล่าง หาบรรทัดแรกที่เป็นไฟล์ของเรา** (ไม่ใช่ `node_modules`) นั่นคือจุดเริ่มสืบ
> 💡 stack trace = **รอยเท้า** ของโปรแกรมก่อนล้ม บรรทัดบนสุดคือจุดที่ล้ม บรรทัดล่างคือทางที่เดินมา

### 2.1 🔧 ลองอ่านของจริงใน Node และ Bun

สร้างไฟล์ `format.ts` ในโฟลเดอร์ทดลอง

```ts
interface Laptop { id: number; brand: string }
const laptops: Laptop[] = [{ id: 1, brand: "Acer" }];

export function formatLaptop(l: Laptop) {
  return `${l.id}: ${l.brand}`;
}

function findLaptop(id: number) {
  return laptops.find((x) => x.id === id) as Laptop;   // TypeScript เชื่อเราว่ามีแน่ๆ
}

console.log(formatLaptop(findLaptop(1)));
console.log(formatLaptop(findLaptop(99)));             // ไม่มี id 99 → undefined
```

รันด้วย Bun แล้วด้วย Node (Node รุ่นใหม่ ตั้งแต่ราว 22.18 ขึ้นไป รันไฟล์ `.ts` ตรงๆ ได้ ถ้าเครื่องเป็นรุ่นเก่าให้ลองแค่ Bun)
```bash
bun format.ts
node format.ts
```

**ควรเห็น (Bun)** (path ย่อให้สั้น)
```
1: Acer
1 | interface Laptop { id: number; brand: string }
...
5 |   return `${l.id}: ${l.brand}`;
                ^
TypeError: undefined is not an object (evaluating 'l.id')
      at formatLaptop (/.../format.ts:5:13)
      at /.../format.ts:13:13
```
**ควรเห็น (Node)**
```
1: Acer
file:///.../format.ts:5
  return `${l.id}: ${l.brand}`;
              ^

TypeError: Cannot read properties of undefined (reading 'id')
    at formatLaptop (file:///.../format.ts:5:15)
    at file:///.../format.ts:13:13
    at ModuleJob.run (node:internal/modules/esm/module_job:...)
```

สังเกต 4 อย่าง
1. **ข้อความ error ต่างกันตาม runtime** (Bun: `undefined is not an object`, Node: `Cannot read properties of undefined`) แต่ความหมายเหมือนกัน ตอนค้นหาใน Google ให้ลองทั้งสองแบบ
2. ทั้งคู่ **ชี้ลูกศร `^` ใต้โค้ดจริง** ตัวอักษรที่ผิด พร้อมโชว์บรรทัดนั้นให้เลย
3. บรรทัด `at formatLaptop (...:5:...)` บอก **ไฟล์:บรรทัด:ตัวอักษรที่** บรรทัด 5 คือ `l.id` ตัวแรกที่แตะ `undefined`
4. บรรทัดที่ขึ้นต้น `node:internal/...` คือโค้ดภายในของ Node ข้ามได้เหมือน `node_modules`

> 🤔 **ทำไม `tsc` ไม่เตือน?** เพราะเราเขียน `as Laptop` บอก TypeScript ว่า "เชื่อฉัน มีแน่" ซึ่งปิดปากมันไว้ ถ้า `find` อาจได้ `undefined` ให้เช็คก่อนใช้ (`if (!laptop) throw new Error("ไม่พบ laptop")`) อย่าใช้ `as` ปิดปากเพื่อให้ผ่านเฉยๆ

### 2.2 Stack trace ใน browser

เมื่อโค้ดฝั่งหน้าเว็บพัง จะเห็นข้อความสีแดงในแท็บ **Console** ของ DevTools (ข้อ 8) หน้าตาจะคล้ายกัน:

```
Uncaught TypeError: Cannot read properties of undefined (reading 'brand')
    at formatLaptop (app.js:3:22)
    at HTMLButtonElement.onclick (app.js:15:9)
```

- อ่านเหมือนกันทุกประการ: บรรทัดแรก = เกิดอะไร, `app.js:3:22` = ไฟล์:บรรทัด:ตัวอักษร
- ปลายบรรทัดมักเป็นลิงก์ คลิกแล้วเปิดโค้ดตรงบรรทัดนั้นในแท็บ **Sources**
- ถ้าโปรเจกต์ถูกบีบอัดตอน build (เช่น `index-4f3a.js:1:20938`) เครื่องมืออย่าง Vite จะมี **source map** ให้ DevTools แปลงกลับเป็นไฟล์ต้นฉบับของเรา ตอน dev ปกติจะเปิดไว้ให้แล้ว
- error ที่ห่อ error อื่นไว้ข้างใน (มี `cause`) จะพิมพ์ส่วน `[cause]` ต่อท้าย ให้อ่านส่วนนั้นด้วย เพราะต้นเหตุจริงมักอยู่ในนั้น

### 2.3 ตารางโกง: error ที่เจอบ่อย → แปลว่าอะไร → ไปดูที่ไหน

| error | แปลว่า / มักเกิดจาก | ไปดูที่ไหนก่อน |
|---|---|---|
| `Cannot read properties of undefined (reading 'x')` | ตัวแปรที่เรากำลังใช้ว่างเปล่า หาข้อมูลไม่เจอแต่ไม่ได้เช็คก่อนใช้ | บรรทัดในไฟล์ของเรา → ดูค่าตัวแปรด้วย breakpoint |
| `X is not a function` | ชื่อผิด, import ผิด, ตัวแปรไม่ใช่สิ่งที่คิด | ชื่อที่ import / `console.log(typeof x)` |
| `X is not defined` | ใช้ตัวแปรที่ยังไม่ได้ประกาศ / ลืม import | ตัวสะกด, บรรทัด import บนสุดของไฟล์ |
| `Cannot find module 'x'` | ยังไม่ได้ติดตั้ง หรือ path ที่ import ผิด | รัน `npm install` / `bun install`, ตรวจ path |
| `ECONNREFUSED 127.0.0.1:5432` | DB ยังไม่เปิด หรือ host/port ผิด (ใน Docker ใช้ชื่อ service!) | `docker compose ps`, ค่า `DATABASE_URL` |
| `EADDRINUSE :::3000` | มีโปรแกรมอื่นใช้ port 3000 อยู่ (อาจเป็นตัวเดิมที่ยังไม่ปิด) | `lsof -i :3000` แล้วปิด process นั้น หรือเปลี่ยน port |
| `relation "x" does not exist` | ยังไม่ได้รัน migration หรือต่อผิด DB | รัน migration, ตรวจว่าต่อ DB ตัวไหน |
| `Unexpected token < in JSON` (Node รุ่นใหม่: `"<html>" is not valid JSON`) | ได้ HTML (หน้า error) กลับมาแทน JSON | DevTools > Network > Response ของ request นั้น |
| `401 Unauthorized` | ยังไม่ได้ login / token หมดอายุ / ไม่ได้แนบ token | Network > Headers ดูว่าส่ง cookie/`Authorization` ไปไหม |
| `403 Forbidden` | login แล้วแต่ไม่มีสิทธิ์ | โค้ดเช็คสิทธิ์ฝั่ง server (บทที่ 10) |
| `404 Not Found` | URL ผิด / method ผิด / route ยังไม่ได้ลงทะเบียน | พิมพ์ URL ซ้ำ ดู path และ method |
| `400 Bad Request` | server ปฏิเสธข้อมูลที่ส่งไป (มักข้อมูลไม่ครบ/ผิดรูปแบบ) | Network > Payload เทียบกับที่ API ต้องการ + Response ที่บอกเหตุผล |
| `500 Internal Server Error` | โค้ดฝั่ง server ล้ม | **terminal/log ของ server** ไม่ใช่ browser |
| `has been blocked by CORS policy` | browser กันเว็บโดเมนหนึ่งเรียก API อีกโดเมน (บทที่ 10) | ตั้งค่า CORS ที่ server ให้อนุญาตโดเมนของเว็บเรา |
| `CORS error` แต่ curl ได้ปกติ | CORS เป็นกฎของ **browser** เท่านั้น curl ไม่สน | ฝั่ง server ไม่ได้ส่ง header `Access-Control-Allow-Origin` |
| `Maximum call stack size exceeded` | ฟังก์ชันเรียกตัวเองไม่มีที่สิ้นสุด | ดู stack trace ซ้ำๆ เงื่อนไขหยุด (base case) |
| `Unhandled promise rejection` | `async` พังแล้วไม่มีใคร `catch` | ข้อ 9 |
| `permission denied` (Docker / ไฟล์) | สิทธิ์ไฟล์ หรือ user ใน container ไม่มีสิทธิ์ | ดู log ของ container (ข้อ 11) |

> 💡 **วิธีใช้ตาราง:** อย่าจำทุกตัว ให้จำหลักว่า error สองกลุ่มใหญ่ **เกิดที่ไหน** = กลุ่ม client (browser) ดู DevTools, กลุ่ม server ดู log ของ server และ error 4xx = เราส่งผิด ส่วน 5xx = server พัง

---

## 3. `console.log` อย่างมีระบบ

```ts
console.log(laptop);                          // ❌ log เปล่าๆ ไม่รู้ว่าค่าไหนของอะไร
console.log("[rent] laptop =", laptop);       // ✅ มีป้ายบอก
console.log({ laptopId, customerId, status }); // ✅ log หลายค่าพร้อมชื่อในบรรทัดเดียว
console.table(laptops);                       // ✅ array ของ object แสดงเป็นตาราง
console.log(JSON.stringify(data, null, 2));   // ✅ object ซ้อนลึกๆ อ่านง่าย
```
> ⚠️ ลบ log ที่ใช้ debug ออกก่อน commit และ **ห้าม log รหัสผ่าน/token/ข้อมูลส่วนตัวลูกค้า** (บทที่ 10)

### 3.1 ระดับของ log (Log levels)

log ทุกบรรทัดไม่ได้สำคัญเท่ากัน ระบบจริงแบ่ง **ระดับ** เพื่อกรองเฉพาะที่ต้องการ

| ระดับ | ใช้เมื่อ | ตัวอย่าง |
|---|---|---|
| `debug` | รายละเอียดตอนพัฒนา เปิดเฉพาะตอนตามบั๊ก | `debug: คำนวณค่าเช่า`, ค่าตัวแปรกลางทาง |
| `info` | เหตุการณ์ปกติที่อยากรู้ | `info: เปิด server ที่ port 3000`, `สร้าง rental #10` |
| `warn` | ผิดปกติแต่ยังไปต่อได้ | `warn: ลูกค้าส่งรหัสผิด 3 ครั้งติด` |
| `error` | พังจริง ต้องมีคนดู | `error: เชื่อม DB ไม่ได้` |

`console` ในตัวมีให้ครบ
```ts
console.debug("[debug] ค่าเริ่มต้น", { months: 3 });
console.info("[info] server เปิดแล้ว");
console.warn("[warn] ส่วนลดสูงผิดปกติ");
console.error("[error] จ่ายเงินไม่สำเร็จ");
```
**ควรเห็น** (ใน terminal) ครบทั้ง 4 บรรทัด ส่วนใน DevTools ของ browser `warn` เป็นสีเหลือง `error` เป็นสีแดง และมีช่องกรองตามระดับให้เลือก

เคล็ดลับที่ใช้ได้จริง
- `console.error` ส่งออกทาง **stderr** (ช่องสำหรับ error) แยกจาก `console.log` ที่ไปทาง stdout ทำให้ redirect แยกกันได้ เช่น `bun app.ts 2> errors.log`
- ระบบจริงใช้ library log (เช่น `pino`) ตั้งระดับผ่าน env เช่น `LOG_LEVEL=debug` ตอน dev และ `info` ตอนใช้งานจริง จะได้ไม่ท่วมจอ
- log เป็น **JSON ต่อบรรทัด** (structured log) เช่น `{"level":"error","msg":"rent failed","laptopId":7}` ทำให้ค้นหา/กรองง่ายกว่าข้อความยาวๆ
- ใส่ **เวลา** และ **รหัสอ้างอิง** (เช่น request id) ใน log เพื่อตามเรื่องเดียวกันข้ามหลายบรรทัด
- ไม่ log ข้อมูลลับ: เปลี่ยน `console.log(user)` เป็น `console.log({ id: user.id })`

---

## 4. 🔧 ใช้ Debugger ใน VS Code (เปลี่ยนชีวิต)

`console.log` เหมือน **ถ่ายรูปทีละภาพ** ส่วน debugger เหมือน **กด pause วิดีโอ** 🎬 แล้วดูทุกอย่างในเฟรมนั้นได้

![โค้ดที่มีจุดแดงที่บรรทัด 3 เมื่อโปรแกรมหยุด แผง Variables แสดง l = undefined พร้อมปุ่ม Continue Step Over Step Into](/img/09-breakpoint-flow.svg)
*breakpoint = บอกโปรแกรมว่า "ถึงบรรทัดนี้แล้วหยุดรอก่อน" แล้วเราค่อยดูค่าต่างๆ*

**วิธีที่ง่ายที่สุด**
1. ใน VS Code กด `⌘/Ctrl + Shift + P` → พิมพ์ **"JavaScript Debug Terminal"** → Enter
2. Terminal ใหม่จะเปิดขึ้น พิมพ์ `npm run dev` ในนั้น
3. คลิกที่ **ซ้ายของเลขบรรทัด** ให้เกิด **จุดแดง** 🔴 = breakpoint
4. เรียกให้โค้ดทำงาน (เช่น ส่ง request) → โปรแกรมหยุดที่จุดแดง

**ตอนหยุดอยู่ทำอะไรได้บ้าง**
| ปุ่ม / แผง | ทำอะไร |
|---|---|
| **Variables** | เห็นค่าทุกตัวแปร ณ ตอนนั้น |
| **Watch** | พิมพ์ expression ให้คอยดู เช่น `laptop.status` |
| **Call Stack** | เส้นทางที่เรียกมาถึงจุดนี้ |
| ▶️ Continue (`F5`) | ไปต่อจนเจอ breakpoint ถัดไป |
| ⤵️ Step Over (`F10`) | ไปบรรทัดถัดไป |
| ⬇️ Step Into (`F11`) | เข้าไปในฟังก์ชันที่เรียก |
| เอาเมาส์ชี้ตัวแปร | เห็นค่าทันที |

> 💡 **Conditional breakpoint:** คลิกขวาที่จุดแดง → Edit Breakpoint → ใส่เงื่อนไข เช่น `laptop.id === 7` จะหยุดเฉพาะตอนที่ตรงเงื่อนไข เหมาะกับบั๊กที่เกิดกับข้อมูลบางตัวใน loop ยาวๆ

### 4.1 ตั้งค่า `launch.json` ทีละขั้น (กดรันด้วย `F5` ได้เลย)

JavaScript Debug Terminal สะดวกแต่ต้องเปิดใหม่ทุกครั้ง ถ้าอยากให้กด `F5` แล้ว debug เลย ให้ตั้งไฟล์ตั้งค่า

1. เปิดโฟลเดอร์โปรเจกต์ใน VS Code (ต้องเปิดทั้งโฟลเดอร์ ไม่ใช่เปิดไฟล์เดียว)
2. เปิดแถบ **Run and Debug** (ไอคอนรูปแมลงกับปุ่มเล่นที่แถบซ้าย หรือ `⌘/Ctrl + Shift + D`)
3. กดลิงก์ **create a launch.json file** (ถ้าถามประเภท ให้เลือก Node.js) VS Code จะสร้างไฟล์ `.vscode/launch.json`
4. แทนเนื้อหาด้วยตัวอย่างที่ตรงกับเครื่องมือที่ใช้

**แบบที่ 1: โปรเจกต์ที่รันด้วย npm script** (`npm run dev`)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug: npm run dev",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

**แบบที่ 2: โปรเจกต์ที่ใช้ Bun** (ติดตั้ง extension ชื่อ **Bun for Visual Studio Code** ก่อน)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug: Bun (ไฟล์ที่เปิดอยู่)",
      "type": "bun",
      "request": "launch",
      "program": "${file}",
      "cwd": "${workspaceFolder}",
      "stopOnEntry": false
    }
  ]
}
```

**แบบที่ 3: ต่อเข้ากับโปรแกรมที่รันอยู่แล้ว (attach)** เช่น Node ที่เปิดด้วย `node --inspect`
```json
{
  "name": "Attach to Node",
  "type": "node",
  "request": "attach",
  "port": 9229
}
```

5. ตั้งจุดแดงในไฟล์ที่สงสัย
6. เลือกชื่อ configuration ในช่องเลือกด้านบนของแถบ Run and Debug แล้วกด `F5`
7. ทำให้โค้ดบรรทัดนั้นทำงาน (เช่น ส่ง request) → VS Code เด้งมาหยุดที่จุดแดง

**ควรเห็น:** บรรทัดที่หยุดเป็นแถบสีเหลือง, แผง **Variables** ด้านซ้ายแสดงค่าตัวแปร, **Call Stack** แสดงเส้นทาง, แถบปุ่มควบคุม (Continue/Step) ลอยอยู่ด้านบน

> 💡 ใส่ `${file}` / `${workspaceFolder}` ตามนี้ได้เลย เป็นตัวแปรของ VS Code ที่มันแทนค่าให้เอง
> ⚠️ ไฟล์ `.vscode/launch.json` ไม่ควรมีรหัสผ่านหรือ token อย่าใส่ความลับในช่อง `env` ที่ commit ขึ้น Git

### 4.2 Logpoint: log โดยไม่ต้องแก้โค้ด

คลิกขวาที่ซ้ายเลขบรรทัด → **Add Logpoint...** → พิมพ์ข้อความ เช่น `rent: laptopId = {laptopId}` (ค่าในปีกกาจะถูกแทนด้วยค่าจริง) โปรแกรม **ไม่หยุด** แต่พิมพ์ข้อความออกมาใน Debug Console ทุกครั้งที่ผ่านบรรทัดนั้น ดีกว่าเติม `console.log` เพราะไม่ต้องแก้ไฟล์ และไม่มีทางหลุดเข้า commit

### 4.3 ฝึกใช้ debugger กับตัวอย่าง `format.ts`

1. เปิดไฟล์ `format.ts` จากข้อ 2.1 ตั้งจุดแดงที่บรรทัดแรกในฟังก์ชัน `formatLaptop` (บรรทัดที่ขึ้นต้นด้วย `return`)
2. กด `F5` (ใช้ config แบบ Bun หรือ Node)
3. โปรแกรมหยุดสองรอบ รอบแรก `l` มีค่า `{ id: 1, brand: "Acer" }` กด Continue
4. รอบสอง ดู Variables: `l = undefined` เห็นต้นเหตุ **ก่อนที่มันจะ error** แล้วดู **Call Stack** ว่าใครส่ง `undefined` มา (`findLaptop(99)`)

---

## 5. 🦆 Rubber Duck Debugging

วางเป็ดยาง (หรือตุ๊กตาอะไรก็ได้) ไว้ข้างจอ แล้ว **อธิบายโค้ดให้มันฟังทีละบรรทัด** ว่าบรรทัดนี้ทำอะไร ค่าตอนนี้ควรเป็นอะไร

ฟังดูตลก แต่ได้ผลจริง เพราะการพูดออกมาบังคับให้สมองเช็คทุกขั้นที่เคย "คิดว่าใช่" และส่วนใหญ่จะเจอบั๊กเองก่อนอธิบายจบ 🦆✨

---

## 6. 🙋 ถามคนอื่นยังไงให้ได้คำตอบเร็ว

ติดเกิน **30 นาที** แล้วยังไม่คืบ = ถามได้เลย ไม่ต้องเกรงใจ แต่ถามให้ดีจะได้คำตอบเร็วกว่ามาก

❌ *"พี่ครับ มันพังครับ"*
❌ *"API ใช้ไม่ได้ครับ"* + รูปถ่ายหน้าจอด้วยมือถือ 📱

✅ ใช้เทมเพลตนี้:
```
🎯 กำลังทำ: เพิ่ม endpoint POST /rentals
👣 ขั้นตอนที่ทำให้พัง: ส่ง { "laptopId": 1, "customerId": 2 } ด้วย REST Client
✅ คาดว่าจะได้: 201 พร้อมข้อมูล rental
❌ ได้จริง: 500 และ log ขึ้นว่า
   error: relation "rentals" does not exist
   at ... src/routes/rentals.ts:18:5
🔍 ลองแล้ว: เช็คว่า DB เปิดอยู่ (docker compose ps ขึ้น running), ลองรัน migrate แล้วขึ้น "No migrations to run"
💻 branch: feat/12-rental-api (push แล้ว)
```
> 💡 บ่อยครั้งแค่ **เขียนเทมเพลตนี้ให้ครบ ก็เจอคำตอบเองแล้ว** (เป็ดยางเวอร์ชันเขียน 🦆)
> ⚠️ copy error เป็น **ข้อความ** ไม่ใช่รูป คนช่วยจะ copy ไปค้นต่อได้

### 6.1 Bug report ที่ดี มีอะไรบ้าง

เมื่อต้องเขียน issue หรือรายงานบั๊กให้ทีม (ไม่ใช่แค่ถามในแชท) ใช้โครงนี้ เพื่อให้คนอื่นทำซ้ำได้โดยไม่ต้องถามกลับ

```
หัวข้อ: [สั้น ชัด] กด "เช่าเครื่อง" แล้วได้ 400 ทั้งที่เลือกเครื่องแล้ว

สภาพแวดล้อม: macOS, Bun 1.x, Chrome, branch feat/12-rental-api, commit a1b2c3d
ขั้นตอนทำซ้ำ:
  1. เปิด http://localhost:3000
  2. กดปุ่ม "เช่าเครื่อง"
ผลที่คาดหวัง: ได้ 201 และเห็นรายการเช่าใหม่
ผลที่ได้จริง: ได้ 400 {"error":"laptopId is required"} (แนบข้อความ error เต็มเป็นข้อความ)
ความถี่: เกิดทุกครั้ง
ที่ลองแล้ว/สมมติฐาน: ใน Network > Payload เห็นส่ง {"laptopid":1} (ตัว i เล็ก) น่าจะพิมพ์คีย์ผิด
ไฟล์แนบ: log ที่เกี่ยวข้อง (ลบข้อมูลลับแล้ว)
```

เช็คลิสต์ก่อนส่ง
- [ ] **ทำซ้ำได้ตามขั้นตอน** (คนอื่นทำตามแล้วเจอเหมือนกัน)
- [ ] บอก **คาดหวัง vs ได้จริง** ชัด ไม่ใช้คำว่า "พัง" เฉยๆ
- [ ] ข้อความ error **เต็มๆ เป็นข้อความ** รวม stack trace
- [ ] บอก **เวอร์ชัน/branch/commit** และระบบปฏิบัติการ
- [ ] **หนึ่งเรื่องต่อหนึ่งรายงาน**
- [ ] ลบ รหัสผ่าน/token/ข้อมูลลูกค้าออกแล้ว

---

## 7. ใช้ AI ช่วย debug อย่างถูกวิธี 🤖

AI ช่วยได้มาก **ถ้าให้ข้อมูลครบ** (ใช้เทมเพลตข้อ 6 ได้เลย)

| ✅ ทำ | ❌ อย่าทำ |
|---|---|
| วาง error เต็มๆ + โค้ดส่วนที่เกี่ยวข้อง | วางแค่ "มันพัง แก้ให้หน่อย" |
| ถามว่า "**ทำไม** ถึงพัง" ให้เข้าใจ | copy คำตอบไปวางโดยไม่อ่าน |
| เอาคำตอบมาทดสอบและทำความเข้าใจ | เชื่อ 100% (AI ผิดได้ และมั่นใจมากด้วย) |
| ลบข้อมูลลับก่อนวาง | วาง `.env`, รหัสผ่าน, ข้อมูลลูกค้าจริง 🔐 |

> 📏 กฎทีม: ใช้ AI ได้ แต่ **ต้องอธิบายโค้ดที่ส่งได้ทุกบรรทัด**

### 7.1 ก่อนวางลงใน AI ต้อง "ล้าง" ของที่ห้ามหลุด

error และ log มักมีของลับปนมาโดยไม่รู้ตัว ก่อน copy ให้ไล่ดูและ **แทนที่ด้วยค่าปลอม**

| เจอในข้อความนี้ | แทนด้วย |
|---|---|
| `postgres://admin:S3cret@10.0.0.5:5432/shop` | `postgres://USER:PASSWORD@HOST:5432/DB` |
| `Authorization: Bearer eyJhbGciOi...` | `Authorization: Bearer <TOKEN>` |
| `Cookie: session=abc123` | `Cookie: session=<SESSION>` |
| `sk_live_...`, `API_KEY=...` | `API_KEY=<REDACTED>` |
| ชื่อ/เบอร์/อีเมลลูกค้าจริงใน response | ข้อมูลปลอม เช่น `user@example.com` |

หลักคิด: **วางเฉพาะส่วนที่จำเป็น** (error + โค้ดที่เกี่ยวข้อง ไม่ใช่ทั้งโปรเจกต์ ไม่ใช่ไฟล์ `.env`) ถ้าเผลอวางความลับไปแล้ว ให้ถือว่า **หลุดแล้ว** → เปลี่ยนรหัส/key นั้นทันทีและแจ้งพี่ (วิธีรับมือในบทที่ 10 ข้อ 1)

**วิธีถามที่ได้ผล:** *"นี่คือ error [วางข้อความ] และโค้ด [วางเฉพาะที่เกี่ยวข้อง] ฉันคาดว่าจะได้ X แต่ได้ Y ช่วยอธิบายว่าเป็นไปได้ที่ต้นเหตุคืออะไรบ้าง และฉันจะตรวจสอบแต่ละข้อยังไง"* การขอ **วิธีตรวจ** ดีกว่าขอแค่ "โค้ดที่แก้แล้ว" เพราะเราจะได้เข้าใจและพิสูจน์ได้เอง (ดูเพิ่มที่บทที่ 16)

---

## 8. 🌐 ทัวร์ DevTools ใน Browser ทีละแท็บ

ถ้าปัญหาอยู่ที่หน้าเว็บหรือการเรียก API **DevTools** (เครื่องมือนักพัฒนาในเบราว์เซอร์) คือเครื่องมือที่ต้องใช้ ตัวอย่างในที่นี้อ้างอิง Chrome ส่วน Edge, Firefox ก็มีแท็บเทียบเท่ากัน แต่ชื่อเมนูอาจต่างเล็กน้อย

**เปิดยังไง:** กด `F12` หรือ `⌘ Option I` (Mac) / `Ctrl Shift I` (Windows) หรือคลิกขวาที่หน้าเว็บแล้วเลือก **Inspect**

### 8.0 🔧 เตรียมห้องทดลอง (ทำครั้งเดียว ใช้ทั้งข้อ 8-10)

สร้างโฟลเดอร์ทดลองใหม่ที่มี 2 ไฟล์ (รันในเครื่องเราเอง ไม่ยุ่งกับของจริง)

`index.html`
```html
<!doctype html>
<html lang="th">
  <body>
    <h1>ห้องทดลอง Debug</h1>
    <button id="load">โหลดรายการ</button>
    <button id="rent">เช่าเครื่อง</button>
    <ul id="list"></ul>
    <script>
      document.getElementById("load").onclick = async () => {
        const res = await fetch("/laptops");
        const laptops = await res.json();
        document.getElementById("list").textContent = laptops.map((l) => l.brand).join(", ");
      };
      document.getElementById("rent").onclick = async () => {
        const res = await fetch("/rentals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ laptopid: 1 }), // พิมพ์ผิด: ต้องเป็น laptopId
        });
        const data = await res.json();
        console.log("ผลลัพธ์:", data);
      };
    </script>
  </body>
</html>
```

`server.ts`
```ts
// เซิร์ฟเวอร์ทดลองสำหรับฝึก debug (รันในเครื่องเราเท่านั้น)
const page = await Bun.file("index.html").text();

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    console.log(`[${req.method}] ${url.pathname}`);

    if (url.pathname === "/") {
      return new Response(page, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/laptops" && req.method === "GET") {
      return Response.json([{ id: 1, brand: "Acer" }, { id: 2, brand: "Lenovo" }]);
    }
    if (url.pathname === "/rentals" && req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body?.laptopId) {
        return Response.json({ error: "laptopId is required" }, { status: 400 });
      }
      return Response.json({ id: 10, ...body }, { status: 201 });
    }
    if (url.pathname === "/login") {
      return new Response("ok", {
        headers: { "Set-Cookie": "session=abc123; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600" },
      });
    }
    return Response.json({ error: "not found" }, { status: 404 });
  },
});
console.log("เปิดที่ http://localhost:3000");
```

```bash
bun server.ts
```
**ควรเห็น:** `เปิดที่ http://localhost:3000` แล้วเปิด http://localhost:3000 ใน Chrome จะเห็นหน้ามี 2 ปุ่ม

> ⚠️ ถ้าขึ้น `Failed to start server. Is port 3000 in use?` (`EADDRINUSE`) แปลว่ามีโปรแกรมอื่นใช้ port 3000 อยู่ ให้ปิดตัวนั้น หรือแก้ `port: 3000` เป็นเลขอื่น เช่น 3001 (แล้วใช้ URL ตามนั้น)

### 8.1 Console: ดู error และลองรันโค้ดสดๆ

1. เปิด DevTools → แท็บ **Console**
2. กดปุ่ม **เช่าเครื่อง** บนหน้าเว็บ
3. ใน Console จะเห็น `ผลลัพธ์: {error: "laptopId is required"}` และมักมีบรรทัดแดงบอกว่า request ได้สถานะ 400

สิ่งที่ทำได้ใน Console
- อ่านข้อความ error (สีแดง) + stack trace พร้อมลิงก์ไปบรรทัดโค้ด
- **พิมพ์โค้ดรันสดๆ** ที่ช่องด้านล่าง เช่น `document.title`, `await fetch("/laptops").then(r => r.json())`
- ตัวกรองระดับ (Errors / Warnings / Info) ซ่อนข้อความที่ไม่สนใจ
- ติ๊กตัวเลือกรักษา log ไว้ข้ามการโหลดหน้าใหม่ (มักชื่อ **Preserve log**) เมื่อปัญหาเกิดตอนหน้ากำลัง redirect

### 8.2 Network: ดูว่าเราส่งอะไรไป และ server ตอบอะไรกลับ

แท็บที่ใช้บ่อยที่สุดตอนทำเว็บเรียก API

![หน้าตาแท็บ Network มีแถบเครื่องมือ ตาราง Name Status Type Time และแท็บย่อย Headers Payload Preview Response Timing](/img/09-devtools-network.svg)
*คลิกแถวสีแดง (ล้มเหลว) แล้วอ่านแท็บย่อยด้านล่างทีละแท็บ*

**ขั้นตอน**
1. เปิดแท็บ **Network** (ถ้าเปิดช้าไปให้โหลดหน้าใหม่ หรือกดปุ่มซ้ำ เพราะมันจับเฉพาะหลังเปิด)
2. กดปุ่ม **โหลดรายการ** แล้วกด **เช่าเครื่อง**
3. จะเห็นแถวใหม่ขึ้น `laptops` และ `rentals` ตารางมีคอลัมน์หลักๆ: **Name** (ปลายทาง), **Status** (รหัสผลลัพธ์), **Type**, **Time** (ใช้เวลาเท่าไร)
4. แถว `rentals` Status เป็น `400` (สีแดง) → คลิกแถวนั้น

**อ่านคำขอที่ล้มเหลว ทีละแท็บย่อย**
| แท็บย่อย | ดูอะไร | ในตัวอย่างนี้ |
|---|---|---|
| **Headers** | URL, **method** (GET/POST), **Status Code**, header ที่ส่ง/รับ (เช่น Content-Type, Cookie) | `POST /rentals` → `400 Bad Request` |
| **Payload** | ข้อมูลที่ **เราส่งไป** | `{"laptopid": 1}` ← ตัว i เล็ก! |
| **Preview / Response** | สิ่งที่ **server ตอบกลับ** (Response = ข้อความดิบ) | `{"error":"laptopId is required"}` |
| **Timing** | ใช้เวลาตรงไหนนาน | (ถ้าช้า ดูตรงนี้) |

**เทียบ Payload กับ Response → เจอบั๊กแล้ว:** server บอกว่าต้องการ `laptopId` แต่เราส่ง `laptopid` ไปพิมพ์ผิด แก้ใน `index.html` เป็น `laptopId` แล้วรีเฟรชแล้วกดใหม่ → Status กลายเป็น `201` สีปกติ

**วิธีอ่านสถานะเร็วๆ**
| Status | ความหมาย | มองหาที่ไหนต่อ |
|---|---|---|
| `2xx` (200, 201) | สำเร็จ | ถ้ายังผิด แปลว่าข้อมูลที่ตอบไม่ตรงที่คิด ดู Response |
| `3xx` | redirect ไปที่อื่น | ดู header `Location` |
| `4xx` (400, 401, 403, 404) | **เราส่งผิด** | Payload, Headers, URL |
| `5xx` (500) | **server พัง** | log ฝั่ง server (ไม่ใช่ที่นี่) |
| `(failed)` / ไม่มีสถานะ | ไม่ถึง server (server ปิด, CORS, เน็ตหลุด) | ดูข้อความแดงใน Console |

**ทริกที่มีประโยชน์**
- ตัวกรอง **Fetch/XHR** แสดงเฉพาะการเรียก API ซ่อนรูป/CSS ที่รกตา
- ตัวเลือก **Disable cache** ปิดแคชตอน DevTools เปิดอยู่ กัน "แก้แล้วแต่ยังเห็นของเก่า"
- คลิกขวาที่แถว → **Copy** → **Copy as cURL** ได้คำสั่ง curl ที่ยิงซ้ำ request เดียวกันได้เป๊ะ นำไปวางใน terminal ลองแก้ทีละค่า หรือแนบกับ bug report (ระวัง: มี cookie/token ติดมาด้วย **ลบก่อนส่งให้คนอื่น**)

### 8.3 Elements: ดู HTML/CSS จริงที่ browser วาด

1. เปิดแท็บ **Elements** (หรือคลิกขวาที่ปุ่มบนหน้าแล้ว **Inspect**) จะเห็นโครงสร้าง HTML ที่ browser สร้างจริง
2. คลิกที่บรรทัด HTML ไหนก็ได้ ฝั่งขวามีแผง **Styles** บอกว่า CSS ตัวไหนมีผล และตัวไหนถูกขีดฆ่า (ถูกกฎอื่นทับ)
3. **ลองแก้สด:** ดับเบิลคลิกข้อความ หรือค่า CSS แล้วแก้ ผลเปลี่ยนทันที (ไม่กระทบไฟล์จริง รีเฟรชก็หาย) ใช้ทดลองสีหรือขนาดก่อนแก้โค้ดจริง
4. ใช้ได้เมื่อ "ทำไมปุ่มไม่ขึ้น / ทำไมข้อความหาย / ทำไมสไตล์ไม่ตรง": มักพบว่า element ไม่ได้ถูกสร้าง หรือโดน `display: none`

> 💡 เมื่อเลือก element ใน Elements แล้วพิมพ์ `$0` ใน Console จะได้ element นั้นมาเล่นต่อได้

### 8.4 Application: ดู cookie และข้อมูลที่เก็บในเครื่อง

1. เปิดแท็บ **Application**
2. ที่แถบซ้ายหา **Cookies** → เลือกโดเมน `localhost:3000`
3. เปิด http://localhost:3000/login ในแท็บใหม่หนึ่งครั้ง (server ตั้ง cookie ให้) กลับมากดรีเฟรชที่ตาราง จะเห็น cookie `session`
4. ดูคอลัมน์ **HttpOnly**, **Secure**, **SameSite** ว่าติ๊กไว้ไหม (สำคัญต่อความปลอดภัย บทที่ 10 ข้อ 4)
5. ที่เมนูเดียวกันมี **Local Storage** และ **Session Storage** ดูและแก้ค่าที่เว็บเก็บในเครื่องได้

เมื่อ "login แล้วแต่ยังโดนเด้งออก" ให้ดูตรงนี้ก่อนว่า cookie ถูกตั้งไหม หมดอายุหรือยัง และถูกส่งไปกับ request ไหม (ดูแท็บ Network > Headers > Cookie)

### 8.5 Sources: breakpoint ฝั่ง browser

เหมือน debugger ใน VS Code แต่ใช้กับโค้ดที่รันในหน้าเว็บ

1. เปิดแท็บ **Sources** แล้วเลือกไฟล์ที่ต้องการ (ในตัวอย่างนี้โค้ดอยู่ใน `index.html`)
2. คลิกที่ **เลขบรรทัด** ให้เกิดจุด breakpoint (เช่นบรรทัด `const data = await res.json();`)
3. กดปุ่ม **เช่าเครื่อง** → หน้าเว็บค้าง โปรแกรมหยุดที่บรรทัดนั้น
4. ดูแผง **Scope** (ค่าตัวแปร ณ ตอนนี้), **Call Stack**, และ **Watch**
5. ใช้ปุ่มควบคุมด้านบน: ไปต่อ (Resume), ข้ามบรรทัด (Step over), เข้าฟังก์ชัน (Step into) หลักเหมือน VS Code ข้อ 4 ทุกอย่าง
6. อีกทางลัด: เขียน `debugger;` ในโค้ด แล้วเปิด DevTools ไว้ browser จะหยุดตรงนั้นเอง (**ลบทิ้งก่อน commit**)
7. ในแผง Sources มีตัวเลือก **pause on exceptions** (หาในแถบควบคุม debugger) ให้ browser หยุดทุกครั้งที่ error เกิดขึ้น มีประโยชน์เมื่อไม่รู้ว่าพังตรงไหน

---

## 9. ⏳ Debug โค้ด async (Promise / async-await)

โค้ดแบบ async คือโค้ดที่ "ไม่รอ" เช่น เรียก API หรือ DB ผลลัพธ์จะมาทีหลัง บั๊กส่วนใหญ่ของมือใหม่ในกลุ่มนี้มี 3 แบบ

สร้างไฟล์ `async-bugs.ts` แล้วรันด้วย `bun async-bugs.ts`
```ts
async function getUser(id: number) {
  await new Promise((r) => setTimeout(r, 50));            // จำลองรอ DB
  if (id !== 1) throw new Error("user not found: " + id);
  return { id, name: "Bit" };
}

// บั๊ก 1: ลืม await
const u = getUser(1);
console.log("ลืม await:", u);

// await ที่ถูกต้อง + จับ error
try {
  await getUser(2);
} catch (e) {
  console.log("จับได้:", (e as Error).message);
}

// บั๊ก 2: forEach ไม่รอ async
console.log("เริ่ม");
[1, 2].forEach(async (i) => {
  await getUser(1);
  console.log("forEach เสร็จ", i);
});
console.log("จบ (แต่ forEach ยังไม่เสร็จ)");
await new Promise((r) => setTimeout(r, 200));

// บั๊ก 3: เรียก async แล้วไม่ await ไม่ catch
getUser(5);
```

**ควรเห็น**
```
ลืม await: Promise { <pending> }
จับได้: user not found: 2
เริ่ม
จบ (แต่ forEach ยังไม่เสร็จ)
forEach เสร็จ 1
forEach เสร็จ 2
error: user not found: 5
      at getUser (/.../async-bugs.ts:3:27)
```
แล้วโปรแกรมล้ม (บรรทัดสุดท้ายคือ unhandled rejection: error ที่ไม่มีใครรับ)

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| เห็น `Promise { <pending> }` แทนข้อมูลจริง | **ลืม `await`** | ใส่ `await` หน้า call |
| ข้อความ "จบ" ขึ้นก่อนงานเสร็จ | `forEach` ไม่รอ callback ที่เป็น async | ใช้ `for (const x of list) { await ... }` (ทีละตัว) หรือ `await Promise.all(list.map(async (x) => ...))` (พร้อมกัน) |
| โปรแกรมล้มด้วย unhandled rejection | async พังแล้วไม่มี `try/catch` หรือ `.catch()` | ครอบ `try/catch` หรือ `await` ในที่ที่จัดการ error ได้ |

**เทคนิคดู async ให้ถูก**
- **ใช้ debugger แทน log:** breakpoint ใช้ได้ปกติกับ `await` พอ Step Over ผ่าน `await` ค่าที่ได้ก็จะโผล่ใน Variables (ตัว debugger รอให้เอง)
- **stack trace ของ async ขาดหาย:** `at async ...` คือบรรทัดที่ผ่านการ `await` ไม่ต้องตกใจที่ดูไม่ต่อเนื่อง ให้ดูบรรทัดแรกที่เป็นไฟล์เรา
- **log ลำดับเวลา:** ใส่ป้ายก่อน/หลัง await เช่น `console.log("[1] ก่อนเรียก DB")` `console.log("[2] DB ตอบแล้ว")` ลำดับที่ไม่ตรงที่คิดบอกบั๊กได้ทันที
- **`return await` ใน `try`:** ถ้าเขียน `return getUser()` โดยไม่ `await` ใน `try` error จะหลุดออกไปนอก `catch`

---

## 10. 📡 Debug API ด้วย `curl` (ตัด browser ออกจากสมการ)

เมื่อเว็บเรียก API แล้วพัง ไม่รู้ว่าผิดที่หน้าเว็บหรือ API ให้ใช้ **curl** ยิงตรงไป API ถ้า curl ได้ผลถูก = API ปกติ ปัญหาอยู่ที่หน้าเว็บ (หรือ CORS) ถ้า curl พังเหมือนกัน = ปัญหาอยู่ที่ API

![ลำดับ Browser, API, Database พร้อมที่ที่ควรดูของแต่ละชั้น และ curl ที่ข้าม browser ไปหา API ตรงๆ](/img/09-where-to-look.svg)
*ไล่ดูทีละชั้น: ถ้า curl ผ่าน แสดงว่า API และ DB ไม่ผิด*

(ใช้ห้องทดลองข้อ 8.0 ที่เปิด `bun server.ts` ค้างไว้ในอีก terminal)

**1) GET ธรรมดา ดู header ด้วย (`-i`)**
```bash
curl -i http://localhost:3000/laptops
```
**ควรเห็น**
```
HTTP/1.1 200 OK
Content-Type: application/json;charset=utf-8
Content-Length: 51

[{"id":1,"brand":"Acer"},{"id":2,"brand":"Lenovo"}]
```

**2) POST พร้อม JSON ที่ผิด** (จำลองบั๊กในข้อ 8.2)
```bash
curl -i -X POST http://localhost:3000/rentals \
  -H "Content-Type: application/json" \
  -d '{"laptopid":1}'
```
**ควรเห็น**
```
HTTP/1.1 400 Bad Request
Content-Type: application/json;charset=utf-8
...

{"error":"laptopId is required"}
```
แก้เป็น `{"laptopId":1}` แล้วยิงซ้ำ → `HTTP/1.1 201 Created` พร้อม `{"id":10,"laptopId":1}`

**3) ดูรายละเอียดทั้งหมดที่ส่ง/รับ (`-v` verbose)**
```bash
curl -v -X POST http://localhost:3000/rentals -H "Content-Type: application/json" -d '{"laptopId":1}'
```
**ควรเห็น** (ย่อ) บรรทัดขึ้นต้น `>` = สิ่งที่เราส่ง, `<` = สิ่งที่ server ตอบ
```
> POST /rentals HTTP/1.1
> Host: localhost:3000
> Content-Type: application/json
> Content-Length: 14
>
< HTTP/1.1 201 Created
< Content-Type: application/json;charset=utf-8
```

**4) เอาเฉพาะรหัสสถานะ กับเวลา**
```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" http://localhost:3000/nope
```
**ควรเห็น** `404 0.000413s` (เวลาจะต่างกันไปในแต่ละเครื่อง)

**5) ถ้า server ไม่ได้เปิด**
```bash
curl -sS http://localhost:1/x
```
**ควรเห็น** `curl: (7) Failed to connect to localhost port 1 ...: Couldn't connect to server` แปลว่า **ไม่มีใครฟังที่ port นั้น** (ตรงกับ `ECONNREFUSED` ฝั่ง Node) ให้เช็คว่า server เปิดอยู่ไหม port ตรงไหม

| อาการ curl | ความหมาย |
|---|---|
| `Failed to connect ... Couldn't connect to server` | server ไม่ได้เปิด / port หรือ host ผิด |
| ได้ HTML แทน JSON | ยิงผิด URL หรือโดน redirect/หน้า error (ลอง `-i` ดู status และ `Content-Type`) |
| `401/403` | ขาด/ผิด token หรือ cookie (curl ใส่ได้ด้วย `-H "Authorization: Bearer ..."` ใช้ค่าปลอมในการฝึก) |
| ค้างไม่ตอบ | server ตอบช้า/ค้าง ใส่ `--max-time 5` เพื่อตัดที่ 5 วินาที |

> 💡 อ่านต่อเรื่อง HTTP และ API ได้ที่บทที่ 5 และ 14 ส่วนวิธี debug ในฝั่ง server ที่ตอบ 500 ให้ไปดู **log ของ server** (หัวข้อถัดไป) ไม่ใช่ที่ curl

---

## 11. 🐳 Debug Container: อ่าน Docker logs

เมื่อ API/DB รันใน Docker (บทที่ 2) พังแล้ว "หน้าจอไม่มี error ให้ดู" ต้องไปอ่านที่ **log ของ container** ลำดับการสืบ

**ขั้น 1: ดูสถานะ**
```bash
docker compose ps          # ดู service ใน compose ของโปรเจกต์
docker ps -a               # ดู container ทั้งหมด รวมที่ดับไปแล้ว
```
ดูคอลัมน์ **STATUS**: `Up ...` = ทำงานอยู่, `Exited (1)` = ดับไปด้วย error (เลขไม่ใช่ 0 คือผิดปกติ), `Restarting` = ดับแล้วถูกสั่งเปิดใหม่วนซ้ำ

**ขั้น 2: อ่าน log**
```bash
docker compose logs api              # log ทั้งหมดของ service ชื่อ api
docker compose logs -f --tail 50 api # ตามดูสดๆ (-f) เฉพาะ 50 บรรทัดล่าสุด
docker compose logs --since 10m db   # เฉพาะ 10 นาทีล่าสุด
docker logs <ชื่อหรือรหัส container> # กรณีไม่ได้ใช้ compose
```
(กด `Ctrl + C` เพื่อเลิกตามดู `-f` ไม่ได้ปิด container)

**ตัวอย่างจริง:** รัน Postgres โดยลืมตั้งรหัสผ่าน (ทดลองได้ ปลอดภัย ไม่แตะข้อมูลอะไร)
```bash
docker run -d --name debug-demo postgres:17
docker ps -a --filter name=debug-demo
docker logs debug-demo
docker rm debug-demo
```
**ควรเห็น**
```
NAMES        IMAGE         STATUS
debug-demo   postgres:17   Exited (1) 4 seconds ago
```
และ `docker logs` บอกสาเหตุชัดเจน
```
Error: Database is uninitialized and superuser password is not specified.
       You must specify POSTGRES_PASSWORD to a non-empty value for the
       superuser. ...
```
บทเรียน: container ดับ **ไม่ได้แปลว่าไม่มีเบาะแส** อ่าน log บรรทัดแรกๆ ที่ขึ้น `Error` มักบอกวิธีแก้ในตัว

**ขั้น 3: เข้าไปดูข้างใน (ถ้า container ยังรันอยู่)**
```bash
docker compose exec api sh          # เปิด shell ใน container ชื่อ api
env | grep DATABASE                 # ดูว่าค่า env ที่ได้จริงคืออะไร (ระวังอย่าแคปความลับ)
exit
```

**ปัญหาที่เจอบ่อยใน Docker**
| อาการ | น่าจะเพราะ | ไปดู |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:5432` ใน container API | ใน container `localhost` คือตัวมันเอง ต้องใช้ชื่อ service เช่น `db` | `DATABASE_URL` ใน compose |
| container ดับทันที `Exited (1)` | env ขาด / config ผิด / คำสั่งเริ่มต้นพัง | `docker logs` บรรทัดแรกๆ |
| แก้โค้ดแล้วไม่เปลี่ยน | ยังใช้ image เก่า | build ใหม่ (`docker compose up --build`) |
| port ชนกัน (`address already in use`) | โปรแกรมอื่นใช้ port บนเครื่องเรา | เปลี่ยน port ฝั่งซ้ายของ `ports: "3001:3000"` |
| ข้อมูล DB หายหลังรีสตาร์ท | ไม่ได้ผูก volume | ส่วน `volumes:` ใน compose (บทที่ 2) |

> ⚠️ log ของ container อาจมีความลับ (เช่น connection string) ก่อนวางใน bug report/AI ให้ล้างตามข้อ 7.1

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ได้ <code>ECONNREFUSED 127.0.0.1:5432</code> ตอนรัน API ใน Docker Compose แต่รันนอก Docker ได้ปกติ น่าจะเพราะอะไร?</summary>

ใน container `127.0.0.1` / `localhost` หมายถึงกล่อง API เอง ต้องใช้ชื่อ service ของ DB เช่น `db:5432` (บทที่ 2)
</details>

<details><summary>2. stack trace ยาว 30 บรรทัด ควรดูตรงไหนก่อน?</summary>

บรรทัดแรก (เกิดอะไร) และบรรทัดแรกที่เป็นไฟล์ในโปรเจกต์ของเรา ไม่ใช่ `node_modules` (เกิดที่ไหน)
</details>

<details><summary>3. หน้าเว็บกดปุ่มแล้วไม่มีอะไรเกิดขึ้น ควรเปิดอะไรดูเป็นอย่างแรก และถ้าเห็นแถว <code>POST /rentals</code> สถานะ 500 ต้องไปดูที่ไหนต่อ?</summary>

เปิด DevTools แท็บ **Console** (ดู error ฝั่ง JS) และ **Network** (ดู request) ถ้าเป็น `500` แปลว่า server พัง ต้องไปอ่าน **log ของ server** (terminal ที่รัน API หรือ `docker compose logs api`) ไม่ใช่แก้ที่หน้าเว็บ
</details>

<details><summary>4. curl เรียก API ได้ถูกต้อง แต่ในหน้าเว็บขึ้น "blocked by CORS policy" ปัญหาอยู่ฝั่งไหน?</summary>

ฝั่ง **server ไม่ได้อนุญาตโดเมนของเว็บ** (ส่ง header CORS ไม่ถูก) CORS เป็นกฎของ browser เท่านั้น curl ไม่สนใจ จึงผ่านปกติ แก้ที่การตั้งค่า CORS ของ API ไม่ใช่โค้ดหน้าเว็บ (ดูบทที่ 10)
</details>

<details><summary>5. เห็น <code>Promise { &lt;pending&gt; }</code> แทนข้อมูลที่ต้องการ น่าจะลืมอะไร?</summary>

ลืม `await` หน้าฟังก์ชันที่คืนค่าเป็น Promise
</details>

<details><summary>6. ก่อนวาง error ให้ AI ช่วย ต้องทำอะไรกับข้อความนั้น?</summary>

ไล่ดูและแทนที่ข้อมูลลับด้วยค่าปลอม เช่น รหัสผ่านใน connection string, token, cookie, ข้อมูลลูกค้าจริง ถ้าเผลอวางไปแล้วถือว่าหลุด ต้องเปลี่ยนรหัส/key ทันทีและแจ้งพี่
</details>

---

## ✏️ แบบฝึกหัด: ไขคดี 3 บั๊ก 🔎

โค้ดนี้ **ผ่าน `tsc` ทุกบรรทัด** แต่มีบั๊ก 3 จุด หาให้เจอด้วย debugger หรือ log แล้วจดใน README ว่า **บั๊กคืออะไร หาเจอยังไง แก้ยังไง**

```ts
interface Laptop {
  id: number;
  status: "available" | "rented";
  pricePerMonth: number;
}

const laptops: Laptop[] = [
  { id: 1, status: "available", pricePerMonth: 1500 },
  { id: 2, status: "rented", pricePerMonth: 1200 },
  { id: 3, status: "rented", pricePerMonth: 1300 },
];

function calcRent(pricePerMonth: number, months: number, discountPercent: number): number {
  const total = pricePerMonth * months;
  const discount = total * discountPercent;
  return total - discount;
}

function isOverdue(returnDate: Date, today: Date): boolean {
  return returnDate > today;
}

function countAvailable(list: Laptop[]): number {
  return list.filter((l) => (l.status = "available")).length;
}

console.log(calcRent(1500, 3, 10));                                     // คาดว่า 4050
console.log(isOverdue(new Date("2026-01-01"), new Date("2026-02-01")));  // คาดว่า true
console.log(countAvailable(laptops));                                   // คาดว่า 1
console.log(laptops);                                                   // ข้อมูลควรเหมือนเดิม
```
💡 ใบ้: บั๊กที่ 3 ทำให้ข้อมูลเปลี่ยนไปด้วย ดูผลของบรรทัดสุดท้ายให้ดี

**ใช้วงจรนักสืบกับทุกบั๊ก:** (1) รันแล้วจดว่า "ได้อะไร vs คาดว่าได้อะไร" (2) หาว่าค่าเริ่มเพี้ยนที่บรรทัดไหนด้วย breakpoint หรือ `console.log({ total, discount })` (3) ตั้งสมมติฐาน (4) แก้ทีละจุด (5) รันซ้ำจนผลตรงกับที่คาดทั้ง 4 บรรทัด

<details><summary>🔑 เฉลย (ลองเองก่อนค่อยเปิด)</summary>

รันโค้ดเดิมได้ `-40500`, `false`, `3` และ `laptops` ทุกตัวกลายเป็น `"available"`

1. **`calcRent`:** `discountPercent` ส่งมาเป็น `10` (หมายถึง 10%) แต่โค้ดเอาไปคูณตรงๆ เท่ากับลด 1000% ต้องหาร 100: `total * (discountPercent / 100)` จะได้ `4050`
2. **`isOverdue`:** ตั้งใจให้ "เลยกำหนดคืน" ต้องเป็นวันนี้ **มากกว่า** วันคืน (`today > returnDate`) โค้ดเดิมกลับด้านจึงได้ `false`
3. **`countAvailable`:** `l.status = "available"` เป็นการ **กำหนดค่า** (ตัวเดียว `=`) ไม่ใช่เปรียบเทียบ ทำให้ทุกเครื่องถูกแก้เป็น `available` และ filter ผ่านหมด ต้องใช้ `===`
</details>

## ✅ ผ่านด่าน

- [ ] อธิบายวงจร ทำให้เกิดซ้ำ → แคบขอบเขต → สมมติฐาน → แก้ → ตรวจซ้ำ ได้
- [ ] อ่าน stack trace แล้วหาจุดเกิดเหตุได้ (ทั้ง Node/Bun และ browser)
- [ ] ใช้ breakpoint, Step Over, ดูค่าตัวแปรใน VS Code ได้ และตั้ง `launch.json` ได้
- [ ] เปิด DevTools Network แล้วอ่านคำขอที่ล้มเหลว (Status, Payload, Response) ได้
- [ ] ใช้ `curl -i` ยิง API เพื่อแยกว่าบั๊กอยู่ที่หน้าเว็บหรือ API ได้
- [ ] อ่าน `docker compose logs` เพื่อหาสาเหตุที่ container ดับได้
- [ ] รู้จักดูและกู้ปัญหา async (`await`, `forEach`, unhandled rejection)
- [ ] ถามคำถามด้วยเทมเพลตได้ และล้างความลับก่อนวางให้ AI ทุกครั้ง
- [ ] ไขคดี 3 บั๊กสำเร็จ

---

[← บทที่ 8: ORM](./08-orm.md) · [🏠 สารบัญ](/) · [บทที่ 10: Security →](./10-security.md)
