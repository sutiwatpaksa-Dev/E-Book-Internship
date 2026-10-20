# บทที่ 11: สร้างหน้าเว็บด้วย React 🧱

> ⏱ ประมาณ 4 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 3 และ 4 · 🛠 ใช้: Bun, TypeScript, VS Code, DevTools ของเบราว์เซอร์

> **⚡ สรุป 30 วินาที**
> - React = เครื่องมือสร้างหน้าเว็บจาก **ชิ้นส่วนเล็กๆ (component)** ที่เอามาต่อกันได้ หน้าจอจะเปลี่ยนตาม **ข้อมูลที่เปลี่ยนได้ (state)** เอง
> - **Vite** = เครื่องมือเปิดเว็บตอนพัฒนา แก้ไฟล์แล้วหน้าเว็บเปลี่ยนทันที และแพ็กเว็บตอนจะขึ้นจริง
> - เรียนครบ 5 เรื่องที่ทำเว็บจริงต้องใช้: **เขียนหน้าตา, ส่งข้อมูลเข้าชิ้นส่วน, ข้อมูลที่เปลี่ยนได้, ดึงข้อมูลจาก API, ฟอร์ม**
> - ทุกหน้าที่ดึงข้อมูลต้องมี 3 แบบ: **กำลังโหลด / โหลดพัง / สำเร็จ**

