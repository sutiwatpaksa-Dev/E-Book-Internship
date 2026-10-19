# บทที่ 23: Go-live, ดูแลระบบ และส่งมอบลูกค้า 🎉

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 20 (หรือ 22) และ 21 · 🛠 ใช้: cron, `pg_dump`, Uptime monitor, เอกสารส่งมอบ

> **⚡ สรุป 30 วินาที**
> - ก่อนเปิดจริงไล่ **Go-live Checklist** ให้ครบ: ทำงาน, ปลอดภัย, SEO, ความเร็ว, PDPA
> - **Backup ที่ไม่เคยลอง restore = ไม่มี backup** ตั้ง backup อัตโนมัติ + เก็บนอกเครื่อง + ซ้อม restore
> - ตั้ง **uptime monitor** ให้เรารู้ก่อนลูกค้าโทรมา และมี **คู่มือรับมือเว็บล่ม**
> - ส่งมอบ: บัญชีทุกอย่างเป็นของลูกค้า + เอกสารที่คนอื่นดูแลต่อได้

---

## 📖 เรื่องเล่า

เว็บ Bit Café ขึ้นแล้ว ลูกค้าพอใจมาก 🎉 บิตปิดโน้ตบุ๊คไปเที่ยว
3 เดือนต่อมา ดิสก์ของ VPS เต็มเพราะ log, database เขียนไม่ได้, ฟอร์มติดต่อพังเงียบๆ 2 สัปดาห์ ลูกค้าเสียลูกค้าไปหลายราย

พี่ไบต์: *"deploy เสร็จไม่ใช่งานเสร็จ deploy คือวันแรกของการดูแล"*

---

## 1. ✅ Go-live Checklist

**ทำงานครบ**
- [ ] ทุก requirement ใน [STARTER](./starter/index.md) ผ่านบน **production** (ไม่ใช่แค่ในเครื่อง)
- [ ] ข้อมูลตัวอย่าง/ข้อความทดสอบลบออกหมด ใส่ข้อมูลจริงของลูกค้าแล้ว
- [ ] ส่งฟอร์มติดต่อจริง 1 ครั้ง แล้วเห็นในหลังบ้าน
- [ ] ทดสอบบนมือถือจริง (iOS + Android) ผ่าน 4G

**ปลอดภัย**
- [ ] HTTPS ทุกหน้า, `http://` และ `www` redirect ถูก
- [ ] ทุก `/api/admin/*` ไม่ login ได้ `401` (test ใน CI ผ่าน)
- [ ] cookie มี `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] db (5432) และ API (3000) ไม่เปิดสู่ภายนอก
- [ ] รหัส admin ทดสอบถูกเปลี่ยน, ไม่มี `ADMIN_PASSWORD` ค้างใน `.env`
- [ ] ผ่าน [Security Checklist บทที่ 10](./10-security.md#_6-✅-security-checklist-ก่อนเปิด-mr)

**SEO / แชร์**
- [ ] `robots.txt`, `sitemap.xml` ใช้โดเมนจริง
- [ ] แชร์ลง LINE / Facebook แล้วขึ้นการ์ด ([Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/))
- [ ] เพิ่มเว็บใน [Google Search Console](https://search.google.com/search-console) และส่ง sitemap (ยืนยันความเป็นเจ้าของด้วย TXT record: บทที่ 18)

**ความเร็ว**
- [ ] [PageSpeed Insights](https://pagespeed.web.dev) มือถือ ≥ 80 (รูปใหญ่เกินคือสาเหตุอันดับ 1 ให้ย่อ/ใช้ WebP)

**PDPA** 🇹🇭 (ฟอร์มติดต่อเก็บชื่อ เบอร์ อีเมล = ข้อมูลส่วนบุคคล)
- [ ] หน้า Contact มีข้อความสั้นๆ ว่าเก็บข้อมูลอะไร ใช้ทำอะไร เก็บนานเท่าไหร่ ติดต่อใครเพื่อขอลบ
- [ ] ตกลงกับลูกค้าเรื่องระยะเวลาเก็บข้อความ (เช่น ลบข้อความเก่ากว่า 1 ปี)
- [ ] เฉพาะ admin เท่านั้นที่เห็นข้อความ ([บทที่ 10 ข้อ 5](./10-security.md#_5-ข้อมูลลูกค้าและ-pdpa-🇹🇭))

---

## 2. 💾 Backup และ Restore

### 🔧 สคริปต์ backup (VPS)
`deploy/backup.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail                          # pg_dump พัง = สคริปต์พัง ไม่ได้ไฟล์เปล่าที่ดูเหมือนสำเร็จ
cd "$(dirname "$0")/.."

