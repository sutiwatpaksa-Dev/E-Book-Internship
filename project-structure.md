# บทเสริม: จัดโครงสร้างโปรเจกต์ 🗂️

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 11 และ 14 · 🛠 ใช้: Bun, Hono, React, VS Code

> **⚡ สรุป 30 วินาที**
> - โครงสร้างโฟลเดอร์ที่ดี = **เปิดมาแล้วรู้ทันทีว่าโค้ดอะไรอยู่ตรงไหน** ทีมใหม่ก็อ่านออก
> - **แบ่งตามหน้าที่ (Layered / MVC):** แยกเป็นชั้น `routes` → `services` → `repositories` เหมาะกับโปรเจกต์เล็ก
> - **แบ่งตามฟีเจอร์ (Module / Feature-based):** รวมทุกอย่างของฟีเจอร์เดียวไว้โฟลเดอร์เดียว เหมาะกับโปรเจกต์ที่โตขึ้น
> - Frontend ก็เลือกได้สองแบบเหมือนกัน และควร **แยก Component เป็น 2 ระดับ:** ระดับ 1 ใช้ร่วมกันทั้งเว็บ ระดับ 2 เป็นของฟีเจอร์นั้น
> - **ชื่อโฟลเดอร์และไฟล์ใช้ภาษาอังกฤษตัวพิมพ์เล็กเสมอ** คั่นคำด้วย `-`

---

## 📖 เรื่องเล่า

บิตทำเว็บเช่าโน้ตบุ๊กมา 2 เดือน โฟลเดอร์ `src/services/` ตอนนี้มี 14 ไฟล์ ปนกันหมด ทั้งของโน้ตบุ๊ก ลูกค้า และการเช่า

พี่ไบต์ขอให้บิตหา "โค้ดที่คิดค่าปรับเช่าเกินกำหนด" บิตเปิดไฟล์ทีละไฟล์ใช้เวลา 10 นาที

พี่ไบต์ไม่ได้บอกว่าโค้ดผิด แค่ถามว่า *"ถ้าน้องใหม่มาวันแรก เขาจะหาเจอใน 10 วินาทีไหม?"*

บิตเงียบ... 😶 วันนั้นบิตเรียนรู้ว่า **โค้ดที่รันได้ ยังไม่ใช่โค้ดที่ดูแลได้**

---

## 1. ทำไมต้องจัดโครงสร้าง

ตอนโปรเจกต์มี 3 ไฟล์ ใครจะจัดแบบไหนก็ไม่มีปัญหา แต่พอมี 100 ไฟล์ คำถามพวกนี้จะโผล่มาทุกวัน:

| คำถาม | ถ้าโครงสร้างไม่ดี | ถ้าโครงสร้างดี |
|---|---|---|
| อยากแก้ "การเช่า" ต้องเปิดไฟล์ไหน | ค้นทั้งโปรเจกต์ | เปิดโฟลเดอร์เดียวเจอ |
| ไฟล์ใหม่ควรวางที่ไหน | ถามกัน เดากัน | มีกฎตายตัว |
| ลบฟีเจอร์เก่าทิ้งได้ปลอดภัยไหม | ไม่รู้ว่าอะไรใช้ไฟล์นี้อยู่ | ลบทั้งโฟลเดอร์ได้ |
| ทำงานพร้อมกัน 3 คน | แก้ไฟล์เดียวกันชนกันบ่อย | แต่ละคนอยู่คนละโฟลเดอร์ |

> 💡 **เปรียบเทียบกับห้องครัว** 🍳
> - **แบ่งตามหน้าที่** = ครัวแบบโซน: โซนหั่น โซนผัด โซนล้างจาน ทุกเมนูวิ่งผ่านโซนเดียวกัน
> - **แบ่งตามฟีเจอร์** = ครัวแบบสถานี: สถานีส้มตำ สถานีกริลล์ สถานีของหวาน แต่ละสถานีมีของครบในตัว

ไม่มีแบบไหน "ถูกที่สุด" มีแต่ **แบบไหนเหมาะกับขนาดงานตอนนี้**

---

## 2. กฎตั้งชื่อ: ภาษาอังกฤษ ตัวพิมพ์เล็ก

![กฎตั้งชื่อโฟลเดอร์และไฟล์](/img/arch-naming.svg)
*ตั้งชื่อเป็นภาษาอังกฤษตัวพิมพ์เล็ก คั่นคำด้วย `-`*