> **📖 คำใหม่ในบทนี้**
> [React](./glossary.md#react) · [Component](./glossary.md#component) · [Props](./glossary.md#props) · [State](./glossary.md#state) · [Vite](./glossary.md#vite) · [SPA](./glossary.md#spa) · [Loading / Error](./glossary.md#loading-state)

---

## 📖 เรื่องเล่า

บิตทำ API เป็นแล้ว แต่ลูกค้าบอกว่า *"ผมเปิด Postman ไม่เป็นนะ ขอเป็นหน้าเว็บ"* 😅
บิตลองเขียน HTML ล้วนๆ ทำหน้าร้านกาแฟ จะโชว์เมนู 20 อย่าง ต้องก๊อปกล่อง 20 ก้อน พอราคาเปลี่ยนต้องไล่แก้ทีละจุด

พี่ไบต์: *"ถ้าเมนูมาจาก API แล้วหน้าเว็บสร้างตัวเองจากข้อมูลได้ล่ะ?"*
นั่นคือสิ่งที่ React ทำ

---

## 1. React คืออะไร

**HTML แบบเดิม:** เขียนหน้าเว็บตายตัว อยากเปลี่ยนต้องไปหาจุดนั้นแล้วแก้เอง
**React:** บอกแค่ว่า *"ถ้าข้อมูลเป็นแบบนี้ หน้าตาควรเป็นแบบนี้"* ข้อมูลเปลี่ยนเมื่อไหร่ React วาดใหม่ให้เอง

![ข้อมูลผ่านชิ้นส่วน (component) กลายเป็นหน้าเว็บ และวาดใหม่เมื่อข้อมูลเปลี่ยน](/img/11-data-to-ui.svg)
*React รับข้อมูล ส่งผ่านชิ้นส่วน แล้วได้หน้าเว็บ ข้อมูลเปลี่ยนเมื่อไหร่ก็วาดใหม่ให้เอง*

> 💡 **นึกภาพ:** ชิ้นส่วน = **แม่พิมพ์ขนม** 🍪 ใส่ไส้ต่างกัน (ข้อมูล) ได้ขนมหน้าตาเดียวกันแต่ไส้ต่างกัน ไม่ต้องปั้นใหม่ทีละชิ้น

เว็บที่ทำด้วย React เป็นแบบ **SPA** = เบราว์เซอร์โหลดหน้าครั้งเดียว แล้วโค้ดสลับเนื้อหาเอง กดเมนูแล้วไม่กระพริบ ข้อเสียคือ Google และ LINE อ่านยากกว่า (บทที่ 13)

---

## 2. 🔧 ลงมือ: สร้างโปรเจกต์

ตลอดด่าน 5 เราจะสร้าง **Bit Café** ☕ เว็บร้านกาแฟเล็กๆ ที่โครงเหมือน [Mini Project STARTER](./starter/index.md) แต่ฟีเจอร์น้อยกว่า

```bash
mkdir bit-cafe && cd bit-cafe
bun create vite client --template react-ts
cd client
bun install
bun run dev
```
เปิด http://localhost:5173 ควรเห็นหน้าตัวอย่างของ Vite + React พร้อมปุ่มนับเลข 🎉

> ⚠️ **เปลี่ยนชื่อไฟล์ก่อนเขียนโค้ด:** Vite สร้างไฟล์ชื่อ `src/App.tsx` (A ตัวใหญ่) แต่หนังสือเล่มนี้ตั้งชื่อไฟล์เป็นตัวพิมพ์เล็กทั้งหมด (`app.tsx`) กด `Ctrl + C` หยุดเซิร์ฟเวอร์ แล้วรัน
> ```bash
> git mv src/App.tsx src/tmp.tsx
> git mv src/tmp.tsx src/app.tsx
> ```
> (ถ้ายังไม่ได้ `git init` ให้ใช้ `mv` สองครั้งแบบเดียวกัน) ที่ต้องเปลี่ยนสองต่อ เพราะ `mv src/App.tsx src/app.tsx` ตรงๆ บน Mac/Windows จะเปลี่ยนชื่อในเครื่อง แต่ Git ยังจำชื่อเดิม `App.tsx` ทำให้ตอน build บน Linux หาไฟล์ไม่เจอ (ดูวิธีเดียวกันในบทเสริมจัดโครงสร้างโปรเจกต์)
> จากนั้นเปิด `src/main.tsx` แก้บรรทัด `import App from './App.tsx'` เป็น `import App from './app.tsx'` แล้วรัน `bun run dev` ใหม่
> ห้ามข้ามขั้นนี้ เพราะบน Mac/Windows จะดูเหมือนใช้ได้ (ระบบไฟล์ไม่แยกตัวเล็กตัวใหญ่) แต่บน Linux และตอน build บนเซิร์ฟเวอร์ (บทที่ 21–22) จะ error เช่น `Cannot find module './app'` หรือ `differs from already included file name only in casing`

**ไฟล์ที่ต้องรู้จัก**
| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | หน้า HTML หน้าเดียวของทั้งเว็บ มีกล่อง `<div id="root">` ให้ React วาดลงไป |
| `src/main.tsx` | จุดเริ่ม: สั่งให้ React วาด `<App />` ลงในกล่องนั้น |
| `src/app.tsx` | ชิ้นส่วนแรก เราจะแก้ที่นี่ |
| `vite.config.ts` | ตั้งค่า Vite (บทที่ 12 และ 14 จะมาแก้) |

![ลำดับการทำงานของ index.html, main.tsx และ app.tsx](/img/11-vite-files.svg)
*index.html มีกล่อง root ว่างๆ แล้ว main.tsx สั่งให้ React เอา App ไปวาดลงกล่องนั้น*

ลบของเดิมใน `src/app.tsx` แล้วใส่:
```tsx
export default function App() {
  return <h1>Bit Café ☕</h1>;
}
```
กดเซฟแล้วดูเบราว์เซอร์ เปลี่ยนเองทันทีโดยไม่ต้องกดรีเฟรช

---

## 3. JSX: เขียนหน้าตาเว็บในไฟล์ TypeScript

```tsx
const shopName = "Bit Café";
const isOpen = true;
const menu = ["ลาเต้", "มอคค่า", "ชาเขียว"];

export default function App() {
  return (
    <main className="page">                       {/* class → className */}
      <h1>{shopName}</h1>                          {/* {} = ใส่ค่า TS */}
      <p>{isOpen ? "เปิดอยู่ 🟢" : "ปิดแล้ว 🔴"}</p>
      <ul>
        {menu.map((name) => (
          <li key={name}>{name}</li>               // วนลูปด้วย map ต้องมี key
        ))}
      </ul>
    </main>
  );
}
```

![JSX ที่เขียนในโค้ดถูกแปลงเป็นหน้าเว็บที่เบราว์เซอร์แสดง](/img/11-jsx-render.svg)
*JSX คือการเขียนหน้าตาเว็บในไฟล์ TypeScript ส่วน {} ใช้ใส่ค่าจากโค้ด*

**กฎที่ต้องจำ**
| กฎ | ตัวอย่าง |
|---|---|
| ส่งกลับได้ **ก้อนเดียว** ถ้ามีหลายก้อนห่อด้วย `<>...</>` | `<><Navbar /><Footer /></>` |
| `class` ต้องเขียนเป็น `className` | `<div className="card">` |
| ใส่ค่าจากโค้ดใน `{}` | `<p>{price} บาท</p>` |
| แท็กต้องปิดเสมอ | `<img src={url} alt="ลาเต้" />` |
| วนสร้างรายการด้วย `map` ต้องมี `key` ไม่ซ้ำ | `key={item.id}` |
| แสดงเฉพาะเมื่อมีเงื่อนไข | `{error && <p>{error}</p>}` |

---

## 4. ชิ้นส่วน (Component) และการส่งข้อมูลเข้า (Props)

แบ่งหน้าเว็บเป็นชิ้นเล็กๆ แต่ละชิ้นรับข้อมูลผ่าน **props** (เหมือนส่งค่าเข้าฟังก์ชัน)

`src/types/service.ts` บอกหน้าตาของข้อมูล
```ts
export interface Service {
  id: number;
  name: string;
  description: string;
  price: number | null;      // บางบริการไม่มีราคา
  imageUrl: string;
}

export interface Category {  // ใช้ในบทที่ 13
  id: number;
  name: string;
  slug: string;
}
```

`src/components/service-card.tsx` การ์ดสินค้า 1 ใบ
```tsx
import type { Service } from "../types/service";

interface Props {
  service: Service;
}

export default function ServiceCard({ service }: Props) {
  return (
    <article className="card">
      <img src={service.imageUrl} alt={service.name} />
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      {service.price !== null && <p>{service.price.toLocaleString()} บาท</p>}
    </article>
  );
}
```
ใช้งาน: `<ServiceCard service={latte} />`

![แผนภาพต้นไม้ชิ้นส่วน App ส่ง props ลงไปยัง ServiceCard แต่ละใบ](/img/11-props-flow.svg)
*App ส่ง props ลงไปให้ ServiceCard แต่ละใบ ข้อมูลไหลจากบนลงล่างทางเดียว*

> ⚠️ props **อ่านได้อย่างเดียว** ห้ามแก้ `service.name = ...` ในชิ้นส่วน ถ้าต้องเปลี่ยนค่าให้ใช้ state (ข้อ 5)
> 💡 TypeScript ช่วยเยอะ: ลืมส่งข้อมูล หรือส่งผิดชนิด VS Code ขึ้นเส้นแดงทันที

---

## 5. State: ข้อมูลที่เปลี่ยนได้

```tsx
import { useState } from "react";

export default function MenuToggle() {
  const [open, setOpen] = useState(false);     // [ค่าปัจจุบัน, ฟังก์ชันเปลี่ยนค่า] = useState(ค่าเริ่มต้น)

  return (
    <>
      <button onClick={() => setOpen(!open)}>{open ? "ปิดเมนู ✕" : "เมนู ☰"}</button>
      {open && <nav>หน้าแรก · เกี่ยวกับเรา · ติดต่อ</nav>}
    </>
  );
}
```
เรียก `setOpen` → React วาดชิ้นส่วนนี้ใหม่ด้วยค่าใหม่ นี่คือหัวใจของ React ทั้งหมด

![วงจรของ state: กดปุ่ม เปลี่ยนค่า React วาดใหม่ หน้าจอเปลี่ยน](/img/11-state-cycle.svg)
*เปลี่ยน state แล้ว React วาดชิ้นส่วนใหม่ แล้วรอการกดครั้งต่อไป*

> ⚠️ **กับดัก:** ห้ามแก้ state ตรงๆ ต้องสร้างค่าใหม่เสมอ
> ```tsx
> items.push(newItem);              // ❌ React ไม่รู้ว่าเปลี่ยน หน้าจอไม่อัปเดต
> setItems([...items, newItem]);    // ✅ สร้าง array ใหม่
> setForm({ ...form, name: "บิต" }); // ✅ object ก็เหมือนกัน
> ```

---

## 6. useEffect และการดึงข้อมูลจาก API

ข้อนี้มี 2 ตอน: **6.1–6.8 เรียนรู้ useEffect ทีละขั้น** (ฝึกกับตัวอย่างเล็กๆ ก่อน) แล้วค่อย **6.9 ลงมือดึงข้อมูลจริง** ซึ่งใช้ useEffect เต็มรูปแบบ อ่านครบจะเข้าใจว่าทำไมโค้ดใน `useFetch` ถึงเขียนแบบนั้น

### 6.1 useEffect คืออะไร ทำไมต้องมี

ชิ้นส่วน React มีหน้าที่หลักข้อเดียว: **รับ props กับ state แล้วบอกว่าหน้าตาควรเป็นยังไง** เรียกส่วนนี้ว่า **render** กฎเหล็กคือ render ต้อง **ไม่มีผลข้างเคียง** (คำนวณหน้าตาอย่างเดียว ห้ามไปยุ่งกับโลกข้างนอก) เพราะ React จะเรียกฟังก์ชันชิ้นส่วนซ้ำกี่รอบก็ได้ตามที่เห็นสมควร

แต่เว็บจริงต้องทำงานอื่นด้วย เรียกรวมว่า **side effect** = งานที่อยู่ *นอกการวาดหน้าจอ*:

- ดึงข้อมูลจาก API
- ตั้งชื่อแท็บเบราว์เซอร์ (`document.title`)
- ตั้ง timer (`setInterval`, `setTimeout`)
- ฟังเหตุการณ์ของหน้าต่าง (`addEventListener`)

`useEffect` คือ **ช่องที่ React เตรียมไว้ให้ใส่งานพวกนี้** React จะรันให้ *หลังวาดหน้าจอเสร็จ* ไม่ใช่ระหว่างวาด

> 💡 **นึกภาพ:** ชิ้นส่วน = **พนักงานจัดหน้าร้าน** หน้าที่คือจัดของบนชั้นตามใบสั่งให้สวย (render) ส่วนงานอย่าง "โทรสั่งของ" "ตั้งนาฬิกาปลุก" ไม่ใช่งานจัดชั้น ต้องทำ *หลังจัดเสร็จ* ในช่องงานพิเศษ (useEffect) ถ้าไปโทรศัพท์ระหว่างจัดชั้น งานจะเละและโทรซ้ำทุกครั้งที่จัดใหม่

```tsx
// ❌ ห้าม: ยุ่งกับโลกข้างนอกใน render โดยตรง
export default function Bad() {
  document.title = "เมนู";          // ทำทุกครั้งที่ React เรียกฟังก์ชันนี้
  return <h1>เมนู</h1>;
}

// ✅ ใส่ใน useEffect
import { useEffect } from "react";
export default function Good() {
  useEffect(() => {
    document.title = "เมนู";
  }, []);
  return <h1>เมนู</h1>;
}
```

### 6.2 ลำดับเวลา: render → วาดลงจอ → effect

![ลำดับ render วาดลงจอ effect และ cleanup ของ useEffect](/img/11-useeffect-timeline.svg)
*useEffect ทำงานหลังผู้ใช้เห็นหน้าจอแล้ว ถ้ามี cleanup มันจะรันก่อน effect รอบถัดไป หรือตอนชิ้นส่วนหายไป*

ลองดูลำดับจริงด้วย `console.log` ที่ `src/components/order-demo.tsx`

```tsx
import { useEffect, useState } from "react";

export default function OrderDemo() {
  const [name, setName] = useState("A");
  console.log("1 render", name);

  useEffect(() => {
    console.log("2 effect", name);
    return () => console.log("3 cleanup", name);
  }, [name]);

  return <button onClick={() => setName(name === "A" ? "B" : "A")}>ตอนนี้คือ {name}</button>;
}
```

เอาไปใส่ใน `App` (`<OrderDemo />`) แล้วเปิด Console (F12)

**ควรเห็น** (ตอนเปิดหน้าครั้งแรก ดูเรื่อง 2 รอบใน 6.6 ประกอบ)
```text
1 render A
2 effect A
```
กดปุ่ม 1 ครั้ง:
```text
1 render B
3 cleanup A      ← เก็บกวาดของรอบเก่าก่อน
2 effect B       ← แล้วค่อยทำรอบใหม่
```
> 💡 โปรเจกต์ Vite ห่อแอปด้วย `<StrictMode>` (ดูข้อ 6.6) ตอน `bun run dev` จึงเห็นบรรทัด `1 render ...` **ซ้ำเป็น 2 บรรทัด** ทุกครั้ง (React เรียกฟังก์ชันชิ้นส่วน 2 รอบ) และตอนเปิดหน้าครั้งแรกจะมี `3 cleanup A` กับ `2 effect A` ตามมาอีกชุด เป็นเรื่องปกติ ลำดับ render → cleanup → effect ที่อธิบายข้างบนยังเหมือนเดิม
สังเกตว่า **render มาก่อนเสมอ** แล้ว cleanup ของรอบเก่า แล้วจึง effect ของรอบใหม่

### 6.3 Dependency array: บอกว่า effect จะรันเมื่อไหร่

วงเล็บเหลี่ยมท้าย `useEffect` เรียกว่า **dependency array** (รายการค่าที่ effect "พึ่งพา") React จะเทียบค่าในรายการนี้ทุกรอบที่วาดใหม่ ถ้า *เปลี่ยนจากรอบก่อน* ถึงจะรัน effect อีกครั้ง

![เปรียบเทียบ dependency array 3 แบบ: ไม่ใส่ ใส่ [] และใส่ [x]](/img/11-useeffect-deps.svg)
*ไม่ใส่ = รันทุกรอบ, `[]` = รอบแรกรอบเดียว, `[x]` = รอบแรกและเมื่อ x เปลี่ยน*

| เขียนแบบไหน | รันเมื่อไหร่ | ใช้กับอะไร |
|---|---|---|
| `useEffect(() => {...})` ไม่ใส่ array | **ทุกครั้ง** ที่ชิ้นส่วนวาดใหม่ | แทบไม่ได้ใช้ ระวังวนไม่หยุด |
| `useEffect(() => {...}, [])` array ว่าง | **รอบแรกรอบเดียว** ตอนชิ้นส่วนโผล่ขึ้นจอ | ตั้ง timer, ฟัง event, ดึงข้อมูลครั้งเดียว |
| `useEffect(() => {...}, [x])` | รอบแรก **และทุกครั้งที่ `x` เปลี่ยน** | ดึงข้อมูลตาม url / id, อัปเดต title ตามชื่อ |

> 💡 **นึกภาพ:** dependency array = **ลิสต์ของที่ต้องเฝ้าดู** ไม่ใส่ = ทำงานทุกครั้งที่มีอะไรขยับ / `[]` = ทำครั้งเดียวตอนเริ่มกะ / `[x]` = ทำใหม่เมื่อ x เปลี่ยนเท่านั้น

> ⚠️ **กับดัก: วนไม่หยุด (infinite loop)** ถ้า `setState` อยู่ใน effect ที่ไม่มี array: เปลี่ยน state → วาดใหม่ → effect รันอีก → เปลี่ยน state อีก → ... ไม่จบ
> ```tsx
> // ❌ อย่าเอาไปใส่โปรเจกต์จริง
> const [n, setN] = useState(0);
> useEffect(() => {
>   setN(n + 1);          // ไม่มี [...] ท้าย → วนไม่หยุด
> });
> ```
> **ควรเห็น:** ตัวเลข `n` พุ่งขึ้นเรื่อยๆ และ Console แดงเตือน `Maximum update depth exceeded` (ถ้าไม่ปิดแท็บ หน้าอาจหน่วงมาก) วิธีแก้คือใส่ `[]` (ถ้าต้องการทำครั้งเดียว) หรือใส่ค่าที่ต้องการเฝ้าดู หรือคิดใหม่ว่าต้องใช้ effect จริงไหม (ดูข้อ 6.7)

![เปรียบเทียบ effect ที่วนไม่หยุดกับแบบแก้แล้ว](/img/11-useeffect-loop.svg)
*ซ้าย: ไม่มี array ทำให้วาดใหม่ → effect → วาดใหม่ วนไม่จบ ขวา: ใส่ `[]` effect รันครั้งเดียวแล้วหยุด*

### 6.4 Cleanup function: เก็บกวาดหลังใช้งาน

ถ้า effect ตั้งอะไรไว้ (timer, listener, request) แล้วไม่เก็บ ของพวกนั้นจะค้างอยู่แม้ชิ้นส่วนหายไปแล้ว วิธีเก็บคือ **return ฟังก์ชันออกมาจาก effect** React จะเรียกฟังก์ชันนั้นให้ใน 2 จังหวะ:

1. **ก่อนรัน effect รอบใหม่** (เมื่อ dependency เปลี่ยน)
2. **ตอนชิ้นส่วนหายไปจากจอ** (unmount)

![cleanup ทำงานเมื่อ dependency เปลี่ยน และเมื่อชิ้นส่วนหายไป](/img/11-useeffect-cleanup.svg)
*ทุกอย่างที่ effect "ตั้ง" ต้องมี cleanup ที่ "เก็บ" คู่กัน*

> 💡 **นึกภาพ:** เปิดน้ำ → ต้องปิดน้ำ ตั้งนาฬิกาปลุก → ต้องยกเลิกก่อนไปตั้งใหม่ ไม่งั้นนาฬิกาปลุกหลายเรือนดังพร้อมกัน

| effect ตั้งอะไร | cleanup เก็บด้วย |
|---|---|
| `setInterval` / `setTimeout` | `clearInterval(id)` / `clearTimeout(id)` |
| `addEventListener("resize", fn)` | `removeEventListener("resize", fn)` (ต้องเป็นฟังก์ชัน `fn` ตัวเดียวกัน) |
| `fetch(url, { signal })` | `controller.abort()` ดูตัวอย่างจริงใน `useFetch` ข้อ 6.9 ด้านล่าง |

ตัวอย่างเต็มของ timer และ resize อยู่ในข้อ 6.5

### 6.5 ตัวอย่างเล็กๆ 3 อัน

**(1) ตั้งชื่อแท็บ** `src/components/page-title.tsx`
```tsx
import { useEffect } from "react";

export default function PageTitle({ name }: { name: string }) {
  useEffect(() => {
    document.title = `${name} | Bit Café`;
  }, [name]);                                  // name เปลี่ยน → ตั้งใหม่

  return <h1>{name}</h1>;
}
```
ใช้งาน: `<PageTitle name="เมนู" />` ตัวนี้ไม่ต้อง cleanup เพราะแค่เขียนทับค่าเดิม
**ควรเห็น:** ชื่อแท็บเบราว์เซอร์เป็น `เมนู | Bit Café` พอเปลี่ยนเป็น `<PageTitle name="ติดต่อ" />` แท็บเปลี่ยนเป็น `ติดต่อ | Bit Café`

**(2) นับเวลา** `src/components/clock.tsx`
```tsx
import { useEffect, useState } from "react";

export default function Clock() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);            // cleanup: เลิกนับตอนชิ้นส่วนหายไป
  }, []);                                      // ตั้ง timer ครั้งเดียว

  return <p>ผ่านไป {seconds} วินาที</p>;
}
```
**ควรเห็น:** ข้อความ `ผ่านไป 0 วินาที` แล้วเลขเพิ่มทีละ 1 ทุกวินาที ลองครอบด้วยปุ่มซ่อน/แสดง (`{show && <Clock />}`) ซ่อนแล้วแสดงใหม่ เลขจะเริ่มนับจาก 0 ใหม่ และไม่มี timer เก่าเดินซ้อน

> 💡 สังเกต `setSeconds((s) => s + 1)` ที่ส่ง **ฟังก์ชัน** เข้าไป ไม่ใช่ `setSeconds(seconds + 1)` เพราะ effect นี้รันแค่ครั้งเดียว ค่า `seconds` ที่มันจำไว้จะค้างเป็น 0 ตลอด (ดูตาราง 6.8 แถว "ค่าค้าง") การส่งฟังก์ชันคือการบอกว่า *"เอาค่าล่าสุดมาบวก 1"*

**(3) ฟังขนาดหน้าจอ** `src/components/window-size.tsx`
```tsx
import { useEffect, useState } from "react";

export default function WindowSize() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);   // cleanup
  }, []);

  return <p>หน้าจอกว้าง {width} px</p>;
}
```
**ควรเห็น:** ข้อความ `หน้าจอกว้าง 1280 px` (เลขตามหน้าต่างของคุณ) ลากขอบหน้าต่างเบราว์เซอร์ เลขเปลี่ยนตามทันที

### 6.6 StrictMode: ทำไมตอนพัฒนา effect รัน 2 รอบ

เปิด `src/main.tsx` จะเห็นว่าโปรเจกต์ Vite ห่อ `<App />` ด้วย `<StrictMode>` ไว้ ตัวนี้มีผลเฉพาะตอน **พัฒนา (`bun run dev`)** ไม่มีผลกับเว็บที่ build ขึ้นจริง

มันจงใจ **รัน effect → cleanup → effect อีกรอบ** ตอนชิ้นส่วนโผล่ขึ้นจอครั้งแรก (และเรียกฟังก์ชันชิ้นส่วนซ้ำ 2 รอบด้วย) ไว้ทดสอบว่า cleanup ของเรา *เก็บกวาดครบจริงไหม* ถ้า effect กับ cleanup เขียนคู่กันถูก รันกี่รอบผลก็เหมือนกัน แต่ถ้าลืมเก็บ ปัญหา (เช่น timer ซ้อน) จะโผล่ให้เห็นทันทีตั้งแต่ตอนพัฒนา

**ควรเห็น** ถ้าหุ้ม `OrderDemo` ด้วย `<StrictMode>` ตอนเปิดหน้า:
```text
1 render A
1 render A        ← ฟังก์ชันชิ้นส่วนถูกเรียก 2 รอบ
2 effect A
3 cleanup A       ← React จำลองการ "หายไป"
2 effect A        ← แล้ว "โผล่" ใหม่
```
> ⚠️ **วิธีอ่าน:** เห็นซ้ำเฉพาะตอนเปิดหน้ารอบแรกของ dev เป็นเรื่องปกติ **ไม่ใช่บั๊ก ห้ามลบ `<StrictMode>` ทิ้งเพื่อให้หายซ้ำ** ถ้าซ้ำแล้วเกิดปัญหา (เช่น `Clock` เดิน 2 เท่า) แปลว่า cleanup ยังเขียนไม่ครบ ให้ไปแก้ที่ cleanup
> ส่วนคำขอที่ซ้ำ 2 ครั้งในแท็บ Network ตอน dev ก็มาจากเรื่องนี้ (ข้อ 6.9)

### 6.7 ไม่ต้องใช้ useEffect เมื่อไหร่

มือใหม่มักใส่ useEffect เยอะเกินไป จำ 2 ข้อ:

1. **ค่าที่คำนวณจาก state/props ได้เลย** → คำนวณตรงๆ ในชิ้นส่วน ไม่ต้องเก็บเป็น state เพิ่ม
2. **งานที่เกิดเพราะผู้ใช้กดปุ่ม** → ทำใน event handler (`onClick`, `onSubmit`) ไม่ต้องรอ effect

> 💡 effect มีไว้ **ซิงก์กับโลกข้างนอก** (API, เบราว์เซอร์, timer) ถ้าไม่ได้คุยกับโลกข้างนอก มักไม่ต้องใช้

```tsx
// ❌ ไม่ดี: เก็บค่าที่คำนวณได้เองไว้ใน state แล้วใช้ effect ตามอัปเดต
function PriceBad({ price, qty }: { price: number; qty: number }) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    setTotal(price * qty);              // วาดผิดไป 1 รอบ แล้ววาดซ้ำอีกรอบ
  }, [price, qty]);
  return <p>รวม {total} บาท</p>;
}

// ✅ ดี: คำนวณตรงๆ ตอน render
function PriceGood({ price, qty }: { price: number; qty: number }) {
  const total = price * qty;
  return <p>รวม {total} บาท</p>;
}
```
```tsx
// ❌ ไม่ดี: กดปุ่ม → ตั้ง state ธง → ให้ effect ส่งข้อมูล
const [clicked, setClicked] = useState(false);
useEffect(() => {
  if (clicked) save();
}, [clicked]);
<button onClick={() => setClicked(true)}>บันทึก</button>

// ✅ ดี: ทำใน event handler เลย
<button onClick={() => save()}>บันทึก</button>
```
**ควรเห็น:** `PriceGood` แสดงยอดรวมถูกต้องตั้งแต่วาดครั้งแรก ส่วน `PriceBad` วาดค่า `0` ก่อนแล้วจึงอัปเดตตามมา (ผู้ใช้อาจเห็นกระพริบ) ผลลัพธ์สุดท้ายเหมือนกัน แต่แบบดีสั้นกว่าและไม่มีรอบเกินมา

> 🔑 **ข้อสังเกตว่าควรใช้ effect:** "โค้ดนี้ต้องทำ *เพราะชิ้นส่วนโผล่ขึ้นจอ/ค่าเปลี่ยน*" → effect (เช่น ดึงข้อมูลตอนเปิดหน้า) / "โค้ดนี้ต้องทำ *เพราะผู้ใช้ทำอะไรสักอย่าง*" → event handler

### 6.8 ปัญหาที่เจอบ่อยกับ useEffect

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| ตัวเลข/คำขอพุ่งไม่หยุด Console เตือน `Maximum update depth exceeded` | `setState` ใน effect ที่ **ไม่มี `[...]`** (หรือ array มีค่าที่ effect เปลี่ยนเองทุกรอบ) | ใส่ array ที่ถูกต้อง หรือเปลี่ยนไปคำนวณตรงๆ (ข้อ 6.7) |
| ค่าค้างเป็นค่าเก่า (เช่น timer นับแค่ถึง 1 แล้วหยุด) | ใช้ `setCount(count + 1)` ใน effect ที่ `[]` ทำให้ `count` ที่จำไว้เป็น 0 ตลอด | ส่งฟังก์ชัน `setCount((c) => c + 1)` หรือใส่ `count` ใน `[...]` |
| `Can't perform a React state update on an unmounted component` (พบในบทความ/React เวอร์ชันเก่า) | request/timer เสร็จหลังชิ้นส่วนหายไปแล้ว แล้วยังไป `setState` | ทำ cleanup (`abort()` / `clearInterval`) ให้ครบ เหมือน `useFetch` (React 18 ขึ้นไปเลิกแสดงข้อความนี้แล้ว แต่การเก็บกวาดยังจำเป็น) |
| effect ไม่รัน / ไม่รันใหม่ตอนที่คิดว่าต้องรัน | ค่าใน `[...]` ไม่ได้เปลี่ยนจริง, ใส่ `[]` แต่ต้องการให้รันตาม `x`, หรือแก้ state ตรงๆ (ดูข้อ 5) ทำให้ React ไม่รู้ว่าเปลี่ยน | ใส่ตัวแปรที่ effect ใช้ลงใน `[...]` และสร้างค่าใหม่เสมอเมื่ออัปเดต state |
| effect รันถี่เกินจำเป็น | ใส่ object/array/ฟังก์ชันที่สร้างใหม่ทุกรอบ (เช่น `[{ id }]`) ใน `[...]` ทำให้ React ถือว่า "เปลี่ยน" ทุกรอบ | ใส่เฉพาะค่าพื้นฐาน (`id`, `url`) ลงใน `[...]` |
| ESLint เตือน `React Hook useEffect has a missing dependency: 'x'. Either include it or remove the dependency array` (กฎ `react-hooks/exhaustive-deps`) | ใน effect ใช้ตัวแปร `x` จากชิ้นส่วน แต่ไม่ได้ใส่ใน `[...]` | ใส่ `x` ลงใน `[...]` อย่าแก้ด้วยการปิด warning ถ้าใส่แล้ววนไม่หยุด แปลว่าควรคิดโครงสร้างใหม่ (ข้อ 6.7) |
| ซ้ำ 2 รอบตอนเปิดหน้าใน dev | `<StrictMode>` (ข้อ 6.6) | ปกติ ไม่ต้องแก้ ตรวจว่า cleanup ครบ |

### 6.9 🔧 ลงมือ: ดึงข้อมูลจาก API

ตอนนี้ยังไม่มี API จริง (จะสร้างในบทที่ 14) ใช้ไฟล์ข้อมูลตัวอย่างไปก่อน ไฟล์ในโฟลเดอร์ `public/` เปิดได้ตรงๆ ที่ `/ชื่อไฟล์`

`public/mock/services.json`
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "ลาเต้", "description": "นมสดหอมมัน", "price": 65, "imageUrl": "https://picsum.photos/seed/latte/400/300" },
    { "id": 2, "name": "มอคค่า", "description": "ช็อกโกแลตเข้มข้น", "price": 70, "imageUrl": "https://picsum.photos/seed/mocha/400/300" },
    { "id": 3, "name": "จัดเลี้ยงนอกสถานที่", "description": "สอบถามราคา", "price": null, "imageUrl": "https://picsum.photos/seed/event/400/300" }
  ]
}
```
👀 หน้าตา `{ success, data }` ตรงกับ [รายการ API ของงาน STARTER](./starter/database-api.md#_2-รายการ-api) พอมี API จริงก็เปลี่ยนที่อยู่ได้เลย ไม่ต้องแก้หน้าเว็บ

**ตัวช่วยดึงข้อมูล ใช้ซ้ำได้ทุกหน้า** `src/api/useFetch.ts`
```ts
import { useEffect, useState } from "react";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();   // ยกเลิก request ถ้าออกจากหน้าก่อนโหลดเสร็จ
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`โหลดไม่สำเร็จ (รหัส ${res.status})`);
        // ไฟล์ที่ไม่มีอยู่ Vite จะส่งหน้า HTML กลับมาแทน (รหัส 200) แปลงเป็น JSON ไม่ได้ ให้บอกเป็นภาษาคน
        const body = (await res.json().catch(() => {
          throw new Error("ข้อมูลที่ได้กลับมาไม่ใช่ JSON (ที่อยู่ผิดหรือเปล่า?)");
        })) as ApiResponse<T>;
        if (!body.success) throw new Error(body.error.message);
        setData(body.data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();           // cleanup: React เรียกตอนออกจากหน้า หรือ url เปลี่ยน
  }, [url]);                                    // รันใหม่เมื่อ url เปลี่ยนเท่านั้น

  return { data, error, loading };
}
```

**ใช้งาน** `src/app.tsx`
```tsx
import ServiceCard from "./components/service-card";
import { useFetch } from "./api/useFetch";
import type { Service } from "./types/service";

