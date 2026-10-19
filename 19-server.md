# บทที่ 19: เช่า Server (VPS) + Linux + SSH 🖥️

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 0, 2 และ 17 · 🛠 ใช้: VPS Ubuntu 24.04 LTS, SSH, Terminal

> **⚡ สรุป 30 วินาที**
> - **VPS** = คอมพิวเตอร์เช่าในศูนย์ข้อมูล มี IP สาธารณะ เปิด 24 ชม. เราเป็น admin เอง
> - เข้า server ด้วย **SSH key** เท่านั้น ปิด login ด้วยรหัสผ่านและปิด root
> - เปิด firewall แค่ **22, 80, 443** ติดตั้ง Docker แล้วพร้อม deploy
> - ⚠️ ตั้งค่า SSH ผิด = ล็อกตัวเองออกจากเครื่อง **ทดสอบในหน้าต่างใหม่ก่อนปิดหน้าต่างเดิมเสมอ**

---

## 📖 เรื่องเล่า

บิตเช่า VPS ตั้งรหัส root ว่า `Bitcafe2026!` คิดว่ายากแล้ว
3 วันต่อมาเปิด `/var/log/auth.log` ดู พบว่ามีคนพยายาม login เข้ามา **48,000 ครั้ง** จากทั่วโลก 😨

พี่ไบต์: *"ทันทีที่เครื่องมี IP สาธารณะ bot ก็มาเคาะประตูแล้ว ไม่ต้องรอให้ใครรู้จักเว็บเราเลย"*

---

## 1. เลือก VPS

| ผู้ให้บริการ (ตัวอย่าง) | จุดเด่น |
|---|---|
| DigitalOcean, Vultr, Linode (Akamai) | หน้าจอง่าย เอกสารดี มี datacenter สิงคโปร์ |
| AWS Lightsail | ราคาเหมาจ่ายรายเดือน อยู่ในระบบ AWS |
| Hetzner | ราคาถูก (ไกลไทยกว่า) |
| ผู้ให้บริการในไทย | ใกล้ลูกค้า ออกใบกำกับภาษีไทยได้ |

**สเปกสำหรับเว็บ STARTER**
| | ขั้นต่ำ | แนะนำ |
|---|---|---|
| CPU / RAM | 1 vCPU / 1 GB (ต้องเปิด swap) | 1–2 vCPU / 2 GB |
| Disk | 25 GB SSD | 50 GB SSD |
| OS | **Ubuntu 24.04 LTS** | (LTS = ได้อัปเดตความปลอดภัยยาว 5 ปี) |
| Region | **Singapore** | ใกล้ไทยที่สุด เว็บตอบเร็ว |

> 💡 เปิด **backup/snapshot อัตโนมัติ** ของผู้ให้บริการด้วย (เพิ่มเงินเล็กน้อย) คุ้มมากวันที่พลาด

---

## 2. 🔧 SSH Key: กุญแจแทนรหัสผ่าน

**SSH** = คำสั่งเปิด terminal ของเครื่องอื่นผ่าน network แบบเข้ารหัส
**SSH key** = กุญแจ 2 ดอกคู่กัน
```
 🔑 private key (~/.ssh/id_ed25519)      อยู่ในเครื่องเรา ห้ามให้ใคร ห้ามขึ้น Git
 🔒 public key  (~/.ssh/id_ed25519.pub)  เอาไปติดที่ server ได้ ให้ใครเห็นก็ได้
```
> 💡 **เปรียบเทียบ:** public key = แม่กุญแจที่เราเอาไปคล้องประตู server / private key = ลูกกุญแจที่เราถือไว้ คนอื่นเห็นแม่กุญแจก็ไขไม่ได้

```bash
ssh-keygen -t ed25519 -C "bit@blicktech"      # กด Enter ตามค่าเริ่มต้น และตั้ง passphrase
cat ~/.ssh/id_ed25519.pub                       # ก๊อปข้อความนี้ไปใส่ตอนสร้าง VPS
```
ตอนสร้าง VPS เลือก **Authentication: SSH key** แล้ววาง public key → ได้ IP มา เช่น `203.0.113.10`

```bash
ssh root@203.0.113.10
```
ครั้งแรกจะถาม `Are you sure you want to continue connecting (yes/no)?` พิมพ์ `yes` (บันทึกลายนิ้วมือของ server ไว้กันเครื่องปลอม)

