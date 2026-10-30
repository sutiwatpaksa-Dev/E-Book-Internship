---
name: deploy-vercel
description: Deploy เว็บคู่มือขึ้น Vercel (เฉพาะ main = production, dev ทดสอบในเครื่อง) และแก้ปัญหาเวลา build หรือ migrate ล้ม, เวอร์ชันบนเว็บไม่เปลี่ยน, env ผิด ใช้เมื่อผู้ใช้สั่ง "deploy", "ขึ้น main", "push dev", "build ล้ม", "เวอร์ชันไม่เปลี่ยน"
---

# Deploy บน Vercel

| branch | URL | หมายเหตุ |
|---|---|---|
| `dev` | (ไม่มี) | Vercel ไม่ build แล้วตั้งแต่ v2.1.18c ทดสอบในเครื่องด้วย `.env` ที่ชี้ localhost |
| `main` | https://e-book-internship.vercel.app | Production ที่น้องใช้จริง |

Vercel build ด้วย `npm run db:migrate && npm run build` (ดู `vercel.json`) เฉพาะเมื่อ push ขึ้น `main` เพราะ `git.deploymentEnabled` ปิดทุก branch อื่นไว้ (Preview ทุก push กิน Deployment Storage ของ Hobby จนเกือบเต็ม)

## Push ขึ้น dev (ไม่ deploy)

1. `git status` ต้องสะอาด และต้องอยู่บน `dev`
2. `npm test && npm run typecheck && npm run build` ต้องผ่านในเครื่อง
3. `git push origin dev` (มี tag ด้วยก็ `git push origin dev --tags`)
4. ไม่มี deployment เกิดขึ้น ถ้าเห็น Preview ใหม่ใน `vercel ls` แปลว่า `vercel.json` ถูกแก้ ให้ตรวจ `git.deploymentEnabled`

## ขึ้น main (Production)

**ทำเฉพาะเมื่อผู้ใช้สั่งชัดๆ ในข้อความนี้**

```bash
git checkout main && git pull
git merge --ff-only dev        # ถ้า ff ไม่ได้ ให้หยุดแล้วถามผู้ใช้ ห้าม force
git push origin main --tags
git checkout dev
```

แล้วเปิด `https://e-book-internship.vercel.app/api/health` ต้องได้ `{"ok":true,"db":"ok"}`

## แก้ปัญหา

| อาการ | สาเหตุที่เจอบ่อย | ทำอะไร |
|---|---|---|
| เวอร์ชันที่เมนูยังเป็นเลขเก่า | build ใหม่ยังไม่เสร็จ หรือ cache ของ browser | รอให้ deployment ขึ้น Ready แล้ว hard refresh · ตรวจว่า `package.json` ขึ้นเลขแล้วจริงใน commit ที่ deploy |
| build ล้มที่ขั้น migrate | ดูบรรทัด `❌ migrate ไม่สำเร็จ` และ `Postgres: <code>` ที่ `scripts/migrate.ts` พิมพ์ไว้ | `42P07 relation already exists` แปลว่าตารางมีแล้ว แต่ `drizzle.__drizzle_migrations` ไม่มีแถวของ migration นั้น ใช้ `bun --env-file=.env.preview scripts/migrate-baseline.ts` ตรวจก่อน (อ่านอย่างเดียว เทียบตารางกับ snapshot) ผ่านแล้วค่อยใส่ `--apply` **ต้องขออนุมัติก่อนเขียน DB** · ต้นเหตุมักเป็น `drizzle-kit push` กับฐานที่ใช้ร่วมกัน ฐาน preview/production ใช้ `db:generate` + `db:migrate` เท่านั้น ห้าม push |
| ต่อ DB ไม่ได้ | `DATABASE_URL` ของ Production ผิด หรือไม่ได้ตั้ง scope เป็น Production | ให้ผู้ใช้ตรวจที่ Settings → Environment Variables (ค่าเป็น Secret ดึงด้วย `vercel env pull` ไม่ได้) |
| build ล้มที่ MDX | `{` `}` `<` ที่ไม่ได้ escape, `</details>` ที่ไม่มีบรรทัดว่างก่อนหน้า | รัน `npm run build` ในเครื่องเพื่อดูไฟล์และบรรทัด |
| API ช้า (ทุก request เกิน 0.5 วินาที) | function ไม่ได้รันใกล้ฐานข้อมูล ดู header `x-vercel-id` (ตัวกลางคือที่รัน เช่น `sin1::iad1::` = รันที่อเมริกา) | `vercel.json` ตั้ง `"regions": ["sin1"]` ไว้แล้ว เพราะ Neon อยู่ Singapore ถ้าย้ายฐานข้อมูล ต้องเปลี่ยน region ตาม |
| หน้า 500 หลัง deploy | env ขาด (`SESSION_SECRET`, `APP_ORIGIN`) | ดู Runtime Logs และ `/api/health` |

ตรวจ DB ได้แบบอ่านอย่างเดียว (`SELECT`) ส่วน INSERT / UPDATE / DROP ต้องขออนุมัติทุกครั้ง และห้ามพิมพ์ connection string ออกมาบนจอหรือเขียนลงไฟล์

## หลัง deploy

- แจ้งผู้ใช้ว่า commit ไหนขึ้นไปที่ไหน และตรวจอะไรแล้วบ้าง
- ถ้าเป็นการขึ้น main ให้อัปเดต `Handoff.md` (ดู skill `maintainer`)
