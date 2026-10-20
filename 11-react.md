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

## 6. 🔧 ดึงข้อมูลจาก API

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

> 📚 เว็บที่โตขึ้นควรจัดแบบแบ่งตามฟีเจอร์ และแยก Component เป็น 2 ระดับ (shared กับของฟีเจอร์) ดู [บทเสริม: จัดโครงสร้างโปรเจกต์](./project-structure.md)

---

## 9. ⚠️ ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| Console เตือน `Each child in a list should have a unique "key"` | ใช้ `map` แต่ไม่ใส่ `key` | ใส่ `key={item.id}` |
| กดแล้วหน้าจอไม่เปลี่ยน | แก้ state ตรงๆ (`push`, `obj.x =`) | สร้างค่าใหม่ด้วย `[...]` / `{...}` |
| ดึงข้อมูลรัวไม่หยุด | useEffect ไม่มี `[...]` ต่อท้าย | ใส่ `[]` หรือ `[url]` |
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

---

## ✏️ แบบฝึกหัด

ทำหน้า Bit Café ที่มี: ชื่อร้าน, ปุ่มเปิดปิดเมนู (`MenuToggle`), การ์ดสินค้าจาก `useFetch` และฟอร์มติดต่อที่เพิ่มช่อง **อีเมล (ไม่บังคับกรอก แต่ถ้ากรอกต้องถูกรูปแบบ)** แล้วลองให้เห็นทั้ง 3 แบบกับตา (กำลังโหลด / โหลดพัง / สำเร็จ)

## ✅ ผ่านด่าน

- [ ] สร้างโปรเจกต์ React + TypeScript ด้วย Vite ได้
- [ ] เขียนชิ้นส่วนที่รับข้อมูล (props) แบบมีชนิดข้อมูลได้
- [ ] ใช้ `useState` และรู้ว่าทำไมห้ามแก้ state ตรงๆ
- [ ] ดึงข้อมูลด้วย `useEffect` พร้อมข้อความตอนโหลดและตอนพัง
- [ ] ทำฟอร์มที่ตรวจก่อนส่ง, กันกดซ้ำ และล้างฟอร์มหลังส่งเสร็จได้

---

[← บทที่ 10: Security](./10-security.md) · [🏠 สารบัญ](/) · [บทที่ 12: ตกแต่งเว็บ (Tailwind) →](./12-tailwind.md)
