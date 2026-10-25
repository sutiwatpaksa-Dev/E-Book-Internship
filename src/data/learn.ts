// โครงคู่มือแบบใหม่ (ทดลอง): 7 ขั้นของการทำซอฟต์แวร์ + การ์ดความรู้ที่แขวนไว้ใต้ขั้นที่ได้ใช้
// เนื้อหาอยู่ที่ content/docs/learn/ · ไฟล์นี้เป็นที่เดียวที่บอกลำดับ ชื่อ และเวลาอ่าน
// แผนที่ (/learn), sidebar ของส่วนนี้, หัวการ์ด และรายการลิงก์ที่ API ยอมให้ติ๊กผ่าน ดึงจากที่นี่ทั้งหมด

export const LEARN_BASE = "/learn";

export type StepSlug = "problem" | "design" | "coding" | "testing" | "documentation" | "deploy" | "maintenance";

export type LearnStep = {
  slug: StepSlug;
  num: number;
  name: string;
  // คำไทยกำกับ ("ออกแบบ")
  th: string;
  // ผลงานที่ได้เมื่อจบขั้น (บรรทัดเดียว)
  output: string;
  // ช่วงย่อยในขั้น เรียงตามลำดับทำ (ขั้น Coding เรียงตามวันในงาน STARTER: เตรียมเครื่อง → DB → API → Login → Frontend → หลังบ้าน)
  parts?: string[];
  // โจทย์ STARTER ของขั้นนี้แบบย่อ (หน้าวันนี้แสดง ตัวเต็มอยู่ในหน้าขั้น ส่วน "ลงมือกับโปรเจกต์ของเรา")
  task: string;
};

export type LearnCard = {
  slug: string;
  title: string;
  step: StepSlug;
  part?: string;
  minutes: number;
  // ขั้นอื่นที่ใช้การ์ดนี้ด้วย (การ์ดมีหน้าเดียว แต่บอกว่าใช้ที่ไหนบ้าง)
  alsoIn?: StepSlug[];
  // การ์ดที่ควรอ่านก่อน (slug) · แสดงเป็นลิงก์บนหัวการ์ด · ต้องอยู่ก่อนการ์ดนี้ในรายการเสมอ (มีเทสต์ตรวจ)
  needs?: string[];
  // ใช้ในงาน STARTER วันไหน ตามหัวข้อ "ควรศึกษาก่อน" ใน Requirement (หน้า 15–16)
  starter?: string;
};

// บทเดิมที่ยังไม่ได้แปลงเป็นการ์ด แสดงในขั้นที่เกี่ยวข้องพร้อมป้าย "บทเดิม" จนกว่าจะแปลงเสร็จ
export type LegacyLink = { step: StepSlug; part?: string; title: string; link: string };

export const steps: LearnStep[] = [
  { slug: "problem", num: 1, name: "Problem", th: "เข้าใจปัญหา", output: "รายการความต้องการ (user story) และขอบเขตงาน", task: "เขียน user story ของ STARTER อย่างน้อย 8 ข้อ จัดลำดับ ต้องมี / ควรมี / ไว้ทีหลัง" },
  { slug: "design", num: 2, name: "Design", th: "ออกแบบ", output: "ภาพร่างหน้าจอ แบบตาราง และรายการ API", task: "วาดหน้าจอหลักทุกหน้า แล้วไล่ทีละช่องว่าต้องเก็บข้อมูลอะไร จดเป็นตารางและรายการ API" },
  { slug: "coding", num: 3, name: "Coding", th: "เขียนโค้ด", output: "ระบบที่รันได้ในเครื่อง", parts: ["เตรียมเครื่อง", "DB", "API", "Login", "Frontend", "หลังบ้าน"], task: "เปลี่ยนแบบตารางเป็น schema แล้วสร้างด้วย migration จากนั้นทำ Backend ทีละ story ที่ต้องมี" },
  { slug: "testing", num: 4, name: "Testing", th: "ทดสอบ", output: "เทสต์ที่รันซ้ำได้ และเช็กลิสต์ทดสอบด้วยมือ", task: "เขียนเช็กลิสต์ทดสอบจาก story ที่ต้องมี แล้วให้เพื่อนทำตามเช็กลิสต์ของเรา" },
  { slug: "documentation", num: 5, name: "Documentation", th: "เขียนเอกสาร", output: "README, .env.example และเอกสาร API", task: "เขียน README แล้วให้เพื่อน clone ไปรันโดยดูแค่ README จดทุกจุดที่เพื่อนติด" },
  { slug: "deploy", num: 6, name: "Deploy", th: "ขึ้นระบบจริง", output: "เว็บที่เปิดได้จาก URL จริง", task: "ขึ้น STARTER ด้วยบริการสำเร็จรูป แล้วไล่เช็กลิสต์จากขั้น 4 บนเว็บจริงทุกข้อ" },
  { slug: "maintenance", num: 7, name: "Maintenance", th: "ดูแลระบบ", output: "แผนดูแล: log, backup, อัปเดต และ feedback", task: "ตั้ง backup ฐานข้อมูล แล้วลองกู้คืนลงฐานใหม่จริง 1 ครั้ง" },
];

