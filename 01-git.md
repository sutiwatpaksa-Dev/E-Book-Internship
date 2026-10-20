# บทที่ 1: Git 🕹️

> ⏱ ประมาณ 5-6 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 0 · 🛠 ใช้: Git, Terminal, บัญชี GitHub และ/หรือ GitLab

> **⚡ สรุป 30 วินาที**
> - Git คือ **"จุดเซฟเกม" ของโค้ด** ย้อนกลับได้ทุกเมื่อ
> - `add` → `commit` = เซฟ / `branch` = แยกเส้นทางไปลองของใหม่ / `merge` = รวมกลับ
> - `push` / `pull` = ส่งขึ้น / ดึงลงจาก server กลาง (GitHub, GitLab)
> - พลาดแล้วแก้ได้: `restore`, `reset`, `revert`, `amend`, `reflog` และ `stash` เก็บงานครึ่งๆ กลางๆ
> - ทีมทำงานผ่าน **Pull Request / Merge Request** ให้พี่ review ก่อนรวมโค้ดเสมอ

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

### Commit หน้าตาเป็นยังไง

แต่ละ commit คือ "ภาพถ่ายของทั้งโปรเจกต์" ณ ตอนนั้น มีรหัสประจำตัว (hash เช่น `a1b2c3d`) ชื่อคนทำ เวลา ข้อความ และ **ชี้ย้อนกลับไปหา commit ก่อนหน้า** ต่อกันเป็นลูกโซ่ ส่วน **branch** เป็นแค่ "ป้ายชื่อ" ที่ชี้ไปที่ commit หนึ่ง และ **HEAD** คือป้ายบอกว่าตอนนี้เรายืนอยู่ตรงไหน

![commit ต่อกันเป็นลูกโซ่ มีป้าย main และ HEAD ชี้ commit ล่าสุด](/img/01-commit-chain.svg)
*commit คือลูกโซ่ branch คือป้ายชื่อ HEAD คือตำแหน่งที่เรายืนอยู่*

เพราะ branch เป็นแค่ป้าย การสร้าง branch ใหม่จึง **เร็วและถูกมาก** ไม่ได้ก๊อปไฟล์ทั้งโปรเจกต์ ใช้เป็นนิสัยได้เลย

---

## 2. Git ทำงานยังไง: 3 พื้นที่

![3 พื้นที่ของ Git: Working Directory, Staging Area, Repository และคำสั่งที่ย้ายของระหว่างกัน](/img/01-three-areas.svg)
*ไฟล์เดินทางจากซ้ายไปขวาด้วย add และ commit ส่วนลูกศรย้อนกลับคือคำสั่งแก้พลาด*

> 💡 เหมือน **ถ่ายรูปหมู่**
> - **Working Directory** = ทุกคนที่อยู่ในห้อง
> - **Staging (`git add`)** = เรียกคนที่จะถ่ายมายืนหน้ากล้อง
> - **Commit** = กดชัตเตอร์ ได้รูปเก็บถาวรพร้อมคำบรรยาย

ทำไมต้องมี staging? เพราะบางทีเราแก้หลายเรื่องพร้อมกัน แต่อยากเซฟแยกเป็นเรื่องๆ ให้ประวัติอ่านง่าย

ไฟล์ใน repo จะมีสถานะ 4 แบบ: **untracked** (Git ยังไม่รู้จัก) → **modified** (แก้แล้วแต่ยังไม่ add) → **staged** (add แล้ว) → **committed** (เซฟแล้ว) ใช้ `git status` ดูได้ตลอด

---

## 3. 🔧 ติดตั้งและตั้งค่า Git

### 3.1 ติดตั้ง (ทำไว้แล้วในบทที่ 0)

ตรวจว่ามี Git:
```bash
git --version
```
**ควรเห็น** `git version 2.x.x` ถ้าไม่เจอให้กลับไปบทที่ 0 หัวข้อ "แก้ปัญหาติดตั้ง"

### 3.2 ตั้งชื่อและอีเมล (ทำครั้งเดียวต่อเครื่อง)

ชื่อนี้จะติดอยู่กับ **ทุก commit** เหมือนลายเซ็น
```bash
git config --global user.name "ชื่อ นามสกุล"
git config --global user.email "อีเมลบริษัท"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"
```
- `init.defaultBranch main` = repo ใหม่ใช้ชื่อ branch หลักว่า `main`
- `core.editor "code --wait"` = เวลา Git เปิดหน้าต่างให้พิมพ์ข้อความ ให้เปิดใน VS Code (ต้องมีคำสั่ง `code` ตามบทที่ 0)

ตรวจผล:
```bash
git config --global --list
```
**ควรเห็น**
```
user.name=ชื่อ นามสกุล
user.email=อีเมลบริษัท
init.defaultbranch=main
core.editor=code --wait
```

> 💡 **อีเมลควรใช้อันไหน?** ใช้อีเมลเดียวกับที่สมัครบัญชี GitHub/GitLab ระบบจะจับคู่ commit กับบัญชีเราได้ถูกต้อง ถ้าไม่อยากเปิดเผยอีเมลจริง GitHub มีที่อยู่แบบ `@users.noreply.github.com` ให้ใช้ (ดูในหน้า Settings → Emails)

> 🪟 **เฉพาะ Windows:** Windows ใช้ตัวขึ้นบรรทัดใหม่ต่างจาก Mac/Linux (CRLF vs LF) Git for Windows ตั้งค่า `core.autocrlf` ให้เหมาะสมตอนติดตั้งอยู่แล้ว ปกติไม่ต้องแก้ ถ้าเจอข้อความเตือนเรื่อง `LF will be replaced by CRLF` ไม่ใช่ error แค่เตือน

---

## 4. 🔧 ลงมือ: เซฟครั้งแรก

**สร้าง repo**
```bash
mkdir git-playground && cd git-playground
git init                     # เริ่มให้ Git ดูแลโฟลเดอร์นี้
echo "# My first repo" > README.md
git status                   # ⭐ คำสั่งที่ใช้บ่อยที่สุด: ตอนนี้มีอะไรเปลี่ยน
```
**ควรเห็น**
```
Initialized empty Git repository in .../git-playground/.git/
On branch main
No commits yet
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md
```
(`README.md` เป็นสีแดงในหัวข้อ `Untracked files`) โฟลเดอร์ซ่อน `.git/` คือที่ที่ Git เก็บประวัติทั้งหมด **ห้ามลบ**

```bash
git add README.md            # เอาไปไว้หน้ากล้อง
git status                   # ตอนนี้เป็นสีเขียว
git commit -m "docs: add readme"   # กดชัตเตอร์ พร้อมข้อความบอกว่าเซฟอะไร
git log --oneline            # ดูประวัติ
```
**ควรเห็น** (รหัส commit ของแต่ละคนไม่เหมือนกัน)
```
[main (root-commit) a1b2c3d] docs: add readme
 1 file changed, 1 insertion(+)
 create mode 100644 README.md

a1b2c3d (HEAD -> main) docs: add readme
```

**แก้ไฟล์แล้วดูความต่าง**
```bash
echo "Hello Blicktech" >> README.md
git diff                     # ดูว่าแก้อะไรไป (+ เพิ่ม / - ลบ)
```
**ควรเห็น**
```
--- a/README.md
+++ b/README.md
@@ -1 +1,2 @@
 # My first repo
+Hello Blicktech
```
```bash
git add .                    # . = ทุกไฟล์ที่เปลี่ยน
git commit -m "docs: add greeting"
```

**ดูประวัติหลายแบบ**
```bash
git log --oneline            # บรรทัดเดียวต่อ commit
git log --oneline --graph --all   # วาดเป็นกราฟ เห็นทุก branch
git show a1b2c3d             # ดูว่า commit นั้นเปลี่ยนอะไร (ใช้รหัสของเราเอง)
```

> 💡 `git add .` สะดวกแต่ **เช็ค `git status` ก่อน commit เสมอ** จะได้ไม่เผลอเก็บไฟล์ที่ไม่ควร (เช่น `.env`) ถ้าอยากเลือกทีละส่วนของไฟล์เดียว ใช้ `git add -p`

---

## 5. ข้อความ commit ที่ดี

ข้อความ commit คือ **จดหมายถึงตัวเองในอนาคต** และถึงคนในทีม คนอ่านควรรู้เรื่องโดยไม่ต้องเปิดโค้ด

**รูปแบบ:** `ประเภท: ทำอะไร` (เรียกว่า Conventional Commits)

| ประเภท | ใช้เมื่อ | ตัวอย่าง |
|---|---|---|
| `feat` | เพิ่มฟีเจอร์ | `feat: add laptop search by serial` |
| `fix` | แก้บั๊ก | `fix: VAT calculated twice on discount` |
| `docs` | แก้เอกสาร | `docs: add setup steps to README` |
| `refactor` | ปรับโค้ด ผลลัพธ์เหมือนเดิม | `refactor: split rental service` |
| `test` | เพิ่ม/แก้ test | `test: cover return-date edge cases` |
| `chore` | งานจุกจิก | `chore: bump drizzle-orm` |

**กฎง่ายๆ**
1. บรรทัดแรกสั้น ไม่เกินประมาณ 50-72 ตัวอักษร ขึ้นต้นด้วยกริยา (add, fix, remove) บอกว่า "commit นี้ทำอะไร"
2. หนึ่ง commit ต่อหนึ่งเรื่อง อย่าเอา "เพิ่มฟีเจอร์ + แก้บั๊ก + จัดโค้ด" ไว้ก้อนเดียว
3. ถ้าต้องอธิบายเหตุผล เว้นบรรทัดว่าง แล้วเขียนเพิ่ม (เรียกว่า body) บอก **ทำไม** ไม่ใช่แค่ทำอะไร

