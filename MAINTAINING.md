# ดูแล E-book

ไฟล์นี้สำหรับคนดูแลคู่มือ ไม่แสดงบนหน้าเว็บ

## แก้เนื้อหาและดูผลในเครื่อง

เว็บสร้างด้วย **Next.js + Fumadocs** (React + TypeScript + Tailwind) stack เดียวกับที่คู่มือสอน โค้ดของเว็บนี้จึงเป็นตัวอย่างระบบจริงให้น้องเปิดดูได้

```bash
npm install
npm run dev        # เปิด http://localhost:3000 แก้ไฟล์ .mdx แล้วหน้าเว็บอัปเดตเอง (ต้องรัน Postgres ก่อน ดูหัวข้อ "รันในเครื่อง")
npm run build      # ตรวจว่า build ผ่าน (MDX เขียนผิดรูปแบบจะทำให้ build ไม่ผ่าน)
npm test && npm run typecheck
```

### โครงสร้างไฟล์

```
content/docs/            เนื้อหาทั้งหมด (.mdx) path ในนี้ = URL บนเว็บ
├─ meta.json             ลำดับและหัวข้อ "ด่าน" ใน sidebar
├─ index.mdx             หน้าแรก (Roadmap)
├─ 00-start.mdx … 23-go-live.mdx   บทเรียน
├─ starter/              Mini Project (ต้อง login: Internship ขึ้นไป) มี meta.json ของตัวเอง
└─ glossary.mdx, cheat-sheet.mdx, changelog.mdx, บทเสริม
public/                  ไฟล์ที่ส่งตรงๆ: img/ (แผนภาพ), brand/ (โลโก้)
src/                     frontend แบบแบ่งตามหน้าที่ (Layer-based)
├─ app/                  หน้าเว็บ (Next.js App Router) path ของโฟลเดอร์ = URL
│  ├─ (docs)/[[...slug]]/        หน้าเนื้อหาทั่วไป สร้างเป็นไฟล์ static ตอน build
│  ├─ (docs)/starter/[[...slug]]/ หน้าที่ล็อก ตรวจสิทธิ์ฝั่ง server ทุกครั้ง
│  ├─ (docs)/login, no-access, dev/admin
│  ├─ api/[[...route]]/  ประตูเข้า API (ส่งต่อให้ Hono ใน server/)
│  └─ api/search/        ดัชนีค้นหา (ไม่รวมหน้าที่ล็อก)
├─ components/           หน้าตา (.tsx) ไม่เรียก fetch เอง
│                        ระดับ 1 ใช้ร่วมกัน: button, field, error-text
│                        ระดับ 2 รู้จักงานของเว็บนี้: login-form, admin-panel, learning-roadmap, requirement-viewer
├─ hooks/                สถานะที่ใช้ร่วมกัน (use-session.ts)
├─ api/                  เรียก API ทั้งหมดผ่านที่นี่ (client.ts + ไฟล์ละกลุ่ม)
├─ lib/                  source.ts (โหลดเนื้อหา), page-access.ts (กฎว่า path ไหนต้อง login), require-page-access.ts
├─ data/roadmap.ts       ลำดับบทบน Roadmap หน้าแรก
└─ types/
server/                  backend แบบแบ่งตามหน้าที่ (Layered / MVC) ไม่รู้จัก Next.js
├─ app.ts                ประกอบ routes + csrf + error handler
├─ routes/               Controller: รับคำขอ ตรวจ input ตอบกลับ (*.routes.ts)
├─ validators/           schema ของ input (zod)
├─ services/             Model: กฎธุรกิจ ไม่รู้จัก HTTP โยนรหัสข้อผิดพลาด (*.service.ts)
├─ repositories/         Model: คุยกับฐานข้อมูลเท่านั้น (*.repository.ts)
├─ middleware/           require-role, error-handler (แปลงรหัสเป็น status)
├─ db/                   client.ts, schema.ts, migrations/
├─ lib/                  session.ts (บัตรผ่าน), pin.ts
└─ config/env.ts         ตรวจตัวแปร env ตอนเริ่ม
scripts/                 สคริปต์ดูแลระบบ (สร้างบัญชีแรก)
design/brand-source/     ไฟล์โลโก้ต้นฉบับ (ไม่ขึ้นเว็บ)
```