export const cards: LearnCard[] = [
  { slug: "postgres", title: "Postgres และที่ที่มันรัน", step: "coding", part: "DB", minutes: 10, alsoIn: ["deploy"], starter: "วันที่ 1–2 · เปิดฐานข้อมูล + ต่อ pgAdmin" },
  { slug: "sql-basics", title: "SQL ที่ใช้บ่อย", step: "coding", part: "DB", minutes: 12, alsoIn: ["design"], needs: ["postgres"], starter: "วันที่ 2 · primary key / foreign key" },
  { slug: "orm-query-builder", title: "ORM กับ Query Builder", step: "coding", part: "DB", minutes: 8, needs: ["sql-basics"], starter: "วันที่ 2 · แนวคิด ORM (ต่อจาก Prisma ในงาน Todo)" },
  { slug: "drizzle-orm", title: "Drizzle ORM", step: "coding", part: "DB", minutes: 15, needs: ["orm-query-builder"], starter: "วันที่ 2 · Drizzle schema + ต่อฐานข้อมูล" },
  { slug: "migration", title: "Migration และ Seed", step: "coding", part: "DB", minutes: 10, alsoIn: ["deploy"], needs: ["drizzle-orm"], starter: "วันที่ 2 · migration + seed script" },
  { slug: "http-rest", title: "HTTP และ REST", step: "coding", part: "API", minutes: 10, alsoIn: ["design"], starter: "วันที่ 3 · REST, method, status code, รูปแบบคำตอบ" },
  { slug: "hono", title: "Hono", step: "coding", part: "API", minutes: 12, needs: ["http-rest"], starter: "วันที่ 3 · Public API" },
  { slug: "validation", title: "ตรวจข้อมูลขาเข้าด้วย Zod", step: "coding", part: "API", minutes: 8, needs: ["hono"], starter: "วันที่ 3 · Zod ทุก endpoint" },
  { slug: "layers", title: "แบ่งชั้น routes · services · repositories", step: "coding", part: "API", minutes: 10, needs: ["validation", "drizzle-orm"], starter: "วันที่ 3–4 · โค้ดใน server/src ที่โตขึ้น" },
  { slug: "error-handling", title: "จัดการ error ที่จุดเดียว", step: "coding", part: "API", minutes: 8, needs: ["layers"], starter: "วันที่ 3 รูปแบบ error · วันที่ 9 ไม่หลุด stack trace" },
  { slug: "api-testing", title: "ยิงทดสอบ API", step: "coding", part: "API", minutes: 8, alsoIn: ["testing"], needs: ["hono"], starter: "วันที่ 3 · ทดสอบทุก endpoint + ส่ง collection" },
  { slug: "password-hash", title: "เก็บรหัสผ่านด้วย hash", step: "coding", part: "Login", minutes: 8, needs: ["migration"], starter: "วันที่ 4 · ทำไมต้อง hash password (ตาราง admins + seed ทำวันที่ 2)" },
  { slug: "jwt-cookie", title: "Login: JWT ใน httpOnly cookie", step: "coding", part: "Login", minutes: 15, needs: ["password-hash", "error-handling"], starter: "วันที่ 4 · JWT, httpOnly cookie ต่างจาก localStorage, login/logout" },
  { slug: "auth-middleware", title: "Middleware กัน API หลังบ้าน", step: "coding", part: "Login", minutes: 10, needs: ["jwt-cookie"], starter: "วันที่ 4 · middleware เช็ก token ทุก /api/admin/* (ไม่ login ได้ 401)" },
  { slug: "react-components", title: "React: Component และ Props", step: "coding", part: "Frontend", minutes: 12, starter: "วันที่ 6 · React component พื้นฐาน" },
  { slug: "tailwind", title: "Tailwind และออกแบบมือถือก่อน", step: "coding", part: "Frontend", minutes: 10, alsoIn: ["design"], needs: ["react-components"], starter: "วันที่ 6 · Tailwind theme + responsive 375/768/1280" },
  { slug: "react-state", title: "React: State และ useEffect", step: "coding", part: "Frontend", minutes: 10, needs: ["react-components"], starter: "วันที่ 6–8 · ข้อมูลที่เปลี่ยนบนหน้าจอ" },
  { slug: "fetch-data", title: "หน้าเว็บดึงข้อมูลจาก API", step: "coding", part: "Frontend", minutes: 10, needs: ["react-state", "hono"], starter: "วันที่ 6 · ดึงจาก API + loading/error ทุกหน้า" },
  { slug: "react-forms", title: "ฟอร์ม: กรอก ตรวจ ส่ง", step: "coding", part: "Frontend", minutes: 10, needs: ["fetch-data", "validation"], starter: "วันที่ 7 · Contact form" },
  { slug: "router-seo", title: "หลายหน้า (React Router) และ SEO", step: "coding", part: "Frontend", minutes: 12, needs: ["fetch-data"], starter: "วันที่ 6 หลายหน้า + 404 · วันที่ 9 SEO" },
  { slug: "protected-routes", title: "หน้าหลังบ้านที่ต้อง login", step: "coding", part: "หลังบ้าน", minutes: 12, needs: ["router-seo", "react-forms", "auth-middleware"], starter: "วันที่ 8 · /admin/login, เด้งกลับเมื่อไม่ login, logout" },
  { slug: "crud-ui", title: "หน้าจัดการข้อมูล: ตาราง ค้นหา แบ่งหน้า เพิ่ม แก้ ลบ", step: "coding", part: "หลังบ้าน", minutes: 15, needs: ["protected-routes"], starter: "วันที่ 8 · CRUD UI (list/add/edit/delete) + state ของฟอร์มและตาราง" },
];

