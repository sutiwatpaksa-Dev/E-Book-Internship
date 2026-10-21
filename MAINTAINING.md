# ดูแล E-book

ไฟล์นี้สำหรับคนดูแลคู่มือ ไม่แสดงบนหน้าเว็บ

## แก้เนื้อหาและดูผลในเครื่อง

```bash
npm install
npm run dev        # เปิด http://localhost:5173 แก้ไฟล์ .md แล้วหน้าเว็บอัปเดตเอง
npm run build      # ตรวจว่า build ผ่าน (ลิงก์เสียจะทำให้ build ไม่ผ่าน)
```

### โครงสร้างไฟล์

```
docs/                    หน้าเว็บทั้งหมด (VitePress srcDir) path ในนี้ = URL บนเว็บ
├─ index.md              หน้าแรก
├─ 00-start.md … 23-go-live.md   บทเรียน
├─ react-language.md, project-structure.md   บทเสริม
├─ glossary.md, cheat-sheet.md, changelog.md
├─ starter/              Mini Project (ต้อง login: Internship ขึ้นไป)
├─ dev/                  ส่วนพี่เลี้ยง (ต้อง login: Dev)
├─ login.md, no-access.md
└─ public/               ไฟล์ที่ส่งตรงๆ: img/ (แผนภาพ), brand/ (โลโก้)
.vitepress/
├─ config.mts            เมนู, sidebar, head
└─ theme/                frontend แบบแบ่งตามหน้าที่ (Layer-based)
   ├─ index.ts           ประกอบ layout + ตรวจก่อนเปลี่ยนหน้า
   ├─ components/        หน้าตา (.vue) ไม่เรียก fetch เอง
   ├─ composables/       สถานะที่ใช้ร่วมกัน เช่น use-session.ts (เทียบได้กับ hooks ของ React)
   ├─ api/               เรียก API ทั้งหมดผ่านที่นี่ (client.ts + ไฟล์ละกลุ่ม)
   ├─ lib/               ฟังก์ชันช่วยที่ไม่ผูกกับ UI (access.ts)
   ├─ types/             type ที่ใช้ร่วมกัน
   └─ styles/custom.css
api/server.ts            ทางเข้า API บน Vercel (เรียก server/app.ts)
server/                  backend แบบแบ่งตามหน้าที่ (Layered / MVC)
├─ app.ts                ประกอบ routes + csrf + error handler
├─ routes/               Controller: รับคำขอ ตรวจ input ตอบกลับ (*.routes.ts)
├─ validators/           schema ของ input (zod)
├─ services/             Model: กฎธุรกิจ ไม่รู้จัก HTTP โยนรหัสข้อผิดพลาด (*.service.ts)
├─ repositories/         Model: คุยกับฐานข้อมูลเท่านั้น (*.repository.ts)
├─ middleware/           require-role, error-handler (แปลงรหัสเป็น status), page-gate (กฎว่า path ไหนต้อง login)
├─ db/                   client.ts, schema.ts, migrations/
├─ lib/                  session.ts (บัตรผ่าน), pin.ts
└─ config/env.ts         ตรวจตัวแปร env ตอนเริ่ม
middleware.ts            ด่านตรวจ login ก่อนส่งหน้าเว็บ (Vercel Routing Middleware ต้องอยู่ที่ root)
scripts/                 สคริปต์ดูแลระบบ (สร้างบัญชีแรก)
design/brand-source/     ไฟล์โลโก้ต้นฉบับ (ไม่ขึ้นเว็บ)
```

- ทิศทางการเรียก: `routes → services → repositories → db` ห้ามข้ามชั้น ฝั่งหน้าเว็บ `components → composables / api → client`
- ไฟล์ component ใช้ชื่อตัวพิมพ์เล็กคั่นด้วย `-` ตามที่คู่มือสอนใน [บทเสริมจัดโครงสร้างโปรเจกต์](docs/project-structure.md)
- ออกเวอร์ชันใหม่: เพิ่มหัวข้อบนสุดใน `changelog.md` แล้วรัน `npm version <ตัวเลข> --no-git-tag-version` (เลขจะขึ้นที่เมนูและ footer เอง) จากนั้น commit, `git tag v<ตัวเลข>` และ push
- เพิ่มบทใหม่: สร้างไฟล์ `.md` ใน `docs/` แล้วเพิ่มชื่อใน `chapters` ที่ `.vitepress/config.mts`
- สีและฟอนต์อยู่ที่ `.vitepress/theme/custom.css`

## เผยแพร่ (Vercel)