export default function App() {
  const { data, error, loading } = useFetch<Service[]>("/mock/services.json");

  if (loading) return <p>กำลังโหลด... ⏳</p>;
  if (error) return <p>โหลดข้อมูลไม่สำเร็จ: {error} 😢</p>;

  return (
    <main>
      <h1>Bit Café ☕</h1>
      {data?.map((s) => <ServiceCard key={s.id} service={s} />)}
    </main>
  );
}
```
![การดึงข้อมูลมี 3 สถานะ: กำลังโหลด โหลดพัง และสำเร็จ](/img/11-fetch-states.svg)
*ทุกหน้าที่ดึงข้อมูลต้องเตรียมหน้าตาให้ครบทั้ง 3 แบบ*

💥 **ลองพังมันดู:** เปลี่ยนที่อยู่เป็น `/mock/nope.json` ต้องเห็นข้อความ "ข้อมูลที่ได้กลับมาไม่ใช่ JSON" ไม่ใช่หน้าขาว (Vite ตอบไฟล์ที่ไม่มีด้วยหน้า HTML ของเว็บ เราจึงต้องดักตอนแปลง JSON ด้วย ไม่ใช่เช็คแค่ `res.ok`)
💥 เปิด DevTools → Network → เลือก **Slow 4G** แล้วรีเฟรช จะเห็นข้อความกำลังโหลด

> ⚠️ **กับดักของ useEffect**
> - ลืมใส่ `[url]` ท้าย useEffect → โค้ดดึงข้อมูลทำงานทุกครั้งที่หน้าจอวาดใหม่ → ดึงไม่หยุด 🔁
> - ตอนพัฒนา React จงใจรันโค้ดใน useEffect **2 รอบ** เพื่อช่วยจับบั๊ก ถ้าเห็นคำขอซ้ำในแท็บ Network ไม่ต้องตกใจ ตอนขึ้นระบบจริงไม่เป็นแบบนี้
> - รายละเอียดทั้งหมดอยู่ในข้อ 6.3 (dependency array), 6.4 (cleanup) และ 6.6 (StrictMode)

---

## 7. 🔧 ฟอร์ม: ช่องกรอก + ตรวจ + ส่ง

ค่าในช่องกรอกเก็บไว้ใน state ทุกตัวอักษรที่พิมพ์

![พิมพ์ในช่องกรอก onChange อัปเดต state แล้วช่องกรอกวาดใหม่](/img/11-form-flow.svg)
*ช่องกรอกอ่านค่าจาก state และทุกตัวอักษรที่พิมพ์จะอัปเดต state กลับ*

`src/components/contact-form.tsx`
```tsx
import { useState, type FormEvent } from "react";

