# บทที่ 13: React Router + SEO 🧭

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 11 และ 12 · 🛠 ใช้: React, React Router

> **⚡ สรุป 30 วินาที**
> - **React Router** ทำให้ SPA มีหลาย URL (`/`, `/about`, `/contact`) โดยไม่ต้องโหลดหน้าใหม่
> - **Layout route** = Navbar/Footer เขียนครั้งเดียว ใช้ทุกหน้า
> - **SEO** ขั้นต่ำ: `<title>`, meta description, OG tags ต่อหน้า, `h1` หน้าละตัว, `alt` ทุกรูป, `robots.txt`, `sitemap.xml`
> - SPA มีข้อจำกัดเรื่อง SEO ต้อง **อธิบายได้ว่าทำไม และแก้ยังไง**

---

## 📖 เรื่องเล่า

บิตทำหน้าเว็บเสร็จ 3 หน้า แต่ทุกหน้าอยู่ที่ URL เดียว `localhost:5173` 😵
ลูกค้าส่งลิงก์หน้า "ติดต่อ" ให้เพื่อนไม่ได้ กด Back ของ browser แล้วหลุดออกจากเว็บ และแชร์ลง LINE แล้วขึ้นแค่คำว่า "Vite + React + TS"

พี่ไบต์: *"เว็บที่ดีต้องมี URL ให้ทุกหน้า และบอก Google กับ LINE ได้ว่าหน้านี้คืออะไร"*

---

## 1. Routing ใน SPA ทำงานยังไง

```
 ผู้ใช้กด "ติดต่อ"
      |
      v
 React Router เปลี่ยน URL เป็น /contact  (ไม่ขอหน้าใหม่จาก server)
      |
      v
 หา Route ที่ตรงกับ /contact  -->  วาด <ContactPage />
```

> ⚠️ **ผลข้างเคียงสำคัญ:** ถ้าผู้ใช้เปิด `https://เว็บ/contact` ตรงๆ หรือกด refresh, server ต้องตอบ `index.html` กลับไปเสมอ (ไม่ใช่ 404) แล้วให้ React Router จัดการต่อ
> ตอน dev Vite ทำให้อัตโนมัติ ตอน deploy ต้องตั้งเอง ([บทที่ 20](./20-deploy-vps.md) และ [บทที่ 22](./22-deploy-managed.md))

---

## 2. 🔧 ติดตั้งและตั้ง Route

```bash
cd bit-cafe/client
bun add react-router
```

`src/main.tsx`
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

`src/App.tsx`
```tsx
import { Routes, Route } from "react-router";
import PublicLayout from "./components/PublicLayout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>          {/* ทุกหน้าข้างในมี Navbar/Footer */}
        <Route index element={<HomePage />} />     {/* "/" */}
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />   {/* URL ที่ไม่มี → 404 */}
      </Route>
    </Routes>
  );
}
```

---

## 3. Layout + NavLink + Outlet

`src/components/PublicLayout.tsx`
```tsx
import { Outlet } from "react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LineButton from "./LineButton";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />        {/* 👈 หน้าลูก (Home/About/Contact) มาวาดตรงนี้ */}
      </main>
      <Footer />
      <LineButton />
    </div>
  );
}
```

แก้ Navbar จากบทที่ 12: เปลี่ยน `<a href>` เป็น **`NavLink`** จะได้ 2 อย่าง: ไม่โหลดหน้าใหม่ + รู้ว่าหน้าไหน active
```tsx
import { NavLink } from "react-router";

<NavLink
  to={l.href}
  end={l.href === "/"}                 // "/" ต้องตรงเป๊ะ ไม่งั้น active ทุกหน้า
  className={({ isActive }) =>
    isActive ? "font-semibold text-brand underline underline-offset-8" : "hover:text-brand"
  }
  onClick={() => setOpen(false)}       // มือถือ: กดแล้วปิดเมนู
>
  {l.label}
</NavLink>
```
> ⚠️ ลิงก์ภายในเว็บใช้ `<Link>` / `<NavLink>` เสมอ ถ้าใช้ `<a href>` browser จะโหลดใหม่ทั้งหน้า state หายหมด
> ลิงก์ออกนอกเว็บ (LINE, Facebook) ใช้ `<a href target="_blank" rel="noopener noreferrer">` ได้ตามปกติ

`src/pages/NotFoundPage.tsx`
```tsx
import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <section className="py-24 text-center">
      <title>ไม่พบหน้านี้ | Bit Café</title>
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2">ไม่พบหน้าที่คุณหา 🧐</p>
      <Link to="/" className="mt-6 inline-block text-brand underline">กลับหน้าแรก</Link>
    </section>
  );
}
```

---

## 4. 🔧 Filter ด้วย URL (useSearchParams)

หน้า About/Services ต้อง **กรองตามหมวดหมู่** เก็บหมวดที่เลือกไว้ใน URL (`/about?category=drinks`) ดีกว่าเก็บใน state เพราะ **ส่งลิงก์ต่อได้ และกด Back แล้วกลับไปหมวดเดิม**

