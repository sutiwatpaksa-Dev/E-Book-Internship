# บทที่ 2: Docker คืออะไร และต่างจาก VM ยังไง 🐳

> ⏱ ประมาณ 5 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 0 · 🛠 ใช้: Docker Desktop, Terminal

> **⚡ สรุป 30 วินาที**
> - Docker แพ็กโปรแกรม **พร้อมทุกอย่างที่ต้องใช้** ไว้ในกล่อง (container) รันที่ไหนก็เหมือนกัน
> - **Image** = แม่พิมพ์ / **Container** = ของที่พิมพ์ออกมา / **Volume** = ที่เก็บข้อมูลถาวร
> - **VM** จำลองคอมทั้งเครื่องพร้อม OS (หนัก) / **Container** ใช้ kernel ร่วมกับเครื่องเรา (เบา เร็ว)
> - `docker compose up -d` เปิดหลายกล่องพร้อมกันด้วยคำสั่งเดียว
> - ในกล่อง `localhost` คือกล่องตัวเอง ต้องเรียกกล่องอื่นด้วย **ชื่อ service**

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

**Docker ช่วยแก้ปัญหาอะไรบ้าง**

| ปัญหาเดิม | ถ้ามี Docker |
|---|---|
| เครื่องบิตกับพี่ไบต์ใช้ Node คนละเวอร์ชัน | ทุกคนรัน image เดียวกัน เวอร์ชันเดียวกัน |
| อยากลองฐานข้อมูล ต้องลง PostgreSQL ลงเครื่อง ลบยาก | `docker run` แล้วลบทิ้งได้สะอาด ไม่ทิ้งขยะในเครื่อง |
| คนใหม่เข้าทีม ใช้เวลาครึ่งวันตั้งเครื่อง | `docker compose up` คำสั่งเดียวได้ทั้งระบบ |
| รันบนเครื่องได้ แต่ขึ้น server พัง | server รัน image เดียวกับที่เราทดสอบ |

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

![ภาพรวม Dockerfile สร้าง image แล้วรันเป็น container พร้อม registry](/img/02-image-container.svg)
*Dockerfile (สูตร) → build เป็น image (แม่พิมพ์) → run เป็น container ได้หลายตัว ส่วน registry คือคลังที่ push ขึ้นไปเก็บและ pull ลงมาใช้*

### Image กับ Container ต่างกันยังไง (จุดที่คนสับสนที่สุด)

- **Image** = ไฟล์ที่ **อ่านอย่างเดียว** เหมือนแผ่น DVD ติดตั้งเกม นำไปใช้ซ้ำกี่ครั้งก็ได้ ไม่เปลี่ยนแปลง
- **Container** = image ที่ **ถูกเปิดใช้งานแล้ว** มีชั้นที่เขียนได้เพิ่มมาอีกชั้นหนึ่ง ของที่โปรแกรมเขียนระหว่างทำงาน (เช่น ไฟล์ที่สร้างใหม่) จะอยู่ในชั้นนี้ **และหายไปพร้อมกล่องเมื่อลบ container**
- image 1 ก้อน เปิดเป็น container ได้กี่ตัวก็ได้ แต่ละตัวแยกกันอิสระ

ถ้าเป็นโลกของโปรแกรมมิ่ง: image คือ **class** ส่วน container คือ **object** ที่สร้างจาก class นั้น

### Registry และ Docker Hub

**Registry** คือเว็บคลังเก็บ image ตัวที่ใหญ่ที่สุดคือ **Docker Hub** (hub.docker.com) เมื่อสั่ง `docker run postgres:17` แล้วไม่มี image ในเครื่อง Docker จะไปดึง (`pull`) จาก Docker Hub ให้เอง

- **Official image** (เช่น `postgres`, `nginx`, `node`) ดูแลโดยทีมที่เชื่อถือได้ ปลอดภัยกว่าของคนทั่วไป เวลาค้นหาให้มองหาป้าย **Docker Official Image**
- image ของคนอื่น/บริษัทอื่น จะมีชื่อนำหน้า เช่น `oven/bun` (`oven` คือเจ้าของ) อ่านที่มาก่อนใช้เสมอ
- registry อื่นที่เจอบ่อย: GitHub Container Registry (`ghcr.io`) ใช้เก็บ image ส่วนตัวของบริษัทได้

**ชื่อ image** อ่านแบบนี้: `postgres:17`
- `postgres` = ชื่อ, `17` = **tag** (เวอร์ชัน)
- ชื่อเต็มจริงๆ คือ `registry/เจ้าของ/ชื่อ:tag` เช่น `docker.io/library/postgres:17` แต่ที่เหลือ Docker เติมให้เอง
- ไม่ใส่ tag จะได้ `latest` ⚠️ ห้ามใช้ในงานจริง เพราะเวอร์ชันเปลี่ยนเองได้วันไหนก็ไม่รู้
- tag ที่มี `alpine` เช่น `nginx:alpine` คือรุ่นที่ใช้ Linux ตัวจิ๋ว (Alpine) ขนาดเล็กกว่ามาก

---

## 3. Docker vs VM

**VM (Virtual Machine)** = **จำลองคอมพิวเตอร์ทั้งเครื่อง** (CPU, RAM, ดิสก์เสมือน) แล้ว **ติดตั้ง OS เต็มตัว** ลงไป เช่น เปิด Windows บน Mac ด้วย VirtualBox, VMware, Parallels

> 💡 **เปรียบเทียบกับที่พักอาศัย** 🏠 vs 🏢
> - **VM = บ้านเดี่ยวหลายหลัง** แต่ละหลังมีฐานราก ระบบน้ำไฟเป็นของตัวเอง แยกขาดกันดี แต่สร้างช้า ใช้ที่ดินเยอะ
> - **Container = ห้องในคอนโด** ใช้โครงสร้างตึกและระบบน้ำไฟร่วมกัน แต่ละห้องมีประตูล็อกแยก สร้างไว ใส่ได้หลายห้อง
>
> "โครงสร้างตึกส่วนกลาง" คือ **kernel** แกนกลางของระบบปฏิบัติการที่คุยกับ hardware