- ทิศทางการเรียก: `routes → services → repositories → db` ห้ามข้ามชั้น ฝั่งหน้าเว็บ `app → components → hooks / api → client`
- ไฟล์ใช้ชื่อตัวพิมพ์เล็กคั่นด้วย `-` ตามที่คู่มือสอนใน [บทเสริมจัดโครงสร้างโปรเจกต์](content/docs/project-structure.mdx)
- ออกเวอร์ชันใหม่: เพิ่มหัวข้อบนสุดใน `changelog.mdx` แล้วรัน `npm version <ตัวเลข> --no-git-tag-version` (เลขจะขึ้นที่เมนูเอง) จากนั้น commit, `git tag v<ตัวเลข>` และ push
  - เลขเวอร์ชันมี 3 ตำแหน่ง ขึ้นแต่ละตำแหน่งเมื่อ:
    - ตัวหน้า (`3.0.0`) เมื่อเปลี่ยนตัวระบบทั้งเว็บ เช่น v2.0.0 ที่ย้ายมา Next.js + login
    - ตัวกลาง (`2.1.0`) เมื่อ **redesign** วิธีเรียนหรือวิธีใช้เว็บ และงานก้อนนั้นเสร็จครบตามเกณฑ์ที่ตกลงกันไว้ก่อนเริ่ม ขึ้นเลขนี้ตอนที่ขึ้น `main` เท่านั้น เพราะเลขตัวกลางหมายถึงสิ่งที่ผู้ใช้จริงได้รับ
    - ตัวท้าย (`2.0.13`) เมื่อปล่อยงานทีละชิ้นระหว่างทาง (+1 ทุกครั้ง)
    - งานหลังบ้านล้วนใช้ตัวอักษรต่อท้าย (`2.0.4a`) และไม่ลง changelog
  - ระหว่างที่ redesign ยังไม่เสร็จ ให้ปล่อยบน `dev` เป็นเลขตัวท้ายไปก่อน ครั้งที่ขึ้น `main` แล้วครบเกณฑ์ให้ใช้เลขตัวกลางแทนเลขตัวท้ายถัดไป (เช่น 2.0.15 → 2.1.0 → 2.1.1) และหัวข้อ changelog ของเลขนั้นให้สรุปภาพรวมทั้งก้อน
- เพิ่มบทใหม่: สร้างไฟล์ `.mdx` ใน `content/docs/` (frontmatter `title` และ `navTitle` ชื่อสั้นใน sidebar) แล้วเพิ่มชื่อไฟล์ใน `content/docs/meta.json` และ `src/data/roadmap.ts`
- เขียน MDX: `{` `}` และ `<` ในข้อความธรรมดาต้องอยู่ใน `` `โค้ด` `` หรือใส่ `\{` ไม่งั้น MDX อ่านเป็นโค้ด, `<details>` ต้องมีบรรทัดว่างก่อน `</details>`
- ตาราง "ในกลุ่มนี้มีใครบ้าง" ในบทเรียนดึงจาก `src/data/tool-groups.ts` (ใช้ใน MDX ด้วย `<ToolTable group="js-runtime" />`) มีเครื่องมือใหม่ เพิ่มที่ไฟล์นั้นที่เดียว ใส่ระดับ team / know / aware
  - **ทุกข้อเท็จจริงต้องมาจากเว็บทางการ** ของเครื่องมือนั้น (เอกสารของเจ้าของ ไม่ใช่บล็อก) `url` ชี้หน้าที่ยืนยันข้อมูลได้ แล้ว **สรุปด้วยคำของเราเอง** ไม่คัดลอกประโยค (ลิขสิทธิ์ และเราอยากได้สไตล์ "อธิบายให้เข้าใจ" ไม่ใช่โฆษณา)
  - ตรวจแล้วอัปเดต `checkedAt` ของกลุ่ม หน้าเว็บแสดงวันที่นี้ใต้ตาราง คนอ่านรู้ว่าข้อมูลสดแค่ไหน
  - ตรวจซ้ำทุกครั้งที่ออกเวอร์ชันใหญ่ หรืออย่างน้อยปีละครั้ง (เครื่องมือ JS เปลี่ยนเร็ว)