```tsx
import { useSearchParams } from "react-router";
import { useFetch } from "../api/useFetch";
import ServiceCard from "./ServiceCard";
import type { Category, Service } from "../types/service";

export default function ServiceList() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "";

  const categories = useFetch<Category[]>("/api/categories");
  const services = useFetch<Service[]>(`/api/services${category ? `?category=${encodeURIComponent(category)}` : ""}`);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setParams({})} className={!category ? "bg-brand text-white" : ""}>ทั้งหมด</button>
        {categories.data?.map((c) => (
          <button key={c.id} onClick={() => setParams({ category: c.slug })}
            className={category === c.slug ? "bg-brand text-white" : ""}>
            {c.name}
          </button>
        ))}
      </div>
      {services.loading && <p>กำลังโหลด... ⏳</p>}
      {services.error && <p>โหลดข้อมูลไม่สำเร็จ: {services.error} 😢</p>}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.data?.map((s) => <ServiceCard key={s.id} service={s} />)}
      </div>
    </>
  );
}
```
👀 url เปลี่ยน → `useFetch` รันใหม่เอง เพราะเราใส่ `[url]` ไว้ใน dependency (บทที่ 11 ข้อ 6)
💡 endpoint `/api/...` จะมีจริงใน [บทที่ 14](./14-hono-api.md) ระหว่างนี้ชี้ไปที่ไฟล์ mock ใน `public/` แบบบทที่ 11 ไปก่อนได้

---

## 5. หน้าหลังบ้าน: Route ซ้อน + Route ที่ต้อง login

เพิ่มใน `App.tsx`:
```tsx
<Route path="admin/login" element={<LoginPage />} />
<Route path="admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
  <Route index element={<DashboardPage />} />            {/* /admin */}
  <Route path="settings" element={<SettingsPage />} />   {/* /admin/settings */}
  <Route path="services" element={<ServicesPage />} />   {/* /admin/services */}
</Route>
```
`RequireAuth` จะเช็คกับ server ว่า login อยู่ไหม ถ้าไม่ → พาไป `/admin/login` (เขียนจริงใน [บทที่ 15](./15-auth.md))

> ⚠️ การซ่อนหน้า admin ฝั่ง React **ไม่ใช่ความปลอดภัย** ใครก็เปิด DevTools ข้ามได้ ตัวกันจริงคือ **API ต้องตอบ 401** ถ้าไม่ได้ login

---

## 6. SEO: บอก Google และ LINE ว่าหน้านี้คืออะไร

**SEO (Search Engine Optimization)** = ทำให้ search engine เข้าใจและแสดงเว็บเราได้ดี
**OG tags (Open Graph)** = ข้อมูลที่ LINE / Facebook ใช้สร้างการ์ดตอนแชร์ลิงก์

```
 แชร์ลิงก์ลง LINE  -->  bot ของ LINE เปิดหน้าเว็บ  -->  อ่าน <meta property="og:...">  -->  การ์ด: รูป + หัวข้อ + คำอธิบาย
```

### 🔧 ตั้ง title / meta ต่อหน้า
React 19 ให้เขียน `<title>` และ `<meta>` ที่ไหนก็ได้ใน component แล้วจะย้ายไปไว้ใน `<head>` ให้เอง

`src/components/Seo.tsx`
```tsx
interface Props {
  title: string;
  description: string;
  image?: string;
}

export default function Seo({ title, description, image }: Props) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}
    </>
  );
}
```
ใช้ในหน้า โดยดึงค่าจาก API (`pages.seo_title` ฯลฯ ที่ admin แก้ได้):
```tsx
const page = useFetch<PageData>("/api/pages/home");
// ...
{page.data && <Seo title={page.data.seoTitle} description={page.data.seoDescription} image={page.data.ogImageUrl} />}
```

### กฎเนื้อหาที่ Google ชอบ
- `h1` **หน้าละ 1 ตัว** = หัวข้อหลักของหน้า ที่เหลือใช้ `h2`, `h3` ตามลำดับ
- รูปทุกรูปมี `alt` อธิบายรูป (ช่วยคนตาบอดที่ใช้โปรแกรมอ่านจอด้วย)
- ข้อความลิงก์บอกปลายทาง: "ดูเมนูทั้งหมด" ✅ ไม่ใช่ "คลิกที่นี่" ❌

### 🔧 robots.txt และ sitemap.xml
ใส่ใน `client/public/` (มีแค่ 3 หน้า เขียนมือได้)

`public/robots.txt`
```
User-agent: *
Disallow: /admin
Sitemap: https://example.com/sitemap.xml
```

`public/sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about</loc></url>
  <url><loc>https://example.com/contact</loc></url>
</urlset>
```
(เปลี่ยน `example.com` เป็นโดเมนจริงตอน deploy ใน [บทที่ 18](./18-domain-dns.md))

