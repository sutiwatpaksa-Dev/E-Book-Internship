# บทที่ 20: Deploy ขึ้น VPS (Docker Compose + Caddy + HTTPS) 🚀

> ⏱ ประมาณ 4 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 14, 15, 18 และ 19 · 🛠 ใช้: Docker Compose, Caddy, Git, SSH

> **⚡ สรุป 30 วินาที**
> - production มี 3 กล่อง: **db** (PostgreSQL), **server** (Hono), **web** (Caddy เสิร์ฟหน้าเว็บ + HTTPS + ส่ง `/api` ต่อให้ server)
> - เปิดสู่โลกแค่ **web (80/443)** ส่วน db และ server คุยกันในเครือข่ายภายในของ Docker
> - Caddy ขอ **certificate ฟรีจาก Let's Encrypt และต่ออายุให้เอง** แค่ DNS ชี้ถูก
> - ลำดับ deploy ทุกครั้ง: **pull → build → migrate → up**

---

## 📖 เรื่องเล่า

บิตเคย deploy โดย SSH เข้าเครื่อง รัน `bun run dev` ทิ้งไว้ใน terminal แล้วปิดโน้ตบุ๊คกลับบ้าน
เช้ามาเว็บล่ม เพราะปิด terminal = process ตายตาม 😅 ส่วนหน้าเว็บก็เป็น `http://` ขึ้น "Not secure" ตัวแดง

พี่ไบต์: *"production ต้อง **รันเองได้ ฟื้นเองได้ ปลอดภัยเอง** โดยไม่มีใครนั่งเฝ้า"*

---

## 1. ภาพ production

```
 Internet
    │  https://example.com            (DNS A record → IP ของ VPS: บทที่ 18)
    ▼
 ┌──────────────────────────── VPS (ufw: 22, 80, 443) ────────────────────────────┐
 │                                                                                │
 │  ┌─ web (Caddy) :80 :443 ─┐        Docker network ภายใน (คนนอกเข้าไม่ได้)        │
 │  │  /api/*  ──────────────┼──────>  server (Hono) :3000  ──────>  db (Postgres) │
 │  │  /*  → ไฟล์ React /srv  │                                        volume: pgdata│
 │  └────────────────────────┘                                                    │
 │     volume: caddy_data (เก็บ certificate)                                       │
 └────────────────────────────────────────────────────────────────────────────────┘
```

**ทำไมออกแบบแบบนี้**
| การตัดสินใจ | เหตุผล |
|---|---|
| หน้าเว็บกับ API อยู่โดเมนเดียว (`/api`) | cookie login ใช้ได้ทันที ไม่ต้อง CORS (บทที่ 15) |
| Caddy อยู่ในกล่องเดียวกับไฟล์หน้าเว็บ | build หน้าเว็บครั้งเดียวได้ image พร้อมเสิร์ฟ |
| db/server ไม่มี `ports:` | ไม่หลุดสู่โลก แม้ Docker จะข้าม ufw (บทที่ 19) |
| `restart: unless-stopped` | process ตาย / server reboot แล้วขึ้นเอง |
| volume สำหรับ db และ caddy | สร้างกล่องใหม่กี่ครั้งข้อมูลและ certificate ก็ไม่หาย |

---

## 2. 🔧 เตรียมไฟล์ใน repo (ทำในเครื่องเรา)

โครงสร้างหลังเพิ่มไฟล์
```
bit-cafe/
├─ client/
│  ├─ Dockerfile          ← ใหม่
│  └─ .dockerignore       ← ใหม่
├─ server/
│  ├─ Dockerfile          ← ใหม่
│  └─ .dockerignore       ← ใหม่
├─ deploy/
│  └─ Caddyfile           ← ใหม่
├─ compose.yaml           (dev: แค่ db จากบทที่ 14)
├─ compose.prod.yaml      ← ใหม่
└─ .env.prod.example      ← ใหม่ (ไม่มีค่าจริง)
```