กฎของทีม Blicktech:

1. **โฟลเดอร์:** ภาษาอังกฤษ ตัวพิมพ์เล็กทั้งหมด คำหลายคำคั่นด้วย `-` เช่น `laptops`, `rental-history`
2. **ไฟล์ฝั่ง backend และไฟล์ทั่วไป:** ตัวพิมพ์เล็ก คั่นด้วย `-` และบอกหน้าที่ต่อท้ายด้วยจุด เช่น `laptop.service.ts`, `laptop.routes.ts`
3. **ไม่ใช้ภาษาไทย ช่องว่าง หรืออักขระพิเศษ** ในชื่อไฟล์และโฟลเดอร์
4. **ใช้ชื่อเป็นพหูพจน์สำหรับโฟลเดอร์ของกลุ่มสิ่งของ** (`laptops`, `components`) และเอกพจน์สำหรับไฟล์ที่พูดถึงสิ่งเดียว (`laptop.service.ts`)

> ⚠️ **ไฟล์ component ของ React** (เช่น `ServiceCard.tsx` ในบทที่ 11) ตามธรรมเนียมของ React ใช้ชื่อตัวพิมพ์ใหญ่ตัวแรกให้ตรงกับชื่อ component ถ้าทีมต้องการให้ **ไฟล์ทุกตัวเป็นตัวพิมพ์เล็กหมด** ให้ใช้ `service-card.tsx` แล้วเขียน `export function ServiceCard` ข้างในเหมือนเดิม บทนี้ใช้แบบตัวพิมพ์เล็กทั้งหมด **ถามพี่ไบต์ว่าโปรเจกต์ที่ได้รับมอบหมายใช้แบบไหน แล้วใช้แบบเดียวกันทั้งโปรเจกต์**

**ทำไมต้องตัวพิมพ์เล็ก?**
- Windows และ Mac **ไม่แยก** `Laptop.ts` กับ `laptop.ts` แต่ Linux (เซิร์ฟเวอร์จริง, Docker) **แยก**
- เขียน `import "./Laptop"` ทั้งที่ไฟล์ชื่อ `laptop.ts` จะรันได้บนเครื่องเรา แล้ว **พังตอน deploy** ซึ่งหาสาเหตุยากมาก

💥 **ลองพังมันดู:** ในเครื่อง Mac ลองสร้างไฟล์ `Laptop.ts` แล้ว `import` เป็น `./laptop` ดูว่ารันได้ไหม (บน Mac ส่วนใหญ่จะรันได้ แต่บน Linux จะ error `Cannot find module`) แล้วลองใน Docker ด้วย `docker run --rm -v "$PWD":/app -w /app oven/bun:1 bun run index.ts`

---

## 3. 🔧 Backend แบบที่ 1: แบ่งตามหน้าที่ (Layered / MVC)

### 3.1 แนวคิด

แบ่งโค้ดเป็น **ชั้น** แต่ละชั้นทำหน้าที่เดียว และ **เรียกได้เฉพาะชั้นที่อยู่ถัดลงไป**

![คำขอไหลผ่านชั้น routes services repositories](/img/arch-layered-flow.svg)
*คำขอไหลลงทีละชั้น ห้ามข้ามชั้น*

| ชั้น | โฟลเดอร์ | หน้าที่ | ห้ามทำ |
|---|---|---|---|
| Routes (Controller) | `routes/` | รับคำขอ HTTP ตรวจ input ส่งต่อ แล้วตอบกลับ | เขียนกฎธุรกิจ หรือ query ฐานข้อมูลเอง |
| Services | `services/` | **กฎธุรกิจ** เช่น "เครื่องที่ถูกเช่าแล้วเช่าซ้ำไม่ได้" | รู้จัก HTTP (`c.req`, status code) |
| Repositories | `repositories/` | คุยกับฐานข้อมูล: อ่าน เขียน ค้นหา | ตัดสินใจเรื่องธุรกิจ |

### 3.2 แล้ว MVC เกี่ยวอะไรด้วย?

**MVC** = Model / View / Controller เป็นแนวคิดแบ่งหน้าที่ที่เก่าแก่กว่า คนมักใช้คำนี้กับเว็บที่เซิร์ฟเวอร์สร้างหน้า HTML ให้เอง พอมาทำ API (ตอบเป็น JSON) จะจับคู่ได้ประมาณนี้:

