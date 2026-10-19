# ดูแล E-book

ไฟล์นี้สำหรับคนดูแลคู่มือ ไม่แสดงบนหน้าเว็บ

## แก้เนื้อหาและดูผลในเครื่อง

```bash
npm install
npm run dev        # เปิด http://localhost:5173 แก้ไฟล์ .md แล้วหน้าเว็บอัปเดตเอง
npm run build      # ตรวจว่า build ผ่าน (ลิงก์เสียจะทำให้ build ไม่ผ่าน)
```

- เนื้อหาแต่ละบทคือไฟล์ `00-start.md` ถึง `11-mini-project.md` และ `cheat-sheet.md`
- `README.md` คือหน้าแรกของ e-book
- เพิ่มบทใหม่: สร้างไฟล์ `.md` แล้วเพิ่มชื่อใน `chapters` ที่ `.vitepress/config.mts`
- สีและฟอนต์อยู่ที่ `.vitepress/theme/custom.css`

## เผยแพร่ (Vercel)

ตั้งครั้งแรก:
1. เข้า https://vercel.com/new แล้ว login ด้วย GitHub
2. เลือก repo `E-Book-Internship` แล้วกด **Import**
3. Vercel อ่านค่าจาก `vercel.json` เอง (Framework: VitePress, Output: `.vitepress/dist`) กด **Deploy** ได้เลย

หลังจากนั้น push ขึ้น `main` เมื่อไหร่ Vercel build และอัปเดตเว็บให้เอง
เปิด Merge Request / Pull Request จะได้ลิงก์ Preview แยกให้ดูก่อน merge

ถ้าต้องการโดเมนบริษัท เช่น `handbook.blicktechconsultant.co.th` ตั้งที่ Project → Settings → Domains