![เปรียบเทียบ VM กับ Docker container](/img/02-docker-vs-vm.svg)
*VM มี Guest OS ของตัวเองทุกตัว (หนัก) ส่วน container ใช้ kernel ของเครื่องร่วมกัน (เบา)*

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

> ⚠️ **บน Mac และ Windows:** container ต้องใช้ Linux kernel Docker Desktop จึงแอบรัน **Linux VM ตัวเล็ก** อยู่ข้างหลังให้อัตโนมัติ (ดูภาพในข้อ 4)
> สรุป: **Docker กับ VM ไม่ใช่คู่แข่ง แต่มักใช้ร่วมกัน** เช่น server บน cloud มักเป็น VM ที่ข้างในรัน container หลายตัว

> 🤓 **เกร็ด (ไม่ต้องจำ):** container จริงๆ คือ "โปรแกรมธรรมดา" ที่ Linux ขังไว้ด้วยฟีเจอร์ **namespaces** (มองไม่เห็นของคนอื่น) และ **cgroups** (จำกัด CPU/RAM)

---

## 4. 🔧 ติดตั้ง Docker และตรวจว่าพร้อมใช้

### Docker Desktop คืออะไร

**Docker Desktop** คือโปรแกรมสำหรับ Mac / Windows ที่รวมของที่ต้องใช้ไว้ให้ครบ: ตัวสั่งงาน `docker` (CLI), ตัวทำงานจริง **Docker Engine (daemon)**, Docker Compose และหน้าจอดูกล่องแบบกดปุ่ม

![Docker Desktop รัน Linux VM เล็กๆ ที่มี Docker Engine อยู่ข้างใน](/img/02-desktop-arch.svg)
*คำสั่งที่เราพิมพ์ใน Terminal เป็นแค่ตัวสั่งงาน ตัวทำงานจริงคือ Docker Engine ที่อยู่ใน Linux VM ถ้า Docker Desktop ไม่เปิด จะขึ้น "Cannot connect to the Docker daemon"*

### ติดตั้งตามเครื่อง

| เครื่อง | ขั้นตอน |
|---|---|
| **Mac** | ดาวน์โหลด Docker Desktop จาก docker.com เลือกรุ่นให้ตรงกับชิป (**Apple Silicon** = M1/M2/M3... หรือ **Intel**) ลากไอคอนใส่ Applications แล้วเปิดครั้งแรก รอสถานะ Running |
| **Windows** | ต้องเปิดใช้ **WSL 2** (Linux ที่มากับ Windows) ก่อน: เปิด PowerShell แบบ Administrator พิมพ์ `wsl --install` แล้วรีสตาร์ตเครื่อง จากนั้นติดตั้ง Docker Desktop และเลือกตัวเลือกใช้ **WSL 2** ถ้าถูกถาม |
| **Linux** | ติดตั้ง **Docker Engine** ตามคู่มือของ distro ที่ docs.docker.com (ไม่ต้องมี Docker Desktop) |

> ⚠️ **Windows ที่เจอบ่อย:** ถ้า Docker ขึ้นว่า virtualization ไม่ได้เปิด ต้องเข้า BIOS/UEFI ของเครื่องแล้วเปิด **Virtualization** (บางยี่ห้อเรียก Intel VT-x / AMD SVM) แล้วลองใหม่
> 💡 สำหรับบริษัทขนาดใหญ่ Docker Desktop มีเงื่อนไขลิขสิทธิ์ ให้ถามพี่ไบต์ก่อนติดตั้งในเครื่องบริษัท

### ตรวจว่าพร้อมใช้

เปิด Docker Desktop รอจนขึ้นสถานะ **Running** แล้วพิมพ์ใน Terminal:

```bash
docker --version
docker compose version
```
ควรเห็น (เลขเวอร์ชันของคุณอาจต่างไป):
```
Docker version 29.7.2, build ...
Docker Compose version v5.4.0
```
ถ้าสองคำสั่งนี้ตอบกลับมา แปลว่าติดตั้งสำเร็จแล้ว

> 💡 สังเกตว่าเราพิมพ์ `docker compose` (เว้นวรรค) ซึ่งเป็นรุ่นใหม่ ส่วน `docker-compose` (มีขีด) เป็นของเก่า ถ้าเจอในเน็ตให้เปลี่ยนเป็นแบบเว้นวรรค

---

## 5. 🔧 ลงมือ: Container ตัวแรก

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
ควรเห็น: ข้อความดึง image (`Pulling from library/nginx`) ในครั้งแรก แล้วจบด้วยรหัสยาวๆ ตัวอักษรและตัวเลข (นั่นคือ ID ของ container)

| ส่วน | ความหมาย |
|---|---|
| `-d` | รันเบื้องหลัง ไม่ค้างหน้าจอ |
| `-p 8080:80` | **port mapping** `เครื่องเรา:ในกล่อง` |
| `--name web` | ตั้งชื่อ container |
| `nginx:alpine` | image ที่ใช้ (`alpine` = Linux รุ่นจิ๋ว) |

เปิด **http://localhost:8080** → เห็น **"Welcome to nginx!"** 🎉

![port mapping 8080:80 เชื่อม browser บนเครื่องเรากับ nginx ในกล่อง](/img/02-port-mapping.svg)
*`-p 8080:80` คือการเจาะประตู: ใครมาเคาะ port 8080 ของเครื่องเรา จะถูกส่งต่อเข้า port 80 ในกล่อง*

> 💡 **ทำไมต้อง `-p`?** container เหมือนห้องที่ปิดประตูไว้ ต้อง "เจาะช่อง" เชื่อมประตูของเครื่องเรา (8080) ไปยังประตูในกล่อง (80)

