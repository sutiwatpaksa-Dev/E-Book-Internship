# บทที่ 13: หลายหน้า + ให้ Google หาเจอ (React Router + SEO) 🧭

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 11 และ 12 · 🛠 ใช้: React, React Router

> **⚡ สรุป 30 วินาที**
> - **React Router** ทำให้เว็บ React มีหลายหน้า แต่ละหน้ามีลิงก์ของตัวเอง (`/`, `/about`, `/contact`) และสลับหน้าได้โดยไม่ต้องโหลดใหม่
> - **โครงหน้าร่วม** = เมนูบนกับส่วนท้ายเขียนครั้งเดียว ใช้ได้ทุกหน้า
> - **ให้ Google หาเจอ (SEO)** อย่างน้อยต้องมี: ชื่อหน้า, คำอธิบายสั้น, การ์ดตอนแชร์, หัวข้อใหญ่หน้าละ 1 อัน, คำอธิบายรูป, `robots.txt`, `sitemap.xml`
> - เว็บแบบที่เราทำมีข้อจำกัดเรื่องนี้ ต้อง **อธิบายได้ว่าทำไม และแก้ยังไง**

> **📖 คำใหม่ในบทนี้**
> [Router / Route](./glossary.md#router) · [SPA](./glossary.md#spa) · [SEO](./glossary.md#seo) · [OG tags](./glossary.md#og) · [Component](./glossary.md#component) · [State](./glossary.md#state)

---

## 📖 เรื่องเล่า

บิตทำหน้าเว็บเสร็จ 3 หน้า แต่ทุกหน้าใช้ลิงก์เดียวกันคือ `localhost:5173` 😵
ลูกค้าส่งลิงก์หน้า "ติดต่อ" ให้เพื่อนไม่ได้, กดย้อนกลับในเบราว์เซอร์แล้วหลุดออกจากเว็บ, แชร์ลง LINE แล้วการ์ดขึ้นแค่คำว่า "client" (ชื่อที่ Vite ใส่ไว้ใน `<title>` ตอนสร้างโปรเจกต์)

พี่ไบต์: *"เว็บที่ดี ทุกหน้าต้องมีลิงก์ของตัวเอง และบอก Google กับ LINE ได้ว่าหน้านี้คืออะไร"*

---

## 1. เว็บ React เปลี่ยนหน้ายังไง

![เปรียบเทียบกดลิงก์ a href ที่โหลดใหม่ทั้งหน้า กับ Link ที่สลับเนื้อหาในหน้าเดิม](/img/13-client-routing.svg)
*ซ้าย: ลิงก์ธรรมดาขอหน้าใหม่จาก server ทุกครั้ง · ขวา: React Router เปลี่ยนลิงก์แล้วสลับหน้าเองโดยไม่ถาม server*

> ⚠️ **ผลที่ต้องรู้:** ถ้าผู้ใช้พิมพ์ `https://เว็บ/contact` เข้ามาตรงๆ หรือกดรีเฟรช server ต้องส่งหน้าหลัก (`index.html`) กลับไปเสมอ (ไม่ใช่ตอบว่าไม่พบ) แล้วให้ React Router เลือกหน้าเอง
> ตอนพัฒนาในเครื่อง Vite ทำให้เอง ตอนขึ้นระบบจริงต้องตั้งเอง ([บทที่ 20](./20-deploy-vps.md) และ [บทที่ 22](./22-deploy-managed.md))

![เปรียบเทียบ server ที่ตอบ 404 กับ server ที่ส่ง index.html กลับให้ React Router เลือกหน้า](/img/13-spa-fallback.svg)
*ถ้าพิมพ์ลิงก์ตรงๆ หรือรีเฟรช server ต้องส่ง index.html กลับเสมอ*

---

## 2. 🔧 ติดตั้งและประกาศหน้า

```bash
cd bit-cafe/client
bun add react-router
```

`src/main.tsx`
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./app";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

`src/app.tsx` ประกาศว่าลิงก์ไหนแสดงหน้าไหน
```tsx
import { Routes, Route } from "react-router";
import PublicLayout from "./components/public-layout";
import HomePage from "./pages/home-page";
import AboutPage from "./pages/about-page";
import ContactPage from "./pages/contact-page";
import NotFoundPage from "./pages/not-found-page";

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

![ตารางจับคู่ลิงก์กับ Route และหน้าที่แสดง รวมหน้า 404](/img/13-route-table.svg)
*Router เทียบลิงก์กับรายการ Route ลิงก์ที่ไม่มีในรายการไปที่ path="*" (หน้า 404)*

---

## 3. โครงหน้าร่วม + เมนูที่รู้ว่าอยู่หน้าไหน

`src/components/public-layout.tsx` โครงที่ทุกหน้าใช้ร่วมกัน (`Outlet` = ช่องที่เนื้อหาของแต่ละหน้าจะมาแสดง)
```tsx
import { Outlet } from "react-router";
import Navbar from "./navbar";
import Footer from "./footer";
import LineButton from "./line-button";

// ข้อมูลร้านชั่วคราว: แบบฝึกหัดบทที่ 14 จะเปลี่ยนเป็นดึงจาก /api/settings
// (รูปโลโก้: วางไฟล์ชื่อ logo.png ไว้ในโฟลเดอร์ public/ ถ้ายังไม่มีจะเห็นแค่ข้อความ alt แทนรูป)
const shop = {
  shopName: "Bit Café",
  logoUrl: "/logo.png",
  address: "123 ถ.สุขุมวิท กรุงเทพฯ",
  phone: "0812345678",
  openingHours: "ทุกวัน 08:00–18:00",
  lineUrl: "https://line.me/",
};

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar shopName={shop.shopName} logoUrl={shop.logoUrl} />
      <main className="flex-1">
        <Outlet />        {/* 👈 หน้าลูก (Home/About/Contact) มาวาดตรงนี้ */}
      </main>
      <Footer address={shop.address} phone={shop.phone} openingHours={shop.openingHours} />
      <LineButton lineUrl={shop.lineUrl} />
    </div>
  );
}
```

![โครง PublicLayout ที่มี Navbar Footer และช่อง Outlet ให้หน้าลูกมาแสดง](/img/13-layout-outlet.svg)
*Outlet คือช่องว่างในโครงหน้าร่วม หน้าที่ตรงกับลิงก์จะถูกวาดลงตรงนี้*

แก้เมนูจากบทที่ 12: เปลี่ยน `<a href>` เป็น **`NavLink`** จะได้ 2 อย่าง: เปลี่ยนหน้าโดยไม่โหลดใหม่ + รู้ว่าตอนนี้อยู่หน้าไหน (เอาไปทำให้เมนูนั้นเด่น)
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
> ⚠️ ลิงก์ไปหน้าอื่นในเว็บเราเอง ใช้ `<Link>` / `<NavLink>` เสมอ ถ้าใช้ `<a href>` เบราว์เซอร์จะโหลดใหม่ทั้งหน้า ข้อมูลที่จำไว้หายหมด
> ลิงก์ออกไปเว็บอื่น (LINE, Facebook) ใช้ `<a href target="_blank" rel="noopener noreferrer">` ได้ตามปกติ

`src/pages/not-found-page.tsx` หน้า 404
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

## 4. 🔧 เลือกดูทีละหมวด โดยจำไว้ในลิงก์

หน้าเกี่ยวกับร้าน/บริการต้อง **เลือกดูทีละหมวดได้** ให้จำหมวดที่เลือกไว้ในลิงก์ (`/about?category=drinks`) ดีกว่าจำไว้ในตัวแปร เพราะ **ส่งลิงก์ให้คนอื่นแล้วเห็นหมวดเดียวกัน และกดย้อนกลับแล้วกลับไปหมวดเดิม**

![ขั้นตอนกดปุ่มหมวด ลิงก์เปลี่ยน useSearchParams อ่านค่า และ useFetch ดึงข้อมูลใหม่](/img/13-search-params.svg)
*เก็บหมวดไว้ในลิงก์ รีเฟรช ส่งต่อ และย้อนกลับได้ ต่างจากเก็บไว้ในตัวแปร*

```tsx
import { useSearchParams } from "react-router";
import { useFetch } from "../api/useFetch";
import ServiceCard from "./service-card";
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
👀 ลิงก์เปลี่ยน → `useFetch` ดึงข้อมูลใหม่เอง เพราะเราบอกไว้ในบทที่ 11 ข้อ 6 ว่าให้ทำใหม่เมื่อ `url` เปลี่ยน
💡 ที่อยู่ `/api/...` จะมีจริงใน [บทที่ 14](./14-hono-api.md) ระหว่างนี้ชี้ไปที่ไฟล์ตัวอย่างใน `public/` แบบบทที่ 11 ไปก่อนได้

