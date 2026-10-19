# บทที่ 1: Git 🕹️

> ⏱ ประมาณ 2 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 0 · 🛠 ใช้: Git, Terminal, บัญชี GitHub/GitLab

> **⚡ สรุป 30 วินาที**
> - Git คือ **"จุดเซฟเกม" ของโค้ด** ย้อนกลับได้ทุกเมื่อ
> - `add` → `commit` = เซฟ / `branch` = แยกเส้นทางไปลองของใหม่ / `merge` = รวมกลับ
> - `push` / `pull` = ส่งขึ้น / ดึงลงจาก server กลาง (GitHub, GitLab)
> - ทีมทำงานผ่าน **Merge Request** ให้พี่ review ก่อนรวมโค้ดเสมอ

---

## 📖 เรื่องเล่า

บิตเปิดโฟลเดอร์งานสมัยเรียนให้พี่ไบต์ดู:

```
project.zip
project_final.zip
project_final_v2.zip
project_final_v2_จริงๆ.zip
project_final_v2_จริงๆ_แก้ตามอาจารย์_ล่าสุด.zip
```

พี่ไบต์ถาม: *"ถ้าอยากรู้ว่าเมื่อวานแก้บรรทัดไหนไป หรืออยากรวมงานกับเพื่อนอีก 3 คนที่แก้ไฟล์เดียวกัน จะทำยังไง?"*
บิตเงียบ... 😶

---

## 1. Git คืออะไร

**Git** คือโปรแกรมที่ **บันทึกประวัติการเปลี่ยนแปลงของไฟล์** ทุกครั้งที่เราสั่ง และช่วยให้หลายคนทำงานในโปรเจกต์เดียวกันได้โดยไม่ทับกัน

> 💡 **เปรียบเทียบกับเกม**
> - **commit** = กดเซฟเกม 💾 ตายเมื่อไหร่ก็โหลดเซฟกลับมาได้
> - **branch** = สร้างเซฟแยกไปลองเส้นทางใหม่ ถ้าดีค่อยเอากลับมารวม ถ้าพังก็ทิ้ง เซฟหลักไม่เสียหาย
> - **GitHub / GitLab** = cloud save ให้ทั้งทีมโหลดเซฟเดียวกันได้

> 🤓 **เกร็ด:** Git สร้างโดย Linus Torvalds คนเดียวกับที่สร้าง Linux ปี 2005 ใช้เวลาเขียนเวอร์ชันแรกประมาณ 10 วัน เพราะเครื่องมือเดิมที่ทีม Linux ใช้เลิกให้ใช้ฟรี

**Git ≠ GitHub**
| | Git | GitHub / GitLab |
|---|---|---|
| คืออะไร | โปรแกรมในเครื่องเรา | เว็บไซต์เก็บ repo ออนไลน์ |
| ทำอะไร | บันทึกประวัติ, branch, merge | แชร์ repo, review โค้ด, จัดการงาน (issue) |
| ใช้ได้ไหมถ้าไม่มีเน็ต | ✅ | ❌ |

---

## 2. Git ทำงานยังไง: 3 พื้นที่

```
 Working Directory  --git add-->  Staging Area  --git commit-->  Repository (ประวัติ)
   (ไฟล์ที่แก้อยู่)                  (ของที่เลือกจะเซฟ)               (จุดเซฟถาวร)
```

> 💡 เหมือน **ถ่ายรูปหมู่**
> - **Working Directory** = ทุกคนที่อยู่ในห้อง
> - **Staging (`git add`)** = เรียกคนที่จะถ่ายมายืนหน้ากล้อง
> - **Commit** = กดชัตเตอร์ ได้รูปเก็บถาวรพร้อมคำบรรยาย

ทำไมต้องมี staging? เพราะบางทีเราแก้หลายเรื่องพร้อมกัน แต่อยากเซฟแยกเป็นเรื่องๆ ให้ประวัติอ่านง่าย

---

## 3. 🔧 ลงมือ: เซฟครั้งแรก

**ตั้งค่าครั้งแรกครั้งเดียว** (ชื่อนี้จะติดอยู่กับทุก commit)
```bash
git config --global user.name "ชื่อ นามสกุล"
git config --global user.email "อีเมลบริษัท"
git config --global init.defaultBranch main
```

**สร้าง repo**
```bash
mkdir git-playground && cd git-playground
git init                     # เริ่มให้ Git ดูแลโฟลเดอร์นี้
echo "# My first repo" > README.md
git status                   # ⭐ คำสั่งที่ใช้บ่อยที่สุด: ตอนนี้มีอะไรเปลี่ยน
```
ควรเห็น `README.md` เป็นสีแดงในหัวข้อ `Untracked files`