**ขั้นที่ 3: ส่องข้างในกล่อง** 🔍
```bash
docker ps                  # ดู container ที่รันอยู่
```
ควรเห็น (ค่า ID และเวลาจะต่างไป):
```
CONTAINER ID   IMAGE          COMMAND                  CREATED          STATUS          PORTS                                     NAMES
35b659cfc065   nginx:alpine   "/docker-entrypoint.…"   10 seconds ago   Up 9 seconds    0.0.0.0:8080->80/tcp, [::]:8080->80/tcp   web
```
```bash
docker logs web            # ดู log (refresh หน้าเว็บแล้วดูอีกรอบ จะมีบรรทัดใหม่เพิ่ม)
docker exec -it web sh     # เข้าไปในกล่อง
```
ควรเห็น: เครื่องหมายพร้อมรับคำสั่งเปลี่ยนเป็น `/ #` แปลว่าเราอยู่ **ข้างในกล่อง** แล้ว
```sh
cat /etc/os-release        # ข้างในเป็น Alpine Linux ทั้งที่เครื่องเราเป็น Mac/Windows!
echo "<h1>Hello from Blicktech</h1>" > /usr/share/nginx/html/index.html
exit
```
ควรเห็น: บรรทัดแรกของผลลัพธ์ `cat` คือ `NAME="Alpine Linux"`
refresh หน้าเว็บ → เปลี่ยนเป็นข้อความของเรา 😎

> 💡 `-it` = `-i` (รับคีย์บอร์ด) + `-t` (ทำหน้าจอเหมือน terminal) ใช้คู่กันตอนเข้าไปพิมพ์คำสั่งในกล่อง

**ขั้นที่ 4: ลบกล่องแล้วสร้างใหม่**
```bash
docker rm -f web
docker run -d -p 8080:80 --name web nginx:alpine
```
refresh อีกรอบ → **กลับเป็น "Welcome to nginx!"** ข้อความที่เราแก้หายไป เพราะของในกล่องหายไปพร้อมกล่อง จำเรื่องนี้ไว้ จะสำคัญมากในข้อ 7

```bash
docker rm -f web           # เก็บกวาด
```

---

## 6. 📚 คำสั่ง Docker ที่ใช้บ่อย (สูตรลัด)

### วงจรชีวิตของ container

```
docker run   -->  Up (กำลังทำงาน)
docker stop  -->  Exited (หยุดอยู่ แต่ยังไม่ถูกลบ)
docker start -->  กลับมา Up
docker rm    -->  ถูกลบ (ข้อมูลในกล่องหายด้วย)
```
container ที่ **Exited** ไม่ได้หายไป มันแค่หยุด และยังกินชื่อไว้ (จึงเกิด error `name is already in use`) ต้อง `docker rm` ถึงจะหายจริง

### คำสั่งดูและควบคุม container

| ต้องการ | คำสั่ง | หมายเหตุ |
|---|---|---|
| ดูกล่องที่กำลังรัน | `docker ps` | |
| ดูกล่องทั้งหมด รวมที่หยุดแล้ว | `docker ps -a` | ใช้หาสาเหตุที่กล่องดับ |
| ดู log | `docker logs web` | |
| ดู log สดๆ ต่อเนื่อง | `docker logs -f web` | กด Ctrl+C ออก (กล่องไม่ดับ) |
| ดู log 50 บรรทัดท้าย | `docker logs --tail 50 web` | |
| เข้าไปพิมพ์คำสั่งในกล่อง | `docker exec -it web sh` | บาง image ใช้ `bash` ได้ด้วย |
| รันคำสั่งเดียวแล้วกลับ | `docker exec web ls /` | |
| หยุดกล่อง | `docker stop web` | ส่งสัญญาณให้ปิดตัวอย่างสุภาพ |
| เริ่มกล่องที่หยุดอยู่ | `docker start web` | |
| เริ่มใหม่ | `docker restart web` | |
| ลบกล่องที่หยุดแล้ว | `docker rm web` | |
| บังคับลบกล่องที่ยังรัน | `docker rm -f web` | |
| ดูรายละเอียดทั้งหมด | `docker inspect web` | ได้ JSON ยาวๆ |
| ดู CPU/RAM ที่ใช้ | `docker stats` | กด Ctrl+C ออก |

### คำสั่งจัดการ image / volume / network

| ต้องการ | คำสั่ง |
|---|---|
| ดู image ในเครื่อง | `docker images` |
| ดึง image มาไว้ก่อน | `docker pull postgres:17` |
| ลบ image | `docker rmi postgres:17` (ลบไม่ได้ถ้ามีกล่องใช้อยู่) |
| ดู volume | `docker volume ls` |
| ลบ volume | `docker volume rm pgdata` ⚠️ ข้อมูลหาย |
| ดูเครือข่าย | `docker network ls` |
| ดูพื้นที่ที่ Docker กินอยู่ | `docker system df` |

### การเก็บกวาด (ระวัง)

| คำสั่ง | ลบอะไร | ความเสี่ยง |
|---|---|---|
| `docker container prune` | container ที่หยุดแล้วทั้งหมด | ต่ำ |
| `docker image prune` | image ที่ไม่มี tag และไม่มีใครใช้ (dangling) | ต่ำ |
| `docker system prune` | container ที่หยุดแล้ว, เครือข่ายที่ไม่ใช้, dangling image, build cache | กลาง อ่านรายการก่อนกด `y` |
| `docker system prune --volumes` | ที่ข้างบน **รวม volume ที่ไม่มีกล่องใช้** | ⚠️ **สูง** ข้อมูลฐานข้อมูลที่หยุดอยู่อาจหาย |

> ⚠️ **กฎเหล็ก:** อย่า `prune` แบบ `--volumes` ถ้าไม่แน่ใจว่าใน volume ไม่มีข้อมูลสำคัญ และ **ห้ามใช้บนเครื่อง server จริงถ้ายังไม่มีข้อมูลสำรอง**

