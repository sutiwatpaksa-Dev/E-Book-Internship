# บทที่ 9: Debugging 🕵️

> ⏱ ประมาณ 1.5 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 4 · 🛠 ใช้: VS Code, TypeScript

> **⚡ สรุป 30 วินาที**
> - บั๊กไม่ใช่ศัตรู แต่คือ **ปริศนา** ที่มีเบาะแสให้เสมอ
> - ขั้นตอน: **ทำให้เกิดซ้ำ → อ่าน error → แคบขอบเขต → ตั้งสมมติฐาน → แก้ → ตรวจซ้ำ**
> - อ่าน stack trace: บรรทัดแรก = **เกิดอะไร** · บรรทัดแรกที่เป็นไฟล์ของเรา = **เกิดที่ไหน**
> - ใช้ **breakpoint** ใน VS Code แทนการเดาด้วย `console.log` อย่างเดียว
> - ถามคนอื่นให้ได้คำตอบเร็ว: บอก **ทำอะไร คาดว่าจะได้อะไร ได้อะไรจริง ลองอะไรไปแล้ว**

---

## 📖 เรื่องเล่า

บิตนั่งจ้องจอ 2 ชั่วโมง แก้โค้ดไปเรื่อยๆ แบบสุ่ม รันใหม่ 40 รอบ ก็ยังพัง 😩
พี่ไบต์เดินมาถามคำถามเดียว: *"error บอกว่าอะไร?"*
บิต: *"เอ่อ... ผมยังไม่ได้อ่านเลยครับ มันยาวมาก"*

พี่ไบต์อ่านให้ฟัง 10 วินาที ชี้บรรทัดที่ 23 แก้เสร็จใน 1 นาที 🫠

> 🤓 **เกร็ด:** คำว่า "bug" ในวงการคอมพิวเตอร์ มีบันทึกจริงในปี 1947 ว่าทีมของ Grace Hopper เจอ **แมลงเม่าติดอยู่ในเครื่อง** คอมพิวเตอร์ Harvard Mark II แล้วแปะแมลงตัวนั้นไว้ในสมุดบันทึกพร้อมเขียนว่า "first actual case of bug being found" 🦋

---

## 1. Mindset: เป็นนักสืบ ไม่ใช่นักเดา

| ❌ นักเดา | ✅ นักสืบ |
|---|---|
| แก้มั่วๆ แล้วรันดูว่าหายไหม | อ่านเบาะแส (error) ก่อน |
| เปลี่ยนทีละ 5 จุด | เปลี่ยนทีละ 1 จุด แล้วดูผล |
| "มันพังเอง" | "มันพังเพราะ..." |
| แก้หายแล้วไม่รู้ว่าทำไม | เข้าใจว่าทำไมพังและทำไมหาย |

**6 ขั้นของนักสืบ** 🔍
1. **ทำให้เกิดซ้ำ** ได้ทุกครั้ง: ทำอะไร ใส่ข้อมูลอะไร ถึงพัง
2. **อ่าน error ให้จบ** (ข้อ 2)
3. **แคบขอบเขต:** พังที่ฟังก์ชันไหน บรรทัดไหน ข้อมูลตัวไหนผิด
4. **ตั้งสมมติฐาน:** "น่าจะเพราะ X เป็น undefined"
5. **แก้ทีละอย่าง** แล้วทดสอบ
6. **ตรวจซ้ำ** ว่าหายจริง และไม่ทำของอื่นพัง

---

## 2. อ่าน Stack Trace

```
TypeError: Cannot read properties of undefined (reading 'brand')
    at formatLaptop (/app/src/format.ts:3:22)
    at /app/src/routes/laptops.ts:15:18
    at Layer.handle (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
```

| ส่วน | บอกอะไร |
|---|---|
| `TypeError` | **ชนิด** ของ error |
| `Cannot read properties of undefined (reading 'brand')` | **เกิดอะไร:** พยายามอ่าน `.brand` จากสิ่งที่เป็น `undefined` |
| `at formatLaptop (src/format.ts:3:22)` | **เกิดที่ไหน:** ฟังก์ชัน `formatLaptop` ไฟล์ `format.ts` บรรทัด 3 |
| `at ... routes/laptops.ts:15:18` | **ใครเรียกมา:** บรรทัด 15 ของ `laptops.ts` |
| `node_modules/...` | โค้ดของ library **ข้ามไปได้เลย** |

> 💡 **อ่านจากบนลงล่าง หาบรรทัดแรกที่เป็นไฟล์ของเรา** (ไม่ใช่ `node_modules`) นั่นคือจุดเริ่มสืบ
> 💡 stack trace = **รอยเท้า** ของโปรแกรมก่อนล้ม บรรทัดบนสุดคือจุดที่ล้ม บรรทัดล่างคือทางที่เดินมา

