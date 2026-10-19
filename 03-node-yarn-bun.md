# บทที่ 3: Node vs Yarn vs Bun 📦

> ⏱ ประมาณ 1.5 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 0 · 🛠 ใช้: Node.js, Terminal

> **⚡ สรุป 30 วินาที**
> - **Runtime** = ตัวรันโค้ด (Node, Bun) / **Package manager** = ตัวติดตั้ง package (npm, Yarn, pnpm, Bun)
> - Yarn **ไม่ใช่** runtime ส่วน Bun เป็น **ทั้งสองอย่าง**
> - `package.json` = รายการ package · `node_modules` = ตัว package จริง (ห้าม commit) · lock file = เวอร์ชันเป๊ะ (ต้อง commit)
> - 1 โปรเจกต์ใช้ package manager **ตัวเดียว**

---

## 📖 เรื่องเล่า

บิตเขียนในรายงานประจำวันว่า *"วันนี้เปลี่ยนจาก Node มาใช้ Yarn แล้วครับ เร็วขึ้นมาก"*
พี่ไบต์ตอบกลับมาสั้นๆ: *"แล้วตอนนี้โค้ดรันด้วยอะไรอยู่?"*
บิต: *"...Yarn?"* 🤔

พี่ไบต์ยิ้ม เพราะคำตอบคือ **ยังรันด้วย Node อยู่เหมือนเดิม** ถ้าอ่านบทนี้จบ จะรู้ว่าทำไม

---

## 1. ของ 2 ประเภทที่คนชอบสับสน

**Runtime = ตัวรันโค้ด**
- เดิม JavaScript รันได้แค่ใน browser ปี 2009 มีคนนำ engine ของ Chrome (ชื่อ **V8**) ออกมาให้รันนอก browser ได้ เกิดเป็น **Node.js** ทำให้ใช้ JS เขียน server ได้
- 💡 runtime = **เครื่องเล่นเพลง** 🎧 โค้ด = **แผ่นเพลง** มีแผ่นอย่างเดียวฟังไม่ได้

**Package manager = ตัวติดตั้ง package**
- package ทั้งโลกอยู่ในคลังกลางชื่อ **npm registry** (npmjs.com) มีหลายล้าน package
- 💡 package manager = **แอปสโตร์** 📲 ช่วยค้น ติดตั้ง อัปเดต

| ชื่อ | ประเภท | อธิบาย |
|---|---|---|
| **Node.js** | Runtime | มาตรฐานของวงการ ใช้ engine V8 |
| **npm** | Package manager | **ติดมากับ Node อัตโนมัติ** |
| **Yarn** | Package manager | ทางเลือกแทน npm โดย Meta **ต้องใช้คู่กับ Node** |
| **pnpm** | Package manager | ประหยัดพื้นที่ดิสก์ (รู้จักไว้) |
| **Bun** | **Runtime + Package manager** + bundler + test runner | ครบในตัวเดียว ใช้ engine JavaScriptCore (ของ Safari) |
| **Deno** | Runtime | สร้างโดยคนที่สร้าง Node (รู้จักไว้) |

```
              Runtime (รันโค้ด)       Package manager (ติดตั้ง package)
Node.js  ->   node                    npm (มากับ Node) หรือ yarn / pnpm (ติดตั้งเพิ่ม)
Bun      ->   bun                     bun install (ในตัว)
```

ดังนั้นเทียบให้ถูกต้องคือ 2 คู่:
- **Runtime:** Node vs Bun
- **Package manager:** npm vs Yarn vs Bun

> 🤓 **เกร็ด:** Deno สะกดสลับตัวอักษรจาก **No-de** และผู้สร้างเคยขึ้นเวทีพูดเรื่อง "10 สิ่งที่ผมเสียใจเกี่ยวกับ Node" ก่อนจะสร้าง Deno ออกมาแก้

---

## 2. 🔧 ลงมือ: โปรเจกต์แรก

```bash
mkdir pkg-demo && cd pkg-demo
npm init -y                  # สร้าง package.json
npm install dayjs            # ติดตั้ง package จัดการวันที่
```
สังเกตว่าเกิด 3 อย่าง:
1. `package.json` มี `dependencies` เพิ่มขึ้น
2. โฟลเดอร์ `node_modules/` (ลองเปิดดู มีไฟล์เยอะมาก)
3. ไฟล์ `package-lock.json`