- สีและฟอนต์อยู่ที่ `src/app/global.css` และ `src/app/layout.tsx`

## branch และการ deploy

| branch | ขึ้นที่ไหน | ใช้ทำอะไร |
|---|---|---|
| `main` | https://e-book-internship.vercel.app (Production) | เว็บที่น้องใช้อยู่จริง **แช่แข็งไว้** แก้ผ่าน `dev` แล้วค่อย merge |
| `dev` | https://e-book-internship-git-dev-mao-ji.vercel.app (Preview) | ทำงานและทดสอบ push ได้เลย Vercel build ให้เอง |

- Preview เปิดได้เฉพาะคนที่อยู่ในทีม Vercel (Vercel Authentication) คนนอกเห็นแค่หน้า login ของ Vercel
- ตัวแปร env ของ `dev` ตั้งแยกที่ Settings → Environment Variables → Preview → เลือก branch `dev` ใช้ฐานข้อมูลคนละก้อนกับ Production ได้
- ทดสอบบน `dev` ผ่านแล้ว จึง merge `dev` เข้า `main` เพื่อขึ้นเว็บจริง

## เผยแพร่ (Vercel)

Vercel อ่านค่าจาก `vercel.json` เอง (Framework: Next.js, `bunVersion` ให้ API รันบน Bun) push ขึ้น branch เมื่อไหร่ Vercel build ให้เอง
ถ้าต้องการโดเมนบริษัท เช่น `handbook.blicktechconsultant.co.th` ตั้งที่ Project → Settings → Domains

## ระบบ login (ตั้งแต่ v2.0.0)

หน้า `starter/`, `dev/` และไฟล์ Requirement PDF ต้อง login ก่อน มีสองด่าน

| ด่าน | ไฟล์ | หน้าที่ |
|---|---|---|
| ก่อนส่งหน้าเว็บ | `src/lib/require-page-access.ts`, `src/lib/page-access.ts` | หน้าที่ล็อกสร้างฝั่ง server ทุกครั้ง ตรวจบัตรผ่าน (cookie `bt_session`) ก่อน ไม่มีบัตรพาไปหน้า login |
| API (Hono บน Bun) | `src/app/api/[[...route]]/route.ts`, `server/` | login/logout, หน้า admin, ส่ง PDF (เช็กกับ DB ทุกครั้ง) |

- กฎว่า path ไหนต้องมี role อะไรอยู่ที่ `src/lib/page-access.ts` ที่เดียว
- หน้าที่ล็อกต้องอยู่ใน route ที่ไม่ static (เช่น `src/app/(docs)/starter/`) เพราะไฟล์ static ใครขอก็ได้ ถ้าเพิ่มส่วนที่ล็อกใหม่ (เช่น `steps/`) ให้สร้าง route แบบเดียวกัน
- ดัชนีค้นหา (`src/app/api/search/route.ts`) ตัดหน้าที่ล็อกออกให้เอง

> ⚠️ repo นี้ยังเปิดสาธารณะ ไฟล์ `.mdx` ของหน้าที่ล็อกยังอ่านบน GitHub ได้ login กันได้เฉพาะบนเว็บ ไฟล์ที่ต้องปิดจริง (PDF) จึงเก็บใน DB ไม่ใส่ใน repo

### ตั้งครั้งแรกบน Vercel

1. สร้าง Postgres: Vercel → Storage → **Neon** (ฟรี) ผูกกับโปรเจกต์ จะได้ `DATABASE_URL` ใน env เอง
2. Project → Settings → Environment Variables เพิ่ม (Preview ของ `dev` กับ Production ตั้งแยกกัน ใช้ secret และฐานข้อมูลคนละชุด)
   - `SESSION_SECRET` = ผลจาก `openssl rand -base64 48`
   - `APP_ORIGIN` = URL ของเว็บนั้น เช่น `https://e-book-internship.vercel.app`
   - `EXAMPLE_REPO_URL` = ลิงก์ repo ระบบตัวอย่าง (ไม่ใส่ก็ได้ ปุ่มจะไม่แสดง)
