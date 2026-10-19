# 📋 Cheat Sheet

> รวมคำสั่งที่ใช้บ่อย เปิดค้างไว้ข้างจอได้เลย

---

## Terminal
```bash
pwd · ls · cd <โฟลเดอร์> · cd .. · mkdir <ชื่อ> · code .
Tab = เติมชื่อ · ↑ = คำสั่งก่อนหน้า · Ctrl+C = หยุดโปรแกรม
```

## Git
```bash
git status                          # ⭐ ดูสถานะ (ใช้บ่อยสุด)
git add . && git commit -m "feat: ..."
git log --oneline                   # ดูประวัติ
git diff                            # ดูสิ่งที่แก้
git restore <ไฟล์>                  # ยกเลิกการแก้ที่ยังไม่ add
git switch -c feat/12-name          # สร้าง branch ใหม่
git switch main && git pull         # ☀️ ทำทุกเช้า
git push -u origin <branch>         # push ครั้งแรก
git merge <branch>
```
ประเภท commit: `feat` · `fix` · `docs` · `refactor` · `test` · `chore`

## Docker
```bash
docker run -d -p 8080:80 --name web nginx:alpine
docker ps / docker ps -a
docker logs -f <ชื่อ>
docker exec -it <ชื่อ> sh
docker rm -f <ชื่อ>
docker build -t <image> .
docker compose up -d [--build]
docker compose logs -f <service>
docker compose down [-v]            # -v = ลบ volume ⚠️
```
port: `-p เครื่องเรา:ในกล่อง` · ในกล่องเรียกกันด้วย **ชื่อ service** ไม่ใช่ localhost

## Package manager
| ทำอะไร | npm | Yarn | Bun |
|---|---|---|---|
| ติดตั้งทั้งหมด | `npm install` | `yarn` | `bun install` |
| ตาม lock เป๊ะ | `npm ci` | `yarn install --frozen-lockfile` | `bun install --frozen-lockfile` |
| เพิ่ม | `npm install x` | `yarn add x` | `bun add x` |
| เพิ่มแบบ dev | `npm install -D x` | `yarn add -D x` | `bun add -d x` |
| รัน script | `npm run dev` | `yarn dev` | `bun run dev` |

## TypeScript
```bash
npm install -D typescript tsx @types/node
npx tsx watch src/index.ts          # dev
npx tsc --noEmit                    # ตรวจ type ✅ ก่อน commit
npx tsc                             # build
```
```ts
interface X { a: string; b?: number }      // object
type S = "a" | "b";                         // union
Omit<X, "a"> · Partial<X> · Pick<X, "a">    // utility
unknown ✅  any 🚫
```

## HTTP
| Method | ใช้ | | Code | ความหมาย |
|---|---|---|---|---|
| `GET` | ดู | | `200` | OK |
| `POST` | สร้าง | | `201` | สร้างแล้ว |
| `PATCH` | แก้บางส่วน | | `204` | สำเร็จ ไม่มี body |
| `PUT` | แทนที่ | | `400` | ข้อมูลผิด |
| `DELETE` | ลบ | | `401` / `403` | ไม่รู้ว่าใคร / ไม่มีสิทธิ์ |
| | | | `404` / `409` | ไม่พบ / ขัดกับสถานะ |
| | | | `500` | server พัง |

## SQL
```sql
SELECT col FROM t WHERE ... ORDER BY ... ;
INSERT INTO t (a, b) VALUES (1, 2);
UPDATE t SET a = 1 WHERE id = 5;        -- ⚠️ อย่าลืม WHERE
DELETE FROM t WHERE id = 5;             -- ⚠️ อย่าลืม WHERE
SELECT ... FROM a JOIN b ON b.a_id = a.id;
SELECT ... FROM a LEFT JOIN b ON ... WHERE b.id IS NULL;
SELECT x, COUNT(*) FROM t GROUP BY x;
BEGIN; ... COMMIT;   /   ROLLBACK;
```
psql: `\dt` ตาราง · `\d t` โครงสร้าง · `\q` ออก

## ORM
```bash
npx drizzle-kit generate && npx drizzle-kit migrate
npx prisma migrate dev --name <ชื่อ> && npx prisma generate
npx prisma studio
```
กัน N+1: `with: { rentals: true }` (Drizzle) · `include: { rentals: true }` (Prisma)

## Debugging
- อ่าน error บรรทัดแรก + บรรทัดแรกที่เป็นไฟล์ของเรา
- VS Code: `⌘/Ctrl+Shift+P` → **JavaScript Debug Terminal** → คลิกซ้ายเลขบรรทัด 🔴
- `F5` ต่อ · `F10` บรรทัดถัดไป · `F11` เข้าในฟังก์ชัน
- ถาม: 🎯 ทำอะไร · 👣 ขั้นตอน · ✅ คาดว่า · ❌ ได้จริง · 🔍 ลองแล้ว

## Security
- ความลับ → `.env` (ห้ามเข้า Git) + `.env.example`
- รหัสผ่าน → `bcrypt.hash(pw, 12)` / `bcrypt.compare(pw, hash)`
- input → Zod ทุก endpoint · SQL → ORM หรือ `$1`
- หลุด → เปลี่ยน key ทันที + แจ้งพี่

---

## 📚 แหล่งเรียนรู้เพิ่มเติม

| เรื่อง | ลิงก์ |
|---|---|
| Git (ฝึกแบบภาพ) | https://learngitbranching.js.org |
| Docker | https://docs.docker.com/get-started/ |
| TypeScript Handbook | https://www.typescriptlang.org/docs/handbook/intro.html |
| TypeScript Playground | https://www.typescriptlang.org/play |
| Zod | https://zod.dev |
| HTTP status (แมว 🐱) | https://http.cat |
| MDN: HTTP | https://developer.mozilla.org/en-US/docs/Web/HTTP |
| SQL (ฝึกในเว็บ) | https://sqlbolt.com |
| SQL Murder Mystery 🕵️ | https://mystery.knightlab.com |
| PostgreSQL | https://www.postgresql.org/docs/ |
| MySQL | https://dev.mysql.com/doc/ |
| MongoDB | https://www.mongodb.com/docs/manual/ |
| Drizzle | https://orm.drizzle.team/docs/overview |
| Prisma | https://www.prisma.io/docs |
| Sequelize (TS) | https://sequelize.org/docs/v6/other-topics/typescript/ |
| Node.js | https://nodejs.org/en/learn |
| Bun | https://bun.sh/docs |
| OWASP Top 10 (ช่องโหว่ยอดฮิต) | https://owasp.org/www-project-top-ten/ |

---

[← บทที่ 11: Mini Project](./11-mini-project.md) · [🏠 สารบัญ](./README.md)