### `server/Dockerfile`
```dockerfile
FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production   # เฉพาะ dependencies ที่ใช้ตอนรัน

COPY . .
ENV NODE_ENV=production
USER bun                                         # ไม่รันด้วย root
EXPOSE 3000
CMD ["bun", "src/index.ts"]
```
`server/.dockerignore`
```
node_modules
.env
*.http
*.log
```
> 💡 Bun รัน TypeScript ได้ตรงๆ ไม่ต้อง build เป็น JS ก่อน และ `src/db/migrate.ts` (บทที่ 14) ใช้แค่ `drizzle-orm` จึงรัน migration ใน image นี้ได้แม้ไม่มี `drizzle-kit`

### `client/Dockerfile` (multi-stage: build แล้วส่งต่อให้ Caddy)
```dockerfile
# ขั้นที่ 1: build หน้าเว็บเป็นไฟล์ static
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# ขั้นที่ 2: Caddy เสิร์ฟไฟล์ + ทำ HTTPS + ส่ง /api ต่อให้ server
FROM caddy:2
COPY --from=build /app/dist /srv
```
`client/.dockerignore`
```
node_modules
dist
*.log
```

### `deploy/Caddyfile`
```
{$DOMAIN} {
	encode zstd gzip

	header {
		Strict-Transport-Security "max-age=31536000"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
	}

	handle /api/* {
		reverse_proxy server:3000
	}

	handle {
		root * /srv
		@assets path /assets/*
		header @assets Cache-Control "public, max-age=31536000, immutable"
		try_files {path} /index.html
		file_server
	}
}

www.{$DOMAIN} {
	redir https://{$DOMAIN}{uri} permanent
}
```
อ่านทีละส่วน:
| บรรทัด | ทำอะไร |
|---|---|
| `{$DOMAIN} {` | เว็บของโดเมนนี้ (อ่านจาก env) เขียนชื่อโดเมน = **Caddy ทำ HTTPS ให้อัตโนมัติ** และ redirect http → https |
| `encode zstd gzip` | บีบอัดไฟล์ก่อนส่ง เว็บโหลดเร็วขึ้น |
| `header { ... }` | header ความปลอดภัย: บังคับ HTTPS, ห้ามเว็บอื่นเอาเราไปใส่ iframe, ซ่อนชื่อ server |
| `handle /api/*` → `reverse_proxy server:3000` | request API ส่งต่อให้กล่องชื่อ `server` (ชื่อ service ใน compose) |
| `try_files {path} /index.html` | ไม่มีไฟล์ตาม path (เช่น `/about`) → ส่ง `index.html` ให้ React Router จัดการ (บทที่ 13) |
| `@assets ... immutable` | ไฟล์ใน `/assets/` มี hash ในชื่อ ให้ browser จำได้ 1 ปี |
| `www.{$DOMAIN}` | `www.example.com` → redirect ไป `example.com` |

> 🔐 Caddy **เขียนทับ** header `X-Forwarded-For` ที่ client ส่งมาเองด้วย IP จริง rate limit ใน `rateLimit.ts` (บทที่ 14) จึงเชื่อค่านี้ได้ **เฉพาะเมื่อ API เข้าได้ทางเดียวผ่าน Caddy** ซึ่งเป็นเหตุผลที่ server ห้ามมี `ports:`

### `compose.prod.yaml`
```yaml
name: bitcafe

x-logging: &logging              # ตั้งครั้งเดียว ใช้ทุกกล่อง: log ไม่โตจนดิสก์เต็ม
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

services:
  db:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?ต้องตั้ง POSTGRES_PASSWORD ใน .env}
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:                    # บอก Docker ว่า "พร้อมจริง" คือเมื่อไหร่
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10
    logging: *logging
    # ไม่มี ports: → คนนอกต่อไม่ได้

  server:
    build: ./server
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://app:${POSTGRES_PASSWORD}@db:5432/app
      JWT_SECRET: ${JWT_SECRET:?ต้องตั้ง JWT_SECRET ใน .env}
      NODE_ENV: production          # → cookie มี Secure (บทที่ 15)
      PORT: "3000"
      ADMIN_EMAIL: ${ADMIN_EMAIL:-}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-}
    depends_on:
      db:
        condition: service_healthy  # รอ db พร้อมจริงก่อนเปิด server
    logging: *logging
    # ไม่มี ports: → เข้าได้ทางเดียวผ่าน Caddy

  web:
    build: ./client
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"               # HTTP/3
    environment:
      DOMAIN: ${DOMAIN:?ต้องตั้ง DOMAIN ใน .env}
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data            # ⚠️ certificate อยู่ที่นี่ ห้ามหาย
      - caddy_config:/config
    depends_on:
      - server
    logging: *logging

volumes:
  pgdata:
  caddy_data:
  caddy_config:
```
👀 `${ตัวแปร:?ข้อความ}` = ถ้าไม่ได้ตั้งค่า compose จะหยุดพร้อมบอกข้อความ ดีกว่าเปิดระบบขึ้นมาด้วยรหัสผ่านว่าง