ตั้งครั้งแรก:
1. เข้า https://vercel.com/new แล้ว login ด้วย GitHub
2. เลือก repo `E-Book-Internship` แล้วกด **Import**
3. Vercel อ่านค่าจาก `vercel.json` เอง (Framework: VitePress, Output: `.vitepress/dist`) กด **Deploy** ได้เลย

หลังจากนั้น push ขึ้น `main` เมื่อไหร่ Vercel build และอัปเดตเว็บให้เอง
เปิด Merge Request / Pull Request จะได้ลิงก์ Preview แยกให้ดูก่อน merge

ถ้าต้องการโดเมนบริษัท เช่น `handbook.blicktechconsultant.co.th` ตั้งที่ Project → Settings → Domains

## ระบบ login (ตั้งแต่ v2.0.0)

หน้า `starter/`, `steps/`, `dev/` และไฟล์ Requirement PDF ต้อง login ก่อน มีสองส่วนที่ทำงานคู่กัน

| ส่วน | ไฟล์ | หน้าที่ |
|---|---|---|
| Routing Middleware | `middleware.ts`, `server/middleware/page-gate.ts` | ตรวจบัตรผ่าน (cookie `bt_session`) ก่อนส่งไฟล์หน้าเว็บ ไม่มีบัตรพาไปหน้า login |
| API (Hono บน Bun) | `api/server.ts`, `server/` | login/logout, หน้า admin, ส่ง PDF (เช็กกับ DB ทุกครั้ง) |

ตารางกฎว่า path ไหนต้องมี role อะไรอยู่ที่ `server/middleware/page-gate.ts` (หน้าเว็บใช้ `.vitepress/theme/lib/access.ts` แค่แสดงปุ่ม ถ้าเพิ่ม path ที่ล็อกต้องแก้ทั้งสองที่)
หน้าใหม่ที่ต้องล็อกให้ใส่ `search: false` ใน frontmatter ไม่งั้นเนื้อหาจะหลุดไปอยู่ในดัชนีค้นหาที่ทุกคนโหลดได้

> ⚠️ repo นี้ยังเปิดสาธารณะ ไฟล์ `.md` ของหน้าที่ล็อกยังอ่านบน GitHub ได้ login กันได้เฉพาะบนเว็บ ไฟล์ที่ต้องปิดจริง (PDF) จึงเก็บใน DB ไม่ใส่ใน repo

### ตั้งครั้งแรกบน Vercel

1. สร้าง Postgres: Vercel → Storage → **Neon** (ฟรี) ผูกกับโปรเจกต์ จะได้ `DATABASE_URL` ใน env เอง
2. Project → Settings → Environment Variables เพิ่ม
   - `SESSION_SECRET` = ผลจาก `openssl rand -base64 48`
   - `APP_ORIGIN` = `https://e-book-internship.vercel.app`
   - `EXAMPLE_REPO_URL` = ลิงก์ repo ระบบตัวอย่าง (ไม่ใส่ก็ได้ ปุ่มจะไม่แสดง)
3. สร้างตารางจากเครื่องเรา (ใช้ `DATABASE_URL` ของ Neon ชั่วคราว ไม่ต้องบันทึกลงไฟล์)
   ```bash
   DATABASE_URL='<ของ Neon>' npm run db:migrate
   DATABASE_URL='<ของ Neon>' SESSION_SECRET=x APP_ORIGIN=https://e-book-internship.vercel.app bun scripts/create-user.ts <username> dev
   ```
   จด PIN ที่ได้ (แสดงครั้งเดียว)
4. Deploy แล้ว login ด้วยบัญชีนั้น เปิด **⚙️ จัดการบัญชี** อัปโหลด PDF Requirement และสร้างบัญชีน้อง

### รันในเครื่อง

```bash
cp .env.example .env     # แก้ SESSION_SECRET
docker run -d --name ebook-auth-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=ebook -p 5544:5432 postgres:17-alpine
npm run db:migrate && bun scripts/create-user.ts mentor dev
npm run api:dev          # API ที่ :3001
npm run dev              # เว็บที่ :5173 (ส่ง /api ไป :3001 ให้เอง)
npm test && npm run typecheck
```

middleware ไม่ทำงานตอน `npm run dev` (เป็นของ Vercel) จึงมีเทสต์ใน `server/middleware/vercel-middleware.test.ts` แทน และตรวจของจริงบน Preview URL ก่อน merge
แก้ตารางใน `server/db/schema.ts` แล้ว `npm run db:generate` ได้ไฟล์ SQL ใหม่ใน `server/db/migrations/` ให้ commit ไฟล์นั้นด้วย และรัน `db:migrate` กับ Neon ก่อน deploy