### ทางลัดที่ทำให้ชีวิตง่าย

- ใช้ **ชื่อ** แทน ID ได้เสมอ (ตั้งด้วย `--name`)
- ใช้แค่ **ตัวอักษรแรกๆ ของ ID** ก็พอ เช่น `docker stop 35b6`
- `docker run --rm ...` = ลบกล่องให้อัตโนมัติเมื่อจบ เหมาะกับคำสั่งที่รันครั้งเดียว เช่น `docker run --rm alpine echo hi`

---

## 7. 🔧 ข้อมูลใน Docker: Volume และ Bind mount

### ปัญหา: ข้อมูลในกล่องหายตอนลบกล่อง

อย่างที่เห็นในข้อ 5 ของที่เขียนในกล่อง หายไปพร้อมกล่อง Docker มีวิธีเก็บข้อมูลไว้ **นอกกล่อง** 2 แบบ

![เปรียบเทียบไม่มี mount, volume และ bind mount](/img/02-volume-vs-bind.svg)
*ไม่มี mount = ข้อมูลหายตอนลบกล่อง / volume = Docker เก็บให้ในที่ปลอดภัย (เหมาะกับฐานข้อมูล) / bind mount = ชี้ไปโฟลเดอร์จริงในเครื่องเรา (เหมาะกับตอนเขียนโค้ด)*

| | **Volume** | **Bind mount** |
|---|---|---|
| ใครดูแลที่เก็บ | Docker (เราไม่ต้องรู้ว่าอยู่ตรงไหน) | เรา เลือกโฟลเดอร์เอง |
| รูปแบบ | `-v pgdata:/var/lib/...` (ชื่อ:ที่อยู่ในกล่อง) | `-v ./src:/app/src` (โฟลเดอร์เรา:ที่อยู่ในกล่อง) |
| เปิดไฟล์ดูจากเครื่องเราได้ไหม | ไม่สะดวก | ✅ ได้เลย |
| เหมาะกับ | **ฐานข้อมูล** ข้อมูลที่โปรแกรมสร้าง | **ตอนพัฒนา** อยากแก้โค้ดแล้วเห็นผลทันที |
| กฎจำ | ชื่อไม่ขึ้นต้นด้วย `/` หรือ `.` | ขึ้นต้นด้วย `/` หรือ `./` (เป็น path) |

### 🔧 ลงมือ A: ฐานข้อมูลแบบไม่มี volume (ข้อมูลหาย)

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
ควรเห็น: ตารางที่มีแถว `1 | hello docker`

ลบกล่องแล้วสร้างใหม่:
```bash
docker rm -f pg-test
docker run -d --name pg-test -e POSTGRES_PASSWORD=secret postgres:17
docker exec -it pg-test psql -U postgres -c "SELECT * FROM notes;"
```
ควรเห็น: `ERROR: relation "notes" does not exist` → **ข้อมูลหายหมด** 😱

