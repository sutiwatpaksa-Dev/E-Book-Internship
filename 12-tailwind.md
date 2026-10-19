# บทที่ 12: ตกแต่งเว็บให้สวยทุกขนาดจอ (Tailwind) 🎨

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 11 · 🛠 ใช้: React, Vite, DevTools ของเบราว์เซอร์

> **⚡ สรุป 30 วินาที**
> - Tailwind = ตกแต่งหน้าเว็บด้วย **คำสั้นๆ** ใส่ไว้ใน `className` เลย (`p-4` เว้นขอบ, `text-xl` ตัวใหญ่, `bg-brand` สีพื้นของร้าน) ไม่ต้องเขียนไฟล์ CSS ยาวๆ
> - ตั้ง **สีและฟอนต์ของร้าน** ไว้ที่เดียว ทั้งเว็บใช้ตรงกัน
> - **ทำสำหรับมือถือก่อน** แล้วค่อยเติมคำนำหน้าอย่าง `md:` `xl:` สำหรับจอใหญ่
> - ลองที่ความกว้าง **375 / 768 / 1280 px** ต้องไม่มีอะไรล้นจนเลื่อนซ้ายขวาได้

> **📖 คำใหม่ในบทนี้**
> [Tailwind](./glossary.md#tailwind) · [Responsive](./glossary.md#responsive) · [Breakpoint](./glossary.md#breakpoint) · [Component](./glossary.md#component)

---

## 📖 เรื่องเล่า

บิตเขียน CSS ไป 600 บรรทัด ตั้งชื่อเอง `.card`, `.card2`, `.card-new`, `.card-new-final` 🫠
วันหนึ่งลูกค้าขอเปลี่ยนสีหลักจากน้ำตาลเป็นเขียว บิตต้องค้นรหัสสี `#6b3e26` ไล่แก้ 47 จุด และพลาดไป 3 จุด

พี่ไบต์: *"ถ้าสีร้านอยู่ที่เดียว แก้บรรทัดเดียวทั้งเว็บเปลี่ยน ดีกว่าไหม?"*

---

## 1. Tailwind คืออะไร

**CSS แบบเดิม:** ตั้งชื่อเอง → ไปเขียนการตกแต่งในอีกไฟล์ → สลับไฟล์ไปมา
**Tailwind:** ใช้คำสำเร็จรูปที่แต่ละคำทำอย่างเดียว ต่อกันใน `className` ได้เลย

```tsx
// CSS แบบเดิม
<button className="btn-primary">จองเลย</button>
/* style.css */ .btn-primary { background: #6b3e26; color: white; padding: 8px 16px; border-radius: 8px; }

// Tailwind
<button className="bg-brand text-white px-4 py-2 rounded-lg">จองเลย</button>
```

> 💡 **นึกภาพ:** CSS แบบเดิม = สั่งตัดชุดใหม่ทุกครั้ง / Tailwind = **ตัวต่อเลโก้** 🧱 มีชิ้นมาตรฐานให้ต่อ ขนาดเท่ากันทุกครั้ง

**คำที่ใช้บ่อย**
| เรื่อง | ตัวอย่าง | แปลว่า |
|---|---|---|
| ระยะห่าง | `p-4` `px-6` `mt-8` `gap-4` | เว้นขอบด้านใน / เว้นด้านนอก / ช่องว่างระหว่างชิ้น (1 หน่วย = 4px) |
| ขนาด | `w-full` `max-w-6xl` `h-64` | กว้างเต็ม / กว้างไม่เกิน / สูง |
| ตัวอักษร | `text-sm` `text-3xl` `font-bold` | ตัวเล็ก / ตัวใหญ่ / ตัวหนา |
| สี | `text-white` `bg-brand` `border-gray-200` | สีตัวอักษร / สีพื้น / สีขอบ |
| จัดวาง | `flex` `items-center` `justify-between` `grid grid-cols-3` | เรียงแนวนอน / จัดกลาง / ดันไปสองข้าง / แบ่ง 3 คอลัมน์ |
| ตกแต่ง | `rounded-xl` `shadow-md` `hover:opacity-80` | มุมโค้ง / เงา / จางลงตอนเอาเมาส์ชี้ |

---

## 2. 🔧 ติดตั้ง

```bash
cd bit-cafe/client
bun add tailwindcss @tailwindcss/vite
```

`vite.config.ts`
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

ลบของเดิมใน `src/index.css` แล้วใส่บรรทัดเดียว:
```css
@import "tailwindcss";
```
ลองใส่ `className="text-3xl font-bold text-red-500"` ที่ `<h1>` ถ้าตัวใหญ่สีแดง = ติดตั้งสำเร็จ 🎉

> 💡 ติดตั้งส่วนเสริม **Tailwind CSS IntelliSense** ใน VS Code พิมพ์แล้วมีคำให้เลือก และเห็นสีตัวอย่าง

---

## 3. 🔧 สีและฟอนต์ของร้าน

งาน STARTER บังคับว่า **ใช้สี ฟอนต์ โลโก้ ตามสรุปร้านทั้งเว็บ และตั้งไว้ที่เดียว**

`src/index.css`
```css
@import url("https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&display=swap");
@import "tailwindcss";

@theme {
  --color-brand: #6b3e26;        /* สีหลัก → ใช้ bg-brand, text-brand, border-brand */
  --color-brand-light: #f5ebe0;  /* สีรอง → bg-brand-light */
  --color-accent: #e9a03b;       /* สีเน้น → bg-accent */
  --font-sans: "Prompt", system-ui, sans-serif;   /* ฟอนต์หลักทั้งเว็บ */
}
```
ตอนนี้ใช้ `bg-brand`, `text-accent`, `bg-brand-light/50` (จางลงครึ่งหนึ่ง) ได้ทุกที่
ลูกค้าขอเปลี่ยนสี? แก้ **บรรทัดเดียว** ✅

---

## 4. ทำให้พอดีทุกจอ: เริ่มจากมือถือ

Tailwind มี **จุดเปลี่ยน (breakpoint)** = ความกว้างจอที่คำนั้นเริ่มทำงาน

| คำนำหน้า | เริ่มที่ | อุปกรณ์ |
|---|---|---|
| (ไม่มี) | 0px | มือถือ (ทุกจอ) |
| `sm:` | 640px | มือถือแนวนอน |
| `md:` | 768px | แท็บเล็ต |
| `lg:` | 1024px | โน้ตบุ๊ค |
| `xl:` | 1280px | คอมจอใหญ่ |

**อ่านว่า "ตั้งแต่ ... ขึ้นไป"** ไม่ใช่ "เฉพาะ"

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
```
= มือถือ 1 คอลัมน์ → ตั้งแต่ 768px เป็น 2 คอลัมน์ → ตั้งแต่ 1280px เป็น 3 คอลัมน์

> ⚠️ **กับดัก:** คิดว่า `md:` คือมือถือ ❌ คำที่ **ไม่มีคำนำหน้า** คือมือถือ ส่วน `md:` คือจอใหญ่กว่า

---

## 5. 🔧 ลงมือ: ชิ้นส่วนที่งาน STARTER ต้องมี

### เมนูบน + ปุ่ม ☰ บนมือถือ
`src/components/Navbar.tsx`
```tsx
import { useState } from "react";

const links = [
  { href: "/", label: "หน้าแรก" },
  { href: "/about", label: "เกี่ยวกับเรา" },
  { href: "/contact", label: "ติดต่อ" },
];

export default function Navbar({ shopName, logoUrl }: { shopName: string; logoUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2 font-bold text-brand">
          <img src={logoUrl} alt={shopName} className="h-10 w-10 rounded-full" />
          {shopName}
        </a>

        {/* จอใหญ่: เมนูเรียงแนวนอน / มือถือ: ซ่อน */}
        <ul className="hidden gap-6 md:flex">
          {links.map((l) => (
            <li key={l.href}><a href={l.href} className="hover:text-brand">{l.label}</a></li>
          ))}
        </ul>

        {/* มือถือ: ปุ่ม hamburger / จอใหญ่: ซ่อน */}
        <button className="md:hidden text-2xl" onClick={() => setOpen(!open)} aria-label="เปิดเมนู">
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <ul className="border-t px-4 pb-4 md:hidden">
          {links.map((l) => (
            <li key={l.href}><a href={l.href} className="block py-2">{l.label}</a></li>
          ))}
        </ul>
      )}
    </header>
  );
}
```
(บทที่ 13 จะเปลี่ยน `<a>` เป็น `NavLink` เพื่อให้เมนูของหน้าที่อยู่เด่นขึ้น)

### ภาพใหญ่ด้านบนหน้าแรก
```tsx
<section
  className="relative flex min-h-[60vh] items-center justify-center bg-cover bg-center px-4 text-center text-white"
  style={{ backgroundImage: `url(${hero.imageUrl})` }}       // รูปมาจาก API ใช้ style แทน class
