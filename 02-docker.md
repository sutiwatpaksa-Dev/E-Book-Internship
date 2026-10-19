# บทที่ 2: Docker คืออะไร และต่างจาก VM ยังไง 🐳

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 0 · 🛠 ใช้: Docker Desktop, Terminal

> **⚡ สรุป 30 วินาที**
> - Docker แพ็กโปรแกรม **พร้อมทุกอย่างที่ต้องใช้** ไว้ในกล่อง (container) รันที่ไหนก็เหมือนกัน
> - **Image** = แม่พิมพ์ / **Container** = ของที่พิมพ์ออกมา / **Volume** = ที่เก็บข้อมูลถาวร
> - **VM** จำลองคอมทั้งเครื่องพร้อม OS (หนัก) / **Container** ใช้ kernel ร่วมกับเครื่องเรา (เบา เร็ว)
> - `docker compose up -d` เปิดหลายกล่องพร้อมกันด้วยคำสั่งเดียว

---

## 📖 เรื่องเล่า

บิตโคลนโปรเจกต์ของพี่ไบต์มา รัน... พัง ❌

```
Error: The module was compiled against a different Node.js version
```

บิต: *"พี่ครับ เครื่องผมรันไม่ได้"*
พี่ไบต์: *"แปลกนะ เครื่องพี่รันได้"* 🤷

ปัญหาไม่ใช่โค้ด แต่คือ **สภาพแวดล้อมไม่เหมือนกัน**: พี่ไบต์ใช้ Mac + Node 24 + PostgreSQL 17 ส่วนบิตใช้ Windows + Node 20 + PostgreSQL 15 และ server จริงเป็น Linux อีกแบบ
ประโยค *"แต่เครื่องผมรันได้นะ"* คือมุกประจำวงการ ที่ Docker เกิดมาเพื่อฆ่ามุกนี้

---

## 1. Docker คืออะไร

**Docker คือเครื่องมือที่แพ็กโปรแกรม + ทุกอย่างที่โปรแกรมต้องใช้ ไว้ใน "กล่อง" เดียว** เปิดกล่องที่เครื่องไหนก็ได้ผลเหมือนกัน

> 💡 **เปรียบเทียบกับตู้คอนเทนเนอร์ขนส่งสินค้า**
> สมัยก่อนขนของลงเรือต้องจัดทีละชิ้น ของแต่ละแบบยกต่างกัน ช้าและพังง่าย
> พอมี **ตู้คอนเทนเนอร์มาตรฐาน** ข้างในใส่อะไรก็ได้ แต่เรือ รถบรรทุก เครน ทุกที่ยกตู้แบบเดียวกัน
> Docker = **ตู้คอนเทนเนอร์ของโปรแกรม** ข้างในเป็น Node, Python หรือฐานข้อมูลก็ได้ แต่ทุกเครื่องเปิดด้วยวิธีเดียวกัน

> 🤓 **เกร็ด:** โลโก้ Docker จึงเป็น **วาฬแบกตู้คอนเทนเนอร์** และวาฬตัวนั้นมีชื่อว่า "Moby Dock"

---

## 2. คำศัพท์หลัก 6 คำ (สำคัญมาก)

| คำ | คืออะไร | 💡 เปรียบเทียบ |
|---|---|---|
| **Image** | แม่แบบของกล่อง บรรจุทุกอย่างไว้แล้ว แก้ไขไม่ได้ | แม่พิมพ์ขนมครก |
| **Container** | กล่องที่เปิดใช้งานจริงจาก image | ขนมครกแต่ละลูก |
| **Dockerfile** | ไฟล์สูตรสำหรับสร้าง image ของเราเอง | สูตรทำแม่พิมพ์ |
| **Registry** | คลังเก็บ image (ใหญ่สุดคือ Docker Hub) | ร้านขายแม่พิมพ์ |
| **Volume** | ที่เก็บข้อมูลถาวรนอกกล่อง | แฟลชไดรฟ์เสียบกล่อง |
| **Compose** | ไฟล์บอกว่าระบบมีกี่กล่อง ตั้งค่ายังไง | สั่งข้าวชุดแทนสั่งทีละจาน |