export const legacy: LegacyLink[] = [
  { step: "problem", title: "Requirement งาน STARTER (ต้อง login)", link: "/starter" },
  { step: "design", title: "ประเภทฐานข้อมูลและการออกแบบตาราง", link: "/06-sql-nosql" },
  { step: "coding", part: "เตรียมเครื่อง", title: "ก่อนเริ่ม: ติดตั้งเครื่องมือ + Terminal", link: "/00-start" },
  { step: "coding", part: "เตรียมเครื่อง", title: "Git", link: "/01-git" },
  { step: "coding", part: "เตรียมเครื่อง", title: "Docker", link: "/02-docker" },
  { step: "coding", part: "เตรียมเครื่อง", title: "Runtime & Package Manager (Bun)", link: "/03-node-yarn-bun" },
  { step: "coding", part: "เตรียมเครื่อง", title: "TypeScript", link: "/04-typescript" },
  { step: "coding", part: "เตรียมเครื่อง", title: "จัดโครงสร้างโปรเจกต์ (client / server)", link: "/project-structure" },
  { step: "coding", part: "DB", title: "เก็บรูปภาพคู่กับฐานข้อมูล", link: "/08c-image-storage" },
  { step: "testing", title: "Debugging", link: "/09-debugging" },
  { step: "deploy", title: "เน็ตเวิร์กพื้นฐาน", link: "/17-network" },
  { step: "deploy", title: "Domain และ DNS", link: "/18-domain-dns" },
  { step: "deploy", title: "บริการสำเร็จรูป (Vercel + Neon)", link: "/22-deploy-managed" },
  { step: "deploy", title: "เช่าเครื่อง VPS", link: "/19-server" },
  { step: "deploy", title: "CI/CD", link: "/21-cicd" },
  { step: "maintenance", title: "เปิดใช้จริง ดูแลระบบ ส่งมอบ", link: "/23-go-live" },
  { step: "maintenance", title: "Security พื้นฐาน", link: "/10-security" },
];

export const stepUrl = (s: StepSlug) => `${LEARN_BASE}/${s}`;
export const cardUrl = (slug: string) => `${LEARN_BASE}/cards/${slug}`;

export const stepBySlug = (s: StepSlug) => steps.find((x) => x.slug === s)!;
export const cardByUrl = (url: string) => cards.find((c) => cardUrl(c.slug) === url) ?? null;
export const cardsOf = (s: StepSlug) => cards.filter((c) => c.step === s);
export const legacyOf = (s: StepSlug) => legacy.filter((l) => l.step === s);

// ลิงก์การ์ดทั้งหมด: ปุ่ม "เข้าใจแล้ว" บันทึกเป็นลิงก์เหล่านี้ (API รับเฉพาะที่อยู่ในรายการ)
export const learnLinks = cards.map((c) => cardUrl(c.slug));

// หน้านี้อยู่ขั้นไหน: /learn/coding → coding, /learn/cards/migration → ขั้นของการ์ดนั้น
export function stepOfUrl(url: string): StepSlug | null {
  const card = cardByUrl(url);
  if (card) return card.step;
  const step = steps.find((s) => stepUrl(s.slug) === url);
  return step?.slug ?? null;
}

// สิ่งที่ควรทำต่อ: การ์ดแรกที่ยังไม่เข้าใจ (ตามลำดับขั้น) · ยังไม่เริ่มเลย = ขั้น 1 · ครบแล้ว card = null
// แผนที่ (/learn) และหน้าวันนี้ (/today) ใช้ตัวเดียวกัน ปุ่ม "ทำต่อ" จึงพาไปที่เดียวกันเสมอ
export function nextUp(done: ReadonlySet<string>) {
  const started = cards.some((c) => done.has(cardUrl(c.slug)));
  const card = cards.find((c) => !done.has(cardUrl(c.slug))) ?? null;
  return { started, card, step: started && card ? stepBySlug(card.step) : steps[0] };
}

// การ์ดก่อน/ถัดไปในขั้นเดียวกัน (สุดทางแล้วพากลับหน้าขั้น)
export function neighbors(card: LearnCard) {
  const list = cardsOf(card.step);
  const i = list.indexOf(card);
  return { prev: i > 0 ? list[i - 1] : null, next: list[i + 1] ?? null };
}