### `.env.prod.example` (commit ได้ ไม่มีค่าจริง)
```
DOMAIN=example.com
POSTGRES_PASSWORD=
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

### อย่าลืมแก้
- โฟลเดอร์ `server/drizzle/` (ไฟล์ migration) ต้อง **commit ขึ้น Git** server จะรัน migration จากไฟล์ชุดนี้
- `client/public/robots.txt` และ `sitemap.xml` เปลี่ยน `example.com` เป็นโดเมนจริง (บทที่ 13)
- meta OG ค่าเริ่มต้นใน `client/index.html` (บทที่ 13 ข้อ 7)

**ทดสอบในเครื่องก่อน** (ตรวจไฟล์ compose โดยไม่ต้องรัน)
```bash
cp .env.prod.example .env       # ใส่ค่าอะไรก็ได้ชั่วคราว
docker compose -f compose.prod.yaml config --quiet && echo OK
rm .env
```
แล้ว commit + push ขึ้น GitHub/GitLab

---

## 3. 🔧 ชี้ DNS

ที่ Cloudflare (บทที่ 18) เพิ่ม `A @ → IP ของ VPS` และ `CNAME www → example.com` แบบ **DNS only** แล้วตรวจ:
```bash
dig +short example.com          # ต้องได้ IP ของ VPS ก่อนไปขั้นต่อไป
```
> ⚠️ ถ้า DNS ยังไม่ชี้มาที่ VPS แล้วเปิด Caddy ไปก่อน Caddy จะขอ certificate ไม่ผ่าน (Let's Encrypt ตรวจไม่เจอเรา) และถ้าลองซ้ำหลายครั้งอาจโดนจำกัดชั่วคราว **DNS ก่อน แล้วค่อย up**

---

## 4. 🔧 เอาโค้ดขึ้น server

```bash
ssh bitcafe
```

**repo เป็น private** ใช้ **deploy key** (กุญแจที่อ่าน repo นี้ได้อย่างเดียว)
```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N "" -C "bitcafe-server"
cat ~/.ssh/deploy_key.pub
```
- GitHub: repo → Settings → **Deploy keys** → Add (ไม่ต้องติ๊ก write access)
- GitLab: repo → Settings → Repository → **Deploy keys**

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/deploy_key
EOF

git clone git@github.com:<org>/bit-cafe.git ~/bit-cafe
cd ~/bit-cafe
```

**สร้าง `.env` บน server** (ไฟล์นี้อยู่บน server เท่านั้น ไม่เคยอยู่ใน Git)
```bash
cp .env.prod.example .env
openssl rand -hex 24          # → ใช้เป็น POSTGRES_PASSWORD (hex ไม่มีอักขระพิเศษ ใส่ใน URL ได้)
openssl rand -base64 48       # → ใช้เป็น JWT_SECRET
nano .env                     # ใส่ DOMAIN, ค่าที่สุ่มได้, อีเมลและรหัส admin คนแรก
chmod 600 .env                # ให้ deploy อ่านได้คนเดียว
```

---

## 5. 🔧 เปิดระบบครั้งแรก

```bash
docker compose -f compose.prod.yaml build                              # ① build image
docker compose -f compose.prod.yaml run --rm server bun run db:migrate # ② สร้างตาราง
docker compose -f compose.prod.yaml run --rm server bun run seed       # ③ ข้อมูลตั้งต้น + admin คนแรก
docker compose -f compose.prod.yaml up -d                              # ④ เปิดทั้งระบบ
docker compose -f compose.prod.yaml ps                                 # ทุกกล่องต้อง running (db = healthy)
```
💡 พิมพ์ยาวเหนื่อย ตั้ง alias ใน `~/.bashrc` ของ server: `alias dc='docker compose -f ~/bit-cafe/compose.prod.yaml'` แล้วใช้ `dc ps`, `dc logs -f`