>
  <div className="absolute inset-0 bg-black/50" />            {/* ชั้นมืดให้อ่านตัวหนังสือออก */}
  <div className="relative max-w-2xl">
    <h1 className="text-3xl font-bold md:text-5xl">{hero.title}</h1>
    <p className="mt-4 text-lg md:text-xl">{hero.subtitle}</p>
    <a href="/contact" className="mt-8 inline-block rounded-full bg-accent px-8 py-3 font-semibold text-brand hover:opacity-90">
      {hero.ctaText}
    </a>
  </div>
</section>
```

### การ์ดสินค้าแบบตาราง (grid)
```tsx
<div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 md:grid-cols-2 xl:grid-cols-3">
  {services.map((s) => (
    <article key={s.id} className="overflow-hidden rounded-2xl bg-white shadow-md">
      <img src={s.imageUrl} alt={s.name} className="aspect-[4/3] w-full object-cover" />
      <div className="p-5">
        <h3 className="text-xl font-semibold">{s.name}</h3>
        <p className="mt-2 text-gray-600">{s.description}</p>
        {s.price !== null && <p className="mt-4 font-bold text-brand">{s.price.toLocaleString()} บาท</p>}
      </div>
    </article>
  ))}
</div>
```

### ปุ่ม LINE ลอยมุมขวาล่าง
`src/components/LineButton.tsx`
```tsx
export default function LineButton({ lineUrl }: { lineUrl: string }) {
  return (
    <a
      href={lineUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#06C755] text-white shadow-lg hover:scale-105"
      aria-label="แชท LINE"
    >
      LINE
    </a>
  );
}
```
👀 `bg-[#06C755]` = ใส่ค่าเองในวงเล็บเหลี่ยม ใช้กับค่าที่ไม่ได้ตั้งไว้ (นี่คือสีเขียวของ LINE)

### ส่วนท้ายหน้า (Footer)
`src/components/Footer.tsx`
```tsx
interface Props {
  address: string;
  phone: string;
  openingHours: string;
}

export default function Footer({ address, phone, openingHours }: Props) {
  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3">
        <p>📍 {address}</p>
        <p>
          📞 <a href={`tel:${phone}`} className="underline">{phone}</a>
        </p>
        <p>🕘 {openingHours}</p>
      </div>
    </footer>
  );
}
```

### ตารางในหน้าจัดการร้านบนมือถือ
```tsx
<div className="overflow-x-auto rounded-lg border">   {/* ตารางเลื่อนในกรอบ ไม่ดันทั้งหน้า */}
  <table className="min-w-[640px] w-full text-left text-sm">...</table>
</div>
```

### กล่องเทาๆ ระหว่างกำลังโหลด
```tsx
<div className="animate-pulse space-y-3">
  <div className="h-40 rounded-xl bg-gray-200" />
  <div className="h-4 w-3/4 rounded bg-gray-200" />
</div>
```

---

## 6. 🔧 ลองทุกขนาดจอ

1. เปิด DevTools (`F12` / `⌘ + ⌥ + I`)
2. กดไอคอนรูปมือถือ (**Toggle device toolbar**, `⌘ + ⇧ + M`)
3. เลือก **Responsive** แล้วพิมพ์ความกว้าง **375**, **768**, **1280** ทีละค่า

**ต้องผ่านทุกข้อ**
- [ ] ไม่มีอะไรล้นจนเลื่อนซ้ายขวาได้
- [ ] ตัวหนังสือไม่ล้นกล่อง รูปไม่ยืดเบี้ยว
- [ ] บนมือถือเห็นปุ่ม ☰ และกดเปิดเมนูได้
- [ ] ปุ่มใหญ่พอกดด้วยนิ้ว (สูงประมาณ 44px ขึ้นไป)

> 💡 หาว่าชิ้นไหนทำให้ล้น: วางคำสั่งนี้ใน Console
> ```js
> [...document.querySelectorAll("*")].filter((el) => el.scrollWidth > document.documentElement.clientWidth)
> ```

---

## 7. ⚠️ ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| ใส่คำแล้วไม่มีผล | ต่อคำเองแบบ `bg-${color}-500` | Tailwind หาคำจาก **ข้อความเต็มๆ** ในโค้ด ต้องเขียนเต็ม เช่น `bg-red-500` |
| มือถือเลื่อนซ้ายขวาได้ | ใส่ความกว้างตายตัว `w-[500px]` | ใช้ `w-full max-w-...` |
| ทั้งเว็บไม่มีการตกแต่ง | ลืม `@import "tailwindcss"` หรือลืมใส่ใน `vite.config.ts` | ตรวจข้อ 2 |
| `bg-brand` ไม่ทำงาน | ชื่อใน `@theme` ไม่ได้ขึ้นต้นด้วย `--color-` | ต้องเป็น `--color-ชื่อ` |
| `className` ยาวจนอ่านยาก | ใส่ทุกอย่างไว้ที่เดียว | แยกเป็นชิ้นส่วนย่อย เช่น `<Button>` |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. <code>hidden md:flex</code> แปลว่าอะไร?</summary>

จอแคบกว่า 768px (มือถือ) ซ่อนไว้ / ตั้งแต่ 768px ขึ้นไปแสดงแบบเรียงแนวนอน
</details>

<details><summary>2. ทำไมตั้งสีร้านไว้ใน <code>@theme</code> ดีกว่าใส่ <code>bg-[#6b3e26]</code> ทุกที่?</summary>

ค่าอยู่ที่เดียว ลูกค้าขอเปลี่ยนสีแก้บรรทัดเดียว และชื่อ `bg-brand` อ่านแล้วรู้เลยว่าเป็นสีร้าน
</details>

<details><summary>3. ทำไมตารางหน้าจัดการร้านต้องห่อด้วย <code>overflow-x-auto</code>?</summary>

ตารางที่มีหลายคอลัมน์กว้างกว่าจอมือถือ ถ้าไม่ห่อ ทั้งหน้าจะเลื่อนซ้ายขวาได้ ห่อแล้วเลื่อนเฉพาะในกรอบตาราง
</details>

---

## ✏️ แบบฝึกหัด

ตกแต่ง Bit Café จากบทที่ 11 ให้มี เมนูบน (มีปุ่ม ☰ บนมือถือ), ภาพใหญ่หน้าแรก, การ์ดสินค้าแบบตาราง, ปุ่ม LINE ลอย และส่วนท้ายหน้า (ที่อยู่, เบอร์โทร, เวลาเปิด) ตั้งสีร้าน 3 สีใน `@theme` แล้วแคปจอที่ 375 / 768 / 1280 px

## ✅ ผ่านด่าน

- [ ] ติดตั้ง Tailwind กับ Vite ได้
- [ ] ตั้งสีและฟอนต์ของร้านใน `@theme` แล้วใช้ทั้งเว็บ
- [ ] เข้าใจการทำมือถือก่อน และคำนำหน้า `md:` `xl:`
- [ ] ทำปุ่ม ☰, การ์ดแบบตาราง, ปุ่มลอย, ตารางที่เลื่อนในกรอบ ได้
- [ ] ลอง 375 / 768 / 1280 แล้วไม่มีอะไรล้น

---

[← บทที่ 11: React](./11-react.md) · [🏠 สารบัญ](/) · [บทที่ 13: หลายหน้า + Google →](./13-router-seo.md)