---

## 3. 🔧 ตั้งค่าเครื่องครั้งแรก

ทั้งหมดนี้พิมพ์ **บน server** (หลัง `ssh root@...`)

### 3.1 อัปเดต + ตั้งเวลา
```bash
apt update && apt upgrade -y
timedatectl set-timezone Asia/Bangkok
```

### 3.2 สร้าง user ของเรา (ไม่ใช้ root ทำงานประจำ)
```bash
adduser deploy                                  # ตั้งรหัสผ่าน (ใช้ตอน sudo)
usermod -aG sudo deploy                         # ให้ใช้ sudo ได้
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # ก๊อป public key ไปให้ deploy
```
**เปิด Terminal หน้าต่างใหม่ในเครื่องเรา** แล้วทดสอบ:
```bash
ssh deploy@203.0.113.10
sudo whoami                                     # ต้องได้ root
```
ได้แล้วค่อยไปต่อ ❗ ยังไม่ต้องปิดหน้าต่าง root

### 3.3 ปิด login ด้วยรหัสผ่าน และปิด root
```bash
sudo tee /etc/ssh/sshd_config.d/00-hardening.conf > /dev/null <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
EOF
sudo sshd -t && sudo systemctl restart ssh      # -t = ตรวจ config ก่อน ผิดจะไม่ restart
```
> 🤓 **ทำไมชื่อไฟล์ขึ้นต้น `00-`?** SSH อ่านไฟล์ใน `sshd_config.d/` เรียงตามชื่อ และ **ค่าแรกที่เจอชนะ** image ของผู้ให้บริการบางเจ้ามีไฟล์ `50-cloud-init.conf` ที่เปิด `PasswordAuthentication yes` ไว้ ถ้าเราตั้งชื่อ `99-` ค่าของเราจะแพ้

**ทดสอบในหน้าต่างใหม่อีกครั้ง:**
```bash
ssh deploy@203.0.113.10                         # ต้องเข้าได้
ssh root@203.0.113.10                           # ต้องถูกปฏิเสธ (Permission denied)
```

### 3.4 Firewall (ufw)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH          # 22  ⚠️ ต้องมีบรรทัดนี้ก่อน enable ไม่งั้นหลุดทันที
sudo ufw allow 80/tcp           # HTTP
sudo ufw allow 443/tcp          # HTTPS
sudo ufw allow 443/udp          # HTTP/3
sudo ufw enable
sudo ufw status verbose
```
ตั้ง **firewall ของผู้ให้บริการ VPS** (Cloud Firewall ในหน้าเว็บ) ให้เปิดแค่ 22, 80, 443 ด้วย เป็นชั้นที่สอง

### 3.5 อัปเดตความปลอดภัยอัตโนมัติ
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades    # เลือก Yes
```

### 3.6 Swap (จำเป็นถ้า RAM 1–2 GB)
build image บน server ใช้ RAM เยอะ ไม่มี swap อาจโดน kill กลางทาง
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h                                          # ต้องเห็นบรรทัด Swap: 2.0Gi
```

---

## 4. 🔧 ติดตั้ง Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
less get-docker.sh              # 👀 เปิดอ่านคร่าวๆ ก่อนรัน script จากเน็ตเสมอ (กด q ออก)
sudo sh get-docker.sh
sudo usermod -aG docker deploy  # ให้ deploy ใช้ docker ได้โดยไม่ต้อง sudo
exit                            # ออกแล้ว ssh เข้าใหม่ให้สิทธิ์มีผล
```
```bash
ssh deploy@203.0.113.10
docker run --rm hello-world     # เห็น "Hello from Docker!" = พร้อม 🎉
docker compose version
```

> ⚠️ **กับดักใหญ่: Docker ข้าม ufw** port ที่เขียนใน `ports:` ของ compose (เช่น `"5432:5432"`) จะเปิดสู่โลก **แม้ ufw จะไม่ได้ allow** เพราะ Docker แก้กฎ firewall เอง
> ✅ บน production: **ห้ามใส่ `ports:` ให้ database และ API** เปิดเฉพาะ Caddy (80/443) ให้ container อื่นคุยกันผ่าน Docker network ภายใน (บทที่ 20)
> ถ้าจำเป็นต้องเปิดเพื่อดูชั่วคราว ให้ผูกกับ localhost: `"127.0.0.1:5432:5432"` แล้วต่อผ่าน SSH tunnel (ข้อ 6)

