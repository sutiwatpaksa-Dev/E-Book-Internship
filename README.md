# คู่มือฝึกงาน Blicktech

เว็บคู่มือและระบบติดตามการฝึกงานสำหรับน้องฝึกงาน บริษัท บลิคซ์เทค คอนซัลแทนท์ จำกัด
สอนทำซอฟต์แวร์ 1 ระบบให้ครบ 7 ขั้น (โจทย์ → ออกแบบ → ฐานข้อมูล → API → หน้าเว็บ → ทดสอบ → ขึ้นจริง) ด้วยการ์ดความรู้สั้นๆ และโจทย์ฝึกงานจริง

- **เว็บจริง:** https://e-book-internship.vercel.app
- **เนื้อหา:** [`content/docs/`](content/docs/index.mdx) · **มีอะไรใหม่:** [`changelog.mdx`](content/docs/changelog.mdx)
- **วิธีดูแลระบบ:** [`MAINTAINING.md`](MAINTAINING.md)

## ใครใช้ทำอะไร

| ผู้ใช้ | ทำอะไรได้ |
|---|---|
| **น้องฝึกงาน** | เปิดหน้า "วันนี้" ดูว่าต้องทำอะไรต่อ พร้อมกราฟความคืบหน้า · อ่านการ์ดความรู้และติ๊กผ่าน · ถามหรือขอเนื้อหาจากพี่เลี้ยง · ส่งลิงก์ repo GitHub, ส่งงานตรวจรายรอบ และแนบลิงก์เว็บที่ deploy แล้ว · ดูผลตรวจและแจ้งเตือน |
| **พี่เลี้ยง** | หลังบ้านที่ `/dev/admin`: ภาพรวมและความคืบหน้ารายคน · ตอบแชทและส่งข้อความหาน้อง (คนเดียวหรือทั้งรุ่น) · ตรวจงานที่ส่งแบบ ผ่าน/แก้ · จัดการรุ่น โจทย์ (รวมรอบส่งงาน) ประกาศ บัญชี และการ์ดที่เขียนเอง · ค้นหาด้วย `Ctrl/⌘ + K` |

หน้าโจทย์ฝึกงาน หลังบ้าน และไฟล์ Requirement ต้อง login ก่อน ส่วนบทเรียนที่ไม่มีเครื่องหมายกุญแจอ่านได้โดยไม่ต้อง login

## เทคโนโลยี

เว็บนี้เป็นตัวอย่างของ stack ที่คู่มือสอน ใช้โครงเดียวกัน

- **หน้าเว็บ:** Next.js (App Router) + Fumadocs + React + TypeScript + Tailwind CSS v4
- **API:** Hono รันบน Bun ในโฟลเดอร์ `server/` แบ่งชั้น `routes → services → repositories → db` ห้ามข้ามชั้น
- **ฐานข้อมูล:** PostgreSQL + Drizzle ORM (migration อยู่ใน `server/db/migrations/`)
- **ทดสอบ:** `bun test`

## เริ่มรันในเครื่อง

ต้องมี [Bun](https://bun.sh), Node.js และ Docker

```bash
cp .env.example .env     # แก้ SESSION_SECRET (openssl rand -base64 48)
docker run -d --name ebook-auth-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=ebook -p 5544:5432 postgres:17-alpine
npm install
npm run db:migrate       # สร้างตาราง
bun scripts/create-user.ts mentor dev   # สร้างบัญชีพี่เลี้ยง (จะได้ PIN 6 หลัก แสดงครั้งเดียว)
npm run dev              # เปิด http://localhost:3000
```

`DATABASE_URL` ในไฟล์ `.env` ต้องชี้ฐานในเครื่อง (`localhost`) เท่านั้น

อยากลองด้วยข้อมูลตัวอย่าง (3 รุ่น พี่เลี้ยง 2 คน น้อง 9 คน พร้อมงานที่ส่งและแชท):

```bash
bun --env-file=.env scripts/seed-demo.ts           # ใส่ข้อมูลตัวอย่าง (ปฏิเสธถ้าไม่ใช่ฐานในเครื่อง)
bun --env-file=.env scripts/seed-demo.ts --clean   # ลบข้อมูลตัวอย่างทั้งชุด
```

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รันเว็บและ API ในเครื่อง |
| `npm test` | รันเทสต์ทั้งหมด |
| `npm run typecheck` | ตรวจ TypeScript |
| `npm run build` | build เหมือนบน Vercel (ตรวจ MDX ด้วย) |
| `npm run db:generate` | สร้างไฟล์ migration หลังแก้ `server/db/schema.ts` (ต้อง commit ไฟล์ที่ได้) |
| `npm run db:migrate` | รัน migration กับฐานใน `.env` |
| `npm run user:create` / `user:reset-pin` | สร้างบัญชี / ออก PIN ใหม่ |

## โครงสร้างโปรเจกต์

```text
content/docs/        เนื้อหา (MDX): บทเรียน, การ์ดความรู้ใน learn/cards/, โจทย์ใน starter/, changelog
src/app/             หน้าเว็บและ route ของ Next.js
src/components/      คอมโพเนนต์ (ชิ้นพื้นฐานใช้ร่วม: button, field, empty-state, status-badge ...)
src/api/ hooks/      เรียก API และ state ฝั่งหน้าเว็บ (คอมโพเนนต์ไม่เรียก fetch เอง)
src/lib/ data/       กฎที่ใช้ร่วมกันทั้ง server และหน้าเว็บ, ข้อมูลเส้นทางเรียน 7 ขั้น
server/              API (routes, services, repositories, validators) และ db/ (schema, migrations)
scripts/             migrate, สร้างบัญชี, seed ข้อมูลตัวอย่าง
```

## ขึ้นเว็บจริง

- ทำงานและทดสอบบน branch `dev` ในเครื่อง ตัว `dev` ไม่ได้ deploy
- push ขึ้น `main` เท่านั้นที่ Vercel build และขึ้น Production (build รัน `npm run db:migrate` ก่อน `next build` ให้เอง)
- หลังขึ้นเปิด `/api/health` ต้องได้ `{"ok":true,"db":"ok"}`
- ตั้งค่า env บน Vercel (`DATABASE_URL`, `SESSION_SECRET`, `APP_ORIGIN`) และขั้นตอนตั้งครั้งแรกอยู่ใน [`MAINTAINING.md`](MAINTAINING.md)

> repo นี้เปิดสาธารณะ ห้ามใส่ค่าลับ (รหัสผ่าน, token, connection string) ลงไฟล์ใดๆ ไฟล์ที่ต้องปิด เช่น PDF Requirement เก็บในฐานข้อมูล ไม่ใส่ใน repo

## เพิ่มหรือแก้เนื้อหา

- การ์ดความรู้ใหม่: เขียนใน `content/docs/learn/cards/` ตามแม่แบบของ skill `card-writer` แล้วลงทะเบียนใน `src/data/learn.ts`
- ทุกคำสั่งในเนื้อหาต้องใช้ได้ทั้ง Mac และ Windows (Git Bash)
- ก่อน commit รัน `npm test && npm run typecheck && npm run build`
- เลขเวอร์ชันอยู่ใน `package.json` และ [`changelog.mdx`](content/docs/changelog.mdx) กติกาละเอียดดู [`MAINTAINING.md`](MAINTAINING.md)