### 🔧 ลงมือ B: ฐานข้อมูลแบบมี volume (ข้อมูลอยู่)

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
docker volume ls           # เห็น pgdata อยู่ในรายการ
docker rm -f pg-test && docker volume rm pgdata     # เก็บกวาด
```

### 🔧 ลงมือ C: Bind mount แก้ไฟล์ในเครื่อง เห็นผลในกล่องทันที

```bash
mkdir bind-demo && cd bind-demo
mkdir site
echo "<h1>Version 1</h1>" > site/index.html
docker run -d -p 8080:80 --name bind-web -v "$(pwd)/site:/usr/share/nginx/html:ro" nginx:alpine
```
(Windows PowerShell ใช้ `${PWD}` แทน `$(pwd)` / `:ro` = ในกล่องอ่านได้อย่างเดียว กันโปรแกรมในกล่องแก้ไฟล์เราโดยไม่ตั้งใจ)

เปิด http://localhost:8080 → เห็น **Version 1**
ตอนนี้ **แก้ไฟล์ในเครื่องเรา** (ไม่ต้องเข้ากล่อง):
```bash
echo "<h1>Version 2</h1>" > site/index.html
```
refresh หน้าเว็บ → เห็น **Version 2** ทันที โดยไม่ต้อง build หรือรันใหม่ 🎉

```bash
docker rm -f bind-web      # เก็บกวาด
```

> 💡 เปรียบเทียบ: volume = **ตู้เซฟของ Docker** ฝากของไว้ ไม่ต้องรู้ว่าตั้งอยู่ที่ไหน / bind mount = **ประตูเชื่อมไปห้องทำงานของเรา** ของจริงอยู่ที่เราตลอด

---

## 8. 🔧 Dockerfile: สร้าง image ของเราเอง

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
ควรเห็น: ตอน build มีบรรทัดไล่ขั้นตอน เช่น `[1/2] FROM docker.io/library/nginx:alpine` และ `[2/2] COPY index.html ...` จบด้วย `naming to docker.io/library/my-site`

เปิด http://localhost:8080 → เห็นหน้าของเรา และคราวนี้ **ลบกล่องสร้างใหม่กี่รอบก็ยังอยู่** เพราะไฟล์ถูกอบอยู่ใน image แล้ว

### อ่าน Dockerfile ทีละบรรทัด

| บรรทัด | ทำอะไร | อธิบาย |
|---|---|---|
| `FROM nginx:alpine` | เลือกฐาน | ทุก image ต้องเริ่มจากอีก image หนึ่ง เหมือนต่อยอดสูตรที่มีคนทำไว้แล้ว |
| `COPY index.html /usr/share/nginx/html/index.html` | ก๊อปไฟล์ | `COPY จากเครื่องเรา ไปในกล่อง` ที่อยู่ปลายทางคือโฟลเดอร์ที่ nginx อ่านหน้าเว็บ |
| `EXPOSE 80` | จดบันทึก | แค่บอกว่ากล่องฟัง port 80 **ไม่ได้เปิดประตูจริง** ต้องใช้ `-p` ตอนรัน |

**คำสั่งใน Dockerfile ที่เจอบ่อย**
| คำสั่ง | ทำอะไร |
|---|---|
| `FROM` | เริ่มจาก image ไหน |
| `WORKDIR` | ย้ายไปทำงานในโฟลเดอร์ไหนในกล่อง (ไม่มีจะสร้างให้) |
| `COPY` | ก๊อปไฟล์จากเครื่องเราเข้ากล่อง |
| `RUN` | รันคำสั่งตอน **build** เช่น ติดตั้ง package |
| `ENV` | ตั้ง environment variable |
| `EXPOSE` | บอก port ที่ใช้ |
| `CMD` | คำสั่งที่รันตอน **container เริ่มทำงาน** |

> 💡 `RUN` ทำตอนสร้างแม่พิมพ์ (ครั้งเดียว) / `CMD` ทำทุกครั้งที่ทำขนมลูกใหม่

### Layer และ cache: ทำไม build รอบสองถึงเร็ว

ทุกบรรทัดใน Dockerfile ที่เปลี่ยนไฟล์ จะสร้าง **layer** (ชั้น) ซ้อนกันเหมือนแพนเค้กหลายชั้น image คือชั้นเหล่านี้ซ้อนกัน

Docker จำผลของแต่ละ layer ไว้ (**cache**) ถ้าบรรทัดนั้นและไฟล์ที่เกี่ยวข้อง **ไม่เปลี่ยน** ก็ใช้ของเดิมเลย แต่ถ้า layer ไหนเปลี่ยน **layer ที่อยู่ถัดลงไปทั้งหมดต้องสร้างใหม่**

![layer cache: build ครั้งแรกสร้างทุกชั้น build ครั้งต่อไปใช้ cache ของชั้นที่ไม่เปลี่ยน](/img/02-layers-cache.svg)
*เรียงบรรทัด "ที่เปลี่ยนไม่บ่อย" ไว้ข้างบน และ "ที่เปลี่ยนบ่อย" (โค้ดของเรา) ไว้ข้างล่าง ผลคือ build ครั้งต่อไปเร็วขึ้นมาก*

ลองดูของจริง: รัน `docker build -t my-site .` ซ้ำอีกครั้งโดยไม่แก้อะไร
ควรเห็น: ทุกขั้นตอนมีคำว่า `CACHED` และเสร็จในเสี้ยววินาที
```
#6 [2/2] COPY index.html /usr/share/nginx/html/index.html
#6 CACHED
```
แล้วลองแก้ `index.html` ซักคำ build ใหม่ → ขั้น `COPY` ไม่ใช่ `CACHED` อีกต่อไป

### Dockerfile ของแอปจริง (อ่านเป็นตัวอย่าง ยังไม่ต้องรัน)

นี่คือรูปแบบที่ใช้กับแอป Bun ซึ่งจะได้ทำจริงในบทที่ 5 ลองอ่านและดูว่าแต่ละบรรทัดมีหน้าที่อะไร
```dockerfile
FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

| บรรทัด | ทำอะไร |
|---|---|
| `FROM oven/bun:1` | เริ่มจาก image ที่มี Bun ติดมาแล้ว (เวอร์ชัน 1.x) |
| `WORKDIR /app` | ต่อไปนี้ทำงานในโฟลเดอร์ `/app` ในกล่อง |
| `COPY package.json bun.lock ./` | ก๊อป **เฉพาะไฟล์รายการ package** มาก่อน |
| `RUN bun install --frozen-lockfile` | ติดตั้ง package ตาม lock file เป๊ะ (ผลถูกเก็บเป็น layer) |
| `COPY . .` | ค่อยก๊อปโค้ดที่เหลือทั้งหมดเข้ามา |
| `EXPOSE 3000` | จดว่าแอปฟัง port 3000 |
| `CMD [...]` | สั่งรันแอปเมื่อกล่องเริ่มทำงาน |

**ทำไมต้อง COPY สองรอบ?** ถ้าแก้โค้ดแต่ไม่ได้เพิ่ม package → `package.json` ไม่เปลี่ยน → layer ติดตั้ง package ใช้ cache ได้ ประหยัดเวลาหลายสิบวินาทีทุกครั้งที่ build

### `.dockerignore`: อย่าเอาของที่ไม่ต้องใช้เข้ากล่อง

คำสั่ง `COPY . .` ก๊อปทุกอย่างในโฟลเดอร์ รวมถึง `node_modules`, `.git` และไฟล์ลับ `.env` สร้างไฟล์ `.dockerignore` (หลักการเดียวกับ `.gitignore`) เพื่อกันไว้:
```
node_modules
.git
.env
dist
```
> ⚠️ ไฟล์ลับอย่าใส่เข้า image เพราะใครได้ image ก็เปิดอ่านได้

---

## 9. 🔧 ตัวแปรสภาพแวดล้อม (environment variable) และไฟล์ `.env`

**Environment variable** คือค่าตั้งต่างๆ ที่ส่งให้โปรแกรมจากข้างนอก เช่น รหัสผ่าน DB, port, ที่อยู่ API ข้อดีคือ **โค้ดเดียวกัน ตั้งค่าต่างกันตามที่รัน** (เครื่องเรา vs server จริง) โดยไม่ต้องแก้โค้ดและไม่ต้องเขียนรหัสผ่านลงในโค้ด

ส่งค่าเข้ากล่องได้ 3 วิธี:

| วิธี | ตัวอย่าง | ใช้เมื่อ |
|---|---|---|
| ทีละตัว | `docker run -e POSTGRES_PASSWORD=secret ...` | ค่าไม่กี่ตัว |
| จากไฟล์ | `docker run --env-file .env ...` | ค่าเยอะ |
| ใน Compose | `environment:` หรือ `env_file:` | ใช้ในโปรเจกต์จริง |

### `.env` กับ Compose