ลองใช้ package: สร้างไฟล์ `hello.mjs`
```js
import dayjs from "dayjs";
console.log("วันนี้:", dayjs().format("DD/MM/YYYY"));
```
```bash
node hello.mjs
```
(ไฟล์ `.mjs` นี้แค่ทดลองให้เห็นภาพ ตั้งแต่บทที่ 4 เป็นต้นไปเราเขียน TypeScript เท่านั้น)

---

## 3. `package.json`: บัตรประจำตัวโปรเจกต์

```json
{
  "name": "rental-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "zod": "^4.1.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "tsx": "^4.20.0"
  }
}
```
(เลขเวอร์ชันเป็นตัวอย่าง ของจริงจะเป็นเวอร์ชันล่าสุดตอนติดตั้ง)

| ส่วน | ความหมาย |
|---|---|
| `scripts` | คำสั่งลัด เรียกด้วย `npm run dev` |
| `type: "module"` | ใช้ `import/export` แบบใหม่ (ESM) |
| `dependencies` | package ที่ **ต้องใช้ตอนโปรแกรมทำงานจริง** |
| `devDependencies` | package ที่ **ใช้แค่ตอนพัฒนา** เช่น TypeScript (ติดตั้งด้วย `-D`) |

> 💡 เปรียบเทียบร้านอาหาร: `dependencies` = **วัตถุดิบ** ต้องอยู่ในจานที่เสิร์ฟ / `devDependencies` = **มีดและเขียง** ใช้ในครัว ไม่ต้องเสิร์ฟให้ลูกค้า

**`node_modules/`** = ตัว package จริง ใหญ่ได้หลายร้อย MB
⚠️ **ห้าม commit** (ใส่ `.gitignore`) เพราะสร้างใหม่ได้เสมอด้วย `npm install`

> 🤓 **เกร็ด:** มีมีมดังว่า `node_modules` คือ **วัตถุที่หนักที่สุดในจักรวาล** หนักกว่าหลุมดำ 🕳️

---

## 4. เลขเวอร์ชัน (Semantic Versioning)

`MAJOR.MINOR.PATCH` เช่น `4.1.2`

| ส่วน | เปลี่ยนเมื่อ | กระทบโค้ดเดิมไหม |
|---|---|---|
| **MAJOR** (4) | เปลี่ยนใหญ่ | ⚠️ อาจพัง |
| **MINOR** (1) | เพิ่มฟีเจอร์ | ✅ ใช้ได้ |
| **PATCH** (2) | แก้บั๊ก | ✅ ใช้ได้ |

- `^4.1.2` = รับอัปเดตได้ถึง `4.x.x` (ไม่ข้าม major)
- `~4.1.2` = รับได้ถึง `4.1.x` (แค่ patch)
- `4.1.2` = เวอร์ชันนี้เท่านั้น

---

## 5. Lock file: ทำไมต้องมี

`package.json` บอกแค่ **ช่วง** (`^4.1.2`) วันนี้บิตติดตั้งได้ `4.1.2` เดือนหน้าเพื่อนติดตั้งได้ `4.3.0` → **เครื่องไม่เหมือนกันอีกแล้ว** (ปัญหาเดียวกับบท Docker!)

**Lock file** = บันทึก **เวอร์ชันที่ติดตั้งจริงแบบเป๊ะๆ** ของทุก package รวม package ย่อยที่ซ่อนอยู่ข้างใน

| Package manager | Lock file |
|---|---|
| npm | `package-lock.json` |
| Yarn | `yarn.lock` |
| pnpm | `pnpm-lock.yaml` |
| Bun | `bun.lock` |

- ✅ **ต้อง commit lock file เสมอ**
- `npm install` = ติดตั้ง และอาจอัปเดต lock file
- `npm ci` = ติดตั้ง **ตาม lock file เป๊ะ** (ใช้ใน Docker และ CI)
- ⚠️ **1 โปรเจกต์ = package manager ตัวเดียว** เห็น `package-lock.json` อยู่แล้ว ห้ามไปรัน `yarn` เพิ่มจนมี lock file 2 ตัว

---

## 6. เปรียบเทียบ

