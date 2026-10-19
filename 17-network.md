# บทที่ 17: Network พื้นฐานสำหรับ Dev 🌐

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 0, 2 และ 5 · 🛠 ใช้: Terminal (`ping`, `curl`, `dig`/`nslookup`, `traceroute`)

> **⚡ สรุป 30 วินาที**
> - พิมพ์ URL แล้วเกิด 4 อย่าง: **DNS** แปลงชื่อเป็น IP → ต่อ **TCP** ไปที่ IP:port → คุย **TLS** (ถ้า HTTPS) → ส่ง **HTTP**
> - **IP** = ที่อยู่เครื่อง / **Port** = ห้องในเครื่อง / **Firewall** = ยามหน้าตึก
> - `localhost` ≠ `0.0.0.0` ≠ IP สาธารณะ เรื่องนี้ทำให้ deploy พังบ่อยที่สุด
> - ใช้ `curl -v`, `dig`, `ping` ดูทีละชั้นว่าพังตรงไหน

---

## 📖 เรื่องเล่า

บิต deploy เว็บครั้งแรก เปิดในเครื่องตัวเองได้ แต่ส่งลิงก์ให้ลูกค้าแล้วลูกค้าเปิดไม่ได้ 😰
บิตลอง restart server 3 รอบ ลบ Docker ทิ้งสร้างใหม่ ก็ยังไม่ได้

พี่ไบต์ถามคำถามเดียว: *"เปิดไม่ได้แบบไหน? หาชื่อไม่เจอ, ต่อไม่ติด, หรือต่อติดแต่ได้ error?"*
บิตตอบไม่ได้ เพราะไม่รู้ว่า **การเปิดเว็บ 1 ครั้งมีหลายขั้น** และแต่ละขั้นพังคนละแบบ

---

## 1. เปิดเว็บ 1 ครั้งเกิดอะไรขึ้น

```
 พิมพ์ https://shop.example.com/about
        |
  ① DNS      "shop.example.com อยู่ที่ IP อะไร?"            → 203.0.113.10
        |
  ② TCP      ต่อสายไปที่ 203.0.113.10 port 443              → ต่อติด / timeout / refused
        |
  ③ TLS      ขอดูใบรับรอง (certificate) ว่าเป็นเว็บจริง        → 🔒 / "Your connection is not private"
        |
  ④ HTTP     GET /about                                     → 200 / 404 / 502
```

> 💡 **เปรียบเทียบ: ส่งพัสดุ** 📦
> ① DNS = เปิดสมุดหาที่อยู่จากชื่อร้าน / ② TCP = เดินไปถึงหน้าตึกและมีคนเปิดประตู / ③ TLS = ตรวจบัตรว่าเป็นร้านจริงไม่ใช่ร้านปลอม / ④ HTTP = ยื่นใบสั่งของ

**อาการ → พังที่ชั้นไหน**
| อาการที่เห็น | ชั้น | สาเหตุที่พบบ่อย |
|---|---|---|
| `DNS_PROBE_FINISHED_NXDOMAIN`, `Could not resolve host` | ① DNS | ยังไม่ตั้ง DNS, พิมพ์ชื่อผิด, DNS ยังไม่กระจาย |
| `Connection timed out` | ② TCP | firewall บล็อก, IP ผิด, server ปิดอยู่ |
| `Connection refused` | ② TCP | ถึงเครื่องแล้ว แต่ **ไม่มีโปรแกรมฟัง port นั้น** |
| `Your connection is not private`, `SSL certificate problem` | ③ TLS | ยังไม่มี certificate, ใบหมดอายุ, ชื่อไม่ตรง |
| `502 Bad Gateway` | ④ HTTP | reverse proxy ต่อไปหา app ไม่ได้ (app ล่ม / ชื่อผิด) |
| `404` / `500` | ④ HTTP | ถึงแอปแล้ว ปัญหาอยู่ในโค้ดหรือ route |

---

## 2. IP Address

