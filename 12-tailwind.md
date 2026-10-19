# บทที่ 12: Tailwind CSS + Responsive 🎨

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 11 · 🛠 ใช้: React, Vite, Browser DevTools

> **⚡ สรุป 30 วินาที**
> - Tailwind = แต่งหน้าเว็บด้วย **class สั้นๆ** ใน JSX (`p-4`, `text-xl`, `bg-brand`) แทนการเขียนไฟล์ CSS ยาวๆ
> - ตั้ง **สี/ฟอนต์ของแบรนด์** ไว้ที่เดียวใน `@theme` ทั้งเว็บใช้ตรงกัน
> - **Mobile-first:** เขียนสำหรับมือถือก่อน แล้วเติม `md:` `lg:` สำหรับจอใหญ่
> - ทดสอบที่ **375 / 768 / 1280 px** ต้องไม่มี scroll แนวนอน

---

## 📖 เรื่องเล่า

บิตเขียน CSS ไป 600 บรรทัด ตั้งชื่อ class เอง `.card`, `.card2`, `.card-new`, `.card-new-final` 🫠
วันหนึ่งลูกค้าขอเปลี่ยนสีหลักจากน้ำตาลเป็นเขียว บิตต้อง search `#6b3e26` แก้ 47 จุด และพลาดไป 3 จุด

พี่ไบต์: *"ถ้าสีแบรนด์อยู่ที่เดียว แก้บรรทัดเดียวทั้งเว็บเปลี่ยน ดีกว่าไหม?"*

---

## 1. Tailwind คืออะไร

**CSS แบบเดิม:** ตั้งชื่อ class → ไปเขียน style ในอีกไฟล์ → สลับไฟล์ไปมา
**Tailwind:** ใช้ class สำเร็จรูปที่ทำหน้าที่เดียว (utility class) ต่อกันใน JSX เลย

```tsx
// CSS แบบเดิม
<button className="btn-primary">จองเลย</button>
/* style.css */ .btn-primary { background: #6b3e26; color: white; padding: 8px 16px; border-radius: 8px; }

// Tailwind
<button className="bg-brand text-white px-4 py-2 rounded-lg">จองเลย</button>
```

> 💡 **เปรียบเทียบ:** CSS เดิม = สั่งตัดชุดใหม่ทุกครั้ง / Tailwind = **เลโก้** 🧱 มีชิ้นมาตรฐานให้ต่อ ชิ้นเท่ากันทุกครั้ง

**class ที่ใช้บ่อย**
| หมวด | ตัวอย่าง | ความหมาย |
|---|---|---|
| ระยะ | `p-4` `px-6` `mt-8` `gap-4` | padding / margin / ช่องว่าง (1 หน่วย = 4px) |
| ขนาด | `w-full` `max-w-6xl` `h-64` | กว้าง / สูง |
| ตัวอักษร | `text-sm` `text-3xl` `font-bold` | ขนาด / น้ำหนัก |
| สี | `text-white` `bg-brand` `border-gray-200` | สีตัวอักษร / พื้น / ขอบ |
| จัดวาง | `flex` `items-center` `justify-between` `grid grid-cols-3` | flexbox / grid |
| ตกแต่ง | `rounded-xl` `shadow-md` `hover:opacity-80` | มุมโค้ง / เงา / ตอนชี้ |

---

## 2. 🔧 ติดตั้ง (Tailwind v4)

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

> 💡 ติดตั้ง extension **Tailwind CSS IntelliSense** ใน VS Code พิมพ์ class แล้วมีให้เลือก + เห็นสีตัวอย่าง

---

## 3. 🔧 สีและฟอนต์ของแบรนด์ (Theme)

STARTER บังคับว่า **ใช้สี/ฟอนต์/โลโก้ตาม brief ทั้งเว็บ ตั้งค่าใน Tailwind theme**

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
ตอนนี้ใช้ `bg-brand`, `text-accent`, `bg-brand-light/50` (โปร่ง 50%) ได้ทุกที่
ลูกค้าขอเปลี่ยนสี? แก้ **บรรทัดเดียว** ✅

---

## 4. Responsive: Mobile-first

Tailwind มี **breakpoint** = ความกว้างจอที่ class เริ่มทำงาน

| prefix | เริ่มที่ | อุปกรณ์ |
|---|---|---|
| (ไม่มี) | 0px | มือถือ (ทุกจอ) |
| `sm:` | 640px | มือถือแนวนอน |
| `md:` | 768px | แท็บเล็ต |
| `lg:` | 1024px | โน้ตบุ๊ค |
| `xl:` | 1280px | desktop |