```bash
git add README.md            # เอาไปไว้หน้ากล้อง
git status                   # ตอนนี้เป็นสีเขียว
git commit -m "docs: add readme"   # กดชัตเตอร์ พร้อมข้อความบอกว่าเซฟอะไร
git log --oneline            # ดูประวัติ
```

**แก้ไฟล์แล้วดูความต่าง**
```bash
echo "Hello Blicktech" >> README.md
git diff                     # ดูว่าแก้อะไรไป (+ เพิ่ม / - ลบ)
git add .                    # . = ทุกไฟล์ที่เปลี่ยน
git commit -m "docs: add greeting"
```

**ย้อนเวลา** ⏪
```bash
git restore README.md        # ยกเลิกการแก้ที่ยังไม่ได้ add กลับไปเป็นแบบ commit ล่าสุด
git log --oneline            # ดูรหัส commit (เช่น a1b2c3d)
git show a1b2c3d             # ดูว่า commit นั้นเปลี่ยนอะไร
```

---

## 4. `.gitignore`: ของที่ห้ามเซฟ

ไฟล์ `.gitignore` บอก Git ว่า **ไม่ต้องสนใจไฟล์เหล่านี้**
```
node_modules/
dist/
.env
.DS_Store
```

| ห้าม commit | เพราะ |
|---|---|
| `node_modules/` | ใหญ่มาก และสร้างใหม่ได้ด้วย `npm install` |
| `dist/` | สร้างใหม่ได้ด้วย `npm run build` |
| `.env` | 🔐 มีรหัสผ่าน/ความลับ |

> ⚠️ **กับดักใหญ่:** ถ้าเผลอ commit ความลับขึ้นไปแล้ว **ลบไฟล์ทีหลังไม่ช่วย** เพราะยังอยู่ในประวัติ ต้อง **เปลี่ยนรหัส/key นั้นทันที** และแจ้งพี่ (บทที่ 10)

---

## 5. 🔧 Branch และ Merge

```
main:     A---B---------E   (merge)
               \       /
feature:        C-----D
```

```bash
git switch -c feature/price      # สร้าง branch ใหม่และย้ายไปอยู่ในนั้น
echo "price: 1500" > price.txt
git add . && git commit -m "feat: add price"
git switch main                  # กลับไป main → price.txt หายไป! (เพราะอยู่ใน branch อื่น)
git merge feature/price          # รวมงานเข้ามา → price.txt กลับมา
git branch                       # ดูว่ามี branch อะไรบ้าง (* = ตัวที่อยู่ตอนนี้)
```

> 💡 ทำไมต้องแยก branch? เพื่อให้ **`main` ใช้งานได้เสมอ** ใครทำฟีเจอร์ไหนก็แยกไปทำ เสร็จและผ่าน review แล้วค่อยรวมเข้ามา

---

## 6. 🔧 Conflict: เมื่อสองคนแก้บรรทัดเดียวกัน

ลองสร้าง conflict เองให้ไม่กลัวมัน:
```bash
git switch -c feature/discount
echo "price: 1200" > price.txt
git commit -am "feat: discount price"

git switch main
echo "price: 1800" > price.txt
git commit -am "feat: raise price"

git merge feature/discount
# CONFLICT (content): Merge conflict in price.txt
```
เปิด `price.txt` จะเห็น:
```
<<<<<<< HEAD
price: 1800
=======
price: 1200
>>>>>>> feature/discount
```
| ส่วน | ความหมาย |
|---|---|
| `<<<<<<< HEAD` ถึง `=======` | ของฝั่งที่เราอยู่ (main) |
| `=======` ถึง `>>>>>>>` | ของฝั่งที่กำลังรวมเข้ามา |

**วิธีแก้:** เลือก/รวมเนื้อหาให้ถูกต้อง **ลบเครื่องหมาย `<<<` `===` `>>>` ทิ้งให้หมด** แล้ว
```bash
git add price.txt
git commit -m "merge: resolve price conflict"
```
> 💡 VS Code มีปุ่ม **Accept Current / Accept Incoming / Accept Both** ช่วยให้ง่ายขึ้น
> 🧘 conflict ไม่ใช่ error ไม่ได้แปลว่าทำพัง แค่ Git **ไม่กล้าตัดสินใจแทนเรา** เลยถามก่อน

---

## 7. 🔧 ทำงานกับ server กลาง (GitHub / GitLab)