BACKUP_DIR="$HOME/backups"
FILE="$BACKUP_DIR/db-$(date +%F-%H%M).sql.gz"
mkdir -p "$BACKUP_DIR"

docker compose -f compose.prod.yaml exec -T db pg_dump -U app -d app | gzip > "$FILE"
find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +14 -delete     # เก็บย้อนหลัง 14 วัน
echo "✅ $(date '+%F %T') $FILE ($(du -h "$FILE" | cut -f1))"
```
```bash
chmod +x deploy/backup.sh
./deploy/backup.sh                         # ลองรันมือ 1 ครั้ง
```

### 🔧 ตั้งให้รันเองทุกคืน (cron)
```bash
crontab -e
```
เพิ่มบรรทัด:
```
0 3 * * * /home/deploy/bit-cafe/deploy/backup.sh >> /home/deploy/backups/backup.log 2>&1
```
(`0 3 * * *` = ทุกวัน ตี 3 ตามเวลาเครื่อง ซึ่งเราตั้งเป็น Asia/Bangkok ในบทที่ 19)

### ☁️ เก็บสำเนานอกเครื่อง
backup ที่อยู่บน VPS เครื่องเดียวกัน **หายพร้อมเครื่อง** ต้องมีอีกชั้น อย่างน้อย 1 ทาง:
- เปิด **snapshot/backup อัตโนมัติของผู้ให้บริการ VPS**
- ส่งไฟล์ไป object storage (S3-compatible) ด้วยเครื่องมืออย่าง `rclone` หลัง backup เสร็จ
- managed DB (Neon/Supabase): ใช้ฟีเจอร์ backup / point-in-time restore ของแพลตฟอร์ม และตรวจว่าแผนที่ใช้เก็บย้อนหลังได้กี่วัน

### 🔧 ซ้อม Restore (ทำทุกเดือน)
กู้ลง **ฐานข้อมูลทดลอง** ไม่ใช่ตัวจริง
```bash
DC="docker compose -f compose.prod.yaml"
LATEST=$(ls -t ~/backups/db-*.sql.gz | head -1)

$DC exec -T db createdb -U app restore_test
gunzip -c "$LATEST" | $DC exec -T db psql -q -U app -d restore_test -v ON_ERROR_STOP=1 > /dev/null
$DC exec -T db psql -U app -d restore_test -c "select count(*) from services;"   # ตัวเลขสมเหตุสมผลไหม
$DC exec -T db dropdb -U app restore_test
```
> ⚠️ **กู้ตัวจริงเมื่อเกิดเหตุ:** หยุด server ก่อน (`$DC stop server`) → กู้ลงฐานข้อมูลใหม่ → ตรวจ → ค่อยสลับ ห้ามกู้ทับฐานข้อมูลที่ยังมีคนเขียนอยู่ และถ้าไม่แน่ใจให้ปรึกษาพี่เลี้ยงก่อนทุกครั้ง

---

## 3. 📈 Monitoring: รู้ก่อนลูกค้า

### Uptime monitor
ใช้บริการฟรีอย่าง **UptimeRobot** หรือ **Better Stack**
- URL: `https://example.com/api/health` ทุก 5 นาที
- แจ้งเตือน: อีเมล + LINE / Slack / Telegram ของทีม
- เพิ่มอีกตัวที่ `https://example.com/` (หน้าเว็บ) แยกกัน

💡 ทำ health check ให้ตรวจฐานข้อมูลด้วย จะรู้เมื่อ DB มีปัญหา ไม่ใช่แค่ process ยังวิ่ง
```ts
import { sql } from "drizzle-orm";

app.get("/api/health", async (c) => {
  await db.execute(sql`select 1`);           // DB ล่ม → โยน error → onError ตอบ 500 → monitor แจ้งเตือน
  return c.json({ status: "ok" });
});
```

### ตรวจเครื่องเป็นประจำ
| ดูอะไร | คำสั่ง | สัญญาณอันตราย |
|---|---|---|
| ดิสก์ | `df -h` | ใช้ > 80% |
| ขนาด Docker | `docker system df` | image/build cache สะสม |
| RAM | `free -h` | swap ถูกใช้เยอะตลอด |
| กล่องทั้งหมด | `dc ps` | สถานะ `Restarting` |
| error ล่าสุด | `dc logs --since 24h server \| grep -i error` | error ซ้ำๆ |
| backup เมื่อคืน | `tail -3 ~/backups/backup.log` | ไม่มีบรรทัด ✅ ของเมื่อคืน |
| certificate | `curl -vI https://example.com 2>&1 \| grep -i "expire date"` | เหลือ < 14 วัน (Caddy ควรต่อให้เองก่อน 30 วัน) |