3. ตาราง: Vercel รัน `npm run db:migrate` ก่อน `next build` ทุกครั้ง (`buildCommand` ใน `vercel.json`) จึงสร้าง/แก้ตารางให้เอง ใน Build Logs จะมีบรรทัด `migrate → <host>/<ฐาน>` (Vercel อาจปิด host เป็น `[REDACTED]` เพราะตรงกับค่า Secret ดู host จริงได้จาก Runtime Logs ตอน `/api/health` ล้ม) ต่อฐานไม่ได้ build จะล้มก่อน ไม่ปล่อยเว็บที่ไม่มีตารางขึ้นไป
4. บัญชี Dev คนแรก (ง่ายสุด): ตั้ง env `FIRST_DEV_USERNAME` และ `FIRST_DEV_PIN` (6 หลัก, Sensitive) แล้ว deploy · login ครั้งแรกด้วยชื่อ+PIN นั้น ระบบสร้างบัญชี Dev ชื่อนั้นให้ถ้ายังไม่มีชื่อนี้ในระบบ (มีชื่อนี้แล้วไม่แตะ ไม่เปลี่ยน PIN) · ลืม PIN ทุกบัญชีจนเข้าหน้า admin ไม่ได้ ก็ใช้ทางนี้ได้ด้วยชื่อใหม่ · ดูผลใน Runtime Logs: บรรทัดที่ขึ้นต้น `FIRST_DEV:` · login ได้แล้วลบ `FIRST_DEV_PIN` ออก
   หรือสร้างจาก Terminal ของเราเอง ค่าใน Vercel เป็นแบบ Secret ดึงด้วย `vercel env pull` ไม่ได้ (ได้ค่าว่าง) ให้คัดลอก connection string ของฐาน**ที่เว็บใช้จริง** จาก Neon Console → Connect (กดปุ่ม Copy) แล้วดึงจากคลิปบอร์ดด้วย `pbpaste` ค่าไม่ขึ้นจอ ไม่ติด history (อย่าใช้ `read -s` แล้ววาง: Terminal แอบเติมรหัส bracketed paste เข้าไปในค่า ทำให้ URL ผิดรูปแบบ)
   ```bash
   export DATABASE_URL="$(pbpaste)" SESSION_SECRET=$(openssl rand -base64 48) APP_ORIGIN=<URL ของเว็บ>
   bun scripts/create-user.ts <username> dev
   pbcopy < /dev/null   # ล้างคลิปบอร์ด
   ```
   ลืม PIN: รันแบบเดียวกันแต่ใช้ `bun scripts/reset-pin.ts <username>` (ออก PIN ใหม่ + ปลดล็อก) อยากตั้งเอง: `read -s "NEW_PIN?PIN 6 หลัก: " && export NEW_PIN` ก่อนรัน (พิมพ์เอง อย่าวาง)
   `SESSION_SECRET` ตรงนี้ใช้แค่ผ่านด่านตรวจ env ของสคริปต์ ไม่ต้องตรงกับบน Vercel
   จด PIN ที่ได้ (แสดงครั้งเดียว)
5. เปิด `/api/health` ต้องได้ `{"ok":true,"db":"ok"}` แล้ว login ด้วยบัญชีนั้น เปิด **⚙️ จัดการบัญชี** อัปโหลด PDF Requirement และสร้างบัญชีน้อง

### รันในเครื่อง

```bash
cp .env.example .env     # แก้ SESSION_SECRET
docker run -d --name ebook-auth-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=ebook -p 5544:5432 postgres:17-alpine
npm run db:migrate && bun scripts/create-user.ts mentor dev
npm run dev              # เว็บ + API ที่ :3000 (รันบน Bun เพราะ API ใช้ Bun.password)
```

แก้ตารางใน `server/db/schema.ts` แล้ว `npm run db:generate` ได้ไฟล์ SQL ใหม่ใน `server/db/migrations/` ให้ commit ไฟล์นั้นด้วย push แล้ว Vercel migrate ให้ตอน build