```bash
git clone <url>                  # ดาวน์โหลด repo มาทั้งก้อนครั้งแรก
git pull                         # ดึงของใหม่ที่คนอื่น push มา
git push -u origin feature/price # ส่ง branch ของเราขึ้นไป (-u ใช้แค่ครั้งแรก)
git push                         # ครั้งต่อไปพิมพ์แค่นี้
```
> ⚠️ **ก่อนเริ่มงานทุกเช้า: `git switch main && git pull`** จะได้เริ่มจากโค้ดล่าสุด ลด conflict

---

## 8. Workflow ของทีม Blicktech

```
 1. รับงาน (Issue)   ->  2. แตก branch       ->  3. commit ทีละเรื่อง  ->  4. push
 5. เปิด Merge Request (MR)  ->  6. พี่ review / แก้ตาม comment  ->  7. merge เข้า main
```

**ตั้งชื่อ branch:** `ประเภท/เลข-issue-คำอธิบายสั้น`
```
feat/42-laptop-search
fix/57-wrong-vat
```

**Commit message:** `ประเภท: ทำอะไร` (เขียนให้คนอ่านรู้เรื่องโดยไม่ต้องเปิดโค้ด)

| ประเภท | ใช้เมื่อ | ตัวอย่าง |
|---|---|---|
| `feat` | เพิ่มฟีเจอร์ | `feat: add laptop search by serial` |
| `fix` | แก้บั๊ก | `fix: VAT calculated twice on discount` |
| `docs` | แก้เอกสาร | `docs: add setup steps to README` |
| `refactor` | ปรับโค้ด ผลลัพธ์เหมือนเดิม | `refactor: split rental service` |
| `test` | เพิ่ม/แก้ test | `test: cover return-date edge cases` |
| `chore` | งานจุกจิก | `chore: bump drizzle-orm` |

❌ `update`, `แก้`, `asdf`, `final2` → อ่านแล้วไม่รู้ว่าทำอะไร

**Merge Request (MR) / Pull Request (PR)** = การขอรวมโค้ดเข้า `main` ให้คนอื่นตรวจก่อน
- เขียนอธิบายว่า **ทำอะไร ทำไม ทดสอบยังไง** แนบ screenshot ถ้ามี UI
- MR เล็กๆ review ง่ายและเร็วกว่า MR ใหญ่ทีเดียวหลายร้อยบรรทัด
- comment ของ reviewer **ไม่ใช่การตำหนิ** แต่คือการช่วยให้โค้ดดีขึ้น 🙏

> ⚠️ **ห้ามเด็ดขาด:** `git push --force` ใส่ `main` หรือ branch ที่คนอื่นใช้ร่วม เพราะลบงานคนอื่นทิ้งได้

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. แก้ไฟล์แล้ว <code>git commit</code> แต่ขึ้นว่า "nothing added to commit" เพราะอะไร?</summary>

ยังไม่ได้ `git add` ไฟล์เข้า staging ก่อน
</details>

<details><summary>2. เผลอ commit ไฟล์ <code>.env</code> ที่มีรหัสผ่าน DB ขึ้น GitLab ต้องทำอะไร?</summary>

เปลี่ยนรหัสผ่าน DB ทันที (เพราะอยู่ในประวัติแล้ว) แจ้งพี่ แล้วลบไฟล์ออกจาก repo พร้อมเพิ่ม `.env` ใน `.gitignore`
</details>

<details><summary>3. ทำไมไม่ commit ทุกอย่างลง main ตรงๆ?</summary>

main ต้องใช้งานได้เสมอ การแยก branch และผ่าน MR ช่วยให้มีคนตรวจก่อน และงานที่ยังไม่เสร็จไม่ไปกระทบคนอื่น
</details>

---

## ✏️ แบบฝึกหัด

สร้าง repo `intern-basic-<ชื่อเล่น>` บน GitHub/GitLab ใส่ `README.md` แนะนำตัว และ `.gitignore`
จากนั้นแตก branch `docs/about-me` เพิ่มหัวข้อ "สิ่งที่อยากเรียนรู้" แล้วเปิด **Merge Request** เข้า `main` ส่งลิงก์ให้พี่ review

## ✅ ผ่านด่าน

- [ ] `add`, `commit`, `status`, `log`, `diff` ใช้คล่อง
- [ ] สร้าง branch และ merge ได้
- [ ] แก้ conflict ได้โดยไม่ตกใจ
- [ ] เปิด Merge Request ได้

---

[← บทที่ 0](./00-start.md) · [🏠 สารบัญ](./README.md) · [บทที่ 2: Docker →](./02-docker.md)