**Runtime: Node vs Bun**
| หัวข้อ | Node.js | Bun |
|---|---|---|
| อายุ | ตั้งแต่ 2009 มาตรฐานวงการ | ใหม่กว่ามาก กำลังโต |
| รัน TypeScript | Node รุ่นใหม่รัน `.ts` ได้แบบตัด type ทิ้ง หรือใช้ `tsx` | รันได้ทันที |
| ความเร็วเริ่มโปรแกรม | ดี | เร็วกว่า |
| ความเข้ากันได้ | 100% | ส่วนใหญ่ได้ บาง package ยังมีปัญหา |
| ตรวจ type | ❌ ต้อง `tsc --noEmit` | ❌ ต้อง `tsc --noEmit` เหมือนกัน |

**Package manager: npm vs Yarn vs Bun**
| ทำอะไร | npm | Yarn | Bun |
|---|---|---|---|
| ติดตั้งทั้งหมด | `npm install` | `yarn` | `bun install` |
| เพิ่ม package | `npm install zod` | `yarn add zod` | `bun add zod` |
| เพิ่มแบบ dev | `npm install -D tsx` | `yarn add -D tsx` | `bun add -d tsx` |
| รัน script | `npm run dev` | `yarn dev` | `bun run dev` |
| ความเร็ว | มาตรฐาน | เร็วกว่าเล็กน้อย | เร็วมาก ⚡ |

> **แนวทางของทีม:** งานลูกค้าใช้ **Node + npm** เป็นค่าเริ่มต้น เพราะเสถียรและเข้ากันได้ทุกอย่าง ใช้ Bun ได้กับ script/เครื่องมือภายใน หรือเมื่อทีมตกลงกันแล้ว

---

## 7. 🔧 แข่งความเร็ว 🏁

ติดตั้ง Yarn และ Bun:
```bash
npm install -g yarn
# Mac / Linux
curl -fsSL https://bun.sh/install | bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```
ปิดเปิด Terminal ใหม่ เช็ค `yarn --version`, `bun --version`

สร้าง 3 โฟลเดอร์ `race-npm`, `race-yarn`, `race-bun` แต่ละโฟลเดอร์รัน `npm init -y` แล้วจับเวลา:
```bash
cd race-npm  && time npm install express zod dayjs drizzle-orm pg
cd ../race-yarn && time yarn add express zod dayjs drizzle-orm pg
cd ../race-bun  && time bun add express zod dayjs drizzle-orm pg
```
(PowerShell ใช้ `Measure-Command { npm install ... }` แทน `time`)

ลองรันซ้ำรอบที่ 2 หลังลบ `node_modules` (ตอนนี้มี cache แล้ว) แล้วเทียบกัน

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. "เปลี่ยนจาก Node มาใช้ Yarn" ผิดตรงไหน?</summary>

Yarn เป็น package manager ไม่ใช่ runtime โค้ดยังรันด้วย Node ที่ถูกคือ "เปลี่ยนจาก npm มาใช้ Yarn"
</details>

<details><summary>2. <code>typescript</code> ควรอยู่ใน dependencies หรือ devDependencies?</summary>

devDependencies เพราะใช้แค่ตอนแปลงโค้ด ตอนรันจริงใช้ไฟล์ JS ที่ build แล้ว
</details>

<details><summary>3. clone โปรเจกต์มาแล้วขึ้น <code>Cannot find module 'zod'</code> ต้องทำอะไร?</summary>

รัน `npm install` (หรือ package manager ตาม lock file ของโปรเจกต์) เพราะ `node_modules` ไม่ได้อยู่ใน Git
</details>

---

## ✏️ แบบฝึกหัด

ทำข้อ 7 แล้วสรุปเวลาเป็นตารางใน README (รอบแรก / รอบมี cache) ของทั้ง 3 ตัว

## ✅ ผ่านด่าน

- [ ] แยก runtime กับ package manager ได้
- [ ] อธิบาย `package.json`, `node_modules`, lock file ได้
- [ ] รู้ว่า `^` และ `~` ต่างกันยังไง

---

[← บทที่ 2: Docker](./02-docker.md) · [🏠 สารบัญ](./README.md) · [บทที่ 4: TypeScript →](./04-typescript.md)