```bash
git commit      # ไม่ใส่ -m จะเปิด editor ให้เขียนหลายบรรทัด
```
```
fix: VAT calculated twice on discount

ก่อนหน้านี้ใช้ราคาหลังลดไปคิด VAT แล้วบวก VAT ซ้ำอีกรอบ
เปลี่ยนให้คิด VAT ครั้งเดียวจากราคาหลังลด
```

❌ `update`, `แก้`, `asdf`, `final2` → อ่านแล้วไม่รู้ว่าทำอะไร

---

## 6. `.gitignore`: ของที่ห้ามเซฟ

ไฟล์ `.gitignore` บอก Git ว่า **ไม่ต้องสนใจไฟล์เหล่านี้** วางไว้ที่โฟลเดอร์รากของ repo
```
node_modules/
dist/
.env
.DS_Store
*.log
```

| รูปแบบ | ความหมาย |
|---|---|
| `node_modules/` | ทั้งโฟลเดอร์นี้ (ลงท้าย `/` = โฟลเดอร์) |
| `*.log` | ทุกไฟล์ที่ลงท้าย `.log` |
| `.env` | ไฟล์ชื่อนี้ทุกที่ใน repo |
| `!.env.example` | ยกเว้น: อันนี้ **ให้เก็บ** (ใช้บอกว่า `.env` ต้องมีค่าอะไรบ้างโดยไม่ใส่ความลับ) |

| ห้าม commit | เพราะ |
|---|---|
| `node_modules/` | ใหญ่มาก และสร้างใหม่ได้ด้วย `npm install` |
| `dist/` | สร้างใหม่ได้ด้วย `npm run build` |
| `.env` | 🔐 มีรหัสผ่าน/ความลับ |
| `.DS_Store`, `Thumbs.db` | ไฟล์ขยะของ Mac / Windows |

**ลองทำ**
```bash
echo "secret=1234" > .env
echo ".env" > .gitignore
git status
```
**ควรเห็น** `.gitignore` เป็น untracked แต่ **ไม่เห็น `.env`** เพราะถูกซ่อนไว้แล้ว

ถ้าสงสัยว่าทำไมไฟล์หนึ่งถูกเมิน ใช้:
```bash
git check-ignore -v .env
```
**ควรเห็น** `.gitignore:1:.env	.env` (บอกว่ากฎบรรทัดไหนทำให้ไฟล์ถูกเมิน)

> ⚠️ **`.gitignore` ใช้ได้กับไฟล์ที่ Git ยังไม่เคยติดตามเท่านั้น** ถ้าไฟล์ถูก commit ไปแล้ว ต้องสั่งให้ Git เลิกติดตามก่อน (ไฟล์ในเครื่องยังอยู่):
> ```bash
> git rm --cached .env
> git commit -m "chore: stop tracking .env"
> ```

> ⚠️ **กับดักใหญ่:** ถ้าเผลอ commit ความลับขึ้นไปแล้ว **ลบไฟล์ทีหลังไม่ช่วย** เพราะยังอยู่ในประวัติ ต้อง **เปลี่ยนรหัส/key นั้นทันที** และแจ้งพี่ (บทที่ 10) ดูขั้นตอนเต็มในตารางแก้ปัญหา (หัวข้อ 17)

---

## 7. 🔧 Branch และ Merge

![Git graph: main มี A B E, feature แยกจาก B เป็น C D แล้ว merge กลับเป็น E](/img/01-branch-merge.svg)
*แยก branch ไปทำ (C, D) แล้วรวมกลับเป็น merge commit (E)*

```bash
git switch -c feature/price      # สร้าง branch ใหม่และย้ายไปอยู่ในนั้น
echo "price: 1500" > price.txt
git add . && git commit -m "feat: add price"
git switch main                  # กลับไป main → price.txt หายไป! (เพราะอยู่ใน branch อื่น)
git merge feature/price          # รวมงานเข้ามา → price.txt กลับมา
git branch                       # ดูว่ามี branch อะไรบ้าง (* = ตัวที่อยู่ตอนนี้)
```
**ควรเห็น** หลัง `git switch main` ว่า `ls` ไม่มี `price.txt` และหลัง `git merge` ขึ้นข้อความทำนอง
```
Updating a1b2c3d..e4f5a6b
Fast-forward
 price.txt | 1 +
```
และ `git branch` แสดง
```
  feature/price
* main
```

> 💡 **Fast-forward** คือกรณีที่ main ไม่มี commit ใหม่เลยระหว่างที่เราแยกไปทำ Git แค่เลื่อนป้าย main ไปข้างหน้า ไม่ต้องสร้าง merge commit ถ้า main มีของใหม่ด้วย Git จะสร้าง **merge commit** ตามภาพด้านบน

**ลบ branch ที่ใช้เสร็จแล้ว**
```bash
git branch -d feature/price      # ลบได้เมื่อ merge แล้ว (ถ้ายังไม่ merge Git จะไม่ยอมลบ)
```

> 💡 ทำไมต้องแยก branch? เพื่อให้ **`main` ใช้งานได้เสมอ** ใครทำฟีเจอร์ไหนก็แยกไปทำ เสร็จและผ่าน review แล้วค่อยรวมเข้ามา

---

## 8. 🔧 Conflict: เมื่อสองคนแก้บรรทัดเดียวกัน

ลองสร้าง conflict เองให้ไม่กลัวมัน:
```bash
git switch -c feature/discount
echo "price: 1200" > price.txt
git commit -am "feat: discount price"

git switch main
echo "price: 1800" > price.txt
git commit -am "feat: raise price"

git merge feature/discount
```
**ควรเห็น**
```
Auto-merging price.txt
CONFLICT (content): Merge conflict in price.txt
Automatic merge failed; fix conflicts and then commit the result.
```
`git status` จะบอกว่า `both modified: price.txt` เปิด `price.txt` จะเห็น:

![ไฟล์ที่มี conflict marker แบ่งเป็นฝั่ง HEAD กับฝั่งที่ merge เข้ามา](/img/01-conflict.svg)
*Git ใส่เครื่องหมายให้เห็นว่าสองฝั่งแก้ต่างกันตรงไหน*

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

**วิธีแก้ ทีละขั้น**
1. เปิดไฟล์ที่มี conflict (ดูรายชื่อจาก `git status`)
2. ตัดสินใจว่าจะเก็บอะไร: ของเรา ของเขา หรือผสมกัน (ถ้าไม่แน่ใจ **ถามเจ้าของโค้ดอีกฝั่ง**)
3. **ลบเครื่องหมาย `<<<` `===` `>>>` ทิ้งให้หมด** ให้เหลือแต่เนื้อหาที่ถูกต้อง
4. รันทดสอบว่ายังทำงานได้
5. เสร็จแล้ว
```bash
git add price.txt
git commit -m "merge: resolve price conflict"
```
**ควรเห็น** `[main xxxxxxx] merge: resolve price conflict` และ `git status` สะอาด

> 💡 VS Code มีปุ่ม **Accept Current / Accept Incoming / Accept Both** ช่วยให้ง่ายขึ้น
> 🧘 conflict ไม่ใช่ error ไม่ได้แปลว่าทำพัง แค่ Git **ไม่กล้าตัดสินใจแทนเรา** เลยถามก่อน

**ถ้าแก้ไม่ไหว อยากถอยกลับไปก่อน merge:**
```bash
git merge --abort
```
ทุกอย่างกลับเป็นเหมือนก่อนสั่ง merge

---

## 9. 🔧 แก้พลาด: ตำราย้อนเวลา (Undo Cookbook)

ใครๆ ก็พลาด สิ่งสำคัญคือรู้ว่า **พลาดแบบไหน ใช้ท่าไหน** เริ่มจากถามตัวเองว่า "ของที่พลาดอยู่ที่พื้นที่ไหนแล้ว?"

| สถานการณ์ | ท่าที่ใช้ | ปลอดภัยไหม |
|---|---|---|
| แก้ไฟล์แล้วอยากทิ้งการแก้ (ยังไม่ add) | `git restore ไฟล์` | ⚠️ การแก้หายถาวร |
| `git add` ผิดไฟล์ อยากเอาออกจาก staging | `git restore --staged ไฟล์` | ✅ ไฟล์ยังอยู่ |
| commit แล้ว ข้อความผิด / ลืมใส่ไฟล์ (ยังไม่ push) | `git commit --amend` | ✅ ถ้ายังไม่ push |
| commit เร็วไป อยากถอย commit แต่เก็บงาน | `git reset --soft HEAD~1` หรือ `--mixed` | ✅ |
| commit แล้ว อยากทิ้งทั้ง commit และงาน | `git reset --hard HEAD~1` | 🔴 งานหาย |
| commit ที่ push แล้วมีปัญหา | `git revert รหัส` | ✅ ปลอดภัยที่สุดกับของที่แชร์แล้ว |
| ทำพลาดจนหา commit ไม่เจอ | `git reflog` | ✅ ตาข่ายนิรภัย |

### 9.1 `restore`: ทิ้งการแก้ไข / เอาออกจาก staging

```bash
echo "oops" >> README.md
git restore README.md            # ทิ้งการแก้ กลับเป็นแบบ commit ล่าสุด
cat README.md                    # ไม่มีบรรทัด oops แล้ว
```
```bash
echo "oops" >> README.md
git add README.md                # เผลอ add
git restore --staged README.md   # เอาออกจาก staging (การแก้ยังอยู่ในไฟล์)
git status                       # กลับเป็น modified (สีแดง)
```
ดึงไฟล์เก่ากลับมาจาก commit ในอดีต:
```bash
git restore --source=a1b2c3d -- README.md   # เอา README.md ตามที่เป็นใน commit a1b2c3d
```

### 9.2 `commit --amend`: แก้ commit ล่าสุด

ลืมใส่ไฟล์ หรือพิมพ์ข้อความผิด:
```bash
git add ไฟล์ที่ลืม
git commit --amend -m "docs: add readme and greeting"
```
ถ้าแค่เติมไฟล์ ไม่อยากเปลี่ยนข้อความ ใช้ `git commit --amend --no-edit`