```
Dockerfile  --docker build-->  Image  --docker run-->  Container
  (สูตร)                       (แม่พิมพ์)               (ขนมที่ทำเสร็จ)
                                 ^
                     docker pull (ดึงจาก Docker Hub)
```

**ชื่อ image** อ่านแบบนี้: `postgres:17`
- `postgres` = ชื่อ, `17` = **tag** (เวอร์ชัน)
- ไม่ใส่ tag จะได้ `latest` ⚠️ ห้ามใช้ในงานจริง เพราะเวอร์ชันเปลี่ยนเองได้วันไหนก็ไม่รู้

---

## 3. Docker vs VM

**VM (Virtual Machine)** = **จำลองคอมพิวเตอร์ทั้งเครื่อง** (CPU, RAM, ดิสก์เสมือน) แล้ว **ติดตั้ง OS เต็มตัว** ลงไป เช่น เปิด Windows บน Mac ด้วย VirtualBox, VMware, Parallels

> 💡 **เปรียบเทียบกับที่พักอาศัย** 🏠 vs 🏢
> - **VM = บ้านเดี่ยวหลายหลัง** แต่ละหลังมีฐานราก ระบบน้ำไฟเป็นของตัวเอง แยกขาดกันดี แต่สร้างช้า ใช้ที่ดินเยอะ
> - **Container = ห้องในคอนโด** ใช้โครงสร้างตึกและระบบน้ำไฟร่วมกัน แต่ละห้องมีประตูล็อกแยก สร้างไว ใส่ได้หลายห้อง
>
> "โครงสร้างตึกส่วนกลาง" คือ **kernel** แกนกลางของระบบปฏิบัติการที่คุยกับ hardware

```
        Virtual Machine                      Docker Container
+----------+ +----------+            +----------+ +----------+
|  App A   | |  App B   |            |  App A   | |  App B   |
|  Libs    | |  Libs    |            |  Libs    | |  Libs    |
| Guest OS | | Guest OS |            +----------+ +----------+
+----------+ +----------+            +------------------------+
+------------------------+           |     Docker Engine      |
|       Hypervisor       |           +------------------------+
+------------------------+           | Host OS (shared kernel)|
|        Host OS         |           +------------------------+
+------------------------+           |        Hardware        |
|        Hardware        |           +------------------------+
+------------------------+
```

| หัวข้อ | Virtual Machine | Docker Container |
|---|---|---|
| จำลองอะไร | ทั้งเครื่อง + OS เต็มตัว | แค่แยกพื้นที่ให้โปรแกรม |
| Kernel | แต่ละ VM มีของตัวเอง | ใช้ของเครื่อง host ร่วมกัน |
| ขนาด | หลาย GB | หลักสิบถึงร้อย MB |
| เวลาเปิด | เป็นนาที (ต้อง boot OS) | เป็นวินาที |
| รันพร้อมกัน | ไม่กี่ตัว | หลายสิบตัวสบายๆ |
| ความแยกขาด | แข็งแรงกว่า | เบากว่า แต่พอสำหรับงานทั่วไป |
| รัน OS คนละแบบ | ✅ เช่น Windows บน Mac | ❌ ต้องใช้ kernel เดียวกัน |
| เหมาะกับ | ต้องการ OS เต็มตัว, ความปลอดภัยสูง | แพ็กแอป, รัน DB ตอน dev, deploy |

> ⚠️ **บน Mac และ Windows:** container ต้องใช้ Linux kernel Docker Desktop จึงแอบรัน **Linux VM ตัวเล็ก** อยู่ข้างหลังให้อัตโนมัติ
> สรุป: **Docker กับ VM ไม่ใช่คู่แข่ง แต่มักใช้ร่วมกัน** เช่น server บน cloud มักเป็น VM ที่ข้างในรัน container หลายตัว

> 🤓 **เกร็ด (ไม่ต้องจำ):** container จริงๆ คือ "โปรแกรมธรรมดา" ที่ Linux ขังไว้ด้วยฟีเจอร์ **namespaces** (มองไม่เห็นของคนอื่น) และ **cgroups** (จำกัด CPU/RAM)