> ⚠️ `Disallow: /admin` แค่ **ขอร้อง** bot ที่สุภาพไม่ให้เข้า ไม่ได้กันใคร ความปลอดภัยจริงอยู่ที่ API

---

## 7. 🤓 ข้อจำกัดของ SPA เรื่อง SEO (ต้องอธิบายใน README ได้)

```
 Server ส่งให้ bot:   <div id="root"></div>  + ไฟล์ JS
                              |
          Google bot: รัน JS ได้ (แต่ช้ากว่า อาจเข้าคิว)     → เห็นเนื้อหา ✅
          LINE / Facebook bot: ส่วนใหญ่ไม่รัน JS              → เห็นแค่ meta ใน index.html ❌
```

**ผลคือ:** แชร์ลง LINE แล้วการ์ดอาจไม่ขึ้นรูป/หัวข้อตามที่ admin ตั้ง เพราะ bot ไม่เคยเห็น `<Seo>` ที่ React สร้าง

**ทางแก้ (จากง่ายไปยาก)**
| วิธี | ทำยังไง | เหมาะกับ |
|---|---|---|
| ใส่ meta ค่าเริ่มต้นใน `index.html` | เขียน `og:title`, `og:image` ของร้านไว้ตรงๆ | อย่างน้อยแชร์แล้วมีการ์ด (ทำได้เลยใน STARTER) |
| **Prerender** | ตอน build ให้เครื่องมือเปิดแต่ละหน้าแล้วบันทึก HTML ที่มีเนื้อหาไว้ | เว็บไม่กี่หน้า เนื้อหาไม่เปลี่ยนบ่อย (Bonus ของ STARTER) |
| **SSR** (Server-Side Rendering) | server สร้าง HTML ให้ทุก request (เช่น React Router framework mode, Next.js) | เว็บที่ SEO สำคัญมาก เนื้อหาเปลี่ยนบ่อย |

> 💡 ระดับ STARTER ยอมรับข้อจำกัดนี้ได้ แต่ต้อง **เขียนอธิบายใน README** ว่าทำไม และถ้าจะแก้ต้องทำยังไง

**ทดสอบการ์ดตอนแชร์ (หลัง deploy):** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) และส่งลิงก์ให้ตัวเองใน LINE

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ทำไมลิงก์ภายในเว็บต้องใช้ <code>NavLink</code>/<code>Link</code> ไม่ใช่ <code>&lt;a href&gt;</code>?</summary>

`<a>` ทำให้ browser โหลดหน้าใหม่ทั้งหมด React เริ่มต้นใหม่ state หาย และช้ากว่า ส่วน `Link` เปลี่ยน URL ในหน้าเดิม
</details>

<details><summary>2. เปิด <code>/contact</code> ตรงๆ บน server จริงแล้วได้ 404 เพราะอะไร?</summary>

server หาไฟล์ชื่อ `contact` ไม่เจอ ต้องตั้งให้ server ตอบ `index.html` สำหรับทุก path ที่ไม่ใช่ไฟล์จริง แล้ว React Router จะวาดหน้าที่ถูกต้องเอง
</details>

<details><summary>3. ทำไมเก็บหมวดหมู่ที่เลือกใน URL ดีกว่าใน useState?</summary>

refresh แล้วไม่หาย, ส่งลิงก์ให้คนอื่นแล้วเห็นหมวดเดียวกัน, ปุ่ม Back ของ browser ทำงานถูก
</details>

<details><summary>4. แชร์ลิงก์ลง LINE แล้วไม่ขึ้นรูปตามที่ admin ตั้ง ทั้งที่ <code>&lt;Seo&gt;</code> ทำงานใน browser ปกติ เพราะอะไร?</summary>

bot ของ LINE ไม่รัน JavaScript จึงเห็นแค่ `index.html` เปล่าๆ แก้ได้ด้วย meta เริ่มต้นใน `index.html`, prerender หรือ SSR
</details>

---

## ✏️ แบบฝึกหัด

ทำ Bit Café ให้มี 3 หน้า + 404 ผ่าน React Router, Navbar ไฮไลต์หน้าที่อยู่, หน้าบริการกรองหมวดด้วย `?category=`, ทุกหน้ามี `<Seo>` ต่างกัน และมี `robots.txt` / `sitemap.xml` ตรวจด้วย DevTools → Elements ว่า `<title>` เปลี่ยนเมื่อเปลี่ยนหน้า

## ✅ ผ่านด่าน

- [ ] ตั้ง Route, Layout + `Outlet` และหน้า 404 ได้
- [ ] ใช้ `NavLink` ไฮไลต์หน้าที่อยู่ได้
- [ ] เก็บ filter ใน URL ด้วย `useSearchParams` ได้
- [ ] ตั้ง title / description / OG ต่อหน้าได้
- [ ] อธิบายข้อจำกัด SEO ของ SPA และวิธีแก้ได้

---

[← บทที่ 12: Tailwind](./12-tailwind.md) · [🏠 สารบัญ](./README.md) · [บทที่ 14: Bun + Hono API →](./14-hono-api.md)
