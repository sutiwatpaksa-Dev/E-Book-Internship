# STARTER: Non-functional Requirement 🛡️

> **⚡ สรุป 30 วินาที**
> - ไม่ใช่แค่ "ทำงานได้" แต่ต้อง **ใช้ได้ทุกจอ, หาเจอใน Google, ปลอดภัย และโค้ดอ่านรู้เรื่อง**
> - ข้อ Security บางข้อถ้าพลาด = **ไม่ผ่านทันที** แม้คะแนนรวมจะถึง ([ดูเกณฑ์](./submission.md#เกณฑ์ประเมิน-100-คะแนน))

---

## 📱 Responsive

- ทดสอบที่ **375px** (มือถือ), **768px** (แท็บเล็ต), **1280px** (desktop) ไม่มี scroll แนวนอน
- ตาราง admin บนมือถือต้อง scroll ในกรอบได้ ไม่ล้นจอ

> 💡 วิธีทดสอบและ breakpoint ของ Tailwind: [บทที่ 12 ข้อ 4–6](../12-tailwind.md)

---

## 🔎 SEO พื้นฐาน

- แต่ละหน้าเปลี่ยน `<title>` และ meta description ตามข้อมูลจาก `pages`
- มี OG tags (title, description, image) ให้แชร์ลง LINE/Facebook แล้วขึ้นรูป
- รูปทุกรูปมี `alt`, ใช้ heading `h1` หน้าละ 1 ตัว
- มีไฟล์ `robots.txt` และ `sitemap.xml` (เขียนมือได้ เพราะมีแค่ 3 หน้า)

> 🤓 **ข้อควรรู้:** React SPA ทำ SEO ได้จำกัด เพราะ bot บางตัวไม่รัน JS ระดับ STARTER ยอมรับได้ แต่น้องต้อง **อธิบายใน README ได้ว่าทำไม และถ้าจะแก้ต้องทำยังไง** (เช่น SSR/prerender)
> วิธีทำทั้งหมด: [บทที่ 13 ข้อ 6–7](../13-router-seo.md) · อ่านเพิ่ม: [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [Open Graph protocol](https://ogp.me)

---

## 🔐 Security

ทบทวนหลักการใน [บทที่ 10](../10-security.md) และดูโค้ดตัวอย่างใน [บทที่ 14](../14-hono-api.md) (rate limit, onError) กับ [บทที่ 15](../15-auth.md) (hash, cookie, middleware) แล้วทำให้ครบ:

| ต้องทำ | ทบทวนที่ |
|---|---|
| รหัสผ่าน hash ด้วย `Bun.password.hash` (argon2/bcrypt) | [บทที่ 10 ข้อ 2](../10-security.md#_2-เก็บรหัสผ่านผู้ใช้-hash-ไม่ใช่-encrypt), [Bun: hashing](https://bun.sh/docs/api/hashing) |
| JWT อยู่ใน cookie `httpOnly`, `sameSite=lax`, **ห้ามเก็บใน localStorage** | [บทที่ 10: XSS](../10-security.md#🧪-xss-cross-site-scripting), [Hono: Cookie helper](https://hono.dev/docs/helpers/cookie) |
| ทุก endpoint `/api/admin/*` ผ่าน middleware เช็ค token | [บทที่ 10 ข้อ 3](../10-security.md#_3-authentication-vs-authorization), [Hono: JWT middleware](https://hono.dev/docs/middleware/builtin/jwt) |
| Contact form จำกัด **5 ครั้ง / 10 นาที / IP** กัน spam | [บทที่ 10: Brute force](../10-security.md#🔁-ลองรหัสผ่านรัวๆ-brute-force) |
| Error 500 ห้ามส่ง stack trace กลับไปให้ client | [บทที่ 10: Error ที่บอกมากเกินไป](../10-security.md#📣-error-ที่บอกมากเกินไป) |

> ⚠️ **ทำไม cookie ไม่ใช่ localStorage?** ถ้ามี XSS หลุดเข้ามาแม้แต่จุดเดียว JavaScript ของคนร้ายอ่าน localStorage ได้ทั้งหมด แต่อ่าน cookie `httpOnly` ไม่ได้

---

## ✅ Validation

- ทุก request body/query ผ่าน **Zod ที่ backend เสมอ** (validate frontend อย่างเดียวไม่นับ)
- เบอร์โทร 9–10 หลัก, อีเมลถูกรูปแบบ, ข้อความไม่เกิน 1,000 ตัวอักษร

> 💡 เขียน Zod schema ไว้ที่ server แล้ว export type ด้วย `z.infer` ให้ client ใช้ จะได้ type ตรงกันทั้งสองฝั่ง ([บทที่ 4 ข้อ 5](../04-typescript.md#_5-ข้อจํากัด-typescript-ไม่ได้ตรวจข้อมูลตอนรัน))

---

## 🧹 Code quality

- TypeScript **ห้ามใช้ `any`** ยกเว้นมีเหตุผลเขียนคอมเมนต์ไว้ ([บทที่ 4: any vs unknown](../04-typescript.md#_8-any-🚫-vs-unknown-✅))
- commit **อย่างน้อยวันละ 1 ครั้ง** ข้อความ commit อ่านรู้เรื่อง ([บทที่ 1 Git](../01-git.md))

---

[← ฐานข้อมูล + API Spec](./database-api.md) · [🏠 สารบัญ](../README.md) · [Timeline 10 วัน →](./timeline.md)
