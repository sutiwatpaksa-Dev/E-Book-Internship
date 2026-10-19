# บทที่ 18: Domain & DNS 🏷️

> ⏱ ประมาณ 2 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 17 · 🛠 ใช้: บัญชีผู้ให้บริการโดเมน, Cloudflare (ฟรี), `dig`

> **⚡ สรุป 30 วินาที**
> - **Domain** = ชื่อเว็บที่เช่ารายปี / **DNS** = สมุดโทรศัพท์ที่บอกว่าชื่อนี้ไปที่ IP ไหน
> - record ที่ใช้บ่อย: **A** (ชื่อ → IPv4), **CNAME** (ชื่อ → ชื่ออื่น), **TXT** (ยืนยันตัวตน), **MX** (อีเมล)
> - เปลี่ยน DNS แล้วไม่เห็นผลทันที เพราะ **TTL / cache** รอได้ตั้งแต่ไม่กี่นาทีถึงหลายชั่วโมง
> - งานลูกค้า: โดเมน **ต้องจดในชื่อลูกค้า** ไม่ใช่ชื่อ dev

---

## 📖 เรื่องเล่า

ลูกค้าโทรมาเสียงสั่น: *"เว็บร้านหายไปทั้งเว็บเลย!"*
บิตเช็คแล้วพบว่าโดเมนหมดอายุ เพราะ dev คนก่อนจดโดเมนด้วยบัญชีส่วนตัว อีเมลแจ้งเตือนต่ออายุเลยไปเข้ากล่องของคนที่ลาออกไปแล้ว 😱

พี่ไบต์: *"เรื่องโดเมนดูเหมือนเล็ก แต่พลาดทีเว็บหายทั้งเว็บ วันนี้เรียนให้ครบ"*

---

## 1. Domain ทำงานยังไง

```
 shop.example.com
  │     │       └── TLD (Top-Level Domain): .com, .net, .shop, .th
  │     └────────── ชื่อที่เราเช่า (registered domain): example.com
  └──────────────── subdomain: ตั้งเองได้ไม่จำกัด ฟรี (shop, api, admin, www)
```

**ใครเกี่ยวข้อง**
| ผู้เล่น | หน้าที่ | 💡 เปรียบเทียบ |
|---|---|---|
| **Registrar** | ร้านที่เราเช่าโดเมน (จ่ายรายปี) | สำนักงานที่ดิน ออกโฉนด |
| **DNS provider** (nameserver) | เก็บ record ว่าชื่อไหนไป IP ไหน | สมุดโทรศัพท์ |
| **Hosting / VPS** | เครื่องที่รันเว็บจริง | ตัวบ้าน |

3 อย่างนี้ **อยู่คนละเจ้าได้** เช่น จดโดเมนที่ Registrar A, ใช้ DNS ของ Cloudflare, เว็บอยู่บน VPS ของเจ้า C

**เลือก TLD**
| TLD | เหมาะกับ | หมายเหตุ |
|---|---|---|
| `.com` | ทั่วไป คนจำง่ายที่สุด | ชื่อดีๆ มักถูกจดไปแล้ว |
| `.co.th` | บริษัทในไทย | ต้องใช้เอกสารนิติบุคคล (หนังสือรับรองบริษัท) |
| `.in.th` / `.th` | บุคคล/องค์กรในไทย | เงื่อนไขตามประเภท ดูที่ผู้ให้บริการโดเมน `.th` |
| `.shop`, `.cafe`, `.studio` | ธุรกิจเฉพาะทาง | ปีแรกมักถูก **ปีต่อไปแพงขึ้นมาก** อ่านราคาต่ออายุก่อนจด |

---

## 2. DNS Records ที่ต้องรู้

| Type | ชี้จาก → ไป | ตัวอย่าง | ใช้เมื่อ |
|---|---|---|---|
| **A** | ชื่อ → IPv4 | `example.com → 203.0.113.10` | ชี้ไปที่ VPS |
| **AAAA** | ชื่อ → IPv6 | `example.com → 2001:db8::10` | VPS มี IPv6 |
| **CNAME** | ชื่อ → **ชื่ออื่น** | `www.example.com → example.com` | ชี้ไปบริการที่ให้ชื่อมา เช่น Vercel |
| **TXT** | ชื่อ → ข้อความ | `"google-site-verification=..."` | ยืนยันว่าเป็นเจ้าของโดเมน, ตั้งค่าอีเมล (SPF) |
| **MX** | ชื่อ → mail server | `example.com → mx.mailprovider.com` | อีเมล `@example.com` |
| **CAA** | ระบุว่า CA ไหนออกใบรับรองได้ | `0 issue "letsencrypt.org"` | เพิ่มความปลอดภัย (ไม่บังคับ) |
| **NS** | บอกว่าใครเป็น DNS ของโดเมน | `ns1.cloudflare.com` | ตั้งที่ registrar ตอนย้าย DNS |