> ⚠️ amend จะ **สร้าง commit ใหม่มาแทนที่ของเก่า** (รหัสเปลี่ยน) ทำเฉพาะ commit ที่ **ยังไม่ push** เท่านั้น ถ้า push ไปแล้วต้อง force push ซึ่งอันตราย

### 9.3 `reset`: ถอยป้ายกลับไปที่ commit เก่า

`reset` ย้ายป้าย branch ถอยหลัง ต่างกันที่ว่า **จะจัดการกับ staging และไฟล์ในเครื่องอย่างไร**

![reset 3 โหมด: soft ย้ายแค่ HEAD, mixed ย้าย HEAD และ reset staging, hard ย้ายทั้งหมดรวมไฟล์](/img/01-reset-modes.svg)
*ยิ่งไปทางล่าง ยิ่งทิ้งมาก: soft ไม่ทิ้งอะไร, hard ทิ้งทุกอย่าง*

ลองทำ:
```bash
echo "line A" > notes.txt && git add . && git commit -m "feat: add notes"
git log --oneline                # เห็น commit ล่าสุด "feat: add notes"
```
**soft**: ถอย commit แต่ของยังอยู่ใน staging (เหมาะกับ "อยากรวม commit หลายอัน" หรือ "commit เร็วไป")
```bash
git reset --soft HEAD~1          # HEAD~1 = commit ก่อนหน้า 1 อัน
git status                       # notes.txt เป็นสีเขียว (staged)
```
**mixed** (ค่าเริ่มต้นถ้าไม่ใส่ตัวเลือก): ถอย commit และเอาออกจาก staging แต่ไฟล์ยังอยู่
```bash
git add . && git commit -m "feat: add notes"
git reset HEAD~1                 # เท่ากับ --mixed
git status                       # notes.txt เป็น untracked/modified (สีแดง)
```
**hard**: ถอย commit และ **ทิ้งการแก้ในไฟล์ทั้งหมด** 🔴
```bash
git add . && git commit -m "feat: add notes"
git reset --hard HEAD~1
ls                               # notes.txt หายไปแล้ว
```

> ⚠️ `--hard` ทำลายงานที่ยังไม่ commit ถาวร (ถ้า commit แล้วยังกู้ได้ด้วย reflog ดูหัวข้อ 9.5) **อย่าใช้กับ commit ที่ push ไปแล้ว** ให้ใช้ `revert`

### 9.4 `revert`: ย้อนผลของ commit โดยไม่เขียนประวัติใหม่

`revert` สร้าง **commit ใหม่** ที่ทำตรงข้ามกับ commit เป้าหมาย ประวัติเดิมยังอยู่ครบ จึง **ปลอดภัยกับของที่ push แล้วหรือคนอื่นดึงไปแล้ว**
```bash
git log --oneline                # หารหัส commit ที่จะย้อน เช่น e4f5a6b
git revert e4f5a6b               # เปิด editor ให้ยืนยันข้อความ แล้วบันทึกปิด
```
**ควรเห็น** `Revert "ข้อความเดิม"` เป็น commit ใหม่ล่าสุดใน `git log --oneline`
เร็วขึ้น: `git revert e4f5a6b --no-edit`

> 💡 **เลือกยังไง?** `reset` = "ทำเหมือนไม่เคยเกิดขึ้น" (ใช้กับงานในเครื่องที่ยังไม่ push) · `revert` = "ประกาศว่าขอยกเลิกอันนั้น" (ใช้กับสิ่งที่แชร์แล้ว)

### 9.5 `reflog`: ตาข่ายนิรภัย

Git จดทุกครั้งที่ HEAD ขยับ (แม้หลังจาก reset --hard) ไว้ในบันทึกชื่อ **reflog** เก็บไว้ในเครื่องเราประมาณ 90 วันโดยค่าเริ่มต้น ทำให้กู้ commit ที่ "หายไป" ได้
```bash
git reflog
```
**ควรเห็น** (ของเราจะต่างตามที่ทำมา)
```
a1b2c3d HEAD@{0}: reset: moving to HEAD~1
e4f5a6b HEAD@{1}: commit: feat: add notes
a1b2c3d HEAD@{2}: commit: docs: add greeting
```
สังเกตว่า `e4f5a6b` (commit ที่เราเพิ่ง "ทิ้ง" ด้วย reset --hard) ยังอยู่ในรายการ กู้กลับ:
```bash
git reset --hard e4f5a6b         # ย้าย branch กลับไปชี้ commit นั้น
# หรือปลอดภัยกว่า: แตก branch ใหม่ออกจาก commit นั้น
git switch -c rescue e4f5a6b
```
**ควรเห็น** `notes.txt` กลับมาอยู่ในโฟลเดอร์

> 🤓 **ข้อจำกัด:** reflog กู้ได้เฉพาะสิ่งที่ **เคย commit** ถ้าไฟล์ไม่เคยถูก commit และโดน `restore` / `reset --hard` ทิ้ง Git กู้ให้ไม่ได้ จึงควร commit บ่อยๆ

### 9.6 ลบไฟล์ขยะที่ Git ไม่รู้จัก: `clean`

```bash
git clean -n        # ซ้อม: แค่บอกว่าจะลบอะไร (ยังไม่ลบ)
git clean -fd       # ลบจริง ไฟล์และโฟลเดอร์ untracked (กู้คืนไม่ได้!)
```
**ซ้อมด้วย `-n` ก่อนเสมอ**

---

## 10. 🔧 Stash: พักงานไว้ก่อน

สถานการณ์: กำลังแก้ฟีเจอร์ครึ่งๆ กลางๆ แล้วพี่ให้ไปแก้บั๊กด่วนที่ branch อื่น แต่ยังไม่อยาก commit งานที่ไม่เสร็จ → **stash** = ใส่งานไว้ในลิ้นชักชั่วคราว

```bash
echo "half-done" >> README.md
git stash push -m "wip: greeting"     # เก็บงานที่ยังไม่ commit ใส่ลิ้นชัก
git status                            # สะอาดแล้ว เหมือนยังไม่ได้แก้
```
**ควรเห็น** `Saved working directory and index state On main: wip: greeting`

ไปทำงานอื่น (switch branch, แก้บั๊ก, commit) เสร็จแล้วกลับมา:
```bash
git stash list                        # ดูของในลิ้นชัก
git stash pop                         # หยิบกลับมา + ลบออกจากลิ้นชัก
```
**ควรเห็น** `stash@{0}: On main: wip: greeting` ตอน `list` และไฟล์กลับมาแก้ค้างเหมือนเดิมหลัง `pop`

| คำสั่ง | ทำอะไร |
|---|---|
| `git stash push -m "ข้อความ"` | เก็บการแก้ที่ tracked แล้ว |
| `git stash push -u` | รวมไฟล์ untracked ด้วย |
| `git stash list` | ดูรายการ |
| `git stash pop` | เอากลับมาและลบออกจากลิ้นชัก |
| `git stash apply` | เอากลับมาแต่เก็บสำเนาในลิ้นชักไว้ |
| `git stash drop` | ทิ้งรายการล่าสุด |

> ⚠️ stash เก็บอยู่ในเครื่องเรา ไม่ขึ้น GitHub/GitLab อย่าฝากงานสำคัญไว้นานๆ ถ้าจะค้างข้ามวัน commit ลง branch ชั่วคราวดีกว่า

---

## 11. Rebase vs Merge: รวมงานสองแบบ

ทั้งคู่ "เอางานจากสอง branch มารวมกัน" แต่ **หน้าตาประวัติ** ต่างกัน

![เปรียบเทียบ merge ที่ประวัติแตกกิ่งกับ rebase ที่ประวัติเป็นเส้นตรง](/img/01-rebase-merge.svg)
*merge เก็บประวัติตามจริง rebase ย้าย commit ของเราไปต่อท้ายใหม่*

| | merge | rebase |
|---|---|---|
| ทำอะไร | สร้าง merge commit ผูกสองกิ่ง | ย้าย commit ของเราไปต่อท้ายปลายของ branch เป้าหมาย |
| ประวัติ | เห็นว่าเคยแยกกิ่ง | เป็นเส้นตรงอ่านง่าย |
| รหัส commit | ไม่เปลี่ยน | **เปลี่ยน** (เป็น commit ใหม่) |
| ความเสี่ยง | ต่ำ | สูงกว่า ถ้าใช้ผิดที่ |

ตัวอย่าง: เรากำลังทำ `feature/price` แล้ว `main` มีของใหม่ อยากเอาของใหม่มาไว้ใต้งานเรา:
```bash
git switch feature/price
git fetch origin
git rebase origin/main        # ย้าย commit ของเรามาต่อท้าย main ล่าสุด
```
ถ้าเจอ conflict: แก้ไฟล์ → `git add ไฟล์` → `git rebase --continue` (ถ้าอยากยกเลิก `git rebase --abort`)

> ⚠️ **กฎทอง:** ห้าม rebase **branch ที่คนอื่นดึงไปใช้แล้ว** (เช่น `main`) เพราะเป็นการเขียนประวัติใหม่ ทำให้ประวัติของคนอื่นไม่ตรงกัน ใช้กับ branch ส่วนตัวของเราเท่านั้น และหลัง rebase ที่เคย push แล้วต้อง `git push --force-with-lease` (ปลอดภัยกว่า `--force` เพราะจะไม่ทับถ้ามีคนอื่นเพิ่ง push)

> 💡 **มือใหม่ใช้อะไรดี?** ใช้ **merge** (หรือปุ่ม Merge ในหน้า PR/MR) ให้ชินก่อน ทีมส่วนใหญ่ตกลงกันเองว่าจะใช้แบบไหน ถ้าไม่แน่ใจถามพี่ ส่วน `git pull --rebase` คือ "ดึงของใหม่แล้ว rebase งานเราทับให้" ซึ่งทำให้ประวัติสะอาดโดยไม่ต้องเข้าใจเยอะ