Compose อ่านไฟล์ชื่อ **`.env`** ที่อยู่โฟลเดอร์เดียวกับ `compose.yaml` ให้เอง และให้ใช้ `${ชื่อ}` ในไฟล์ yaml ได้

`.env`
```
DB_PASSWORD=secret123
```
`compose.yaml` (ท่อนย่อ)
```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```
ตรวจว่า Compose แทนค่าให้ถูกด้วย:
```bash
docker compose config
```
ควรเห็น: ค่าที่แทนแล้ว
```
services:
  db:
    environment:
      POSTGRES_PASSWORD: secret123
    image: postgres:17
```

**กฎที่ต้องจำ**
- ✅ ใส่ `.env` ใน `.gitignore` เสมอ (มีรหัสผ่านจริง ห้ามขึ้น Git)
- ✅ commit ไฟล์ **`.env.example`** ที่มีชื่อตัวแปรแต่ใส่ค่าตัวอย่าง เพื่อให้เพื่อนรู้ว่าต้องตั้งอะไรบ้าง
- ⚠️ ถ้าแก้ `.env` แล้ว ต้อง `docker compose up -d` ใหม่ ค่าถึงเข้ากล่อง
- ⚠️ ตัวแปรที่ทำให้ **ฐานข้อมูลถูกสร้างครั้งแรก** (เช่น `POSTGRES_PASSWORD`) มีผลแค่ตอน volume ยังว่าง ถ้า volume มีข้อมูลแล้ว การเปลี่ยนค่าใน `.env` จะไม่เปลี่ยนรหัสผ่านที่ฝังอยู่ในข้อมูล

---

## 10. 🔧 Docker Compose: เปิดหลายกล่องพร้อมกัน

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
ควรเห็น: `docker compose ps` แสดง 2 แถว (`db` และ `adminer`) สถานะ `running` (หรือ `Up`)

เปิด http://localhost:8080 แล้วกรอก:

| ช่อง | ค่า |
|---|---|
| System | PostgreSQL |
| Server | **`db`** 👈 |
| Username / Password | `app` / `secret` |
| Database | `appdb` |

ลองสร้างตารางผ่านหน้าเว็บได้เลย 🎉

![ใน Compose ทุก service อยู่ในเครือข่ายเดียวกันและเรียกหากันด้วยชื่อ](/img/02-compose-network.svg)
*adminer เรียก DB ด้วยชื่อ `db` ส่วนเรา (บนเครื่อง) ต้องผ่าน port ที่ publish ออกมา*

### Port และ Network: ใครคุยกับใครยังไง

มี "ผู้คุย" 2 แบบที่ต้องแยกให้ออก:

| ใครคุยกับใคร | ใช้ที่อยู่อะไร | ต้องมี `ports:` ไหม |
|---|---|---|
| **เรา** (browser, psql บนเครื่องเรา) → กล่อง | `localhost:8080` | ✅ ต้องมี |
| **กล่อง** → กล่องอื่น (ใน Compose เดียวกัน) | `db:5432` (ชื่อ service + port **ในกล่อง**) | ❌ ไม่ต้อง |

- Compose สร้างเครือข่ายให้เองอัตโนมัติ ชื่อ `ชื่อโฟลเดอร์_default` ใช้ `docker network ls` ดูได้
- ฝั่งกล่องคุยกัน ใช้ port **ฝั่งขวา** (ในกล่อง) เสมอ ถ้า `ports: "5433:5432"` กล่องอื่นก็ยังเรียก `db:5432` ส่วนเราเรียก `localhost:5433`
- ⚠️ `ports:` คือการเปิดประตูสู่โลกภายนอก **บนระบบจริง (server) ห้ามใส่ `ports:` ให้ฐานข้อมูล** (ดูบทที่ 19–20)

> 💡 **ทำไม Server ใส่ `db` ไม่ใช่ `localhost`?**
> ใน Compose ทุกกล่องอยู่ในเครือข่ายเดียวกัน และ **เรียกหากันด้วยชื่อ service** ส่วน `localhost` ในกล่อง adminer หมายถึง "กล่อง adminer เอง"
> ⚠️ จุดนี้มือใหม่พลาดบ่อยที่สุด!

### `depends_on` ไม่ได้แปลว่า "รอจนพร้อม"

`depends_on` แค่สั่ง **เปิดตามลำดับ** แต่ไม่รอให้ DB เปิดเสร็จพร้อมรับงาน ถ้าแอปต่อ DB เร็วเกินไปอาจ error ชั่วคราว วิธีที่ถูกคือใส่ **healthcheck** ให้ DB แล้วให้อีกกล่องรอ:
```yaml
  db:
    image: postgres:17
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d appdb"]
      interval: 5s
      retries: 10
  adminer:
    image: adminer
    depends_on:
      db:
        condition: service_healthy
```

### คำสั่ง Compose ที่ใช้บ่อย

```bash
docker compose logs -f db     # ดู log (Ctrl+C ออก)
docker compose down           # ปิดและลบกล่อง (volume ยังอยู่)
docker compose down -v        # ปิด + ลบ volume (⚠️ ข้อมูลหาย)
```
| ต้องการ | คำสั่ง |
|---|---|
| เปิดทั้งระบบ | `docker compose up -d` |
| เปิด + build image ใหม่ | `docker compose up -d --build` |
| ดูสถานะ | `docker compose ps` |
| หยุดไว้เฉยๆ ไม่ลบ | `docker compose stop` |
| เข้า shell ของ service | `docker compose exec db sh` |
| รีสตาร์ตเฉพาะ service | `docker compose restart adminer` |
| ดูค่าที่ Compose อ่านได้จริง | `docker compose config` |

---

## 11. 💥 ลองพังมันดู

การเห็น error ครั้งแรกในที่ปลอดภัย ทำให้ไม่ตกใจเมื่อเจอของจริง

