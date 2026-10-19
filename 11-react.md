# บทที่ 11: React + Vite 🧱

> ⏱ ประมาณ 4 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 3 และ 4 · 🛠 ใช้: Bun, TypeScript, VS Code, Browser DevTools

> **⚡ สรุป 30 วินาที**
> - React = library สร้างหน้าเว็บจาก **component** (ชิ้นส่วน UI ที่ประกอบกันได้) หน้าเว็บ = ผลลัพธ์ของ **state** ตอนนั้น
> - **Vite** = เครื่องมือรันและ build โปรเจกต์ React แก้ไฟล์แล้วหน้าเว็บอัปเดตทันที
> - เรียนครบ 5 เรื่องที่ต้องใช้ทำเว็บจริง: **JSX, props, state, useEffect + fetch, form**
> - ทุกหน้าที่ดึงข้อมูลต้องมี 3 สถานะ: **loading / error / สำเร็จ**

---

## 📖 เรื่องเล่า

บิตเขียน API เป็นแล้ว แต่ลูกค้าบอกว่า *"ผมเปิด Postman ไม่เป็นนะ ขอเป็นหน้าเว็บ"* 😅
บิตลองเขียน HTML ล้วนๆ หน้าร้านกาแฟ พอจะแสดงเมนู 20 รายการ ต้องก๊อป `<div>` 20 ก้อน พอราคาเปลี่ยนต้องแก้ทีละจุด

พี่ไบต์: *"ถ้าเมนูมาจาก API แล้วหน้าเว็บสร้างตัวเองจากข้อมูลได้ล่ะ?"*
นั่นคือสิ่งที่ React ทำ

---

## 1. React คืออะไร

**HTML แบบเดิม:** เขียนหน้าเว็บตายตัว อยากเปลี่ยนต้องไปหา element แล้วแก้ทีละจุด
**React:** บอกแค่ว่า *"ถ้าข้อมูลเป็นแบบนี้ หน้าตาควรเป็นแบบนี้"* ข้อมูลเปลี่ยนเมื่อไหร่ React วาดใหม่ให้เอง

```
   ข้อมูล (state)            component              หน้าเว็บ
 [ { name: "ลาเต้" },  -->  function Menu() { ... }  -->  ☕ ลาเต้
   { name: "มอคค่า" } ]                                     ☕ มอคค่า
```

> 💡 **เปรียบเทียบ:** component = **แม่พิมพ์ขนม** 🍪 ใส่แป้งต่างกัน (ข้อมูล) ได้ขนมหน้าตาเดียวกันแต่ไส้ต่างกัน ไม่ต้องปั้นใหม่ทีละชิ้น

**SPA (Single Page Application)** = browser โหลดหน้า HTML ครั้งเดียว แล้ว JavaScript สลับเนื้อหาเอง กดเมนูแล้วไม่กระพริบ ข้อเสียคือ SEO ทำได้จำกัด (บทที่ 13)

---

## 2. 🔧 ลงมือ: สร้างโปรเจกต์

ตลอดด่าน 5 เราจะสร้าง **Bit Café** ☕ เว็บร้านกาแฟเล็กๆ ที่มีโครงสร้างเหมือน [Mini Project STARTER](./starter/index.md) แต่ฟีเจอร์น้อยกว่า

```bash
mkdir bit-cafe && cd bit-cafe
bun create vite client --template react-ts
cd client
bun install
bun run dev
```
เปิด http://localhost:5173 ควรเห็นหน้า Vite + React พร้อมปุ่มนับเลข 🎉

**ไฟล์ที่ต้องรู้จัก**
| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | หน้า HTML หน้าเดียวของทั้งเว็บ มี `<div id="root">` ให้ React วาดลงไป |
| `src/main.tsx` | จุดเริ่ม: บอก React ให้วาด `<App />` ลงใน `#root` |
| `src/App.tsx` | component แรก แก้ตรงนี้ |
| `vite.config.ts` | ตั้งค่า Vite (บทที่ 12 และ 14 จะมาแก้) |

ลบของเดิมใน `src/App.tsx` แล้วใส่:
```tsx
export default function App() {
  return <h1>Bit Café ☕</h1>;
}
```
เซฟแล้วดู browser เปลี่ยนเองทันทีโดยไม่ต้อง refresh (เรียกว่า **HMR: Hot Module Replacement**)