| MVC | ใน API ของเรา | อยู่ที่ไหน |
|---|---|---|
| **C**ontroller | รับคำขอ ส่งต่อ ตอบกลับ | `routes/` |
| **M**odel | ข้อมูลและกฎธุรกิจ | `services/` + `repositories/` (+ schema ของ DB) |
| **V**iew | หน้าตาของคำตอบ | รูปแบบ JSON ที่ตอบกลับ (หน้าเว็บจริงอยู่ฝั่ง React) |

> 💡 สรุป: Layered กับ MVC คือแนวคิดเดียวกัน (แยกตามหน้าที่) เพียงแต่ Layered แยกละเอียดกว่า (แยก service ออกจาก repository) ที่บริษัทเราใช้ชื่อ `routes / services / repositories`

### 3.3 โครงโฟลเดอร์

```
src/
├── routes/
│   ├── laptop.routes.ts
│   └── customer.routes.ts
├── services/
│   ├── laptop.service.ts
│   └── customer.service.ts
├── repositories/
│   ├── laptop.repository.ts
│   └── customer.repository.ts
├── middleware/
├── db/
└── app.ts
```

### 3.4 ตัวอย่างโค้ด (รันได้จริง)

`src/repositories/laptop.repository.ts` ชั้นล่างสุด คุยกับข้อมูล (ที่นี่ใช้ array แทน DB เพื่อให้ลองง่าย)

```ts
export interface Laptop {
  id: number;
  model: string;
  status: "available" | "rented";
}

const laptops: Laptop[] = [
  { id: 1, model: "Asus", status: "available" },
  { id: 2, model: "Lenovo", status: "rented" },
];

export const laptopRepository = {
  findAll: () => laptops,
  findById: (id: number) => laptops.find((l) => l.id === id),
};
```

`src/services/laptop.service.ts` กฎธุรกิจอยู่ที่นี่ ไม่มีคำว่า HTTP เลย

```ts
import { laptopRepository } from "../repositories/laptop.repository";

export const laptopService = {
  listAvailable: () => laptopRepository.findAll().filter((l) => l.status === "available"),
  rent(id: number) {
    const laptop = laptopRepository.findById(id);
    if (!laptop) throw new Error("NOT_FOUND");
    if (laptop.status === "rented") throw new Error("ALREADY_RENTED");
    laptop.status = "rented";
    return laptop;
  },
};
```

`src/routes/laptop.routes.ts` รับคำขอ แปลงผลเป็น HTTP

```ts
import { Hono } from "hono";
import { laptopService } from "../services/laptop.service";

export const laptopRoutes = new Hono();

laptopRoutes.get("/", (c) => c.json({ data: laptopService.listAvailable() }));

laptopRoutes.post("/:id/rent", (c) => {
  try {
    return c.json({ data: laptopService.rent(Number(c.req.param("id"))) });
  } catch (e) {
    const code = (e as Error).message;
    return c.json({ error: code }, code === "NOT_FOUND" ? 404 : 409);
  }
});
```

`src/app.ts` ประกอบทุกอย่างเข้าด้วยกัน

```ts
import { Hono } from "hono";
import { laptopRoutes } from "./routes/laptop.routes";

export const app = new Hono();
app.route("/api/laptops", laptopRoutes);
```

ผลที่ได้เมื่อเรียกตามลำดับ (ทดสอบด้วย `app.request(...)` ของ Hono):

```
GET  /api/laptops          → 200 {"data":[{"id":1,"model":"Asus","status":"available"}]}
POST /api/laptops/1/rent   → 200 {"data":{"id":1,"model":"Asus","status":"rented"}}
POST /api/laptops/1/rent   → 409 {"error":"ALREADY_RENTED"}
POST /api/laptops/9/rent   → 404 {"error":"NOT_FOUND"}
```

> 🤓 **สังเกตไหม?** `laptop.service.ts` ไม่รู้จัก Hono เลย ถ้าวันหนึ่งเปลี่ยนจาก Hono เป็นเฟรมเวิร์กอื่น หรืออยากเรียก service จากสคริปต์ ก็ใช้ไฟล์นี้ได้ทันที และ **เขียนเทสต์ service ได้โดยไม่ต้องจำลอง HTTP**

### 3.5 ข้อดี ข้อเสีย