**พังที่ 1: ชน port**
```bash
docker run -d --name p1 -p 8099:80 nginx:alpine
docker run -d --name p2 -p 8099:80 nginx:alpine
```
ควรเห็น (กล่องที่สองไม่ยอมเริ่ม):
```
docker: Error response from daemon: ... Bind for 0.0.0.0:8099 failed: port is already allocated
```
สาเหตุ: port 8099 ของเครื่องเรามีกล่อง `p1` จองไว้แล้ว port หนึ่ง ใช้ได้ทีละกล่อง
แก้: เปลี่ยนเป็น `-p 8100:80` แล้วเก็บกวาด `docker rm -f p1 p2`
(หมายเหตุ: กล่อง `p2` ที่สร้างไม่สำเร็จยังเหลืออยู่ในสถานะสร้างแล้ว จึงต้อง `rm` ทิ้งด้วย)

**พังที่ 2: กล่องดับทันที เพราะลืมรหัสผ่าน**
```bash
docker run -d --name pg-bad postgres:17
docker ps -a
docker logs pg-bad
```
ควรเห็น: `docker ps -a` แสดงสถานะ `Exited (1)` และ log บอกตรงๆ:
```
Error: Database is uninitialized and superuser password is not specified.
       You must specify POSTGRES_PASSWORD to a non-empty value for the superuser.
```
บทเรียน: **กล่องดับเอง = ไปอ่าน `docker logs` ก่อนเสมอ** ข้อความ error มักบอกวิธีแก้ให้เลย
เก็บกวาด: `docker rm -f pg-bad`

**พังที่ 3: ชื่อซ้ำ**
```bash
docker run -d --name web nginx:alpine
docker stop web
docker run -d --name web nginx:alpine
```
ควรเห็น: error `The container name "/web" is already in use` แม้กล่องแรกหยุดแล้ว เพราะมันยังไม่ถูก `rm` แก้ด้วย `docker rm -f web`

---

## 12. ⚠️ ปัญหาที่เจอบ่อย (อาการ → สาเหตุ → วิธีแก้)

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `Cannot connect to the Docker daemon` | ยังไม่เปิด Docker Desktop หรือ daemon ยังไม่ขึ้น | เปิด Docker Desktop รอสถานะ Running แล้วลองใหม่ (Linux: `sudo systemctl start docker`) |
| `port is already allocated` / `address already in use` | มีกล่องหรือโปรแกรมอื่นจอง port นั้นอยู่ (เช่น Postgres ที่ลงในเครื่องจองอยู่ที่ 5432) | หาตัวที่ใช้ด้วย `docker ps` ปิดมัน หรือเปลี่ยนฝั่งซ้ายเป็นเลขอื่น เช่น `-p 8081:80` ถ้าไม่ใช่กล่อง Docker หาตัวที่จองด้วย `lsof -i :8080` (Mac/Linux) หรือ `netstat -ano \| findstr :8080` (Windows) |
| `no space left on device` | image เก่า, กล่องที่หยุดแล้ว, build cache สะสมจนดิสก์ที่ Docker ใช้เต็ม | `docker system df` ดูว่าอะไรกิน แล้ว `docker system prune` (อ่านรายการก่อนกด `y`) ถ้ายังไม่พอเพิ่มขนาดดิสก์ใน Docker Desktop → Settings → Resources |
| `permission denied ... /var/run/docker.sock` (Linux) | user ยังไม่อยู่ในกลุ่ม `docker` | `sudo usermod -aG docker $USER` แล้ว logout/login ใหม่ (อย่าแก้ด้วยการ `chmod 777` ไฟล์ socket) |
| container ขึ้น Exited ทันที | โปรแกรมหลักในกล่องจบการทำงาน (error หรือไม่มีงานให้ทำ) | `docker ps -a` ดูรหัสออก แล้ว `docker logs ชื่อ` อ่านสาเหตุ ถ้า `Exited (0)` คือจบปกติ (เช่น `hello-world`) ไม่ใช่บั๊ก |
| `container name "/web" is already in use` | มีชื่อนี้อยู่แล้ว (แม้หยุดแล้ว) | `docker rm -f web` |
| แก้ไฟล์แล้ว container ยังเป็นของเก่า | ไฟล์ถูกอบอยู่ใน image ยังไม่ build ใหม่ | `docker compose up -d --build` (หรือ `docker build` แล้ว run ใหม่) ถ้าอยากเห็นผลทันทีตอนพัฒนา ใช้ bind mount (ข้อ 7) |
| แก้ไฟล์แล้ว (ใช้ bind mount) หน้าเว็บยังเป็นของเก่า | browser จำหน้าเก่าไว้ (cache) หรือ path ที่ mount ผิด | กด Hard refresh (Ctrl+Shift+R / Cmd+Shift+R) แล้วเช็ค path ด้วย `docker exec ชื่อ ls /ที่อยู่ในกล่อง` ว่าเห็นไฟล์ใหม่ไหม |
| ต่อ DB ไม่ได้จากอีกกล่อง | ใช้ `localhost` | ใช้ชื่อ service เช่น `db` |
| ต่อ DB จากเครื่องเราไม่ได้ | ไม่ได้ใส่ `ports:` หรือ port ถูกจองอยู่ | ใส่ `ports: "5432:5432"` และเช็คว่าไม่มี Postgres อื่นจองอยู่ |
| ข้อมูลหายหลัง down/up | ไม่มี volume หรือใช้ `down -v` | เพิ่ม volume, ระวัง `-v` |
| เปลี่ยน `POSTGRES_PASSWORD` แล้วไม่มีผล | รหัสผ่านถูกฝังตอนสร้างข้อมูลครั้งแรกแล้ว | ถ้าเป็นข้อมูลทดลอง `docker compose down -v` แล้ว up ใหม่ (ข้อมูลจริงห้ามทำ) |
| `no matching manifest for linux/arm64` (Mac ชิป M) | image นั้นไม่มีรุ่นสำหรับ ARM | เพิ่ม `--platform linux/amd64` ใน `docker run` (หรือ `platform: linux/amd64` ใน Compose) จะช้ากว่าเล็กน้อย |
| Docker ช้า / กินแรมเยอะ | Docker Desktop ถูกจัดสรรทรัพยากรไว้เยอะ หรือมีกล่องรันค้าง | `docker ps` ปิดกล่องที่ไม่ใช้ และปรับ Settings → Resources |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. รัน image เดียวกัน 3 ครั้ง (คนละชื่อ) ได้อะไร?</summary>