---

## 4. 🔧 ลงมือ: Container ตัวแรก

**ขั้นที่ 0:** เปิด **Docker Desktop** รอจนขึ้นสถานะ Running

**ขั้นที่ 1: ทดสอบระบบ**
```bash
docker run hello-world
```
ควรเห็น:
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
```
เบื้องหลัง: หา image ในเครื่อง → ไม่เจอ → ดึงจาก Docker Hub → สร้าง container → รัน → พิมพ์ข้อความ → จบ

**ขั้นที่ 2: รันเว็บเซิร์ฟเวอร์**
```bash
docker run -d -p 8080:80 --name web nginx:alpine
```
| ส่วน | ความหมาย |
|---|---|
| `-d` | รันเบื้องหลัง ไม่ค้างหน้าจอ |
| `-p 8080:80` | **port mapping** `เครื่องเรา:ในกล่อง` |
| `--name web` | ตั้งชื่อ container |
| `nginx:alpine` | image ที่ใช้ (`alpine` = Linux รุ่นจิ๋ว) |

เปิด **http://localhost:8080** → เห็น **"Welcome to nginx!"** 🎉

> 💡 **ทำไมต้อง `-p`?** container เหมือนห้องที่ปิดประตูไว้ ต้อง "เจาะช่อง" เชื่อมประตูของเครื่องเรา (8080) ไปยังประตูในกล่อง (80)

**ขั้นที่ 3: ส่องข้างในกล่อง** 🔍
```bash
docker ps                  # ดู container ที่รันอยู่
docker logs web            # ดู log (refresh หน้าเว็บแล้วดูอีกรอบ)
docker exec -it web sh     # เข้าไปในกล่อง
```
```sh
cat /etc/os-release        # ข้างในเป็น Alpine Linux ทั้งที่เครื่องเราเป็น Mac/Windows!
echo "<h1>Hello from Blicktech</h1>" > /usr/share/nginx/html/index.html
exit
```
refresh หน้าเว็บ → เปลี่ยนเป็นข้อความของเรา 😎

**ขั้นที่ 4: ลบกล่องแล้วสร้างใหม่**
```bash
docker rm -f web
docker run -d -p 8080:80 --name web nginx:alpine
```
refresh อีกรอบ → **กลับเป็น "Welcome to nginx!"** ข้อความที่เราแก้หายไป เพราะของในกล่องหายไปพร้อมกล่อง จำเรื่องนี้ไว้ จะสำคัญมากในข้อถัดไป

```bash
docker rm -f web           # เก็บกวาด
```

---

## 5. 🔧 ฐานข้อมูลใน Docker และทำไม Volume สำคัญ

**รอบที่ 1: ไม่มี volume**
```bash
docker run -d --name pg-test -e POSTGRES_PASSWORD=secret postgres:17
```
(`-e` = ส่ง environment variable เข้ากล่อง image postgres บังคับให้ตั้งรหัสผ่าน)

รอสัก 5 วินาที แล้วสร้างตาราง:
```bash
docker exec -it pg-test psql -U postgres
```
```sql
CREATE TABLE notes (id SERIAL PRIMARY KEY, text TEXT);
INSERT INTO notes (text) VALUES ('hello docker');
SELECT * FROM notes;
\q
```
ลบกล่องแล้วสร้างใหม่:
```bash
docker rm -f pg-test
docker run -d --name pg-test -e POSTGRES_PASSWORD=secret postgres:17
docker exec -it pg-test psql -U postgres -c "SELECT * FROM notes;"
```
ผล: `ERROR: relation "notes" does not exist` → **ข้อมูลหายหมด** 😱

**รอบที่ 2: มี volume**
```bash
docker rm -f pg-test
docker run -d --name pg-test -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data postgres:17
```
- `-v pgdata:/var/lib/postgresql/data` = เสียบ volume ชื่อ `pgdata` ที่โฟลเดอร์ที่ Postgres เก็บข้อมูล
- `\` ท้ายบรรทัด = คำสั่งยังไม่จบ (PowerShell ใช้ `` ` `` หรือพิมพ์บรรทัดเดียว)