---

## 3. JSX: HTML ในไฟล์ TypeScript

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

**กฎ JSX ที่ต้องจำ**
| กฎ | ตัวอย่าง |
|---|---|
| return ได้ **ก้อนเดียว** ถ้ามีหลายก้อนห่อด้วย `<>...</>` | `<><Navbar /><Footer /></>` |
| `class` เขียนเป็น `className` | `<div className="card">` |
| ค่าจาก TS ใส่ใน `{}` | `<p>{price} บาท</p>` |
| tag ต้องปิดเสมอ | `<img src={url} alt="ลาเต้" />` |
| `map` ต้องมี `key` ที่ไม่ซ้ำ | `key={item.id}` |
| แสดงแบบมีเงื่อนไข | `{error && <p>{error}</p>}` |

---

## 4. Component และ Props

แยก UI เป็นชิ้นเล็กๆ แต่ละชิ้นรับข้อมูลผ่าน **props** (เหมือน parameter ของ function)

`src/types/service.ts`
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

`src/components/ServiceCard.tsx`
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

> ⚠️ props **อ่านอย่างเดียว** ห้ามแก้ `service.name = ...` ใน component ถ้าต้องเปลี่ยนค่า ใช้ state (ข้อ 5)
> 💡 TypeScript ช่วยมาก: ลืมส่ง prop หรือส่งผิดชนิด VS Code ขึ้นเส้นแดงทันที

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
เรียก `setOpen` → React วาด component นี้ใหม่ด้วยค่าใหม่ นี่คือหัวใจของ React ทั้งหมด

> ⚠️ **กับดัก:** ห้ามแก้ state ตรงๆ
> ```tsx
> items.push(newItem);              // ❌ React ไม่รู้ว่าเปลี่ยน หน้าจอไม่อัปเดต
> setItems([...items, newItem]);    // ✅ สร้าง array ใหม่
> setForm({ ...form, name: "บิต" }); // ✅ object ก็เหมือนกัน
> ```

---

## 6. 🔧 ดึงข้อมูล: useEffect + fetch