---

## 4. 🗓️ ตารางดูแลประจำ

| ความถี่ | งาน |
|---|---|
| **ทุกวัน (อัตโนมัติ)** | backup, security update ของ OS (unattended-upgrades), uptime monitor |
| **ทุกสัปดาห์** | ดูแจ้งเตือน, `df -h`, ดู log error, ดูว่า backup มีครบ |
| **ทุกเดือน** | ซ้อม restore, `docker image prune`, อัปเดต dependencies ใน branch แล้วให้ CI ตรวจ, `sudo apt upgrade` + reboot ช่วงคนใช้น้อย |
| **ทุกปี** | ต่ออายุโดเมน (ตรวจ auto-renew), ทบทวนว่าใครยังมีสิทธิ์เข้าระบบ, เปลี่ยน secret ที่สำคัญ |

---

## 5. 🚨 คู่มือรับมือเว็บล่ม

```
 1. ยืนยัน     เปิดเว็บเอง + curl -v  →  ล่มจริงไหม? ล่มชั้นไหน? (บทที่ 17 ข้อ 1)
 2. แจ้ง       บอกพี่เลี้ยง/ทีมทันที (อย่าแก้เงียบๆ คนเดียว)
 3. ดูล่าสุด   มี deploy อะไรก่อนล่มไหม?  ถ้ามี → rollback ก่อน หาสาเหตุทีหลัง (บทที่ 20 ข้อ 7)
 4. ตรวจ       ssh → dc ps → dc logs --since 30m → df -h → free -h
 5. แก้        ทีละอย่าง จดว่าทำอะไรไปเวลาไหน
 6. ยืนยัน     health check เขียว, ลองใช้งานจริง
 7. สรุป       เขียนสั้นๆ: เกิดอะไร กระทบใคร นานเท่าไหร่ แก้ยังไง จะกันไม่ให้เกิดซ้ำยังไง
```
> 💡 **กู้ให้ใช้ได้ก่อน หาสาเหตุทีหลัง** ลูกค้าต้องการเว็บกลับมา ไม่ใช่คำอธิบาย (แต่ต้องหาสาเหตุให้เจอภายหลังเสมอ)
> 📝 ข้อ 7 ไม่ใช่การหาคนผิด เป็นการหาว่า **ระบบ** ควรเปลี่ยนตรงไหน เช่น "เพิ่ม test", "ตั้งแจ้งเตือนดิสก์"

---

## 6. 🤝 ส่งมอบลูกค้า

### บัญชีทั้งหมดต้องเป็นของลูกค้า
| อะไร | เจ้าของ | dev ได้สิทธิ์แบบ |
|---|---|---|
| โดเมน (registrar) | ลูกค้า | ไม่ต้องมี หรือสิทธิ์จัดการ DNS |
| Cloudflare / DNS | ลูกค้า | member |
| VPS / Vercel / Render / Neon | ลูกค้า (หรือบริษัทตามสัญญาดูแล) | member |
| Git repo | ตามสัญญา | — |
| รหัส admin เว็บ | ลูกค้า (ตั้งเอง) | ไม่ควรรู้ |

> 🔐 ส่งรหัสผ่านผ่าน **password manager** หรือช่องทางที่ลบตัวเองได้ **ห้ามส่งในแชท/อีเมลเป็นข้อความธรรมดา**