**TTL (Time To Live)** = จำนวนวินาทีที่เครื่องอื่นจำคำตอบไว้ (cache) ก่อนมาถามใหม่
- TTL 3600 = แก้ record แล้วบางคนอาจยังเห็นค่าเก่าได้นานถึง 1 ชั่วโมง
- 💡 **ก่อนย้ายเครื่อง** ลด TTL เหลือ 300 ล่วงหน้า 1 วัน ย้ายเสร็จค่อยปรับกลับ

> ⚠️ **กฎ CNAME:** ชื่อที่เป็น CNAME ห้ามมี record อื่นอยู่ด้วย และ **root domain** (`example.com` เปล่าๆ) ใช้ CNAME ตามมาตรฐานไม่ได้ (Cloudflare มีฟีเจอร์ CNAME flattening ช่วยได้) จึงมักใช้ A ที่ root และ CNAME ที่ `www`

---

## 3. 🔧 ลงมือ: จดโดเมน + ใช้ DNS ของ Cloudflare

**ทำไม Cloudflare:** DNS ฟรี, เปลี่ยนแล้วมีผลเร็ว, หน้าจอใช้ง่าย, เปิด proxy/กันโจมตีได้ในอนาคต

1. **จดโดเมน** ที่ registrar ที่บริษัทใช้ (หรือ Cloudflare Registrar)
   - ✅ เปิด **auto-renew** + ใส่อีเมลที่ **ลูกค้า/บริษัทเป็นเจ้าของ** (ไม่ใช่อีเมลส่วนตัว dev)
   - ✅ เปิด **2FA** ที่บัญชี registrar
2. **เพิ่มโดเมนใน Cloudflare:** dash.cloudflare.com → Add a domain → เลือกแผน Free
3. Cloudflare จะให้ **nameserver 2 ตัว** (เช่น `xxx.ns.cloudflare.com`) → เอาไปใส่ที่หน้าตั้งค่าโดเมนของ registrar แทนของเดิม
4. รอสถานะใน Cloudflare เป็น **Active** (ไม่กี่นาทีถึงไม่กี่ชั่วโมง)
5. **เพิ่ม record ชี้ไป VPS** (IP จากบทที่ 19)

| Type | Name | Content | Proxy status | TTL |
|---|---|---|---|---|
| A | `@` (= example.com) | `203.0.113.10` | **DNS only** (เมฆสีเทา) | Auto |
| CNAME | `www` | `example.com` | **DNS only** | Auto |

> ⚠️ **ครั้งแรกให้ใช้ "DNS only" (เมฆสีเทา)** ให้ Caddy ขอ certificate จาก Let's Encrypt ได้ตรงๆ ก่อน
> ถ้าภายหลังอยากเปิด proxy (เมฆสีส้ม: ซ่อน IP จริง, กัน DDoS) ต้องตั้ง **SSL/TLS mode = Full (strict)** ใน Cloudflare ด้วย ไม่งั้นจะเจอ redirect วนไม่จบ

**ทำ subdomain ให้ลูกค้าหลายราย** (เช่น demo ระหว่างพัฒนา) เพิ่ม A record ชื่อ `demo` → IP เดียวกัน แล้วให้ Caddy แยกตามชื่อ (บทที่ 20)

---

## 4. 🔧 ตรวจว่า DNS ใช้ได้

```bash
dig +short example.com            # ควรได้ 203.0.113.10
dig +short www.example.com        # ควรได้ example.com. แล้วตามด้วย IP
dig NS example.com +short         # ควรเห็น nameserver ของ Cloudflare
dig @1.1.1.1 +short example.com   # ถาม DNS ของ Cloudflare ตรงๆ (ข้าม cache ในเครื่อง)
dig @8.8.8.8 +short example.com   # ถาม DNS ของ Google
```
ถ้า `@1.1.1.1` ได้ค่าใหม่แต่เครื่องเรายังได้ค่าเก่า = เป็นแค่ cache รอ TTL หมดหรือล้าง cache
```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder   # Mac
ipconfig /flushdns                                              # Windows
```