---

## 12. 🔧 Tag: ปักธงเวอร์ชัน

**tag** คือป้ายที่ **ไม่ขยับ** ติดไว้ที่ commit ที่สำคัญ เช่น เวอร์ชันที่ปล่อยใช้งานจริง (ต่างจาก branch ที่ขยับตามงานใหม่เสมอ)

```bash
git tag v1.0.0                          # tag แบบเบา
git tag -a v1.0.1 -m "release 1.0.1"    # tag แบบมีข้อความ (แนะนำสำหรับ release)
git tag                                 # ดูรายการ
git push origin v1.0.1                  # ส่ง tag ขึ้น server (push ปกติไม่ส่ง tag ให้)
git push origin --tags                  # ส่งทุก tag
git tag -d v1.0.0                       # ลบ tag ในเครื่อง
```
**ควรเห็น** `v1.0.0` และ `v1.0.1` ในผล `git tag`

> 💡 **ตั้งชื่อเวอร์ชันแบบ SemVer:** `v` + `MAJOR.MINOR.PATCH` เช่น `v1.4.2`
> - PATCH เพิ่ม = แก้บั๊กเล็กน้อย (1.4.2 → 1.4.3)
> - MINOR เพิ่ม = เพิ่มฟีเจอร์ที่ไม่ทำให้ของเก่าพัง (1.4.3 → 1.5.0)
> - MAJOR เพิ่ม = เปลี่ยนแปลงใหญ่ที่อาจทำให้ของเก่าใช้ไม่ได้ (1.5.0 → 2.0.0)

GitHub / GitLab จะแสดง tag ในหน้า Releases/Tags และบางทีมใช้ tag เพื่อสั่งให้ระบบ deploy อัตโนมัติ (บทที่ 21)

---

## 13. 🔧 ทำงานกับ server กลาง: remote

**remote** คือ repo อีกก้อนหนึ่งที่อยู่บน server (GitHub/GitLab) ชื่อมาตรฐานคือ `origin`

![เครื่องเรากับ remote: push ส่งขึ้น, fetch ดูของใหม่, clone ก๊อปมาครั้งแรก](/img/01-local-remote.svg)
*ทุกอย่างที่ commit อยู่ในเครื่องเรา จนกว่าจะ push ขึ้น remote*

```bash
git clone <url>                  # ดาวน์โหลด repo มาทั้งก้อนครั้งแรก (ใส่ url จริงแทน <url>)
git remote -v                    # ดูว่า origin ชี้ไปไหน
git fetch                        # ดูว่ามีอะไรใหม่บน remote (ยังไม่แตะงานเรา)
git pull                         # fetch + merge: ดึงของใหม่ที่คนอื่น push มา
git push -u origin feature/price # ส่ง branch ของเราขึ้นไป (-u ใช้แค่ครั้งแรก)
git push                         # ครั้งต่อไปพิมพ์แค่นี้
```
> ⚠️ **ก่อนเริ่มงานทุกเช้า: `git switch main && git pull`** จะได้เริ่มจากโค้ดล่าสุด ลด conflict

**ควรเห็น** `git remote -v`
```
origin	git@github.com:ชื่อเรา/intern-basic.git (fetch)
origin	git@github.com:ชื่อเรา/intern-basic.git (push)
```
(ถ้าเป็น HTTPS จะขึ้น `https://github.com/ชื่อเรา/intern-basic.git`)

### 13.1 ยืนยันตัวตนกับ GitHub/GitLab: เลือก SSH หรือ HTTPS

เวลา push/pull ระบบต้องรู้ว่าเราเป็นใคร มี 2 วิธี:

| | SSH key | HTTPS + token |
|---|---|---|
| URL หน้าตา | `git@github.com:user/repo.git` | `https://github.com/user/repo.git` |
| ตั้งค่า | สร้างกุญแจครั้งเดียว ใช้ได้นาน | ต้องสร้าง **token** (รหัสผ่านใช้แทนไม่ได้แล้ว) |
| ใช้งานประจำ | ไม่ต้องกรอกอะไรเลย | ผ่าน credential manager จำให้ |
| เหมาะกับ | งานประจำของโปรแกรมเมอร์ (แนะนำ) | เครือข่ายที่บล็อกพอร์ต SSH หรืออยากเริ่มง่ายๆ |

> ⚠️ GitHub **ไม่รับรหัสผ่านบัญชีปกติ** สำหรับ Git ผ่าน HTTPS แล้ว ต้องใช้ token หรือ credential manager เท่านั้น (ถ้าเจอ `Authentication failed` ดูหัวข้อแก้ปัญหา)

#### วิธี A: SSH key (แนะนำ)

![คู่กุญแจ SSH: private key อยู่เครื่องเรา public key ฝากไว้ที่ GitHub/GitLab](/img/01-ssh-key.svg)
*หลักการ: ฝากแค่กุญแจสาธารณะ (.pub) ไว้ที่เว็บ ส่วน private key อยู่กับเราเท่านั้น*

**ขั้นที่ 1: สร้างคู่กุญแจ** (ใช้ Terminal ปกติ หรือ Git Bash บน Windows)
```bash
ssh-keygen -t ed25519 -C "อีเมลบริษัท"
```
ระบบถามทีละข้อ:
- `Enter file in which to save the key` → กด **Enter** (ใช้ที่เก็บเริ่มต้น `~/.ssh/id_ed25519`)
- `Enter passphrase` → ตั้งรหัสป้องกันกุญแจ (แนะนำ) หรือกด Enter ข้าม

**ควรเห็น**
```
Your identification has been saved in /Users/bit/.ssh/id_ed25519
Your public key has been saved in /Users/bit/.ssh/id_ed25519.pub
```
เกิดสองไฟล์: `id_ed25519` (private **ห้ามส่งใคร**) และ `id_ed25519.pub` (public ฝากเว็บได้)

**ขั้นที่ 2: ให้ ssh-agent จำกุญแจ** (จะได้ไม่ต้องพิมพ์ passphrase ทุกครั้ง)
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```
**ควรเห็น** `Identity added: /Users/bit/.ssh/id_ed25519 (อีเมลบริษัท)`
(Mac: ถ้าอยากให้จำข้ามการรีสตาร์ต ใช้ `ssh-add --apple-use-keychain ~/.ssh/id_ed25519`)

**ขั้นที่ 3: คัดลอก public key**
```bash
cat ~/.ssh/id_ed25519.pub
```
ขึ้นเป็นข้อความบรรทัดเดียวขึ้นต้นด้วย `ssh-ed25519 AAAA...` ลงท้ายด้วยอีเมล ลากคลุมทั้งบรรทัดแล้วก๊อป (หรือ Mac: `pbcopy < ~/.ssh/id_ed25519.pub` / Windows Git Bash: `clip < ~/.ssh/id_ed25519.pub`)

**ขั้นที่ 4: วางในเว็บ**
- **GitHub**: คลิกรูปโปรไฟล์มุมขวาบน → **Settings** → เมนูซ้าย **SSH and GPG keys** → **New SSH key** → ตั้งชื่อ (เช่น "Macbook งาน") → วางกุญแจในช่อง Key → **Add SSH key**
- **GitLab**: คลิกรูปโปรไฟล์ → **Edit profile** (หรือ Preferences) → เมนูซ้าย **SSH Keys** → วางกุญแจ → ตั้งชื่อ → **Add key**

**ขั้นที่ 5: ทดสอบ**
```bash
ssh -T git@github.com        # GitLab: ssh -T git@gitlab.com
```
ครั้งแรกจะถามยืนยัน `Are you sure you want to continue connecting (yes/no)?` พิมพ์ `yes`
**ควรเห็น**
```
Hi ชื่อผู้ใช้! You've successfully authenticated, but GitHub does not provide shell access.
```
(GitLab ขึ้น `Welcome to GitLab, @ชื่อผู้ใช้!`) ถ้าเห็นแบบนี้ = สำเร็จ ข้อความ "does not provide shell access" เป็นเรื่องปกติ ไม่ใช่ error

เสร็จแล้ว clone/push ด้วย URL แบบ SSH (`git@...`) ได้เลย

#### วิธี B: HTTPS + token

1. ใช้ URL แบบ `https://...` ตอน clone
2. ตอน push/pull ครั้งแรก Git (ผ่าน **Git Credential Manager** ซึ่งมากับ Git for Windows) จะเปิดหน้าต่างให้ login เข้าเว็บ แล้วจำให้ ถ้าเครื่องไม่มี ต้องสร้าง **Personal Access Token** เอง:
   - **GitHub**: Settings → Developer settings → Personal access tokens → สร้างใหม่ เลือกสิทธิ์เท่าที่จำเป็น (เช่น สิทธิ์เขียน repo) และตั้งวันหมดอายุ
   - **GitLab**: Preferences → Access Tokens → สร้างพร้อมเลือก scope (เช่น `write_repository`)
3. เมื่อ Git ถาม **Username** ใส่ชื่อผู้ใช้ และถาม **Password** ให้ **วาง token** (ไม่ใช่รหัสผ่านบัญชี)
4. token แสดงให้เห็นครั้งเดียว ก๊อปเก็บไว้ในที่ปลอดภัย (เช่น password manager) **ห้าม commit token ลง repo**

ชื่อเมนูอาจเปลี่ยนไปตามการปรับหน้าเว็บ ถ้าหาไม่เจอให้ค้นช่อง Search ในหน้า Settings ด้วยคำว่า "token" หรือ "SSH"

สลับ URL ของ repo ที่ clone มาแล้วจาก HTTPS เป็น SSH:
```bash
git remote set-url origin git@github.com:ชื่อเรา/intern-basic.git
git remote -v
```

---

## 14. 🌐 GitHub แบบละเอียด