---

## 5. 🔧 ทำให้ชีวิตง่ายขึ้น: `~/.ssh/config`

ในเครื่อง **เรา** (ไม่ใช่ server) สร้าง/แก้ `~/.ssh/config`
```
Host bitcafe
  HostName 203.0.113.10
  User deploy
  IdentityFile ~/.ssh/id_ed25519
```
ตอนนี้พิมพ์แค่ `ssh bitcafe` ก็เข้าได้ ✨

---

## 6. 🔧 คำสั่ง Linux ที่ใช้ดูแล server

| ทำอะไร | คำสั่ง |
|---|---|
| ดูพื้นที่ disk | `df -h` |
| ดู RAM | `free -h` |
| ดู CPU/process | `htop` (ติดตั้ง `sudo apt install htop`) |
| ดูขนาดโฟลเดอร์ | `du -sh *` |
| ดู log ระบบ / ssh | `sudo journalctl -u ssh --since "1 hour ago"` |
| ใครพยายาม login | `sudo journalctl -u ssh \| grep -i "invalid user" \| tail` |
| ดู port ที่เปิดอยู่ | `sudo ss -tlnp` |
| รีบูต | `sudo reboot` |
| ก๊อปไฟล์ขึ้น server | `scp ./file.txt bitcafe:~/` |
| ต่อ DB บน server จากเครื่องเรา (SSH tunnel) | `ssh -L 5433:127.0.0.1:5432 bitcafe` แล้วเปิด pgAdmin ที่ `localhost:5433` |

> 💡 อยากเพิ่มกันเดารหัสอีกชั้น ติดตั้ง **fail2ban** (`sudo apt install fail2ban`) แบน IP ที่ login ผิดรัวๆ แต่ถ้าปิด password login แล้ว ความเสี่ยงหลักหมดไปแล้ว

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ทำไม SSH key ปลอดภัยกว่ารหัสผ่าน?</summary>

private key ยาวและสุ่มจนเดาไม่ได้ และไม่เคยถูกส่งข้ามเครือข่าย ส่วนรหัสผ่านถูกเดาแบบ brute force ได้ ซึ่ง bot ทำตลอดเวลา
</details>

<details><summary>2. ทำไมต้องทดสอบ login ในหน้าต่างใหม่ก่อนปิดหน้าต่างเดิม?</summary>

ถ้าตั้งค่า SSH หรือ firewall ผิด หน้าต่างเดิมที่ยังเชื่อมอยู่คือทางเดียวที่จะแก้คืนได้ ปิดไปแล้วอาจต้องใช้ console ฉุกเฉินของผู้ให้บริการ หรือสร้างเครื่องใหม่
</details>

<details><summary>3. ufw ไม่ได้ allow 5432 แต่ทำไมคนนอกยังต่อฐานข้อมูลได้?</summary>

compose มี `ports: "5432:5432"` และ Docker เขียนกฎ firewall ของตัวเองข้าม ufw แก้โดยลบ `ports:` ของ database ออก หรือผูกกับ `127.0.0.1`
</details>

---

## ✏️ แบบฝึกหัด

สร้าง VPS (หรือ VM ในเครื่องด้วย Multipass / UTM ถ้ายังไม่มีงบ) ทำข้อ 2–5 ให้ครบ แล้วส่งผลลัพธ์ของ `sudo ufw status verbose`, `ssh root@<IP>` (ต้องถูกปฏิเสธ) และ `docker run --rm hello-world`

## ✅ ผ่านด่าน

- [ ] สร้าง SSH key และเข้า server ด้วย key ได้
- [ ] สร้าง user `deploy` ปิด root login และ password login แล้ว
- [ ] ufw เปิดแค่ 22 / 80 / 443
- [ ] ติดตั้ง Docker และรู้กับดัก Docker ข้าม ufw
- [ ] ใช้ `~/.ssh/config`, `df`, `free`, `ss`, `journalctl`, SSH tunnel ได้

---

[← บทที่ 18: Domain & DNS](./18-domain-dns.md) · [🏠 สารบัญ](./README.md) · [บทที่ 20: Deploy บน VPS →](./20-deploy-vps.md)