**IP** = ที่อยู่ของเครื่องในเครือข่าย

| ชนิด | ตัวอย่าง | อยู่ที่ไหน |
|---|---|---|
| **Private IP** | `192.168.1.25`, `10.0.0.5`, `172.17.0.2` | ในบ้าน/ออฟฟิศ/ใน Docker ใช้ได้เฉพาะในวงนั้น |
| **Public IP** | `203.0.113.10` | ทั้งโลกมองเห็น server ที่เช่า (VPS) จะได้ IP แบบนี้ |
| **Loopback** | `127.0.0.1` (`localhost`) | เครื่องตัวเองเท่านั้น |
| **IPv6** | `2001:db8::1` | IP รุ่นใหม่ ยาวกว่า มีพอให้ทุกอุปกรณ์ในโลก |

```
 บ้านเรา (Private)                         Internet (Public)
 [ โน้ตบุ๊ค 192.168.1.25 ] ─┐
 [ มือถือ   192.168.1.30 ] ─┼─ [ Router ] ── IP สาธารณะ 1 ตัว ──  [ VPS 203.0.113.10 ]
 [ Smart TV 192.168.1.40 ] ─┘   (NAT: แปลง private ↔ public)
```
👀 นี่คือเหตุผลที่ลูกค้าเปิด `http://192.168.1.25:5173` ในเครื่องเราไม่ได้: IP นี้มีความหมายเฉพาะในวง Wi-Fi บ้านเรา

```bash
curl -4 ifconfig.me       # IP สาธารณะที่โลกเห็นเรา
ipconfig getifaddr en0    # Mac: IP ในวง Wi-Fi  (Windows: ipconfig / Linux: ip addr)
```

---

## 3. Port และ "ใครฟังอยู่"

**Port** = หมายเลขช่องทาง 0–65535 บนเครื่องเดียวกัน 1 โปรแกรมฟังได้หลาย port แต่ 1 port มีเจ้าของได้คนเดียว

| Port | ใช้กับ | ตั้งไว้ใน |
|---|---|---|
| `22` | SSH (เข้า server) | บทที่ 19 |
| `80` | HTTP | Caddy (บทที่ 20) |
| `443` | HTTPS | Caddy (บทที่ 20) |
| `3000` | API ของเรา (Hono) | บทที่ 14 |
| `5173` | Vite dev server | บทที่ 11 |
| `5432` | PostgreSQL | บทที่ 2, 14 |

**ดูว่าใครใช้ port อยู่**
```bash
lsof -i :3000                # Mac
sudo ss -tlnp                # Linux (server): รายการ port ที่มีโปรแกรมฟังอยู่ทั้งหมด
```

### ⚠️ `localhost` vs `0.0.0.0` (สำคัญมาก)
เวลา server "ฟัง" port ต้องบอกด้วยว่าฟังที่ **interface ไหน**
| ฟังที่ | ใครเรียกได้ |
|---|---|
| `127.0.0.1` / `localhost` | เฉพาะโปรแกรมในเครื่อง (หรือใน container) เดียวกัน |
| `0.0.0.0` | ทุก interface: เครื่องอื่น / container อื่นเรียกได้ |

```
 Container "server" ฟังที่ 127.0.0.1:3000  →  Caddy (อีก container) เรียกไม่ถึง  →  502 Bad Gateway 😵
 Container "server" ฟังที่ 0.0.0.0:3000    →  Caddy เรียก server:3000 ได้       →  ✅
```
💡 `Bun.serve` (ที่ Hono ใช้ใน `export default { fetch }`) ฟังที่ `0.0.0.0` เป็นค่าเริ่มต้นอยู่แล้ว แต่ framework อื่นบางตัวฟัง `localhost` ต้องตั้งเอง

---

## 4. TCP, UDP, HTTP, HTTPS