ยังไม่มี API จริง (สร้างในบทที่ 14) ใช้ไฟล์ JSON ปลอมก่อน ไฟล์ใน `public/` เปิดได้ตรงๆ ที่ `/ชื่อไฟล์`

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
👀 รูปแบบ `{ success, data }` ตรงกับ [API Spec ของ STARTER](./starter/database-api.md#_2-api-spec) จะได้เปลี่ยนเป็น API จริงทีหลังโดยไม่ต้องแก้หน้าเว็บ

**hook สำหรับดึงข้อมูล ใช้ซ้ำได้ทุกหน้า** `src/api/useFetch.ts`
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
        const body = (await res.json()) as ApiResponse<T>;
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

**ใช้งาน** `src/App.tsx`
```tsx
import ServiceCard from "./components/ServiceCard";
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
💥 **ลองพังมันดู:** เปลี่ยน URL เป็น `/mock/nope.json` ต้องเห็นข้อความ error ไม่ใช่หน้าขาว
💥 เปิด DevTools → Network → เลือก **Slow 4G** แล้ว refresh จะเห็นสถานะ loading

> ⚠️ **กับดัก useEffect**
> - ลืมใส่ `[url]` (dependency array) → effect รันทุกครั้งที่วาดใหม่ → fetch ไม่หยุด 🔁
> - ตอน dev React (`StrictMode`) จงใจรัน effect **2 ครั้ง** เพื่อจับบั๊กเรื่อง cleanup เห็น request ซ้ำใน Network เป็นเรื่องปกติ ไม่เกิดตอน production

---

## 7. 🔧 Form: ช่องกรอก + validate + ส่ง

**Controlled input** = ค่าในช่องกรอกเก็บใน state ทุกตัวอักษร

`src/components/ContactForm.tsx`
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
ครบตาม requirement ของ STARTER: **validate ก่อนส่ง, error ใต้ช่องที่ผิด, ปุ่ม disable + loading, สำเร็จแล้วขอบคุณ + ล้างฟอร์ม**

> ⚠️ validate ฝั่ง client มีไว้ให้ **ผู้ใช้สะดวก** เท่านั้น คนร้ายยิง API ตรงได้เสมอ server ต้องตรวจซ้ำด้วย Zod ทุกครั้ง ([บทที่ 10](./10-security.md))

---

## 8. จัดโฟลเดอร์

```
client/src/
├─ pages/        # 1 ไฟล์ = 1 หน้า (HomePage.tsx, AboutPage.tsx, ...)
├─ components/   # ชิ้นส่วนที่ใช้ซ้ำ (Navbar, ServiceCard, ...)
├─ api/          # ทุกการเรียก backend อยู่ที่นี่ที่เดียว
├─ types/        # interface ของข้อมูล
├─ App.tsx
└─ main.tsx
```
> 💡 กฎง่ายๆ: **component ไม่เรียก `fetch` เอง** ให้เรียกผ่านไฟล์ใน `api/` วันที่ URL หรือรูปแบบ response เปลี่ยน จะแก้ที่เดียว

---

## 9. ⚠️ ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| Console เตือน `Each child in a list should have a unique "key"` | `map` ไม่ใส่ `key` | ใส่ `key={item.id}` (อย่าใช้ index ถ้ารายการเรียงใหม่ได้) |
| กดแล้วหน้าจอไม่เปลี่ยน | แก้ state ตรงๆ (`push`, `obj.x = `) | สร้างค่าใหม่ด้วย `[...]` / `{...}` |
| fetch รัวไม่หยุด | `useEffect` ไม่มี dependency array | ใส่ `[]` หรือ `[url]` |
| `Cannot read properties of null` | ใช้ `data` ก่อนโหลดเสร็จ | เช็ค `loading` ก่อน หรือใช้ `data?.` |
| หน้าขาวทั้งหน้า | error ใน component | เปิด Console อ่าน error บรรทัดแรก ([บทที่ 9](./09-debugging.md)) |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. props กับ state ต่างกันยังไง?</summary>

props = ข้อมูลที่ **พ่อแม่ส่งมาให้** อ่านอย่างเดียว / state = ข้อมูลที่ **component เป็นเจ้าของเอง** เปลี่ยนได้ด้วย setter และเปลี่ยนแล้วหน้าจอวาดใหม่
</details>

<details><summary>2. ทำไมต้องมีสถานะ loading และ error ทุกหน้า?</summary>

network ช้าหรือ API ล่มได้เสมอ ถ้าไม่จัดการ ผู้ใช้จะเห็นหน้าว่างหรือหน้าขาวแล้วคิดว่าเว็บพัง STARTER จึงบังคับไว้เป็น requirement
</details>

<details><summary>3. <code>return () => controller.abort()</code> ใน useEffect มีไว้ทำอะไร?</summary>

เป็น cleanup: ถ้าผู้ใช้ออกจากหน้าก่อนโหลดเสร็จ จะยกเลิก request และไม่ไป set state ของ component ที่หายไปแล้ว
</details>

<details><summary>4. validate ที่ client แล้ว ทำไม server ต้องตรวจซ้ำ?</summary>

ใครก็ส่ง request ตรงไปที่ API ได้โดยไม่ผ่านหน้าเว็บ (curl, Postman, script) การตรวจที่ client จึงข้ามได้ ที่เชื่อได้คือการตรวจที่ server เท่านั้น
</details>

---

## ✏️ แบบฝึกหัด

ทำหน้า Bit Café ที่มี: หัวข้อร้าน, `MenuToggle`, รายการ `ServiceCard` จาก `useFetch` และ `ContactForm` เพิ่มช่อง **อีเมล (ไม่บังคับ แต่ถ้ากรอกต้องถูกรูปแบบ)** ทดสอบ 3 สถานะ (loading / error / สำเร็จ) ให้เห็นกับตา

## ✅ ผ่านด่าน

- [ ] สร้างโปรเจกต์ React + TS ด้วย Vite ได้
- [ ] เขียน component ที่รับ props แบบมี type ได้
- [ ] ใช้ `useState` และรู้ว่าทำไมห้ามแก้ state ตรงๆ
- [ ] ดึงข้อมูลด้วย `useEffect` + `fetch` พร้อม loading / error
- [ ] ทำฟอร์มที่ validate, disable ปุ่มตอนส่ง และล้างฟอร์มหลังสำเร็จได้

---

[← บทที่ 10: Security](./10-security.md) · [🏠 สารบัญ](./README.md) · [บทที่ 12: Tailwind CSS →](./12-tailwind.md)