ดู Caddy ขอ certificate:
```bash
docker compose -f compose.prod.yaml logs -f web
# มองหา "certificate obtained successfully" แล้วกด Ctrl+C
```

**หลัง seed เสร็จ** ลบบรรทัด `ADMIN_PASSWORD` ออกจาก `.env` (ไม่ต้องเก็บรหัสผ่านไว้บน server) แล้ว `up -d` อีกครั้ง และให้เจ้าของร้านเปลี่ยนรหัสผ่านเองเมื่อมีหน้าเปลี่ยนรหัส

---

## 6. ✅ ตรวจว่าใช้ได้จริง

```bash
curl -I http://example.com                 # 308 → https://example.com/
curl -I https://www.example.com            # 301 → https://example.com/
curl -sS https://example.com/api/health    # {"status":"ok"}
curl -sS https://example.com/api/services  # ข้อมูลจาก seed
curl -I https://example.com/about          # 200 (ไม่ใช่ 404: try_files ทำงาน)
curl -s -o /dev/null -w "%{http_code}\n" https://example.com/api/admin/me   # 401
```
**ในเครื่อง server** ตรวจว่า db กับ server ไม่หลุดสู่โลก:
```bash
sudo ss -tlnp | grep -E ':5432|:3000' || echo "✅ ไม่มี 5432/3000 เปิดสู่ภายนอก"
```
**จากเครื่องเรา**:
```bash
curl -m 5 http://203.0.113.10:5432 ; curl -m 5 http://203.0.113.10:3000   # ต้อง timeout / refused ทั้งคู่
```
**ใน browser:** เปิดเว็บ → 🔒 ขึ้น, login หลังบ้านได้, DevTools → Application → Cookies ต้องเห็น `session` มี ✅ HttpOnly ✅ Secure, SameSite = Lax
**มือถือจริง:** เปิดผ่าน 4G (ไม่ใช่ Wi-Fi บริษัท) แล้วลองแชร์ลิงก์ลง LINE

---

## 7. 🔄 อัปเดตเวอร์ชันใหม่ (manual)

```bash
ssh bitcafe
cd ~/bit-cafe
git pull
docker compose -f compose.prod.yaml build
docker compose -f compose.prod.yaml run --rm server bun run db:migrate
docker compose -f compose.prod.yaml up -d
docker image prune -f                      # ลบ image เก่าที่ไม่ใช้ กันดิสก์เต็ม
```
**ทำไม migrate ก่อน up?** โค้ดใหม่อาจต้องใช้คอลัมน์ใหม่ ถ้าเปิดโค้ดใหม่ก่อนมีคอลัมน์ ลูกค้าจะเจอ error ช่วงสั้นๆ

> ⚠️ **migration ต้อง "เพิ่มอย่างเดียว" (expand-only)** ระหว่าง migrate โค้ดเก่ายังวิ่งอยู่ ถ้า migration ลบ/เปลี่ยนชื่อคอลัมน์ที่โค้ดเก่าใช้ เว็บจะพังทันที จำเป็นต้องลบจริงให้แยก 2 รอบ deploy: รอบแรกเลิกใช้คอลัมน์ในโค้ด รอบที่สองค่อยลบ

**ถอยเวอร์ชัน (rollback)** เมื่อเวอร์ชันใหม่มีปัญหา
```bash
git log --oneline -5                       # หา commit ที่ดีล่าสุด
git checkout <commit>
docker compose -f compose.prod.yaml up -d --build
```
(ถอยได้เฉพาะโค้ด migration ที่รันไปแล้วไม่ถอยตาม จึงสำคัญที่ต้องเป็น expand-only) แก้เสร็จแล้วกลับมา `git checkout main`

บทที่ 21 จะทำให้ขั้นตอนนี้เกิดเองทุกครั้งที่ merge เข้า `main`

---