ทำซ้ำ: สร้างตาราง → ลบกล่อง → สร้างใหม่ (ใส่ `-v` เหมือนเดิม) → ตาราง **ยังอยู่** ✅

> ⚠️ **กับดัก:** โฟลเดอร์เก็บข้อมูลต่างกันในแต่ละ image ต้องดูจากหน้า image บน Docker Hub (เช่น `postgres:18` ขึ้นไปเปลี่ยนเป็น `/var/lib/postgresql`)

```bash
docker rm -f pg-test && docker volume rm pgdata     # เก็บกวาด
```

---

## 6. 🔧 Dockerfile: สร้าง image ของเราเอง

เริ่มจากเว็บง่ายๆ ไม่ต้องเขียนโปรแกรมก่อน (Dockerfile สำหรับ API TypeScript จะทำใน [บทที่ 5](./05-http-api.md))

```
my-site/
├── index.html
└── Dockerfile
```

`index.html`
```html
<h1>🐳 My first image</h1>
<p>Built by บิต</p>
```

`Dockerfile`
```dockerfile
FROM nginx:alpine
# เริ่มจาก image nginx ที่มีอยู่แล้ว

COPY index.html /usr/share/nginx/html/index.html
# ก๊อปไฟล์ของเราเข้าไปในกล่อง

EXPOSE 80
# บอกว่าโปรแกรมฟังที่ port 80 (เป็นเอกสารประกอบ ยังต้องใช้ -p ตอนรัน)
```

```bash
docker build -t my-site .            # -t = ตั้งชื่อ image, . = ใช้ Dockerfile ในโฟลเดอร์นี้
docker run -d -p 8080:80 --name site my-site
```
เปิด http://localhost:8080 → เห็นหน้าของเรา และคราวนี้ **ลบกล่องสร้างใหม่กี่รอบก็ยังอยู่** เพราะไฟล์ถูกอบอยู่ใน image แล้ว

**คำสั่งใน Dockerfile ที่เจอบ่อย**
| คำสั่ง | ทำอะไร |
|---|---|
| `FROM` | เริ่มจาก image ไหน |
| `WORKDIR` | ย้ายไปทำงานในโฟลเดอร์ไหนในกล่อง |
| `COPY` | ก๊อปไฟล์จากเครื่องเราเข้ากล่อง |
| `RUN` | รันคำสั่งตอน **build** เช่น ติดตั้ง package |
| `ENV` | ตั้ง environment variable |
| `EXPOSE` | บอก port ที่ใช้ |
| `CMD` | คำสั่งที่รันตอน **container เริ่มทำงาน** |

> 💡 `RUN` ทำตอนสร้างแม่พิมพ์ (ครั้งเดียว) / `CMD` ทำทุกครั้งที่ทำขนมลูกใหม่

---

## 7. 🔧 Docker Compose: เปิดหลายกล่องพร้อมกัน

พิมพ์ `docker run` ยาวๆ ทุกครั้งเหนื่อยและพลาดง่าย Compose ให้เขียนไว้ในไฟล์ครั้งเดียว
มาเปิด **PostgreSQL + Adminer** (หน้าเว็บจัดการฐานข้อมูล) กัน

`compose.yaml`
```yaml
services:                     # รายการกล่องทั้งหมด
  db:                         # กล่องชื่อ db
    image: postgres:17
    environment:              # = -e
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: appdb
    ports:                    # = -p
      - "5432:5432"
    volumes:                  # = -v
      - pgdata:/var/lib/postgresql/data

  adminer:                    # กล่องชื่อ adminer
    image: adminer
    ports:
      - "8080:8080"
    depends_on:               # เปิด db ก่อน
      - db

volumes:
  pgdata:                     # ประกาศ volume
```

```bash
docker compose up -d          # เปิดทั้งระบบ
docker compose ps             # ดูสถานะ
```
เปิด http://localhost:8080 แล้วกรอก:

| ช่อง | ค่า |
|---|---|
| System | PostgreSQL |
| Server | **`db`** 👈 |
| Username / Password | `app` / `secret` |
| Database | `appdb` |