| | ทำอะไร | 💡 เปรียบเทียบ |
|---|---|---|
| **TCP** | ส่งข้อมูลแบบรับประกันว่าถึงครบ เรียงลำดับถูก | ส่งพัสดุลงทะเบียน มีเซ็นรับ |
| **UDP** | ส่งเร็ว ไม่รับประกัน | ตะโกนบอก ได้ยินก็ได้ไม่ได้ยินก็แล้วไป (วิดีโอคอล, เกม, HTTP/3) |
| **HTTP** | ภาษาที่ browser คุยกับ server (บทที่ 5) วิ่งบน TCP | ใบสั่งของ |
| **HTTPS** | HTTP ที่ห่อด้วย **TLS** เข้ารหัส + ยืนยันตัวตน | ใบสั่งของในซองปิดผนึก + ตรวจบัตรผู้รับ |

**ทำไมต้อง HTTPS ทุกเว็บ** (แม้เว็บร้านกาแฟ)
- คนใน Wi-Fi เดียวกันอ่าน/แก้ข้อมูลที่ส่งผ่าน HTTP ได้ รวมถึง cookie login ของ admin 😱
- browser ขึ้นคำว่า "Not secure" ลูกค้าไม่กล้าใช้
- cookie ที่ตั้ง `Secure` (บทที่ 15) จะไม่ถูกส่งเลยถ้าไม่ใช่ HTTPS

**Certificate** = บัตรประชาชนของเว็บ ออกโดยหน่วยงานที่ browser เชื่อ (CA) เช่น **Let's Encrypt** (ฟรี) ปกติอายุ 90 วัน ต้องต่ออายุอัตโนมัติ ซึ่ง Caddy ทำให้เอง (บทที่ 20)

---

## 5. Firewall

**Firewall** = กฎว่า port ไหนอนุญาตให้คนนอกเข้ามาได้

```
 Internet ──> [ Firewall ] ──> VPS
               22  ✅  (SSH เฉพาะเรา)
               80  ✅  (HTTP → redirect ไป HTTPS)
               443 ✅  (HTTPS)
               5432 ❌ (ฐานข้อมูล ห้ามเปิดสู่โลก!)
               3000 ❌ (API ให้เข้าผ่าน Caddy เท่านั้น)
```
> ⚠️ **หลักการ:** เปิดเฉพาะที่จำเป็น (deny by default) ฐานข้อมูลที่เปิด 5432 สู่โลกจะถูก bot สแกนเจอภายในไม่กี่ชั่วโมง

Firewall มี 2 ชั้นที่ต้องรู้: **firewall ของผู้ให้บริการ VPS** (ตั้งในหน้าเว็บ) และ **firewall ในเครื่อง** (`ufw` บน Ubuntu) ตั้งในบทที่ 19

---

## 6. Reverse Proxy

**Reverse proxy** = ประตูหน้าบ้านบานเดียว รับทุก request แล้วส่งต่อไปยังโปรแกรมที่ถูกต้องข้างใน

```
                        ┌─ /api/*  ──> server:3000  (Hono)
 Internet ──443──> Caddy┤
                        └─ /*      ──> ไฟล์หน้าเว็บที่ build แล้ว (React)
```
**ได้อะไร**
- เปิด port สู่โลกแค่ 80/443 ที่เดียว
- จัดการ HTTPS/certificate ที่เดียว
- หน้าเว็บกับ API อยู่ **origin เดียวกัน** → cookie login ใช้ได้ง่าย ไม่ต้องตั้ง CORS (บทที่ 14–15)
- ตอนอัปเดต app ข้างในเปลี่ยนได้โดยลูกค้าไม่รู้ตัว

---

## 7. 🔧 ลงมือ: เครื่องมือดูทีละชั้น