| ข้อดี | ข้อเสีย |
|---|---|
| เข้าใจง่ายที่สุด เหมาะกับมือใหม่ | ฟีเจอร์เดียวกระจายอยู่ 3 โฟลเดอร์ ต้องกระโดดไปมา |
| ทุกโปรเจกต์หน้าตาเหมือนกัน | โปรเจกต์โต โฟลเดอร์ `services/` ยาวเป็นหางว่าว |
| แยกกฎธุรกิจออกจาก HTTP ได้ชัด | ลบหรือย้ายฟีเจอร์ทีเดียวทำยาก |

---

## 4. 🔧 Backend แบบที่ 2: แบ่งตามโมดูล/ฟีเจอร์ (Module / Feature-based)

### 4.1 แนวคิด

เอาทุกอย่างของ **ฟีเจอร์เดียว** มาไว้ **โฟลเดอร์เดียว** ในโฟลเดอร์นั้นยังมีหน้าที่แยกเหมือนเดิม (routes / service / repository) แต่รวมอยู่ใกล้กัน

![เปรียบเทียบการตัดแนวนอนกับแนวตั้ง](/img/arch-slice-layer.svg)
*แบ่งตามชั้น: ตัดแนวนอน ของชั้นเดียวกันอยู่รวมกัน*

![แบ่งตามฟีเจอร์ตัดแนวตั้ง](/img/arch-slice-feature.svg)
*แบ่งตามฟีเจอร์: ตัดแนวตั้ง ของฟีเจอร์เดียวกันอยู่รวมกัน*

### 4.2 โครงโฟลเดอร์

```
src/
├── modules/
│   ├── laptops/
│   │   ├── laptop.routes.ts
│   │   ├── laptop.service.ts
│   │   ├── laptop.repository.ts
│   │   └── index.ts
│   ├── customers/
│   │   ├── customer.routes.ts
│   │   ├── customer.service.ts
│   │   ├── customer.repository.ts
│   │   └── index.ts
│   └── rentals/
│       └── ...
├── shared/
│   ├── middleware/
│   ├── errors.ts
│   └── db.ts
└── app.ts
```

- `modules/` = ฟีเจอร์ของธุรกิจ แต่ละโฟลเดอร์ย่อยคือ 1 โมดูล
- `shared/` = ของที่ **ทุกโมดูลใช้ร่วมกัน** และไม่ใช่ธุรกิจของโมดูลใด (middleware, ตัวต่อฐานข้อมูล, คลาส error)

### 4.3 โค้ดต่างจากแบบที่ 1 แค่ตำแหน่งไฟล์

เนื้อไฟล์ทั้งสามเหมือนเดิมทุกตัวอักษร ต่างกันแค่ตอน `import` ที่เปลี่ยนเป็นไฟล์ข้างๆ (`./`) แทน `../`

`src/modules/laptops/laptop.service.ts` (บรรทัด import เปลี่ยนบรรทัดเดียว)

```ts
import { laptopRepository } from "./laptop.repository";
```

`src/modules/laptops/laptop.routes.ts` (บรรทัด import เปลี่ยนบรรทัดเดียว)

```ts
import { laptopService } from "./laptop.service";
```

`src/modules/laptops/index.ts` **ประตูหน้าบ้านของโมดูล** บอกว่าโมดูลนี้ส่งอะไรออกไปให้คนนอกใช้ได้

```ts
export { laptopRoutes } from "./laptop.routes";
```

`src/app.ts` เรียกโมดูลผ่านประตูหน้าบ้านเท่านั้น

```ts
import { Hono } from "hono";
import { laptopRoutes } from "./modules/laptops";

export const app = new Hono();
app.route("/api/laptops", laptopRoutes);
```

ทดสอบแล้วได้ผลลัพธ์ **เหมือนหัวข้อ 3.4 ทุกบรรทัด** เพราะโค้ดข้างในไม่ได้เปลี่ยน เปลี่ยนแค่การจัดวาง

### 4.4 กฎเหล็กของแบบโมดูล

1. **คนนอกโมดูลเข้าได้ทาง `index.ts` เท่านั้น** ห้าม `import ".../modules/laptops/laptop.repository"` ข้ามไป
2. **โมดูลคุยกับโมดูลอื่นผ่าน service** เช่น `rentals` ต้องเช็คว่าเครื่องว่างไหม ให้เรียก `laptopService` ที่ `laptops` เปิดไว้ใน `index.ts` ห้ามแอบเปิด repository ของ `laptops` เอง
3. **ห้ามโมดูลสองตัว import กันเป็นวงกลม** ถ้า `laptops` ใช้ `rentals` และ `rentals` ใช้ `laptops` แปลว่าแบ่งโมดูลผิด ให้ดึงส่วนที่ใช้ร่วมไปไว้ `shared/` หรือรวมเป็นโมดูลเดียว
4. **ของที่ไม่แน่ใจว่าเป็นของใคร อย่ารีบใส่ `shared/`** ปล่อยไว้ในโมดูลที่ใช้ก่อน ยกขึ้นไปเมื่อมีโมดูลที่ 2 ต้องใช้จริง