ส่วนนี้พาไปรู้จักหน้าเว็บ GitHub ทีละหน้า เนื้อหาเหมือนกันกับ GitLab (หัวข้อ 15) แค่ชื่อกับหน้าตาต่างกัน

### 14.1 สมัครบัญชีและเตรียมความพร้อม

1. ไปที่ https://github.com กด **Sign up** → ใส่อีเมล ตั้งรหัสผ่าน ตั้ง username (ควรเป็นชื่อสุภาพ เพราะจะเป็นชื่อสาธารณะ) → ยืนยันอีเมลจากรหัสที่ส่งไป
2. แนะนำให้เปิด **2FA** (การยืนยันสองชั้น) ที่ Settings → Password and authentication
3. ตั้งค่า SSH key ตามหัวข้อ 13.1

### 14.2 สร้าง repo ใหม่

1. กดปุ่ม **+** มุมขวาบน → **New repository** (หรือไปที่ https://github.com/new)
2. กรอกฟอร์ม:
   - **Repository name**: ชื่อสั้นๆ ตัวพิมพ์เล็กคั่นด้วย `-` เช่น `intern-basic-bit`
   - **Description**: คำอธิบายสั้นๆ (ไม่บังคับ)
   - **Public / Private**: Public = ใครก็เห็น · Private = เห็นเฉพาะคนที่เราเชิญ (งานบริษัทเลือก Private ถ้าไม่ได้รับคำสั่งอื่น)
   - **Add a README file**: ติ๊กถ้าอยากให้มี `README.md` ตั้งแต่ต้น
   - **Add .gitignore**: เลือกแม่แบบ (เช่น Node)
   - **Choose a license**: ถ้าเป็นโปรเจกต์เปิดเผยค่อยเลือก (งานบริษัทปกติไม่ต้อง)
3. กด **Create repository**

### 14.3 push ครั้งแรก

มี 2 กรณี

**กรณี ก: มีโฟลเดอร์ในเครื่องอยู่แล้ว (สร้าง repo เปล่าบนเว็บ ไม่ติ๊ก README)**
หน้าเว็บจะแสดงคำสั่งให้ ซึ่งหน้าตาประมาณ:
```bash
git remote add origin git@github.com:ชื่อเรา/intern-basic-bit.git
git branch -M main
git push -u origin main
```
- `remote add origin` = บอก Git ว่าชื่อ `origin` คือ repo บนเว็บนี้
- `branch -M main` = เปลี่ยนชื่อ branch ปัจจุบันเป็น `main`
- `push -u origin main` = ส่งขึ้นและจำไว้ว่า main ในเครื่องคู่กับ main บนเว็บ

**ควรเห็น**
```
Enumerating objects: 3, done.
...
To github.com:ชื่อเรา/intern-basic-bit.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```
รีเฟรชหน้าเว็บ จะเห็นไฟล์ที่เราส่งขึ้นไป

**กรณี ข: สร้าง repo บนเว็บพร้อม README แล้ว อยากเอามาทำงานในเครื่อง** ใช้ clone (หัวข้อถัดไป) ไม่ต้อง `git init` เอง

> ⚠️ ถ้าสร้าง repo บนเว็บพร้อม README แล้วมา `git init` ในเครื่องและ push จะเจอ error เรื่อง unrelated histories เพราะประวัติสองก้อนไม่เกี่ยวกัน (ดูตารางแก้ปัญหา) วิธีที่ง่ายกว่าคือ **clone** ตั้งแต่ต้น

### 14.4 Clone: ดึง repo ลงเครื่อง

1. เข้าหน้า repo → กดปุ่มสีเขียว **Code** → เลือกแท็บ **SSH** (หรือ HTTPS) → กดไอคอนก๊อป URL
2. ในเครื่อง:
```bash
git clone git@github.com:ชื่อเรา/intern-basic-bit.git
cd intern-basic-bit
git log --oneline
```
**ควรเห็น**
```
Cloning into 'intern-basic-bit'...
...
```
แล้วโฟลเดอร์ใหม่ชื่อตาม repo พร้อมประวัติครบ และ `origin` ตั้งไว้ให้แล้ว

### 14.5 README.md: หน้าปกของโปรเจกต์

`README.md` เป็นไฟล์ Markdown ที่ GitHub/GitLab แสดงเป็นหน้าแรกของ repo ควรมีอย่างน้อย:
```markdown
# ชื่อโปรเจกต์
อธิบาย 1-2 บรรทัดว่าโปรเจกต์นี้คืออะไร

## วิธีรัน
1. `npm install`
2. คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่า
3. `npm run dev`

## เทคโนโลยีที่ใช้
- Node.js, PostgreSQL
```
README ที่ดี = คนใหม่ที่ไม่เคยเห็นโปรเจกต์ทำตามแล้วรันขึ้นได้ภายใน 10 นาที

### 14.6 Issue: ใบสั่งงาน

**Issue** คือที่จดงานที่ต้องทำ บั๊กที่เจอ หรือไอเดีย
1. เข้าแท็บ **Issues** → **New issue**
2. ใส่ **Title** (สั้น ชัด) และ **Description** (เกิดอะไร ควรเป็นอย่างไร ขั้นตอนทำซ้ำ)
3. มุมขวามี **Assignees** (ใครรับงาน) **Labels** (ป้าย เช่น bug, feature) **Milestone** (รอบงาน)
4. กด **Submit new issue** → ได้เลขประจำตัว เช่น `#42`

เทคนิค: ในข้อความ commit หรือคำอธิบาย PR เขียน `Closes #42` เมื่อ merge PR นั้น Issue #42 จะปิดให้เอง (ทำงานเมื่อ merge เข้า branch หลักของ repo)

### 14.7 Fork: ก๊อป repo ของคนอื่นมาเป็นของเรา

เมื่อไม่มีสิทธิ์เขียนใน repo ต้นฉบับ (เช่น โปรเจกต์โอเพนซอร์ส) ให้ **fork** คือก๊อปทั้ง repo ไปไว้ใต้บัญชีเรา

![Fork: ต้นฉบับ → fork ของเรา → clone ลงเครื่อง → push → เปิด PR กลับไปต้นฉบับ](/img/01-fork.svg)
*ลำดับ: Fork → clone → แก้แล้ว push ไปที่ fork ของเรา → เปิด Pull Request ไปที่ต้นฉบับ*

1. เข้าหน้า repo ต้นฉบับ → กดปุ่ม **Fork** มุมขวาบน → ยืนยันสร้าง
2. clone **fork ของเรา** ลงเครื่อง
3. เพิ่ม remote ชื่อ `upstream` ชี้ไปต้นฉบับ เพื่อตามอัปเดต:
```bash
git remote add upstream git@github.com:เจ้าของเดิม/project.git
git remote -v                     # เห็น origin (fork เรา) และ upstream (ต้นฉบับ)
git fetch upstream
git switch main
git merge upstream/main           # เอาของใหม่จากต้นฉบับมาไว้ใน main ของเรา
```
4. แตก branch ทำงาน → push ไป `origin` → เปิด PR จาก fork เราไปยังต้นฉบับ

> 💡 งานในทีมของเราปกติ **ไม่ต้อง fork** เพราะมีสิทธิ์ push branch ใน repo ของทีมโดยตรง fork ใช้กับการร่วมพัฒนาโปรเจกต์ที่เราไม่ใช่สมาชิก

### 14.8 Pull Request (PR) ทีละขั้น

**Pull Request** = "ขอให้ช่วยดึงงานจาก branch ของฉันไปรวมกับ main หน่อย" พร้อมเปิดให้คนอื่นตรวจและคอมเมนต์

![ขั้นตอน PR: Issue, Branch, Commit, Push, เปิด PR, Review, Merge](/img/01-pr-flow.svg)
*PR คือจุดที่โค้ดของเราถูกตรวจ ก่อนเข้า main*

**ขั้นที่ 1: แตก branch และ commit**
```bash
git switch main && git pull
git switch -c docs/about-me
# แก้ README.md ...
git add README.md
git commit -m "docs: add about me section"
```

**ขั้นที่ 2: push branch**
```bash
git push -u origin docs/about-me
```
**ควรเห็น** ข้อความตอนท้ายคล้ายนี้ (ขึ้นกับเว็บ)
```
remote: Create a pull request for 'docs/about-me' on GitHub by visiting:
remote:      https://github.com/ชื่อเรา/intern-basic-bit/pull/new/docs/about-me
```

**ขั้นที่ 3: เปิด PR**
เข้าหน้า repo จะเห็นแถบสีเหลืองบนสุดเขียนว่า branch ของเราเพิ่งถูก push พร้อมปุ่ม **Compare & pull request** กดปุ่มนั้น (หรือไปแท็บ **Pull requests** → **New pull request**) แล้วหน้าจอจะเป็นฟอร์ม:
- ด้านบนมีตัวเลือก **base: main ← compare: docs/about-me** อ่านว่า "เอาจาก compare ไปรวมเข้า base" ตรวจให้ถูกก่อนเสมอ
- **Title**: ตั้งตามหลัก commit message
- **Description**: เขียน **ทำอะไร / ทำไม / ทดสอบยังไง** แนบภาพหน้าจอถ้ามี UI และใส่ `Closes #เลขissue`
- ทางขวามี **Reviewers** (เลือกพี่ที่จะตรวจ) **Assignees** **Labels**
- กด **Create pull request** (ถ้างานยังไม่เสร็จ เลือก **Create draft pull request** ได้ = ร่างที่ยังไม่พร้อมตรวจ)

**ขั้นที่ 4: หน้า PR ที่เปิดแล้ว** มีแท็บสำคัญ 3 แท็บ
| แท็บ | แสดงอะไร |
|---|---|
| **Conversation** | คำอธิบาย คอมเมนต์สนทนา สถานะการตรวจ และผลตรวจอัตโนมัติ (ถ้าตั้งไว้) |
| **Commits** | รายการ commit ใน PR |
| **Files changed** | ความต่างของโค้ด เขียว = เพิ่ม แดง = ลบ |

**ขั้นที่ 5: พี่ review** ใน Files changed พี่เอาเมาส์ชี้ที่บรรทัดแล้วคลิกเครื่องหมาย + เพื่อคอมเมนต์ แล้วกด **Review changes** เลือกผลลัพธ์:
- **Comment** = แค่ให้ความเห็น
- **Approve** = ผ่าน
- **Request changes** = ขอให้แก้ก่อน

**ขั้นที่ 6: แก้ตาม comment** ไม่ต้องเปิด PR ใหม่ แก้ในเครื่อง commit และ push เข้า branch เดิม PR จะอัปเดตเอง:
```bash
git add .
git commit -m "docs: fix typo per review"
git push
```
ตอบกลับคอมเมนต์ แล้วกด **Resolve conversation** เมื่อแก้แล้ว

**ขั้นที่ 7: merge** เมื่อ approve แล้ว ปุ่มสีเขียวด้านล่าง Conversation จะกดได้ ปุ่มมีตัวเลือกใน dropdown:
| ตัวเลือก | ผลลัพธ์ |
|---|---|
| **Create a merge commit** | รวมทุก commit และสร้าง merge commit ผูก (แบบ merge ที่เรียนมา) |
| **Squash and merge** | ยุบทุก commit ใน PR เป็น commit เดียวเข้า main |
| **Rebase and merge** | วาง commit ของเราต่อท้าย main แบบเส้นตรง |

ทีมจะตกลงว่าใช้แบบไหน (ถามพี่) แล้วกดยืนยัน จากนั้นกด **Delete branch** เก็บกวาด

**ขั้นที่ 8: กลับมาซิงก์ในเครื่อง**
```bash
git switch main
git pull
git branch -d docs/about-me
```
**ควรเห็น** commit ของเรา (หรือ commit ที่ squash แล้ว) อยู่ใน `git log --oneline` ของ main

> 💡 **comment ของ reviewer ไม่ใช่การตำหนิ** แต่คือการช่วยให้โค้ดดีขึ้น 🙏 ขอบคุณและแก้ได้เลย ถ้าไม่เห็นด้วย อธิบายด้วยเหตุผลได้อย่างสุภาพ

### 14.9 Branch protection: ล็อก main ไม่ให้ใครแก้ตรงๆ

ทีมจริงจะตั้งกติกาให้ `main` เพื่อไม่ให้ใครเผลอ push ตรง:
- ไปที่ repo → **Settings** → **Branches** (หรือ **Rules**/**Rulesets** ในหน้าเว็บรุ่นใหม่) → เพิ่มกฎสำหรับ branch `main`
- ตัวเลือกที่พบบ่อย: **ต้องผ่าน Pull Request ก่อนจึง merge**, **ต้องมี approve อย่างน้อย 1 คน**, **ต้องผ่านการตรวจอัตโนมัติ (status checks) ก่อน**, **ห้าม force push**, ห้ามลบ branch
- ผลที่เห็น: ถ้าลอง `git push origin main` ตรงๆ จะถูกปฏิเสธ (`protected branch hook declined` หรือข้อความทำนองนี้)

> ⚠️ ฟีเจอร์บางอย่าง (เช่น กฎของ repo ส่วนตัว) อาจขึ้นกับแผนบัญชีหรือสิทธิ์ ถ้าไม่เห็นเมนู ถามพี่/ผู้ดูแล repo

### 14.10 GitHub Actions: ทีเซอร์

**GitHub Actions** คือระบบ **สั่งให้ GitHub รันงานอัตโนมัติเมื่อเกิดเหตุการณ์** เช่น ทุกครั้งที่มีคน push หรือเปิด PR ให้รัน test, ตรวจโค้ด, build หรือ deploy โดยเขียนสูตรเป็นไฟล์ YAML วางที่ `.github/workflows/ชื่อ.yml` ผลลัพธ์ (ผ่าน/ไม่ผ่าน) จะขึ้นเป็นเครื่องหมายถูก/กากบาทในหน้า PR เราจะลงรายละเอียดจริงในบทที่ 21

---

## 15. GitHub vs GitLab (vs Bitbucket)

ทั้งหมดคือ **"เว็บที่โฮสต์ Git repo + เครื่องมือทำงานเป็นทีม"** Git เหมือนกันทุกที่ (คำสั่ง `git` ใช้ได้เหมือนเดิม) ต่างกันที่หน้าเว็บ ชื่อเรียก และของแถม

### 15.1 แผนที่คำศัพท์

| แนวคิด | GitHub | GitLab | Bitbucket |
|---|---|---|---|
| ขอรวมโค้ด | **Pull Request (PR)** | **Merge Request (MR)** | **Pull Request** |
| ระบบรันงานอัตโนมัติ (CI/CD) | **GitHub Actions** (`.github/workflows/*.yml`) | **GitLab CI/CD** (`.gitlab-ci.yml`) | **Bitbucket Pipelines** (`bitbucket-pipelines.yml`) |
| ใบสั่งงาน | **Issues** | **Issues** | **Issues** (หรือใช้ผูกกับ Jira) |
| กระดานงาน | **Projects** | **Issue Boards** | ผูกกับ Jira |
| กลุ่มคน/องค์กร | **Organization** | **Group / Subgroup** | **Workspace** |
| repo | **Repository** | **Project** | **Repository** |
| ปล่อยเวอร์ชัน | **Releases** | **Releases** | **Downloads / Tags** |
| เก็บ container image | GitHub Container Registry | GitLab Container Registry | ใช้บริการอื่นร่วม |
| หน้าเว็บ static ฟรี | GitHub Pages | GitLab Pages | ไม่มีตรงๆ (ใช้บริการอื่น) |
| ปกป้อง branch หลัก | Branch protection / Rulesets | Protected branches | Branch restrictions |
| ผู้ผลิต | GitHub (ในเครือ Microsoft) | GitLab Inc. | Atlassian |

> 💡 ที่ต้องจำจริงๆ มีแค่นี้: **PR = MR** เป็นสิ่งเดียวกัน เพียงชื่อต่างกัน คู่มือนี้ใช้สลับกันตามที่ทีมเรียก

### 15.2 ต่างกันตรงไหนในภาพใหญ่

| ด้าน | GitHub | GitLab | Bitbucket |
|---|---|---|---|
| จุดเด่น | ชุมชนใหญ่ที่สุด โปรเจกต์โอเพนซอร์สส่วนมากอยู่ที่นี่ ใช้เป็น "พอร์ตโฟลิโอ" ได้ | ครบในที่เดียว: repo + CI/CD + จัดการงาน + ความปลอดภัย รวมแพลตฟอร์มเดียว (DevOps platform) | ผูกกับ Jira/Trello และเครื่องมือของ Atlassian ได้ลื่น |
| ติดตั้งเองบนเซิร์ฟเวอร์ตัวเอง (self-host) | มี GitHub Enterprise Server (เสียเงิน) | **มีเวอร์ชัน self-managed** ที่ใช้ได้ทั้งแบบฟรี (Community) และแบบเสียเงิน (Enterprise) | มี Data Center (เสียเงิน ขึ้นกับบริการ ณ ปัจจุบัน) |
| ตัวเลือก self-host แบบโอเพนซอร์สอื่น | | | เช่น Gitea / Forgejo (เบาและตั้งง่าย) |
| ความนิยมในไทย/ทั่วโลก | สูงมาก | สูงในองค์กรที่ต้องการคุมข้อมูลเอง | พบมากในทีมที่ใช้ Jira |

**self-hosting คืออะไร?** คือเอาโปรแกรม GitLab (หรือ Gitea ฯลฯ) ไปติดตั้งบนเซิร์ฟเวอร์ของบริษัทเอง ข้อมูลโค้ดทั้งหมดอยู่ในมือเรา เหมาะกับองค์กรที่มีนโยบายความปลอดภัยเข้มหรือห้ามส่งโค้ดออกนอกบริษัท แลกกับ **ต้องดูแลเอง** (อัปเดต สำรองข้อมูล ความปลอดภัย) ไม่ใช่ว่าฟรีไม่มีต้นทุน

### 15.3 เรื่องราคา (เล่าแบบกว้างๆ)

ทั้งสามเจ้าใช้โมเดลคล้ายกัน คือ **ฟรีใช้ได้จริงสำหรับงานทั่วไป และมีแพ็กเกจเสียเงินแบบจ่ายตามจำนวนผู้ใช้ต่อเดือน** เมื่อต้องการฟีเจอร์เพิ่ม เช่น ควบคุมสิทธิ์ละเอียด, ความปลอดภัยขั้นสูง, ซัพพอร์ต, ระบบ CI ที่ใช้เวลาเครื่องรันมากขึ้น
- ระบบ CI/CD มักมี **โควตาเวลาเครื่องรัน** ต่อเดือนให้ฟรีระดับหนึ่ง เกินแล้วต้องซื้อเพิ่มหรือรันเครื่องของตัวเอง
- repo ส่วนตัว (private) ที่ฟรี ตัวเลือกและข้อจำกัดต่างกันตามเจ้าและเปลี่ยนตามเวลา
- ราคา เงื่อนไข และโควตา **เปลี่ยนได้เสมอ** ให้ดูที่หน้า **Pricing** ของเว็บนั้นๆ ก่อนตัดสินใจ ไม่ควรเชื่อตัวเลขจากบทความเก่า

### 15.4 เลือกอะไรดี

| สถานการณ์ | แนะนำ |
|---|---|
| โปรเจกต์ส่วนตัว พอร์ตโฟลิโอ ร่วมโอเพนซอร์ส | **GitHub** (คนเห็นเยอะสุด) |
| บริษัทที่อยากได้ทุกอย่างในที่เดียว หรืออยากคุมข้อมูลเอง (self-host) | **GitLab** |
| ทีมที่ใช้ Jira เป็นหลักอยู่แล้ว | **Bitbucket** |
| ไม่แน่ใจ / ทีมมีที่ใช้อยู่แล้ว | **ใช้ตามที่ทีมใช้** ทักษะเรียนครั้งเดียวใช้ได้ทุกที่เพราะ Git เหมือนกัน |

> 🤓 ทีมจะแจ้งว่าให้ส่งงานที่ไหน (GitHub หรือ GitLab) ควรลองทำทั้งสองให้คล่อง ซึ่งไม่ยาก เพราะหลักการเหมือนกัน

### 15.5 🔧 ใช้ GitLab ทีละขั้น

**1) สมัครและตั้ง SSH key**
- ไปที่ https://gitlab.com กด **Register** แล้วทำตามขั้นตอน (หรือใช้ GitLab ของบริษัทตามที่พี่ให้ URL)
- ตั้ง SSH key ตามหัวข้อ 13.1 (วางที่ Preferences → SSH Keys) ทดสอบด้วย `ssh -T git@gitlab.com`

**2) สร้าง Project (repo)**
1. มุมซ้ายบนกดปุ่ม **+** (หรือ **New project/repository**) → **New project/repository** → **Create blank project**
2. กรอก:
   - **Project name**: เช่น `intern-basic-bit` (ช่อง Project slug จะสร้าง URL ให้เอง)
   - **Project URL / Namespace**: เลือกว่าจะอยู่ใต้บัญชีเรา หรือใต้ Group ของทีม
   - **Visibility Level**: **Private** (เห็นเฉพาะคนที่เชิญ) / Internal / Public
   - **Initialize repository with a README**: ติ๊กถ้าอยากมีไฟล์เริ่มต้น
3. กด **Create project**

**3) clone และ push**
หน้า project มีปุ่ม **Code** (หรือ **Clone**) ให้ก๊อป URL แบบ SSH
```bash
git clone git@gitlab.com:ชื่อเรา/intern-basic-bit.git
cd intern-basic-bit
```
ถ้ามีโฟลเดอร์อยู่แล้วและสร้าง project เปล่า:
```bash
git remote add origin git@gitlab.com:ชื่อเรา/intern-basic-bit.git
git branch -M main
git push -u origin main
```
**ควรเห็น** `* [new branch] main -> main` และไฟล์ปรากฏในหน้า project

**4) Merge Request (MR)**
```bash
git switch -c docs/about-me
# แก้ README.md แล้ว
git add . && git commit -m "docs: add about me"
git push -u origin docs/about-me
```
**ควรเห็น** ท้าย output ของ GitLab บอกวิธีเปิด MR ในรูปแบบนี้
```
remote: To create a merge request for docs/about-me, visit:
remote:   https://gitlab.com/ชื่อเรา/intern-basic-bit/-/merge_requests/new?merge_request%5Bsource_branch%5D=docs%2Fabout-me
```
ก๊อปลิงก์นั้นไปเปิดใน Browser (หรือเข้า project → **Merge requests** → **New merge request**) หน้าจอจะมี:
- **Source branch** (ของเรา) → **Target branch** (`main`) ตรวจให้ถูก
- **Title** และ **Description** เขียน ทำอะไร/ทำไม/ทดสอบยังไง
- **Assignee** (ผู้รับผิดชอบ MR คือเรา) และ **Reviewer** (เลือกพี่)
- ช่อง checkbox ที่พบ: **Delete source branch when merge request is accepted** และ **Squash commits when merge request is accepted** (ทีมตกลงว่าจะติ๊กอะไร)
- กด **Create merge request**

หน้า MR มีแท็บ **Overview** (คอมเมนต์/สถานะ) **Commits** **Pipelines** (ผลตรวจอัตโนมัติถ้าตั้งไว้) **Changes** (ความต่างของโค้ด) พี่คอมเมนต์ที่บรรทัดโค้ดได้เหมือน PR เราแก้แล้ว push เพิ่มใน branch เดิม MR อัปเดตเอง เมื่อผ่านแล้วกด **Merge** และกลับมา `git switch main && git pull`

**5) ป้องกัน main**: **Settings → Repository → Protected branches** ตั้งได้ว่าใครมีสิทธิ์ push/merge ใน `main` (โดยทั่วไป branch หลักมักถูกป้องกันไว้ให้โดยปริยาย)

---

## 16. Workflow ของทีม Blicktech

```
 1. รับงาน (Issue)   ->  2. แตก branch       ->  3. commit ทีละเรื่อง  ->  4. push
 5. เปิด Merge Request (MR)  ->  6. พี่ review / แก้ตาม comment  ->  7. merge เข้า main
```

**ตั้งชื่อ branch:** `ประเภท/เลข-issue-คำอธิบายสั้น`
```
feat/42-laptop-search
fix/57-wrong-vat
```

**Commit message:** ดูหัวข้อ 5

**Merge Request (MR) / Pull Request (PR)** = การขอรวมโค้ดเข้า `main` ให้คนอื่นตรวจก่อน
- เขียนอธิบายว่า **ทำอะไร ทำไม ทดสอบยังไง** แนบ screenshot ถ้ามี UI
- MR เล็กๆ review ง่ายและเร็วกว่า MR ใหญ่ทีเดียวหลายร้อยบรรทัด
- comment ของ reviewer **ไม่ใช่การตำหนิ** แต่คือการช่วยให้โค้ดดีขึ้น 🙏

> ⚠️ **ห้ามเด็ดขาด:** `git push --force` ใส่ `main` หรือ branch ที่คนอื่นใช้ร่วม เพราะลบงานคนอื่นทิ้งได้

---

## 17. 🩺 แก้ปัญหา Git ที่เจอบ่อย

อ่านข้อความ error **ทั้งหมด** Git มักบอกวิธีแก้ไว้ในบรรทัดท้ายๆ

| อาการ / ข้อความ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `git@github.com: Permission denied (publickey).` `fatal: Could not read from remote repository.` | เครื่องไม่มีกุญแจที่เว็บรู้จัก: ยังไม่ได้ฝาก public key, ssh-agent ไม่ได้โหลดกุญแจ, หรือล็อกอินผิดบัญชี | 1) `ssh -T git@github.com` ดูว่าเข้าได้ไหม 2) `ssh-add -l` ดูว่ากุญแจโหลดอยู่ ถ้าไม่ `ssh-add ~/.ssh/id_ed25519` 3) ตรวจว่าวาง **.pub** ถูกบัญชีแล้ว 4) `git remote -v` ว่า URL ถูกต้อง |
| `! [rejected] main -> main (fetch first)` หรือ `(non-fast-forward)` / `failed to push some refs` | บน remote มี commit ที่เครื่องเราไม่มี (มีคน push ก่อน) | `git pull` (หรือ `git pull --rebase`) รวมของใหม่ แก้ conflict ถ้ามี แล้ว `git push` อีกครั้ง **อย่าใช้ `--force`** |
| `You are in 'detached HEAD' state` | เราไปยืนที่ commit/tag ตรงๆ แทนที่จะอยู่บน branch (เช่น `git switch a1b2c3d`) commit ที่ทำตอนนี้ไม่มีป้าย branch ถือ | ถ้าไม่ได้ทำอะไร: `git switch main` ถ้าทำ commit ไว้และอยากเก็บ: `git switch -c ชื่อ-branch-ใหม่` ก่อนออก |
| `CONFLICT (content): Merge conflict in ...` | สองฝั่งแก้บรรทัดเดียวกัน | เปิดไฟล์ แก้ให้ถูก ลบ `<<<<<<<` `=======` `>>>>>>>` แล้ว `git add` + `git commit` (หรือ `git merge --abort` เพื่อถอยออก) ดูหัวข้อ 8 |
| `fatal: Authentication failed for 'https://...'` หรือ `Support for password authentication was removed` | ใช้รหัสผ่านบัญชีกับ HTTPS (ไม่รับแล้ว) หรือ token หมดอายุ/ไม่มีสิทธิ์ | สร้าง token ใหม่แล้วใช้แทนรหัสผ่าน หรือเปลี่ยนไปใช้ SSH ตามหัวข้อ 13.1 ถ้า Mac/Windows จำ token เก่าไว้ ให้ลบรายการเก่าใน Keychain Access / Credential Manager แล้วลองใหม่ |
| `fatal: The current branch xxx has no upstream branch` | branch ใหม่ยังไม่เคย push จึงยังไม่รู้ว่าคู่กับอะไรบน remote | `git push -u origin ชื่อ-branch` |
| `error: src refspec main does not match any` | ยังไม่มี commit เลย หรือชื่อ branch ในเครื่องไม่ใช่ `main` (เช่น เป็น `master`) | ทำ commit แรกก่อน และ `git branch` ดูชื่อ ถ้าอยากเปลี่ยนเป็น main: `git branch -M main` |
| `fatal: refusing to merge unrelated histories` | รวมสอง repo ที่ประวัติไม่เกี่ยวกัน (เช่น `git init` เองแล้วไปชนกับ repo ที่เว็บสร้างพร้อม README) | ถ้าตั้งใจรวมจริง: `git pull origin main --allow-unrelated-histories` ทางที่ดี: clone ตั้งแต่แรก |
| `error: Your local changes to the following files would be overwritten by merge` (หรือ `checkout`) | มีไฟล์ที่แก้ค้างอยู่ และของที่จะดึงมาชนไฟล์เดียวกัน | `git commit` งานที่ค้าง หรือ `git stash` เก็บไว้ก่อน แล้วทำคำสั่งเดิมซ้ำ จากนั้น `git stash pop` |
| `nothing to commit, working tree clean` | ไม่มีอะไรเปลี่ยนจริงๆ หรือเปลี่ยนแล้วแต่ไฟล์ถูก `.gitignore` | ตรวจว่าบันทึกไฟล์แล้ว `git check-ignore -v ไฟล์` |
| `nothing added to commit but untracked files present` | มีไฟล์ใหม่ แต่ยังไม่ได้ `git add` | `git add ไฟล์` แล้ว commit |
| `fatal: not a git repository (or any of the parent directories): .git` | อยู่ผิดโฟลเดอร์ หรือยังไม่ได้ `git init` | `pwd` ตรวจตำแหน่ง แล้ว `cd` เข้าโฟลเดอร์โปรเจกต์ หรือ `git init` |
| commit ด้วยชื่อ/อีเมลผิด (ไม่ขึ้นเป็นเราบนเว็บ) | ไม่ได้ตั้ง `user.name`/`user.email` หรือตั้งผิด | ตั้งค่าใหม่ตามหัวข้อ 3.2 commit ล่าสุดแก้ด้วย `git commit --amend --reset-author --no-edit` (ถ้ายังไม่ push) |
| ไฟล์ใหญ่เกิน ถูกเว็บปฏิเสธตอน push (เช่น เกิน 100 MB บน GitHub) | commit ไฟล์ใหญ่ไว้ (วิดีโอ, dump ฐานข้อมูล) | เอาไฟล์ออกจาก commit (`git reset --soft HEAD~1` ถ้ายังไม่ push) ใส่ `.gitignore` และถามพี่เรื่องเก็บไฟล์ใหญ่ |
| 🚨 **เผลอ commit ความลับ** (`.env`, รหัสผ่าน, API key, token) | ความลับอยู่ในประวัติแล้ว ลบไฟล์ทีหลังไม่ทำให้หาย ถ้า push ไปแล้วให้ถือว่า **รั่ว** | **ทำตามลำดับ** (1) **เปลี่ยนรหัส / สร้าง key ใหม่ + ยกเลิกของเก่าทันที** นี่คือขั้นที่สำคัญที่สุด (2) แจ้งพี่ (3) ลบไฟล์ออกจากโค้ด เพิ่มลง `.gitignore` แล้ว commit (4) ถ้ายังไม่ push: `git reset --soft HEAD~1`, เอาความลับออก แล้ว commit ใหม่ (5) ถ้า push แล้ว การเขียนประวัติใหม่ (เช่นเครื่องมือ `git filter-repo`) ทำได้แต่ต้องทำร่วมกับพี่ และ **ไม่ใช่ทดแทนการเปลี่ยนรหัส** |
| `error: failed to push` เพราะ `protected branch` | พยายาม push ตรงเข้า `main` ที่ถูกล็อก | ไม่ผิดปกติ ให้แตก branch แล้วเปิด PR/MR แทน |

> 🧭 **ก่อนตกใจ:** รัน `git status` และ `git log --oneline --graph --all` ดูสถานการณ์ก่อนเสมอ แล้วถ้ายังไม่แน่ใจ **หยุดและถามพี่** (พร้อมแนบข้อความ error เต็มๆ) ดีกว่าเดาสั่งคำสั่งแรงๆ อย่าง `reset --hard` หรือ `push --force`

---

## 💥 ลองพังมันดู

ทำใน `git-playground` ที่เราสร้างไว้ ปลอดภัยแน่นอน:

1. **ทำให้ conflict แล้วแก้** ตามหัวข้อ 8 จากนั้นลอง `git merge --abort` ตอนกำลังชนกัน ดูว่าทุกอย่างกลับเป็นปกติ
2. **ลบงานแล้วกู้ด้วย reflog**: สร้างไฟล์ `oops.txt` commit แล้วรัน `git reset --hard HEAD~1` ไฟล์หาย → ใช้ `git reflog` หารหัสแล้ว `git switch -c rescue รหัส` เอากลับ
3. **เข้า detached HEAD**: `git switch --detach HEAD~1` อ่านข้อความเตือนให้ครบ แล้ว `git switch main` กลับมา
4. **ลอง push ซ้ำซ้อน**: clone repo เดียวกันสองโฟลเดอร์ ทั้งคู่แก้ README คนละอย่าง push จากโฟลเดอร์แรก แล้ว push จากโฟลเดอร์สอง จะเจอ `rejected (fetch first)` ลอง `git pull` แล้ว push อีกครั้ง
5. **ลองเผลอ add `.env`** (ไฟล์ปลอม `secret=1234`) แล้ว `git restore --staged .env` และใส่ `.gitignore` ให้ชิน

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

<details><summary>4. <code>git reset --soft</code>, <code>--mixed</code>, <code>--hard</code> ต่างกันยังไง?</summary>

ทั้งสามถอย branch กลับไป commit ที่ระบุเหมือนกัน ต่างที่ `--soft` เก็บของไว้ใน staging, `--mixed` เอาออกจาก staging แต่ไฟล์ยังอยู่, `--hard` ทิ้งทั้ง staging และการแก้ในไฟล์
</details>

<details><summary>5. commit ที่ push ไปแล้วมีบั๊ก ควรใช้ <code>reset</code> หรือ <code>revert</code>?</summary>

ใช้ `revert` เพราะสร้าง commit ใหม่ที่ย้อนผล ไม่เขียนประวัติเดิมใหม่ จึงปลอดภัยกับคนที่ดึงงานไปแล้ว `reset` ใช้กับงานในเครื่องที่ยังไม่ push
</details>

<details><summary>6. ใช้ <code>git reset --hard</code> ไปแล้วรู้ตัวว่าผิด ยังกู้ commit ได้ไหม?</summary>

กู้ได้ถ้า commit นั้นเคยถูกบันทึกไว้ ใช้ `git reflog` หารหัสแล้ว `git reset --hard รหัส` หรือ `git switch -c ชื่อ รหัส` แต่การแก้ที่ยังไม่เคย commit กู้ไม่ได้
</details>

<details><summary>7. ทำงานค้างอยู่แล้วต้องสลับไป branch อื่นด่วน ทำอย่างไรโดยไม่ commit งานที่ไม่เสร็จ?</summary>

ใช้ `git stash push -m "ข้อความ"` เก็บงานไว้ แล้วสลับ branch ไปทำงานด่วน เสร็จแล้วกลับมา `git stash pop`
</details>

<details><summary>8. Pull Request กับ Merge Request ต่างกันไหม?</summary>

เป็นสิ่งเดียวกัน คือการขอให้รวมงานจาก branch หนึ่งเข้าอีก branch พร้อมให้คนตรวจ GitHub และ Bitbucket เรียก Pull Request ส่วน GitLab เรียก Merge Request
</details>

<details><summary>9. push แล้วเจอ <code>rejected (fetch first)</code> ควรทำอะไร? และห้ามทำอะไร?</summary>

ควร `git pull` เพื่อรวมงานที่อยู่บน remote เข้ามาก่อน (แก้ conflict ถ้ามี) แล้ว push ใหม่ ห้ามใช้ `git push --force` เพราะจะทับงานของคนอื่น
</details>

<details><summary>10. SSH key มี 2 ไฟล์ ไฟล์ไหนฝากบน GitHub/GitLab ได้ ไฟล์ไหนห้ามแชร์?</summary>

ฝากไฟล์ `.pub` (public key) ได้ ส่วนไฟล์ที่ไม่มีนามสกุล (private key) ห้ามส่งให้ใครและห้าม commit
</details>

---

## ✏️ แบบฝึกหัด

**ส่วนที่ 1: ฝึกใน repo ทดลอง (ในเครื่อง)**
1. สร้าง repo ใหม่ `git-lab` ทำ commit 3 ครั้ง (ข้อความตามรูปแบบ `ประเภท: ทำอะไร`)
2. ใช้ `git commit --amend` แก้ข้อความ commit สุดท้าย
3. ใช้ `git reset --hard HEAD~1` ทิ้ง commit ล่าสุด แล้วใช้ `git reflog` กู้กลับ
4. ใช้ `git revert` ย้อนผลของ commit กลางสักอัน
5. ใช้ `git stash` เก็บงานที่ค้างแล้ว `pop` กลับ
6. ติด tag `v0.1.0`

**ส่วนที่ 2: ส่งงานจริง**
สร้าง repo `intern-basic-<ชื่อเล่น>` บน GitHub/GitLab ใส่ `README.md` แนะนำตัว และ `.gitignore`
จากนั้นแตก branch `docs/about-me` เพิ่มหัวข้อ "สิ่งที่อยากเรียนรู้" แล้วเปิด **Merge Request / Pull Request** เข้า `main` เขียนคำอธิบายให้ครบ (ทำอะไร/ทำไม/ทดสอบยังไง) ส่งลิงก์ให้พี่ review

**ส่วนที่ 3 (ท้าทาย):** ทำให้ตัวเองเกิด conflict กับเพื่อน (สองคนแก้บรรทัดเดียวกันใน repo เดียวกัน) แล้วช่วยกันแก้ให้ผ่านโดยเปิด PR/MR

## ✅ ผ่านด่าน

- [ ] ตั้ง `user.name` / `user.email` แล้ว และ SSH key (หรือ token) ใช้งานได้
- [ ] `add`, `commit`, `status`, `log`, `diff` ใช้คล่อง
- [ ] เขียน commit message ตามรูปแบบ `ประเภท: ทำอะไร` ได้
- [ ] สร้าง branch และ merge ได้
- [ ] แก้ conflict ได้โดยไม่ตกใจ
- [ ] รู้ว่าเมื่อพลาด ใช้ `restore` / `reset` / `revert` / `amend` / `reflog` เมื่อไหร่
- [ ] ใช้ `stash` และรู้จัก `tag` กับ `.gitignore`
- [ ] push, clone, เปิด Pull Request / Merge Request ได้
- [ ] อธิบายความต่าง GitHub กับ GitLab (PR = MR) ได้

---

[← บทที่ 0](./00-start.md) · [🏠 สารบัญ](/) · [บทที่ 2: Docker →](./02-docker.md)