```bash
# ① DNS: ชื่อนี้ชี้ไป IP อะไร
dig +short example.com              # Mac/Linux
nslookup example.com                # Windows ก็มี

# ② ต่อถึงเครื่องไหม
ping -c 3 example.com               # บาง server ปิด ping ไว้ ไม่ตอบไม่ได้แปลว่าเครื่องล่ม
traceroute example.com              # Windows: tracert  (ดูเส้นทางผ่านกี่จุด)

# ②③④ ดูทุกขั้นในคำสั่งเดียว
curl -v https://example.com
```
อ่านผล `curl -v` ทีละท่อน:
```
* Host example.com:443 was resolved.            ← ① DNS ผ่าน
*   Trying 203.0.113.10:443...
* Connected to example.com (203.0.113.10) port 443   ← ② TCP ผ่าน
* SSL connection using TLSv1.3 ...
*  subject: CN=example.com                      ← ③ TLS ผ่าน ใบรับรองตรงชื่อ
> GET / HTTP/2                                   ← ④ request ที่เราส่ง
< HTTP/2 200                                     ← ④ response ที่ได้
```
บรรทัดไหนหายไป หรือมี error = พังที่ชั้นนั้น 🎯

```bash
curl -I https://example.com         # ดูแค่ header ของ response
curl -sS -o /dev/null -w "%{http_code} %{time_total}s\n" https://example.com   # status + เวลา
```

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ได้ <code>Connection refused</code> กับ <code>Connection timed out</code> ต่างกันยังไง?</summary>

refused = ไปถึงเครื่องแล้ว แต่ไม่มีโปรแกรมฟัง port นั้น (app ไม่ได้รัน หรือฟังผิด port) / timed out = ไปไม่ถึงหรือไม่มีใครตอบเลย มักเป็น firewall บล็อก หรือ IP ผิด
</details>

<details><summary>2. ทำไม API ใน container ฟังที่ <code>127.0.0.1</code> แล้ว Caddy ได้ 502?</summary>

แต่ละ container มี localhost ของตัวเอง `127.0.0.1` ใน container server หมายถึงตัวมันเอง Caddy ที่อยู่อีก container จึงต่อไม่ถึง ต้องฟังที่ `0.0.0.0`
</details>

<details><summary>3. ทำไมไม่เปิด port 5432 ของฐานข้อมูลสู่ Internet?</summary>

bot สแกนหา port ฐานข้อมูลตลอดเวลาแล้วเดารหัสผ่าน ฐานข้อมูลควรคุยได้เฉพาะกับ API ในเครือข่ายภายใน (Docker network) เท่านั้น
</details>

<details><summary>4. เว็บขึ้น <code>502 Bad Gateway</code> ควรดูอะไรก่อน?</summary>

ชั้น DNS/TCP/TLS ผ่านแล้ว (ไม่งั้นไม่เห็น 502) ปัญหาอยู่ระหว่าง reverse proxy กับ app: app ล่มไหม (`docker compose ps`, `logs`), ชื่อ service/port ใน Caddyfile ถูกไหม, app ฟัง `0.0.0.0` ไหม
</details>

---

## ✏️ แบบฝึกหัด

ใช้ `dig`, `curl -v` และ `curl -I` กับ 3 เว็บ: เว็บธนาคาร, เว็บข่าว, และ `http://` (ไม่มี s) ของเว็บใดเว็บหนึ่ง จดว่าแต่ละเว็บ: IP อะไร, TLS เวอร์ชันอะไร, ใบรับรองออกโดยใคร, ตอบ status อะไร และ `http://` ถูก redirect ไปที่ไหน

## ✅ ผ่านด่าน

- [ ] อธิบาย 4 ขั้น DNS → TCP → TLS → HTTP ได้ และรู้ว่าอาการแบบไหนพังชั้นไหน
- [ ] แยก private / public / loopback IP ได้
- [ ] รู้ว่า `localhost` กับ `0.0.0.0` ต่างกันยังไง
- [ ] อธิบายได้ว่าทำไมต้อง HTTPS, firewall และ reverse proxy
- [ ] ใช้ `dig`, `curl -v`, `lsof`/`ss` หาปัญหาได้

---

[← 🏪 Mini Project: STARTER](./starter/submission.md) · [🏠 สารบัญ](./README.md) · [บทที่ 18: Domain & DNS →](./18-domain-dns.md)