### 4.5 ข้อดี ข้อเสีย

| ข้อดี | ข้อเสีย |
|---|---|
| แก้หรือลบฟีเจอร์ที่ที่เดียว | ต้องมีวินัย ไม่งั้นโมดูลพันกันจนเป็นก้อนเดียว |
| ทำงานคู่ขนานหลายคนชนกันน้อย | `shared/` ชอบกลายเป็นถังขยะ |
| แยกโมดูลออกเป็นบริการแยกในอนาคตได้ง่าย | มือใหม่ต้องใช้เวลาคุ้นกับกฎ import |

---

## 5. เทียบกันตรงๆ และเลือกยังไง

| | แบ่งตามหน้าที่ (Layered / MVC) | แบ่งตามฟีเจอร์ (Module) |
|---|---|---|
| โครงสร้างระดับบน | `routes/` `services/` `repositories/` | `modules/laptops/` `modules/customers/` |
| หาโค้ดของ "การเช่า" | เปิด 3 โฟลเดอร์ | เปิด `modules/rentals/` โฟลเดอร์เดียว |
| ขนาดงานที่เหมาะ | เล็ก (ไม่เกินประมาณ 3–5 ฟีเจอร์) | กลางถึงใหญ่ |
| เหมาะกับใคร | คนเริ่มต้น ทีมเล็ก | ทีมที่ทำหลายฟีเจอร์พร้อมกัน |
| ความเสี่ยง | โฟลเดอร์รวมบวม | โมดูลพันกัน ถ้าไม่มีวินัย |

**แนวทางของเรา:**
- **เริ่มด้วย Layered** กับงานเล็ก เช่น โปรเจกต์ STARTER ในหนังสือเล่มนี้ใช้โฟลเดอร์ `routes / db / validators / middleware` (บทที่ 14) ซึ่งเป็นแบบแบ่งตามหน้าที่
- **ย้ายมาแบบโมดูล** เมื่อสังเกตว่า "เพิ่มฟีเจอร์ 1 ตัว ต้องแตะไฟล์ใน 3–4 โฟลเดอร์" หรือโฟลเดอร์ใดโฟลเดอร์หนึ่งมีไฟล์เกิน 10 ตัว
- **อย่าสลับครึ่งๆ กลางๆ** ในโปรเจกต์เดียวต้องใช้แบบเดียวกัน ถ้ามีแบบผสม (`modules/` ที่ข้างในแบ่งตามชั้นอยู่แล้ว) ถือว่าเป็นแบบโมดูล

> 🧭 **วิธีย้ายจาก Layered ไปแบบโมดูลทีละก้าว** (ไม่ต้องรื้อทีเดียว)
> 1. สร้าง `modules/laptops/`
> 2. ย้ายสามไฟล์ของ `laptop` เข้าไปด้วย `git mv` (เพื่อให้ Git จำประวัติไฟล์ได้)
> 3. แก้ `import` ให้ถูก แล้วสร้าง `index.ts`
> 4. รัน `bunx tsc --noEmit` และเทสต์ ให้ผ่านก่อนย้ายฟีเจอร์ถัดไป
> 5. ย้ายทีละฟีเจอร์ commit ทีละฟีเจอร์

---

## 6. 🔧 Frontend: แบ่งตามหน้าที่ vs แบ่งตามฟีเจอร์

Frontend เจอปัญหาเดียวกัน และมีสองแบบเหมือนกัน

### 6.1 แบบแบ่งตามหน้าที่ (Layer-based)

```
src/
├── components/
│   ├── laptop-card.tsx
│   ├── rent-form.tsx
│   ├── customer-table.tsx
│   └── button.tsx
├── pages/
│   ├── laptops-page.tsx
│   └── customers-page.tsx
├── hooks/
│   ├── use-laptops.ts
│   └── use-customers.ts
├── api/
│   ├── laptops.ts
│   └── customers.ts
└── types/
```