---

## 5. หน้าจัดการร้าน: หน้าซ้อนหน้า + หน้าที่ต้อง login

เพิ่มใน `app.tsx`:
```tsx
<Route path="admin/login" element={<LoginPage />} />
<Route path="admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
  <Route index element={<DashboardPage />} />            {/* /admin */}
  <Route path="settings" element={<SettingsPage />} />   {/* /admin/settings */}
  <Route path="services" element={<ServicesPage />} />   {/* /admin/services */}
</Route>
```
`RequireAuth` จะถาม server ว่า login อยู่ไหม ถ้าไม่ → พาไป `/admin/login` (เขียนจริงใน [บทที่ 15](./15-auth.md))

![แผนภาพ Route หน้าจัดการร้านที่ซ้อนใน RequireAuth และ AdminLayout](/img/13-admin-routes.svg)
*หน้าลูกของ admin อยู่ใน AdminLayout ที่ครอบด้วย RequireAuth ส่วน admin/login อยู่นอกด่าน*

> ⚠️ การซ่อนหน้าจัดการร้านไว้ในหน้าเว็บ **ไม่ใช่ความปลอดภัย** ใครก็เปิด DevTools ข้ามได้ ตัวกันจริงคือ **server ต้องตอบ 401** ถ้ายังไม่ได้ login