**อ่านว่า "ตั้งแต่ ... ขึ้นไป"** ไม่ใช่ "เฉพาะ"

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
```
= มือถือ 1 คอลัมน์ → ตั้งแต่ 768px 2 คอลัมน์ → ตั้งแต่ 1280px 3 คอลัมน์

> ⚠️ **กับดัก:** เขียน `md:` แล้วคิดว่าคือ "มือถือ" ❌ class ที่ **ไม่มี prefix** คือมือถือ ส่วน `md:` คือจอใหญ่กว่า

---

## 5. 🔧 ลงมือ: ชิ้นส่วนที่ STARTER ต้องมี

### Navbar + Hamburger menu
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
(บทที่ 13 จะเปลี่ยน `<a>` เป็น `NavLink` เพื่อไฮไลต์หน้าที่อยู่)

### Hero
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

### การ์ดบริการ (grid)
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
```tsx
<a
  href={settings.lineUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#06C755] text-white shadow-lg hover:scale-105"
  aria-label="แชท LINE"
>
  LINE
</a>
```
👀 `bg-[#06C755]` = ใส่ค่าเองในวงเล็บเหลี่ยม ใช้ได้กับค่าที่ไม่อยู่ใน theme (สีทางการของ LINE)

### ตาราง admin บนมือถือ
```tsx
<div className="overflow-x-auto rounded-lg border">   {/* ตารางเลื่อนในกรอบ ไม่ดันทั้งหน้า */}
  <table className="min-w-[640px] w-full text-left text-sm">...</table>
</div>
```

### Loading skeleton
```tsx
<div className="animate-pulse space-y-3">
  <div className="h-40 rounded-xl bg-gray-200" />
  <div className="h-4 w-3/4 rounded bg-gray-200" />
</div>
```

---

## 6. 🔧 ทดสอบ Responsive

1. เปิด DevTools (`F12` / `⌘ + ⌥ + I`)
2. กดไอคอนมือถือ/แท็บเล็ต (**Toggle device toolbar**, `⌘ + ⇧ + M`)
3. เลือก **Responsive** แล้วพิมพ์ความกว้าง **375**, **768**, **1280** ทีละค่า

**ต้องผ่านทุกข้อ**
- [ ] ไม่มี scroll แนวนอน (ลากล่างจอซ้ายขวาไม่ได้)
- [ ] ตัวหนังสือไม่ล้นกล่อง รูปไม่ยืดเบี้ยว
- [ ] มือถือเห็นปุ่ม ☰ และกดเปิดเมนูได้
- [ ] ปุ่มกดง่ายด้วยนิ้ว (สูงอย่างน้อย ~44px)

> 💡 หา element ที่ทำให้ล้น: วางใน Console
> ```js
> [...document.querySelectorAll("*")].filter((el) => el.scrollWidth > document.documentElement.clientWidth)
> ```

---

## 7. ⚠️ ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| ใส่ class แล้วไม่มีผล | ต่อ string แบบ `bg-${color}-500` | Tailwind หา class จาก **ข้อความเต็ม** ในโค้ด ต้องเขียนเต็ม `bg-red-500` |
| scroll แนวนอนบนมือถือ | ใส่ความกว้างตายตัว `w-[500px]` | ใช้ `w-full max-w-...` |
| ทั้งเว็บไม่มี style | ลืม `@import "tailwindcss"` หรือ plugin ใน `vite.config.ts` | ตรวจข้อ 2 |
| สี `bg-brand` ไม่ทำงาน | ชื่อใน `@theme` ไม่ขึ้นต้น `--color-` | ต้องเป็น `--color-ชื่อ` |
| className ยาวอ่านยาก | ใส่ทุกอย่างในที่เดียว | แยกเป็น component ย่อย (`<Button>`) |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. <code>hidden md:flex</code> แปลว่าอะไร?</summary>

มือถือ (ต่ำกว่า 768px) ซ่อน / ตั้งแต่ 768px ขึ้นไปแสดงเป็น flex
</details>

<details><summary>2. ทำไมตั้งสีแบรนด์ใน <code>@theme</code> ดีกว่าใส่ <code>bg-[#6b3e26]</code> ทุกที่?</summary>

ค่าอยู่ที่เดียว ลูกค้าขอเปลี่ยนสีแก้บรรทัดเดียว และชื่อ `bg-brand` อ่านแล้วรู้ว่าคือสีอะไรในแบรนด์
</details>

<details><summary>3. ทำไมตาราง admin ต้องห่อด้วย <code>overflow-x-auto</code>?</summary>

ตารางหลายคอลัมน์กว้างกว่าจอมือถือ ถ้าไม่ห่อ ทั้งหน้าจะเลื่อนแนวนอน ห่อแล้วเลื่อนเฉพาะในกรอบตาราง
</details>

---

## ✏️ แบบฝึกหัด

แต่งหน้า Bit Café จากบทที่ 11 ให้มี Navbar (hamburger), Hero, grid การ์ดบริการ, ปุ่ม LINE ลอย และ Footer (ที่อยู่, เบอร์โทร, เวลาทำการ) ตั้งสีแบรนด์ 3 สีใน `@theme` แล้วแคปจอที่ 375 / 768 / 1280 px

## ✅ ผ่านด่าน

- [ ] ติดตั้ง Tailwind v4 กับ Vite ได้
- [ ] ตั้งสี/ฟอนต์แบรนด์ใน `@theme` และใช้ทั้งเว็บ
- [ ] เข้าใจ mobile-first และ breakpoint `md:` `xl:`
- [ ] ทำ hamburger menu, grid การ์ด, ปุ่มลอย, ตาราง scroll ในกรอบได้
- [ ] ทดสอบ 375 / 768 / 1280 แล้วไม่มี scroll แนวนอน

---

[← บทที่ 11: React](./11-react.md) · [🏠 สารบัญ](./README.md) · [บทที่ 13: Router + SEO →](./13-router-seo.md)