ข้อดีคือหาง่ายตอนเว็บเล็ก แต่พอมีสิบกว่าฟีเจอร์ `components/` จะมีไฟล์ปนกันเป็นร้อย และไม่รู้ว่าอะไรใช้ร่วมกันได้จริง

### 6.2 แบบแบ่งตามฟีเจอร์ (Feature-based)

```
src/
├── features/
│   ├── laptops/
│   │   ├── components/
│   │   │   ├── laptop-card.tsx
│   │   │   └── rent-form.tsx
│   │   ├── hooks/
│   │   │   └── use-laptops.ts
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── customers/
│       ├── components/
│       │   └── customer-table.tsx
│       ├── api.ts
│       └── index.ts
├── components/            ← ระดับ 1: ใช้ร่วมกันทั้งเว็บ
│   ├── button.tsx
│   ├── input.tsx
│   └── modal.tsx
├── pages/
│   ├── laptops-page.tsx
│   └── customers-page.tsx
├── lib/
│   └── api-client.ts
└── app.tsx
```

![โครงสร้าง component 2 ระดับ](/img/arch-two-level-components.svg)
*ลูกศรคือ "ใช้ / import" ระดับ 2 ใช้ระดับ 1 ได้ แต่ระดับ 1 ห้ามใช้ระดับ 2*

### 6.3 แยก Component เป็น 2 ระดับ

หัวใจของ frontend แบบฟีเจอร์คือ **ถามทุกครั้งที่สร้าง component ว่า "มันรู้จักธุรกิจไหม?"**

| | ระดับ 1: Shared | ระดับ 2: Feature |
|---|---|---|
| อยู่ที่ | `src/components/` | `src/features/ชื่อฟีเจอร์/components/` |
| รู้จักธุรกิจไหม | **ไม่รู้จักเลย** รับทุกอย่างผ่าน props | รู้จักข้อมูลและกฎของฟีเจอร์นั้น |
| ตัวอย่าง | `button`, `input`, `modal`, `spinner`, `table` | `laptop-card`, `rent-form`, `customer-table` |
| ใครใช้ได้ | ทุกฟีเจอร์ ทุกหน้า | ฟีเจอร์ตัวเอง และหน้าที่ประกอบฟีเจอร์นั้น |
| เรียก API เองได้ไหม | ❌ ห้าม | ✅ ได้ (ผ่านไฟล์ `api.ts` ของฟีเจอร์) |

**ตัวอย่างความต่าง**

```tsx
// ระดับ 1: src/components/button.tsx ไม่รู้ว่าปุ่มนี้ทำอะไร
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className="rounded bg-blue-700 px-4 py-2 text-white">
      {label}
    </button>
  );
}
```

```tsx
// ระดับ 2: src/features/laptops/components/rent-form.tsx รู้จักเรื่องการเช่าโน้ตบุ๊ก
import { Button } from "../../../components/button";
import { rentLaptop } from "../api";

export function RentForm({ laptopId }: { laptopId: number }) {
  return <Button label="เช่าเครื่องนี้" onClick={() => rentLaptop(laptopId)} />;
}
```

สังเกตทิศทาง: **`rent-form` (ระดับ 2) ใช้ `button` (ระดับ 1)** แต่ `button` ไม่มีทางรู้จัก `rent-form`

**เมื่อไหร่ต้องยกระดับ 2 ขึ้นเป็นระดับ 1?**
ตอนที่ **ฟีเจอร์ที่สองต้องการใช้ component เดียวกันจริงๆ** และ component นั้นไม่ผูกกับธุรกิจ เช่น `laptop-card` กับ `customer-card` หน้าตาเหมือนกันเกือบหมด ให้สร้าง `card` เป็นระดับ 1 แล้วให้สองฟีเจอร์เอาไปห่อด้วยข้อมูลของตัวเอง

### 6.4 หน้า (pages) ทำหน้าที่ประกอบ

```tsx
// src/pages/laptops-page.tsx แค่ "วาง" ชิ้นส่วนเข้าด้วยกัน
import { LaptopList } from "../features/laptops";
import { PageTitle } from "../components/page-title";

export default function LaptopsPage() {
  return (
    <>
      <PageTitle text="โน้ตบุ๊กให้เช่า" />
      <LaptopList />
    </>
  );
}
```

หน้าไม่ควรมีกฎธุรกิจหรือเรียก API เอง ถ้าหน้ายาวเกิน 50–80 บรรทัด แปลว่ามีของที่ควรย้ายลงไปเป็น component ของฟีเจอร์