---

## 6. ให้ Google และ LINE รู้ว่าหน้านี้คืออะไร

**SEO** = ทำให้ Google เข้าใจเนื้อหาและแสดงเว็บเราในผลค้นหา
**OG tags** = ข้อมูลที่ LINE / Facebook ใช้ทำการ์ดตอนแชร์ลิงก์ (รูป หัวข้อ คำอธิบาย)

![แท็ก title meta description และ og tags ในส่วนหัวของหน้า ไปปรากฏในผลค้นหา Google และการ์ดแชร์ใน LINE](/img/13-og-card.svg)
*Google อ่าน title กับ description · LINE/Facebook อ่านแท็ก og:* มาทำการ์ดตอนแชร์ลิงก์ (ตัวอย่างข้อความเป็นข้อมูลสมมติ)*

### 🔧 ตั้งชื่อหน้าและคำอธิบายของแต่ละหน้า
React 19 ให้เขียน `<title>` และ `<meta>` ไว้ในชิ้นส่วนไหนก็ได้ แล้วจะย้ายไปไว้ส่วนหัวของหน้าให้เอง

`src/components/seo.tsx`
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
ใช้ในแต่ละหน้า โดยดึงค่าจาก API (ค่าที่เจ้าของร้านแก้ได้ในหน้าจัดการ):
```tsx
const page = useFetch<PageData>("/api/pages/home");
// ...
{page.data && <Seo title={page.data.seoTitle} description={page.data.seoDescription} image={page.data.ogImageUrl} />}
```

### เขียนเนื้อหาให้ Google อ่านง่าย
- หัวข้อใหญ่สุด (`h1`) **หน้าละ 1 อัน** หัวข้อรองใช้ `h2`, `h3` ตามลำดับ
- รูปทุกรูปมีคำอธิบาย (`alt`) ช่วยทั้ง Google และคนตาบอดที่ใช้โปรแกรมอ่านจอ
- คำบนลิงก์บอกปลายทาง: "ดูเมนูทั้งหมด" ✅ ไม่ใช่ "คลิกที่นี่" ❌

### 🔧 `robots.txt` และ `sitemap.xml`
วางไว้ใน `client/public/` (มีแค่ 3 หน้า เขียนเองได้เลย)

`public/robots.txt` บอกว่าหน้าไหนไม่ต้องเข้ามาดู
```
User-agent: *
Disallow: /admin
Sitemap: https://example.com/sitemap.xml
```

`public/sitemap.xml` รายชื่อหน้าทั้งหมดของเว็บ
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about</loc></url>
  <url><loc>https://example.com/contact</loc></url>