const empty = { name: "", phone: "", message: "" };
type Form = typeof empty;
type Errors = Partial<Record<keyof Form, string>>;

function validate(form: Form): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = "กรุณากรอกชื่อ";
  if (!/^\d{9,10}$/.test(form.phone)) errors.phone = "เบอร์โทร 9–10 หลัก ตัวเลขเท่านั้น";
  if (!form.message.trim()) errors.message = "กรุณากรอกข้อความ";
  else if (form.message.length > 1000) errors.message = "ไม่เกิน 1,000 ตัวอักษร";
  return errors;
}

export default function ContactForm() {
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const update = (field: keyof Form, value: string) => setForm({ ...form, [field]: value });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();                       // ไม่ให้ browser reload หน้า
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      // บทที่ 14 จะเปลี่ยนเป็น fetch("/api/contact", { method: "POST", ... })
      await new Promise((r) => setTimeout(r, 1000));
      setDone(true);
      setForm(empty);                         // ส่งสำเร็จ → ล้างฟอร์ม
    } finally {
      setSending(false);
    }
  }

  if (done) return <p>ขอบคุณครับ เราจะติดต่อกลับโดยเร็ว 🙏</p>;

  return (
    <form onSubmit={onSubmit} noValidate>
      <label>
        ชื่อ *
        <input value={form.name} onChange={(e) => update("name", e.target.value)} />
      </label>
      {errors.name && <p className="error">{errors.name}</p>}

      <label>
        เบอร์โทร *
        <input value={form.phone} inputMode="numeric" onChange={(e) => update("phone", e.target.value)} />
      </label>
      {errors.phone && <p className="error">{errors.phone}</p>}

      <label>
        ข้อความ *
        <textarea value={form.message} onChange={(e) => update("message", e.target.value)} />
      </label>
      {errors.message && <p className="error">{errors.message}</p>}

      <button type="submit" disabled={sending}>{sending ? "กำลังส่ง..." : "ส่ง"}</button>
    </form>
  );
}
```
ครบตามที่งาน STARTER ต้องการ: **ตรวจก่อนส่ง, ข้อความเตือนใต้ช่องที่ผิด, ปุ่มกดซ้ำไม่ได้ระหว่างส่ง, ส่งเสร็จขอบคุณแล้วล้างฟอร์ม**

> ⚠️ การตรวจที่หน้าเว็บมีไว้ให้ **ผู้ใช้สะดวก** เท่านั้น คนร้ายส่งตรงไปที่ API ได้เสมอ server ต้องตรวจซ้ำด้วย Zod ทุกครั้ง ([บทที่ 10](./10-security.md))

---

## 8. จัดโฟลเดอร์

```
client/src/
├─ pages/        # 1 ไฟล์ = 1 หน้า (home-page.tsx, about-page.tsx, ...)
├─ components/   # ชิ้นส่วนที่ใช้ซ้ำ (navbar, service-card, ...)
├─ api/          # ทุกการเรียก backend อยู่ที่นี่ที่เดียว
├─ types/        # interface ของข้อมูล
├─ app.tsx
└─ main.tsx
```
> 💡 กฎง่ายๆ: **ชิ้นส่วนไม่เรียก API เอง** ให้เรียกผ่านไฟล์ในโฟลเดอร์ `api/` วันที่ที่อยู่หรือหน้าตาข้อมูลเปลี่ยน จะได้แก้ที่เดียว

> 📖 ไวยากรณ์ JavaScript/TypeScript และ hook ทีละตัว (`map`, destructuring, `?.`, `useRef`, `useNavigate` ฯลฯ) ดู [บทเสริม: ภาษาและคำสั่งที่ใช้เขียน React](./react-language.md)

> 📚 เว็บที่โตขึ้นควรจัดแบบแบ่งตามฟีเจอร์ และแยก Component เป็น 2 ระดับ (shared กับของฟีเจอร์) ดู [บทเสริม: จัดโครงสร้างโปรเจกต์](./project-structure.md)

---

## 9. ⚠️ ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| Console เตือน `Each child in a list should have a unique "key"` | ใช้ `map` แต่ไม่ใส่ `key` | ใส่ `key={item.id}` |
| กดแล้วหน้าจอไม่เปลี่ยน | แก้ state ตรงๆ (`push`, `obj.x =`) | สร้างค่าใหม่ด้วย `[...]` / `{...}` |
| ดึงข้อมูลรัวไม่หยุด | useEffect ไม่มี `[...]` ต่อท้าย | ใส่ `[]` หรือ `[url]` |
| ตัวเลขใน effect พุ่งไม่หยุด Console เตือน `Maximum update depth exceeded` | `setState` ใน useEffect ที่ไม่มี `[...]` | ใส่ array ให้ถูก หรือคำนวณตรงๆ แทนการใช้ effect (ข้อ 6.3, 6.7) |
| timer นับแค่ 1 แล้วหยุด / ได้ค่าเก่า | effect ที่ `[]` จำค่า state ตอนเริ่มไว้ (stale value) | `setCount((c) => c + 1)` หรือใส่ค่านั้นใน `[...]` (ข้อ 6.8) |
| useEffect ทำงาน 2 รอบตอนเปิดหน้า | `<StrictMode>` ตอนพัฒนา (ปกติ ไม่ใช่บั๊ก) | ไม่ต้องลบ StrictMode แค่ตรวจว่ามี cleanup ครบ (ข้อ 6.6) |
| ESLint เตือน `react-hooks/exhaustive-deps` | ใช้ตัวแปรใน effect แต่ไม่ได้ใส่ใน `[...]` | ใส่ตัวแปรนั้นลงใน `[...]` อย่าปิด warning ทิ้ง (ข้อ 6.8) |
| `Cannot read properties of null` | ใช้ข้อมูลก่อนโหลดเสร็จ | เช็คว่ากำลังโหลดอยู่ไหมก่อน หรือใช้ `data?.` |
| หน้าขาวทั้งหน้า | มี error ในชิ้นส่วน | เปิด Console อ่าน error บรรทัดแรก ([บทที่ 9](./09-debugging.md)) |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. props กับ state ต่างกันยังไง?</summary>

props = ข้อมูลที่ **ชิ้นส่วนแม่ส่งมาให้** อ่านได้อย่างเดียว / state = ข้อมูลที่ **ชิ้นส่วนเป็นเจ้าของเอง** เปลี่ยนได้ และเปลี่ยนแล้วหน้าจอวาดใหม่
</details>

<details><summary>2. ทำไมทุกหน้าต้องมีข้อความตอนกำลังโหลดและตอนโหลดพัง?</summary>

เน็ตช้าหรือ API ล่มได้เสมอ ถ้าไม่เตรียมไว้ ผู้ใช้จะเห็นหน้าว่างหรือหน้าขาวแล้วคิดว่าเว็บพัง งาน STARTER จึงบังคับไว้
</details>

<details><summary>3. <code>return () => controller.abort()</code> ใน useEffect มีไว้ทำอะไร?</summary>

เป็นการเก็บกวาด: ถ้าผู้ใช้ออกจากหน้าก่อนโหลดเสร็จ จะยกเลิกการดึงข้อมูล และไม่ไปเปลี่ยนข้อมูลของชิ้นส่วนที่ไม่อยู่แล้ว
</details>

<details><summary>4. ตรวจที่หน้าเว็บแล้ว ทำไม server ต้องตรวจซ้ำ?</summary>

ใครก็ส่งข้อมูลตรงไปที่ API ได้โดยไม่ผ่านหน้าเว็บ (curl, Postman, โปรแกรมอื่น) การตรวจที่หน้าเว็บจึงข้ามได้ ที่เชื่อได้คือการตรวจที่ server เท่านั้น
</details>

<details><summary>5. <code>useEffect(() =&gt; {...})</code> ที่ไม่มี array, ที่เป็น <code>[]</code> และที่เป็น <code>[x]</code> รันเมื่อไหร่ต่างกันยังไง?</summary>

ไม่มี array = รันทุกครั้งที่วาดใหม่ / `[]` = รันรอบแรกรอบเดียว / `[x]` = รันรอบแรก และรันใหม่ทุกครั้งที่ `x` เปลี่ยน
</details>

<details><summary>6. ถ้าไม่ใส่ cleanup ให้ <code>setInterval</code> ใน effect จะเกิดอะไรขึ้น?</summary>

ตอนชิ้นส่วนหายไป timer ยังเดินต่อและยังพยายามเปลี่ยน state ของชิ้นส่วนที่ไม่อยู่แล้ว และถ้า effect รันใหม่ (เช่น dependency เปลี่ยน หรือ StrictMode ตอน dev) จะมี timer ซ้อนกันหลายตัว ต้อง `return () => clearInterval(id)` เสมอ
</details>

<details><summary>7. เปิดหน้าแล้ว useEffect รัน 2 รอบใน <code>bun run dev</code> เป็นบั๊กไหม ต้องแก้ยังไง?</summary>

ไม่ใช่บั๊ก เป็น `<StrictMode>` ที่จงใจรัน effect → cleanup → effect ตอนพัฒนาเพื่อทดสอบว่า cleanup ครบ ตอน build ขึ้นจริงไม่เป็นแบบนี้ ไม่ต้องลบ StrictMode ถ้ารัน 2 รอบแล้วเกิดปัญหา ให้ไปแก้ cleanup
</details>

<details><summary>8. <code>const total = price * qty</code> กับการใช้ <code>useEffect</code> + <code>setTotal</code> แบบไหนดีกว่า ทำไม?</summary>

แบบคำนวณตรงๆ ดีกว่า เพราะค่าที่คำนวณจาก state/props ได้เลยไม่ต้องเก็บเป็น state เพิ่ม ถ้าใช้ effect จะวาดไป 1 รอบด้วยค่าเก่าก่อน แล้ววาดซ้ำอีกรอบ useEffect มีไว้ซิงก์กับโลกข้างนอก (API, timer, event ของเบราว์เซอร์) ไม่ใช่คำนวณค่า
</details>

---

## ✏️ แบบฝึกหัด

ทำหน้า Bit Café ที่มี: ชื่อร้าน, ปุ่มเปิดปิดเมนู (`MenuToggle`), การ์ดสินค้าจาก `useFetch` และฟอร์มติดต่อที่เพิ่มช่อง **อีเมล (ไม่บังคับกรอก แต่ถ้ากรอกต้องถูกรูปแบบ)** แล้วลองให้เห็นทั้ง 3 แบบกับตา (กำลังโหลด / โหลดพัง / สำเร็จ)

## ✅ ผ่านด่าน

- [ ] สร้างโปรเจกต์ React + TypeScript ด้วย Vite ได้
- [ ] เขียนชิ้นส่วนที่รับข้อมูล (props) แบบมีชนิดข้อมูลได้
- [ ] ใช้ `useState` และรู้ว่าทำไมห้ามแก้ state ตรงๆ
- [ ] ดึงข้อมูลด้วย `useEffect` พร้อมข้อความตอนโหลดและตอนพัง
- [ ] อธิบายได้ว่า dependency array 3 แบบต่างกันยังไง และเขียน cleanup ให้ timer / event listener ได้
- [ ] ทำฟอร์มที่ตรวจก่อนส่ง, กันกดซ้ำ และล้างฟอร์มหลังส่งเสร็จได้

---

[← บทที่ 10: Security](./10-security.md) · [🏠 สารบัญ](/) · [บทที่ 12: ตกแต่งเว็บ (Tailwind) →](./12-tailwind.md)