ลองสร้างตารางผ่านหน้าเว็บได้เลย 🎉

> 💡 **ทำไม Server ใส่ `db` ไม่ใช่ `localhost`?**
> ใน Compose ทุกกล่องอยู่ในเครือข่ายเดียวกัน และ **เรียกหากันด้วยชื่อ service** ส่วน `localhost` ในกล่อง adminer หมายถึง "กล่อง adminer เอง"
> ⚠️ จุดนี้มือใหม่พลาดบ่อยที่สุด!

```bash
docker compose logs -f db     # ดู log (Ctrl+C ออก)
docker compose down           # ปิดและลบกล่อง (volume ยังอยู่)
docker compose down -v        # ปิด + ลบ volume (⚠️ ข้อมูลหาย)
```

---

## 8. ⚠️ ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `Cannot connect to the Docker daemon` | ยังไม่เปิด Docker Desktop | เปิดแล้วรอ Running |
| `port is already allocated` | มีโปรแกรมอื่นใช้ port อยู่ | ปิดตัวนั้น หรือเปลี่ยน `-p 8081:80` |
| `container name "/web" is already in use` | มีชื่อนี้อยู่แล้ว (แม้หยุดแล้ว) | `docker rm -f web` |
| แก้ไฟล์แล้ว container ยังเป็นของเก่า | ยังไม่ build image ใหม่ | `docker compose up -d --build` |
| ต่อ DB ไม่ได้จากอีกกล่อง | ใช้ `localhost` | ใช้ชื่อ service เช่น `db` |
| ข้อมูลหายหลัง down/up | ไม่มี volume หรือใช้ `down -v` | เพิ่ม volume, ระวัง `-v` |
| ดิสก์เต็ม | image เก่าสะสม | `docker system prune` (อ่านคำเตือนก่อนกด y) |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. รัน image เดียวกัน 3 ครั้ง (คนละชื่อ) ได้อะไร?</summary>

container 3 ตัวที่แยกกันอิสระ ข้อมูลในตัวหนึ่งไม่กระทบอีกตัว (แม่พิมพ์เดียว ขนม 3 ลูก)
</details>

<details><summary>2. <code>-p 5433:5432</code> ต้องต่อ DB จากเครื่องเราที่ port อะไร?</summary>

`localhost:5433` (ซ้าย = เครื่องเรา, ขวา = ในกล่อง)
</details>

<details><summary>3. ทำไมรัน Windows ใน Docker บน Mac ไม่ได้ แต่ใช้ VM ได้?</summary>

container ใช้ kernel ร่วมกับ host (บน Mac คือ Linux kernel ใน VM เล็กของ Docker Desktop) จึงรันได้แค่โปรแกรม Linux ส่วน VM จำลองทั้งเครื่อง ติดตั้ง OS อะไรก็ได้
</details>

<details><summary>4. <code>RUN npm install</code> กับ <code>CMD ["node", "index.js"]</code> ทำงานตอนไหน?</summary>

`RUN` ทำตอน `docker build` (ครั้งเดียว ผลถูกอบอยู่ใน image) / `CMD` ทำทุกครั้งที่ container เริ่ม
</details>

---

## ✏️ แบบฝึกหัด

ใช้ `compose.yaml` ข้อ 7 สร้างตาราง `laptops` ผ่าน Adminer ใส่ข้อมูล 3 แถว แล้วพิสูจน์ว่าหลัง `docker compose down` และ `up -d` ใหม่ ข้อมูลยังอยู่ แนบ screenshot ก่อนและหลัง

## ✅ ผ่านด่าน

- [ ] อธิบาย image / container / volume ด้วยคำพูดตัวเองได้
- [ ] อธิบาย Docker vs VM ได้อย่างน้อย 3 ข้อ
- [ ] เขียน Dockerfile และ `compose.yaml` ง่ายๆ ได้
- [ ] รู้ว่าในกล่องต้องเรียกกันด้วยชื่อ service

---

[← บทที่ 1: Git](./01-git.md) · [🏠 สารบัญ](./README.md) · [บทที่ 3: Node vs Yarn vs Bun →](./03-node-yarn-bun.md)