**error ที่เจอบ่อยและสาเหตุที่น่าจะเป็น**
| error | มักเกิดจาก |
|---|---|
| `Cannot read properties of undefined` | หาข้อมูลไม่เจอแต่ไม่ได้เช็คก่อนใช้ |
| `X is not a function` | ชื่อผิด, import ผิด, ตัวแปรไม่ใช่สิ่งที่คิด |
| `ECONNREFUSED 127.0.0.1:5432` | DB ยังไม่เปิด หรือ host/port ผิด (ใน Docker ใช้ชื่อ service!) |
| `EADDRINUSE :::3000` | มีโปรแกรมอื่นใช้ port 3000 อยู่ (อาจเป็นตัวเดิมที่ยังไม่ปิด) |
| `relation "x" does not exist` | ยังไม่ได้รัน migration หรือต่อผิด DB |
| `Unexpected token < in JSON` | ได้ HTML (หน้า error) กลับมาแทน JSON |

---

## 3. `console.log` อย่างมีระบบ

```ts
console.log(laptop);                          // ❌ log เปล่าๆ ไม่รู้ว่าค่าไหนของอะไร
console.log("[rent] laptop =", laptop);       // ✅ มีป้ายบอก
console.log({ laptopId, customerId, status }); // ✅ log หลายค่าพร้อมชื่อในบรรทัดเดียว
console.table(laptops);                       // ✅ array ของ object แสดงเป็นตาราง
console.log(JSON.stringify(data, null, 2));   // ✅ object ซ้อนลึกๆ อ่านง่าย
```
> ⚠️ ลบ log ที่ใช้ debug ออกก่อน commit และ **ห้าม log รหัสผ่าน/token/ข้อมูลส่วนตัวลูกค้า** (บทที่ 10)

---

## 4. 🔧 ใช้ Debugger ใน VS Code (เปลี่ยนชีวิต)

`console.log` เหมือน **ถ่ายรูปทีละภาพ** ส่วน debugger เหมือน **กด pause วิดีโอ** 🎬 แล้วดูทุกอย่างในเฟรมนั้นได้

**วิธีที่ง่ายที่สุด**
1. ใน VS Code กด `⌘/Ctrl + Shift + P` → พิมพ์ **"JavaScript Debug Terminal"** → Enter
2. Terminal ใหม่จะเปิดขึ้น พิมพ์ `npm run dev` ในนั้น
3. คลิกที่ **ซ้ายของเลขบรรทัด** ให้เกิด **จุดแดง** 🔴 = breakpoint
4. เรียกให้โค้ดทำงาน (เช่น ส่ง request) → โปรแกรมหยุดที่จุดแดง

**ตอนหยุดอยู่ทำอะไรได้บ้าง**
| ปุ่ม / แผง | ทำอะไร |
|---|---|
| **Variables** | เห็นค่าทุกตัวแปร ณ ตอนนั้น |
| **Watch** | พิมพ์ expression ให้คอยดู เช่น `laptop.status` |
| **Call Stack** | เส้นทางที่เรียกมาถึงจุดนี้ |
| ▶️ Continue (`F5`) | ไปต่อจนเจอ breakpoint ถัดไป |
| ⤵️ Step Over (`F10`) | ไปบรรทัดถัดไป |
| ⬇️ Step Into (`F11`) | เข้าไปในฟังก์ชันที่เรียก |
| เอาเมาส์ชี้ตัวแปร | เห็นค่าทันที |

> 💡 **Conditional breakpoint:** คลิกขวาที่จุดแดง → Edit Breakpoint → ใส่เงื่อนไข เช่น `laptop.id === 7` จะหยุดเฉพาะตอนที่ตรงเงื่อนไข เหมาะกับบั๊กที่เกิดกับข้อมูลบางตัวใน loop ยาวๆ

---

## 5. 🦆 Rubber Duck Debugging

วางเป็ดยาง (หรือตุ๊กตาอะไรก็ได้) ไว้ข้างจอ แล้ว **อธิบายโค้ดให้มันฟังทีละบรรทัด** ว่าบรรทัดนี้ทำอะไร ค่าตอนนี้ควรเป็นอะไร

ฟังดูตลก แต่ได้ผลจริง เพราะการพูดออกมาบังคับให้สมองเช็คทุกขั้นที่เคย "คิดว่าใช่" และส่วนใหญ่จะเจอบั๊กเองก่อนอธิบายจบ 🦆✨

---

## 6. 🙋 ถามคนอื่นยังไงให้ได้คำตอบเร็ว

ติดเกิน **30 นาที** แล้วยังไม่คืบ = ถามได้เลย ไม่ต้องเกรงใจ แต่ถามให้ดีจะได้คำตอบเร็วกว่ามาก

❌ *"พี่ครับ มันพังครับ"*
❌ *"API ใช้ไม่ได้ครับ"* + รูปถ่ายหน้าจอด้วยมือถือ 📱