### 6.5 กฎ import ของ frontend

| จาก → ไป | ได้ไหม |
|---|---|
| `pages` → `features` | ✅ (ผ่าน `index.ts`) |
| `pages` → `components` (ระดับ 1) | ✅ |
| `features/a` → `components` (ระดับ 1) | ✅ |
| `components` (ระดับ 1) → `features` | ❌ |
| `features/a` → `features/b` | ❌ ถ้าต้องใช้ร่วม ให้ยกขึ้นเป็นระดับ 1 หรือ `lib/` |
| `features` → `pages` | ❌ |

> 🤓 **ตั้งกฎให้เครื่องช่วยเตือนได้:** ESLint มีปลั๊กอินตรวจกฎ import ระหว่างโฟลเดอร์ (เช่น `eslint-plugin-boundaries`) แต่เริ่มต้นการ review ด้วยตาก็พอ

---

## 7. ⚠️ ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| ไม่รู้ว่าไฟล์ใหม่ควรอยู่ตรงไหน | ยังไม่ได้ตอบคำถาม "ของฟีเจอร์ไหน? ใช้ร่วมไหม?" | ถามตามลำดับ: ของฟีเจอร์เดียว → ใส่ในฟีเจอร์ / หลายฟีเจอร์ใช้และไม่มีธุรกิจ → `components/` หรือ `shared/` |
| `shared/` มีไฟล์เป็นร้อย | ใครไม่รู้จะวางไหนก็โยนลงไป | ย้ายกลับเข้าฟีเจอร์ที่ใช้จริง เก็บเฉพาะของที่ ≥ 2 ฟีเจอร์ใช้ |
| `Circular dependency` หรือค่าเป็น `undefined` ตอนรัน | โมดูล A import B และ B import A | ดึงส่วนร่วมไป `shared/` หรือรวมสองโมดูลเป็นหนึ่ง |
| `Cannot find module './Laptop'` เฉพาะบนเซิร์ฟเวอร์ | ชื่อไฟล์ตัวพิมพ์ใหญ่-เล็กไม่ตรงกับตอน import (Linux แยกตัวพิมพ์) | ตั้งชื่อไฟล์ตัวพิมพ์เล็กทั้งหมด และ import ให้ตรงตัวอักษร |
| import ยาว `../../../../components/button` | โฟลเดอร์ซ้อนลึก | ตั้ง path alias ใน `tsconfig.json` (`"paths": { "@/*": ["./src/*"] }`) แล้วเขียน `@/components/button` (Vite ต้องตั้ง alias ให้ตรงกันด้วย) |
| `git` บอกว่าไฟล์หายแล้วเพิ่มใหม่ ประวัติหาย | ย้ายไฟล์ด้วยการลากใน Finder แล้วค่อย add | ใช้ `git mv เดิม ใหม่` แล้วตรวจ `git status` ต้องเห็น `renamed` |
| เปลี่ยนชื่อไฟล์ตัวพิมพ์ใหญ่เป็นเล็กแล้ว Git ไม่เห็น (Mac/Windows) | ระบบไฟล์ไม่แยกตัวพิมพ์ | `git mv Laptop.ts tmp.ts && git mv tmp.ts laptop.ts` |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. Layered กับแบ่งตามฟีเจอร์ ต่างกันที่อะไร?</summary>

Layered **จัดกลุ่มตามหน้าที่** (routes รวมกัน services รวมกัน) ส่วนแบ่งตามฟีเจอร์ **จัดกลุ่มตามเรื่องที่ทำ** (ทุกอย่างของ laptops รวมกัน) โค้ดข้างในเหมือนกัน ต่างที่ตำแหน่งไฟล์
</details>

<details><summary>2. ทำไม service ไม่ควรรู้จัก HTTP?</summary>

เพื่อให้กฎธุรกิจใช้ซ้ำและเทสต์ได้โดยไม่ต้องมี request จริง และเปลี่ยนเฟรมเวิร์กได้โดยไม่ต้องแก้กฎธุรกิจ
</details>

<details><summary>3. ในแบบโมดูล ทำไมต้องมี <code>index.ts</code>?</summary>

เป็น "ประตูหน้าบ้าน" ให้โมดูลบอกชัดว่าเปิดอะไรให้คนนอกใช้ ของที่ไม่ได้ export ผ่านประตูนี้ถือเป็นเรื่องภายใน แก้ภายในได้โดยไม่กระทบคนอื่น
</details>