container 3 ตัวที่แยกกันอิสระ ข้อมูลในตัวหนึ่งไม่กระทบอีกตัว (แม่พิมพ์เดียว ขนม 3 ลูก)
</details>

<details><summary>2. <code>-p 5433:5432</code> ต้องต่อ DB จากเครื่องเราที่ port อะไร?</summary>

`localhost:5433` (ซ้าย = เครื่องเรา, ขวา = ในกล่อง) แต่ถ้ากล่องอื่นใน Compose เดียวกันจะต่อ ให้ใช้ `ชื่อservice:5432`
</details>

<details><summary>3. ทำไมรัน Windows ใน Docker บน Mac ไม่ได้ แต่ใช้ VM ได้?</summary>

container ใช้ kernel ร่วมกับ host (บน Mac คือ Linux kernel ใน VM เล็กของ Docker Desktop) จึงรันได้แค่โปรแกรม Linux ส่วน VM จำลองทั้งเครื่อง ติดตั้ง OS อะไรก็ได้
</details>

<details><summary>4. <code>RUN npm install</code> กับ <code>CMD ["node", "index.js"]</code> ทำงานตอนไหน?</summary>

`RUN` ทำตอน `docker build` (ครั้งเดียว ผลถูกอบอยู่ใน image) / `CMD` ทำทุกครั้งที่ container เริ่ม
</details>

<details><summary>5. ทำไมใน Dockerfile ถึงควร COPY <code>package.json</code> มาติดตั้งก่อน แล้วค่อย COPY โค้ดทั้งหมด?</summary>

เพราะ Docker cache ทีละ layer ถ้าแก้แค่โค้ด `package.json` ไม่เปลี่ยน layer ติดตั้ง package ใช้ cache ได้ build เร็วขึ้นมาก ถ้า COPY ทุกอย่างพร้อมกัน แก้โค้ดบรรทัดเดียวก็ต้องติดตั้ง package ใหม่ทุกครั้ง
</details>

<details><summary>6. ฐานข้อมูลควรใช้ volume หรือ bind mount? แล้วตอนเขียนโค้ดล่ะ?</summary>

ฐานข้อมูลใช้ **volume** (Docker ดูแลให้ ปลอดภัยกว่า) ตอนเขียนโค้ดที่อยากให้แก้ไฟล์ในเครื่องแล้วเห็นผลทันทีใช้ **bind mount**
</details>

<details><summary>7. กล่อง adminer ต่อ DB ด้วย <code>localhost:5432</code> แล้วต่อไม่ได้ ทำไม? ต้องแก้ยังไง?</summary>

`localhost` ในกล่อง adminer หมายถึงกล่อง adminer เอง ไม่ใช่ DB ต้องใช้ชื่อ service เช่น `db:5432`
</details>

<details><summary>8. ลบ <code>.env</code> ออกจาก Git ได้ไหม และควรทำอะไรแทน?</summary>

ควรใส่ `.env` ไว้ใน `.gitignore` (ไม่ commit) เพราะมีรหัสผ่านจริง แล้ว commit `.env.example` ที่มีแค่ชื่อตัวแปรกับค่าตัวอย่างแทน
</details>

---

## ✏️ แบบฝึกหัด

ใช้ `compose.yaml` ข้อ 10 สร้างตาราง `laptops` ผ่าน Adminer ใส่ข้อมูล 3 แถว แล้วพิสูจน์ว่าหลัง `docker compose down` และ `up -d` ใหม่ ข้อมูลยังอยู่ แนบ screenshot ก่อนและหลัง

**ข้อเพิ่มเติม (ทำถ้ามีเวลา)**
1. ย้ายรหัสผ่านไปไว้ในไฟล์ `.env` แล้วใช้ `${DB_PASSWORD}` ใน `compose.yaml` ตรวจด้วย `docker compose config` และใส่ `.env` ใน `.gitignore`
2. ทำ bind mount (ข้อ 7 ลงมือ C) แล้วแก้ `index.html` 3 รอบ แคปหน้าจอให้เห็นว่าเปลี่ยนทันทีโดยไม่ต้อง build
3. เขียนตารางสั้นๆ ว่าตอนไหนใช้ volume ตอนไหนใช้ bind mount พร้อมเหตุผลของคุณเอง

## ✅ ผ่านด่าน

- [ ] อธิบาย image / container / volume ด้วยคำพูดตัวเองได้
- [ ] อธิบายได้ว่า registry / Docker Hub คืออะไร และ tag คืออะไร
- [ ] อธิบาย Docker vs VM ได้อย่างน้อย 3 ข้อ
- [ ] ใช้ `docker ps`, `logs`, `exec`, `stop`, `rm` ได้คล่อง
- [ ] เขียน Dockerfile และ `compose.yaml` ง่ายๆ ได้ และอธิบายแต่ละบรรทัดได้
- [ ] อธิบายความต่างของ volume กับ bind mount ได้
- [ ] รู้ว่าในกล่องต้องเรียกกันด้วยชื่อ service
- [ ] รู้ว่า `.env` ห้ามขึ้น Git และใช้ `.env.example` แทน
- [ ] อ่าน error จาก `docker logs` เพื่อหาสาเหตุที่กล่องดับได้

---

[← บทที่ 1: Git](./01-git.md) · [🏠 สารบัญ](/) · [บทที่ 3: Node vs Yarn vs Bun →](./03-node-yarn-bun.md)