✅ ใช้เทมเพลตนี้:
```
🎯 กำลังทำ: เพิ่ม endpoint POST /rentals
👣 ขั้นตอนที่ทำให้พัง: ส่ง { "laptopId": 1, "customerId": 2 } ด้วย REST Client
✅ คาดว่าจะได้: 201 พร้อมข้อมูล rental
❌ ได้จริง: 500 และ log ขึ้นว่า
   error: relation "rentals" does not exist
   at ... src/routes/rentals.ts:18:5
🔍 ลองแล้ว: เช็คว่า DB เปิดอยู่ (docker compose ps ขึ้น running), ลองรัน migrate แล้วขึ้น "No migrations to run"
💻 branch: feat/12-rental-api (push แล้ว)
```
> 💡 บ่อยครั้งแค่ **เขียนเทมเพลตนี้ให้ครบ ก็เจอคำตอบเองแล้ว** (เป็ดยางเวอร์ชันเขียน 🦆)
> ⚠️ copy error เป็น **ข้อความ** ไม่ใช่รูป คนช่วยจะ copy ไปค้นต่อได้

---

## 7. ใช้ AI ช่วย debug อย่างถูกวิธี 🤖

AI ช่วยได้มาก **ถ้าให้ข้อมูลครบ** (ใช้เทมเพลตข้อ 6 ได้เลย)

| ✅ ทำ | ❌ อย่าทำ |
|---|---|
| วาง error เต็มๆ + โค้ดส่วนที่เกี่ยวข้อง | วางแค่ "มันพัง แก้ให้หน่อย" |
| ถามว่า "**ทำไม** ถึงพัง" ให้เข้าใจ | copy คำตอบไปวางโดยไม่อ่าน |
| เอาคำตอบมาทดสอบและทำความเข้าใจ | เชื่อ 100% (AI ผิดได้ และมั่นใจมากด้วย) |
| ลบข้อมูลลับก่อนวาง | วาง `.env`, รหัสผ่าน, ข้อมูลลูกค้าจริง 🔐 |

> 📏 กฎทีม: ใช้ AI ได้ แต่ **ต้องอธิบายโค้ดที่ส่งได้ทุกบรรทัด**

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. ได้ <code>ECONNREFUSED 127.0.0.1:5432</code> ตอนรัน API ใน Docker Compose แต่รันนอก Docker ได้ปกติ น่าจะเพราะอะไร?</summary>

ใน container `127.0.0.1` / `localhost` หมายถึงกล่อง API เอง ต้องใช้ชื่อ service ของ DB เช่น `db:5432` (บทที่ 2)
</details>

<details><summary>2. stack trace ยาว 30 บรรทัด ควรดูตรงไหนก่อน?</summary>

บรรทัดแรก (เกิดอะไร) และบรรทัดแรกที่เป็นไฟล์ในโปรเจกต์ของเรา ไม่ใช่ `node_modules` (เกิดที่ไหน)
</details>

---

## ✏️ แบบฝึกหัด: ไขคดี 3 บั๊ก 🔎

โค้ดนี้ **ผ่าน `tsc` ทุกบรรทัด** แต่มีบั๊ก 3 จุด หาให้เจอด้วย debugger หรือ log แล้วจดใน README ว่า **บั๊กคืออะไร หาเจอยังไง แก้ยังไง**

```ts
interface Laptop {
  id: number;
  status: "available" | "rented";
  pricePerMonth: number;
}

const laptops: Laptop[] = [
  { id: 1, status: "available", pricePerMonth: 1500 },
  { id: 2, status: "rented", pricePerMonth: 1200 },
  { id: 3, status: "rented", pricePerMonth: 1300 },
];

function calcRent(pricePerMonth: number, months: number, discountPercent: number): number {
  const total = pricePerMonth * months;
  const discount = total * discountPercent;
  return total - discount;
}

function isOverdue(returnDate: Date, today: Date): boolean {
  return returnDate > today;
}

function countAvailable(list: Laptop[]): number {
  return list.filter((l) => (l.status = "available")).length;
}

console.log(calcRent(1500, 3, 10));                                     // คาดว่า 4050
console.log(isOverdue(new Date("2026-01-01"), new Date("2026-02-01")));  // คาดว่า true
console.log(countAvailable(laptops));                                   // คาดว่า 1
console.log(laptops);                                                   // ข้อมูลควรเหมือนเดิม
```
💡 ใบ้: บั๊กที่ 3 ทำให้ข้อมูลเปลี่ยนไปด้วย ดูผลของบรรทัดสุดท้ายให้ดี

## ✅ ผ่านด่าน

- [ ] อ่าน stack trace แล้วหาจุดเกิดเหตุได้
- [ ] ใช้ breakpoint, Step Over, ดูค่าตัวแปรใน VS Code ได้
- [ ] ถามคำถามด้วยเทมเพลตได้
- [ ] ไขคดี 3 บั๊กสำเร็จ

---

[← บทที่ 8: ORM](./08-orm.md) · [🏠 สารบัญ](./README.md) · [บทที่ 10: Security →](./10-security.md)