## 8. ⚠️ ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| log ของ web: `challenge failed` / `no such host` | DNS ยังไม่ชี้มา VPS, เปิด Cloudflare proxy (เมฆส้ม), ufw ปิด 80 | `dig +short`, ใช้ DNS only, `sudo ufw status` |
| เว็บขึ้นแต่ `/api/...` ได้ `502` | server ล่ม / ชื่อใน Caddyfile ไม่ตรงชื่อ service | `dc ps`, `dc logs server` |
| server restart วนไม่หยุด | `.env` ขาดค่า (ZodError ใน log), ต่อ db ไม่ได้ | `dc logs server` อ่านบรรทัดแรกของ error |
| refresh `/about` ได้ 404 | ไม่มี `try_files` | ตรวจ Caddyfile |
| login ได้แต่ refresh แล้วหลุด | cookie มี `Secure` แต่เปิดผ่าน `http://` | ใช้ `https://` เสมอ (Caddy redirect ให้แล้ว) |
| `required variable ... is missing a value` | ยังไม่สร้าง `.env` หรือไม่ได้อยู่ในโฟลเดอร์ repo | `cd ~/bit-cafe` แล้วตรวจ `.env` |
| build ค้าง / โดน `Killed` | RAM ไม่พอ | เปิด swap (บทที่ 19) |
| ดิสก์เต็ม | image เก่าสะสม | `docker image prune -f`, `docker system df` |
| `down -v` แล้วข้อมูลหาย 😱 | `-v` ลบ volume ทั้ง db และ certificate | **ห้ามใช้ `-v` บน production** กู้จาก backup (บทที่ 23) |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ทำไม service <code>db</code> และ <code>server</code> ไม่มี <code>ports:</code> แล้ว Caddy ยังเรียก server ได้?</summary>

ทุกกล่องใน compose เดียวกันอยู่ใน Docker network ภายใน เรียกกันด้วยชื่อ service (`server:3000`, `db:5432`) ได้โดยไม่ต้องเปิด port สู่เครื่อง host `ports:` มีไว้เปิดให้คนนอกเท่านั้น
</details>

<details><summary>2. ถ้าลบ volume <code>caddy_data</code> จะเกิดอะไร?</summary>

certificate หายต้องขอใหม่ทุกครั้งที่สร้างกล่อง ถ้าทำบ่อยจะชน rate limit ของ Let's Encrypt แล้วเว็บไม่มี HTTPS ไปช่วงหนึ่ง
</details>

<details><summary>3. ทำไมลำดับคือ build → migrate → up ไม่ใช่ up แล้วค่อย migrate?</summary>

build ก่อนเพื่อให้ image ใหม่พร้อม (เว็บเดิมยังวิ่งอยู่) migrate ก่อนเปิดโค้ดใหม่เพื่อให้คอลัมน์ที่โค้ดใหม่ต้องใช้มีอยู่แล้ว แล้วค่อยสลับเป็นโค้ดใหม่
</details>

<details><summary>4. <code>/api/admin/me</code> บน production ได้ 200 โดยไม่ login ควรทำอะไร?</summary>

หยุดทุกอย่างแล้วแก้ทันที เป็นข้อที่ทำให้ไม่ผ่าน ตรวจลำดับ `app.route` / `app.use` ใน `index.ts` (บทที่ 15) และเขียน test ให้ทุก admin endpoint ต้อง 401
</details>

---

## ✏️ แบบฝึกหัด

deploy Bit Café (หรือ STARTER ของตัวเอง) ขึ้น VPS ด้วยโดเมนจริงหรือ subdomain ที่พี่เลี้ยงให้ แล้วส่ง: ลิงก์เว็บ, ผล `curl -I` ข้อ 6 ทั้งหมด, แคปจอ cookie ใน DevTools และแคปจอการ์ดตอนแชร์ลิงก์ลง LINE

## ✅ ผ่านด่าน

- [ ] เขียน Dockerfile ของ server และ client (multi-stage) ได้
- [ ] อธิบาย Caddyfile ได้ทุกบรรทัด
- [ ] compose.prod.yaml เปิดสู่โลกแค่ 80/443 และมี healthcheck, restart, volume, log rotation
- [ ] deploy ครั้งแรกได้ HTTPS อัตโนมัติ และตรวจครบตามข้อ 6
- [ ] อัปเดตเวอร์ชันและ rollback ได้ และเข้าใจ migration แบบ expand-only

---

[← บทที่ 19: Server](./19-server.md) · [🏠 สารบัญ](./README.md) · [บทที่ 21: CI/CD →](./21-cicd.md)