### เอกสารส่งมอบ (1–2 หน้า)
```markdown
# Bit Café: เอกสารส่งมอบระบบ

## ลิงก์
- เว็บไซต์: https://example.com
- หลังบ้าน: https://example.com/admin

## วิธีใช้หลังบ้าน (สำหรับเจ้าของร้าน)
- แก้ข้อมูลร้าน / ชั่วโมงเปิด / ลิงก์ LINE: เมนู "ตั้งค่าเว็บไซต์"
- เพิ่มเมนู/บริการ: เมนู "บริการ" → "เพิ่ม" (รูปใช้ลิงก์รูป)
- ดูข้อความลูกค้า: เมนู "ข้อความ" (ตัวหนา = ยังไม่อ่าน)

## โครงสร้างระบบ (สำหรับ dev ที่ดูแลต่อ)
- Hosting: VPS <ผู้ให้บริการ> Singapore, IP 203.0.113.10
- Domain: <registrar> หมดอายุ <วันที่> (auto-renew เปิด)
- DNS: Cloudflare
- Repo: <url> · Deploy: merge เข้า main แล้ว CI deploy ให้เอง (ดู README)
- Backup: ทุกวัน 03:00 เก็บ 14 วัน + snapshot ของผู้ให้บริการ

## ค่าใช้จ่ายรายปี / รายเดือน
- โดเมน: <ราคา>/ปี ต่ออายุ <วันที่>
- Server: <ราคา>/เดือน

## ติดต่อ
- ดูแลระบบ: <ทีม / อีเมลกลาง> · ระยะเวลารับประกัน: <ตามสัญญา>
```

---

## 🎓 จบคู่มือ

ถ้าน้องผ่านมาถึงตรงนี้ น้องทำได้ครบทั้งเส้นทางแล้ว:
```
 Terminal → Git → Docker → TypeScript → API → SQL → ORM → Security
   → React → Tailwind → Router/SEO → Hono → Auth → ทำงานคู่กับ AI
   → Mini Project STARTER → Network → Domain → Server → Deploy → CI/CD → Go-live 🚀
```
จาก **"เปิด Terminal ยังไม่เป็น"** ถึง **"ส่งมอบเว็บไซต์ที่ลูกค้าใช้งานจริงบนโดเมนของตัวเอง"**
ยินดีต้อนรับสู่ทีม Blicktech อย่างเป็นทางการ 🎉

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ทำไมบอกว่า "backup ที่ไม่เคยลอง restore = ไม่มี backup"?</summary>

backup อาจเป็นไฟล์เปล่า, เสีย, ขาดตาราง หรือคำสั่งกู้ไม่ทำงาน ซึ่งจะรู้ก็ตอนต้องใช้จริงซึ่งสายไปแล้ว การซ้อม restore คือวิธีเดียวที่รู้ว่ากู้ได้จริง
</details>

<details><summary>2. ทำไมใส่ <code>set -o pipefail</code> ในสคริปต์ backup?</summary>

ใน `pg_dump | gzip` ถ้า `pg_dump` พัง แต่ `gzip` สำเร็จ ปกติ shell จะถือว่าสำเร็จ ได้ไฟล์ .gz เปล่าที่ดูเหมือนปกติ `pipefail` ทำให้รู้ทันทีว่าพัง
</details>

<details><summary>3. เว็บล่มหลัง deploy เมื่อ 10 นาทีก่อน ควรทำอะไรก่อน?</summary>

แจ้งทีม แล้ว rollback ไปเวอร์ชันก่อนหน้าให้เว็บกลับมาก่อน จากนั้นค่อยหาสาเหตุใน branch แยก
</details>

<details><summary>4. ทำไมโดเมนและ hosting ต้องเป็นบัญชีของลูกค้า?</summary>

เป็นทรัพย์สินของธุรกิจลูกค้า ถ้า dev/บริษัทเปลี่ยนไป ลูกค้ายังควบคุมเว็บได้ ไม่ถูกตัดขาดหรือหมดอายุโดยไม่รู้ตัว
</details>

---

## ✏️ แบบฝึกหัด

ทำให้ STARTER ของตัวเองพร้อมส่งมอบ: ไล่ Go-live Checklist ครบ, ตั้ง backup + cron, ซ้อม restore 1 ครั้ง (แคปจอผล count), ตั้ง uptime monitor แล้วลองปิด server ให้ได้รับแจ้งเตือนจริง และเขียนเอกสารส่งมอบ 1 หน้า

## ✅ ผ่านด่าน

- [ ] ไล่ Go-live Checklist ครบทุกหมวด รวม PDPA
- [ ] backup อัตโนมัติ + สำเนานอกเครื่อง + ซ้อม restore แล้ว
- [ ] มี uptime monitor ที่แจ้งเตือนจริง
- [ ] รู้ขั้นตอนรับมือเว็บล่ม และทำ rollback ได้
- [ ] เขียนเอกสารส่งมอบที่คนอื่นดูแลต่อได้

---

[← บทที่ 22: Deploy แบบ Managed](./22-deploy-managed.md) · [🏠 สารบัญ](./README.md) · [📋 Cheat Sheet →](./cheat-sheet.md)