<details><summary>4. Component ระดับ 1 กับระดับ 2 ต่างกันอย่างไร?</summary>

ระดับ 1 (shared) ไม่รู้จักธุรกิจ รับทุกอย่างผ่าน props ใช้ได้ทุกที่ เช่น `button` ระดับ 2 (feature) รู้จักธุรกิจของฟีเจอร์นั้นและอยู่ในโฟลเดอร์ของฟีเจอร์ เช่น `rent-form`
</details>

<details><summary>5. <code>features/laptops</code> import <code>features/customers</code> ได้ไหม?</summary>

ไม่ได้ ถ้าต้องใช้ร่วมกัน ให้ยกส่วนนั้นขึ้นเป็นระดับ 1 (ถ้าไม่ผูกธุรกิจ) หรือไปไว้ `lib/`
</details>

<details><summary>6. ทำไมชื่อไฟล์ต้องตัวพิมพ์เล็ก?</summary>

Linux ที่ใช้บนเซิร์ฟเวอร์แยกตัวพิมพ์เล็ก-ใหญ่ แต่ Windows/Mac ไม่แยก ชื่อไม่ตรงตัวอักษรจะรันได้บนเครื่องเรา แต่พังตอน deploy
</details>

<details><summary>7. โปรเจกต์ที่มี 3 ฟีเจอร์ ควรเริ่มแบบไหน?</summary>

เริ่มแบบ Layered ก็พอ เพราะเรียบง่ายและเข้าใจเร็ว เมื่อฟีเจอร์เพิ่มและเริ่มต้องแตะหลายโฟลเดอร์ต่อหนึ่งฟีเจอร์ ค่อยย้ายเป็นแบบโมดูลทีละฟีเจอร์
</details>

---

## ✏️ แบบฝึกหัด

1. **สร้างแบบ Layered:** ทำโปรเจกต์ Bun + Hono ใหม่ แล้วสร้าง `laptop` ตามหัวข้อ 3.4 ให้เรียกทั้ง 4 คำขอแล้วได้ผลเหมือนในหนังสือ
2. **ย้ายเป็นแบบโมดูล:** ย้ายเป็น `modules/laptops/` ด้วย `git mv` ตามขั้นตอนหัวข้อ 5 โดยผลลัพธ์ต้องไม่เปลี่ยน
3. **เพิ่มโมดูลที่ 2:** สร้าง `modules/customers/` ที่มี `GET /api/customers` แล้วตั้งใจลอง import repository ของ `laptops` ข้ามโมดูลดู แล้วแก้ให้ผ่านประตู `index.ts` แทน
4. **วิเคราะห์โครงสร้าง:** เปิดโค้ดของ starter ที่ทำในบทที่ 11–15 แล้ววาดแผนผังว่าตอนนี้เป็นแบบไหน ไฟล์ไหนควรเป็น component ระดับ 1 และไฟล์ไหนเป็นระดับ 2
5. **จัด frontend ใหม่:** แตก `src/components/` ของโปรเจกต์ React ให้เป็น `features/` + `components/` (ระดับ 1) แล้วตรวจว่าระดับ 1 ไม่ import อะไรจาก `features/` เลย

---

## ✅ ผ่านด่าน

- [ ] อธิบายความต่างของแบบ Layered (MVC) กับแบบโมดูลได้ พร้อมข้อดีข้อเสียของแต่ละแบบ
- [ ] บอกได้ว่า routes, services, repositories ทำหน้าที่อะไรและห้ามทำอะไร
- [ ] ย้ายฟีเจอร์จาก Layered เป็นโมดูลได้ และผลลัพธ์ของ API ไม่เปลี่ยน
- [ ] แยก component เป็นระดับ 1 และระดับ 2 ได้ และรู้กฎทิศทางการ import
- [ ] ตั้งชื่อโฟลเดอร์และไฟล์เป็นภาษาอังกฤษตัวพิมพ์เล็กทั้งโปรเจกต์ และอธิบายเหตุผลได้
- [ ] รู้ว่าเมื่อไหร่ควรย้ายจากแบบหนึ่งไปอีกแบบ

---

[← บทที่ 16: ทำงานคู่กับ AI](./16-ai-pairing.md) · [🏠 สารบัญ](/) · [บทที่ 17: เน็ตเวิร์กพื้นฐาน →](./17-network.md)