</urlset>
```
(เปลี่ยน `example.com` เป็นชื่อเว็บจริงตอนขึ้นระบบใน [บทที่ 18](./18-domain-dns.md))

> ⚠️ `Disallow: /admin` แค่ **ขอร้อง** ระบบค้นหาที่สุภาพว่าไม่ต้องเข้า ไม่ได้กันใครจริง ความปลอดภัยจริงอยู่ที่ server

---

## 7. 🤓 ข้อจำกัดของเว็บแบบนี้ (ต้องอธิบายใน README ได้)

![Google รันโค้ดแล้วเห็นเนื้อหา LINE และ Facebook ไม่รันโค้ดจึงเห็นแค่ index.html พร้อมทางแก้ 3 ระดับ](/img/13-crawler-spa.svg)
*ระบบที่มาอ่านเว็บ React ได้หน้าเปล่ากับไฟล์โค้ด ทางแก้เรียงจากง่ายไปยาก*

**ผลคือ:** แชร์ลง LINE แล้วการ์ดอาจไม่ขึ้นรูปหรือหัวข้อที่เจ้าของร้านตั้ง เพราะ LINE ไม่เคยเห็นสิ่งที่ `<Seo>` สร้างขึ้น

**ทางแก้ (จากง่ายไปยาก)**
| วิธี | ทำยังไง | เหมาะกับ |
|---|---|---|
| ใส่ข้อมูลการ์ดค่าเริ่มต้นไว้ใน `index.html` | เขียนรูปและหัวข้อของร้านไว้ตรงๆ (และแก้ `<title>client</title>` ที่ Vite ใส่ไว้ กับ `<html lang="en">` เป็นชื่อร้านและ `lang="th"` ด้วย) | อย่างน้อยแชร์แล้วมีการ์ด (ทำได้เลยในงาน STARTER) |
| **สร้างหน้าไว้ล่วงหน้า (prerender)** | ตอนแพ็กเว็บ ให้เครื่องมือเปิดแต่ละหน้าแล้วเก็บหน้าที่มีเนื้อหาไว้ | เว็บไม่กี่หน้า เนื้อหาไม่ค่อยเปลี่ยน (งานเสริมของ STARTER) |
| **ให้ server สร้างหน้าให้ทุกครั้ง (SSR)** | server สร้างหน้าที่มีเนื้อหาครบส่งให้ทุกครั้งที่มีคนขอ | เว็บที่ต้องติด Google มาก และเนื้อหาเปลี่ยนบ่อย |

> 💡 งาน STARTER ยอมรับข้อจำกัดนี้ได้ แต่ต้อง **เขียนอธิบายใน README** ว่าเพราะอะไร และถ้าจะแก้ต้องทำยังไง

**ลองการ์ดตอนแชร์ (หลังขึ้นระบบจริง):** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) และส่งลิงก์ให้ตัวเองใน LINE

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ทำไมลิงก์ในเว็บเราเองต้องใช้ <code>NavLink</code>/<code>Link</code> ไม่ใช่ <code>&lt;a href&gt;</code>?</summary>

`<a>` ทำให้เบราว์เซอร์โหลดใหม่ทั้งหน้า ข้อมูลที่จำไว้หายและช้ากว่า ส่วน `Link` แค่เปลี่ยนลิงก์แล้วสลับเนื้อหาในหน้าเดิม
</details>

<details><summary>2. บนระบบจริง พิมพ์ <code>/contact</code> เข้ามาตรงๆ แล้วได้ 404 เพราะอะไร?</summary>

server หาไฟล์ชื่อ `contact` ไม่เจอ ต้องตั้งให้ server ส่งหน้าหลัก (`index.html`) กลับไปทุกครั้งที่ไม่มีไฟล์ตามที่ขอ แล้ว React Router จะเลือกหน้าที่ถูกเอง
</details>

<details><summary>3. ทำไมจำหมวดที่เลือกไว้ในลิงก์ ดีกว่าจำไว้ในตัวแปร?</summary>

รีเฟรชแล้วไม่หาย, ส่งลิงก์ให้คนอื่นแล้วเห็นหมวดเดียวกัน, ปุ่มย้อนกลับของเบราว์เซอร์ทำงานถูก
</details>

<details><summary>4. แชร์ลิงก์ลง LINE แล้วไม่ขึ้นรูปที่เจ้าของร้านตั้ง ทั้งที่เปิดในเบราว์เซอร์แล้วเห็นปกติ เพราะอะไร?</summary>

ระบบของ LINE ไม่รันโค้ดในหน้าเว็บ จึงเห็นแค่ `index.html` เปล่าๆ แก้ได้ด้วยการใส่ข้อมูลการ์ดค่าเริ่มต้นใน `index.html`, สร้างหน้าไว้ล่วงหน้า หรือให้ server สร้างหน้าให้
</details>

---

## ✏️ แบบฝึกหัด

ทำ Bit Café ให้มี 3 หน้า + หน้า 404 ด้วย React Router, เมนูของหน้าที่อยู่ต้องเด่น, หน้าบริการเลือกหมวดด้วย `?category=`, ทุกหน้ามีชื่อหน้าและคำอธิบายต่างกัน และมี `robots.txt` / `sitemap.xml` แล้วเปิด DevTools → Elements ดูว่าชื่อหน้า (`<title>`) เปลี่ยนเมื่อเปลี่ยนหน้า

## ✅ ผ่านด่าน

- [ ] ประกาศหลายหน้า, ทำโครงหน้าร่วม และหน้า 404 ได้
- [ ] ใช้ `NavLink` ทำให้เมนูของหน้าที่อยู่เด่นได้
- [ ] จำหมวดที่เลือกไว้ในลิงก์ด้วย `useSearchParams` ได้
- [ ] ตั้งชื่อหน้า คำอธิบาย และการ์ดตอนแชร์ ของแต่ละหน้าได้
- [ ] อธิบายข้อจำกัดเรื่อง Google/LINE ของเว็บแบบนี้ และวิธีแก้ได้

---

[← บทที่ 12: ตกแต่งเว็บ](./12-tailwind.md) · [🏠 สารบัญ](/) · [บทที่ 14: สร้าง API →](./14-hono-api.md)
