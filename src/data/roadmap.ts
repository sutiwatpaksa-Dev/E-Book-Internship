// ลำดับการเรียนบนหน้าแรก (แผนที่ของเราเอง จัดลำดับโดยอิง roadmap.sh/full-stack แต่ไม่ได้คัดลอกแผนภาพ)
// เพิ่มบทใหม่: ใส่ที่นี่ และใน content/docs/meta.json (ลำดับใน sidebar)
export type RoadmapItem = {
  num: string;
  title: string;
  link: string;
  outcome: string;
  time: string;
  // บทเสริม: อ่านเมื่ออยากรู้ลึก ไม่นับในความคืบหน้า
  extra?: boolean;
};

export type RoadmapLevel = { title: string; goal: string; items: RoadmapItem[] };

export const roadmap: RoadmapLevel[] = [
  {
    title: "ด่าน 1 · เตรียมตัว",
    goal: "เครื่องพร้อม เก็บงานเป็น รันของใน container ได้",
    items: [
      { num: "00", title: "ก่อนเริ่ม", link: "/00-start", outcome: "ติดตั้งเครื่องมือครบ ใช้ Terminal เบื้องต้นได้", time: "2-3 ชม." },
      { num: "01", title: "Git", link: "/01-git", outcome: "บันทึกงาน แตก branch แก้ conflict ส่งงานแบบทีมได้", time: "5-6 ชม." },
      { num: "02", title: "Docker vs VM", link: "/02-docker", outcome: "รันโปรแกรม/ฐานข้อมูลใน container ได้เอง", time: "5 ชม." },
    ],
  },
  {
    title: "ด่าน 2 · ภาษาและ API",
    goal: "เขียน TypeScript และคุยกันผ่าน HTTP เป็น",
    items: [
      { num: "03", title: "Runtime & Package Manager", link: "/03-node-yarn-bun", outcome: "แยกตัวรันกับตัวจัดการ library ได้ เลือกเครื่องมือเป็น", time: "4 ชม." },
      { num: "เสริม", title: "JavaScript พื้นฐาน", link: "/js-basics", outcome: "อ่านและเขียน JS พื้นฐานได้ก่อนเริ่ม TypeScript", time: "30–60 นาที", extra: true },
      { num: "04", title: "ภาษาและระบบ Type", link: "/04-typescript", outcome: "เขียน TypeScript เป็น แยกตรวจ type ก่อนรันกับตรวจข้อมูลตอนรัน", time: "6 ชม." },
      { num: "05", title: "HTTP & รูปแบบ API", link: "/05-http-api", outcome: "เข้าใจ HTTP เลือกรูปแบบ API เป็น สร้าง REST API และแพ็กใส่ Docker ได้", time: "6 ชม." },
    ],
  },
  {
    title: "ด่าน 3 · ข้อมูล",
    goal: "เก็บข้อมูลให้ถูกที่ และต่อจากโค้ดได้",
    items: [
      { num: "06", title: "ประเภทฐานข้อมูล", link: "/06-sql-nosql", outcome: "แยกประเภทฐานข้อมูลได้ เขียน SQL พื้นฐาน เข้าใจ transaction", time: "5 ชม." },
      { num: "07", title: "ระบบจัดการฐานข้อมูล (DBMS)", link: "/07-mysql-postgres", outcome: "เลือก engine ที่ที่รัน และเครื่องมือต่อฐานข้อมูลเป็น ดูแล user และ backup ได้", time: "4 ชม." },
      { num: "08", title: "ORM, Query Builder & Migration", link: "/08-orm", outcome: "เลือกระดับตัวคุยกับฐานข้อมูลเป็น ใช้ Drizzle และ migration ได้", time: "6 ชม." },
      { num: "08b", title: "จากแบบฐานข้อมูลสู่ Backend", link: "/08b-db-to-backend", outcome: "เปลี่ยนผังตารางเป็น API ที่กฎครบ แบ่งชั้นโค้ดเป็น", time: "4 ชม." },
      { num: "08c", title: "เก็บรูปภาพคู่กับฐานข้อมูล", link: "/08c-image-storage", outcome: "เพิ่ม เปลี่ยน ลบรูปผ่าน object storage อย่างปลอดภัย ลำดับงานไม่ทิ้งรูปแตก", time: "4-5 ชม." },
      { num: "08d", title: "รูปภาพ ภาคต่อ: ที่เก็บแบบอื่นและฟีเจอร์ร้านจริง", link: "/08d-image-storage-more", outcome: "วัดผลจริงว่า bytea / ดิสก์ / base64 ต่างจาก object storage แค่ไหน แล้วเพิ่มหลายรูป เรียงลำดับ ถังขยะกู้คืนได้ ตัวแทนรูป กันรูปซ้ำ และสำรอง/กู้คืน DB คู่กับ bucket", time: "5-6 ชม." },
    ],
  },
  {
    title: "ด่าน 4 · มืออาชีพ",
    goal: "หาบั๊กเองเป็นระบบ และไม่เปิดช่องโหว่",
    items: [
      { num: "09", title: "Debugging", link: "/09-debugging", outcome: "หาบั๊กเองเป็นระบบ ใช้ debugger ได้", time: "3 ชม." },
      { num: "เสริม", title: "เรียนรู้ด้วยตัวเอง", link: "/self-learning", outcome: "หาคำตอบเองจาก error เอกสาร และการค้น ก่อนถามพี่เลี้ยง", time: "2 ชม.", extra: true },
      { num: "10", title: "Security พื้นฐาน", link: "/10-security", outcome: "เก็บรหัสผ่าน/ความลับถูกวิธี รู้จักช่องโหว่ที่เจอบ่อย", time: "4 ชม." },
    ],
  },
  {
    title: "ด่าน 5 · สร้างเว็บ Fullstack",
    goal: "หน้าบ้าน หลังบ้าน และ login ครบในโปรเจกต์เดียว",
    items: [
      { num: "11", title: "สร้างหน้าเว็บด้วย React", link: "/11-react", outcome: "สร้างหน้าเว็บจากชิ้นส่วนเล็กๆ ดึงข้อมูล ทำฟอร์ม", time: "4 ชม." },
      { num: "เสริม", title: "ภาษาและคำสั่งที่ใช้เขียน React", link: "/react-language", outcome: "อ่านโค้ด React ออกทีละบรรทัด", time: "–", extra: true },
      { num: "12", title: "ตกแต่งเว็บทุกขนาดจอ (Tailwind)", link: "/12-tailwind", outcome: "แต่งเว็บตามสีร้าน ใช้ได้ทุกขนาดจอ", time: "3 ชม." },
      { num: "13", title: "หลายหน้า + Google หาเจอ", link: "/13-router-seo", outcome: "หลายหน้า, หน้า 404, เลือกหมวด, การ์ดตอนแชร์", time: "3 ชม." },
      { num: "14", title: "สร้าง API (Bun + Hono)", link: "/14-hono-api", outcome: "API จริงที่ต่อฐานข้อมูล ตามงาน STARTER", time: "5 ชม." },
      { num: "15", title: "ระบบ login หน้าจัดการร้าน", link: "/15-auth", outcome: "login ของเจ้าของร้านที่ปลอดภัย", time: "4 ชม." },
      { num: "16", title: "ทำงานคู่กับ AI", link: "/16-ai-pairing", outcome: "คุยกับ AI ให้ได้ระบบครบ และเข้าใจทุกบรรทัด", time: "5 ชม." },
      { num: "เสริม", title: "จัดโครงสร้างโปรเจกต์", link: "/project-structure", outcome: "วางโฟลเดอร์แบบแบ่งตามหน้าที่และตามฟีเจอร์", time: "–", extra: true },
    ],
  },
  {
    title: "ด่าน 6 · Mini Project",
    goal: "ส่งมอบงานแบบลูกค้าจริง (ต้อง login)",
    items: [
      { num: "🏪", title: "เว็บไซต์ STARTER", link: "/starter", outcome: "เว็บไซต์ธุรกิจ Fullstack หน้าบ้าน + หลังบ้าน + DB", time: "10 วันทำงาน" },
    ],
  },
  {
    title: "ด่าน 7 · ขึ้นเว็บจริง",
    goal: "เว็บออนไลน์บนโดเมนจริง และดูแลต่อได้",
    items: [
      { num: "17", title: "เน็ตเวิร์กพื้นฐาน", link: "/17-network", outcome: "เปิดเว็บ 1 ครั้งเกิดอะไรขึ้น และพังตรงไหนได้บ้าง", time: "3 ชม." },
      { num: "18", title: "ชื่อเว็บ (Domain & DNS)", link: "/18-domain-dns", outcome: "จดชื่อเว็บ แล้วชี้มาที่เครื่องของเรา", time: "2 ชม." },
      { num: "19", title: "เช่าเครื่อง (VPS) + SSH", link: "/19-server", outcome: "เช่าเครื่องและตั้งค่าให้ปลอดภัย", time: "3 ชม." },
      { num: "20", title: "ขึ้นเว็บบนเครื่องเช่า", link: "/20-deploy-vps", outcome: "ขึ้นเว็บจริงพร้อม https ด้วย Docker + Caddy", time: "4 ชม." },
      { num: "21", title: "ตรวจและขึ้นระบบอัตโนมัติ", link: "/21-cicd", outcome: "รวมงานเมื่อไหร่ เครื่องตรวจและขึ้นเว็บให้เอง", time: "3 ชม." },
      { num: "22", title: "บริการสำเร็จรูป (Vercel)", link: "/22-deploy-managed", outcome: "ขึ้นเว็บโดยไม่ต้องดูแลเครื่องเอง", time: "2 ชม." },
      { num: "23", title: "เปิดใช้จริง + ดูแลระบบ", link: "/23-go-live", outcome: "สำรองข้อมูล, เฝ้าเว็บ, รับมือเว็บล่ม, ส่งมอบลูกค้า", time: "3 ชม." },
    ],
  },
];

// บทที่นับในความคืบหน้า (ไม่รวมบทเสริม) ใช้ร่วมกันทั้งหน้าแรก, sidebar และปุ่ม "ผ่านบทนี้แล้ว"
export const requiredLinks = roadmap.flatMap((l) => l.items.filter((i) => !i.extra).map((i) => i.link));
export const extraLinks = roadmap.flatMap((l) => l.items.filter((i) => i.extra).map((i) => i.link));