---

## 5. 📧 อีเมลกับโดเมน (รู้ไว้ก่อน)

ลูกค้ามักอยากได้อีเมล `contact@example.com` ใช้บริการอีเมล (Google Workspace, Zoho, Microsoft 365) แล้วเพิ่ม **MX + TXT** ตามที่ผู้ให้บริการบอก
ถ้าระบบเราส่งอีเมลแจ้งเตือน (Bonus ของ STARTER) ต้องตั้ง **SPF / DKIM / DMARC** (เป็น TXT ทั้งหมด) ไม่งั้นอีเมลเข้า spam

> ⚠️ ก่อนย้าย nameserver ไป Cloudflare ให้ดูว่าโดเมนเดิมมี **MX** อยู่ไหม ถ้ามีต้องก๊อปไปด้วย ไม่งั้นอีเมลของลูกค้าหายทันที (Cloudflare จะพยายามสแกน record เดิมให้ แต่ต้องตรวจเองทุกครั้ง)

---

## 6. 🤝 Checklist โดเมนสำหรับงานลูกค้า

- [ ] จดในชื่อ/บัญชีของ **ลูกค้า** (หรือบัญชีบริษัทที่ตกลงกันเป็นลายลักษณ์อักษร)
- [ ] auto-renew เปิดอยู่ บัตรที่ผูกไว้ยังไม่หมดอายุ
- [ ] อีเมลแจ้งเตือนไปที่อีเมลกลางที่ไม่หายตามคน
- [ ] บัญชี registrar และ Cloudflare เปิด 2FA
- [ ] จดไว้ในเอกสารส่งมอบ: registrar อะไร, DNS อยู่ที่ไหน, วันหมดอายุ (บทที่ 23)

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. Registrar กับ DNS provider ต่างกันยังไง?</summary>

registrar = ที่เช่าโดเมนและจ่ายเงินรายปี / DNS provider = ที่เก็บ record ว่าชื่อไหนไปไหน เป็นเจ้าเดียวกันหรือคนละเจ้าก็ได้ เชื่อมกันด้วยการตั้ง nameserver ที่ registrar
</details>

<details><summary>2. ชี้ <code>example.com</code> ไป VPS ใช้ record อะไร? และ <code>www</code> ล่ะ?</summary>

root ใช้ A ไปที่ IP ของ VPS / `www` ใช้ CNAME ไปที่ `example.com` (หรือ A ไป IP เดียวกันก็ได้)
</details>

<details><summary>3. แก้ A record แล้วเพื่อนเห็นเว็บใหม่ แต่เราเห็นเว็บเก่า เพราะอะไร?</summary>

cache ตาม TTL ในเครื่องเราหรือ DNS ของเน็ตบ้านยังจำค่าเก่า ตรวจด้วย `dig @1.1.1.1` แล้วรอหรือล้าง cache
</details>

<details><summary>4. ทำไมโดเมนต้องจดในชื่อลูกค้า?</summary>

โดเมนคือทรัพย์สินของธุรกิจลูกค้า ถ้าอยู่ในบัญชี dev แล้ว dev ลาออก ติดต่อไม่ได้ หรือลืมต่ออายุ ลูกค้าเสียเว็บและอีเมลทั้งหมด และอาจถูกคนอื่นจดต่อไป
</details>

---

## ✏️ แบบฝึกหัด

ใช้ `dig` ดู record ของเว็บบริษัทใหญ่ 2 แห่ง: A, AAAA, MX, NS, TXT (`dig example.com TXT +short`) จดว่าใช้ DNS ของใคร, อีเมลใช้ผู้ให้บริการอะไร แล้ววาดผัง Registrar / DNS / Hosting ของโปรเจกต์ STARTER ที่จะ deploy

## ✅ ผ่านด่าน

- [ ] อธิบายส่วนประกอบของโดเมน และหน้าที่ registrar / DNS / hosting ได้
- [ ] รู้ว่าจะใช้ A, CNAME, TXT, MX เมื่อไหร่ และเข้าใจ TTL
- [ ] ตั้ง nameserver ไป Cloudflare และเพิ่ม record ชี้ไป VPS ได้
- [ ] ตรวจ DNS ด้วย `dig` และแยกปัญหา cache ได้
- [ ] รู้ Checklist โดเมนของงานลูกค้า

---

[← บทที่ 17: Network](./17-network.md) · [🏠 สารบัญ](./README.md) · [บทที่ 19: Server (VPS) →](./19-server.md)
