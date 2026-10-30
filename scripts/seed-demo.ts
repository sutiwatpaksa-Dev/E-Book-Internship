// ข้อมูลตัวอย่างสำหรับดูหน้าตาเว็บในเครื่อง (หลังบ้านทุกแท็บ + หน้าของน้อง) ห้ามใช้กับฐานจริง
// ใช้: bun --env-file=.env scripts/seed-demo.ts          ใส่ข้อมูลตัวอย่าง (ลบชุดเก่าก่อนทุกครั้ง)
//      bun --env-file=.env scripts/seed-demo.ts --clean  ลบข้อมูลตัวอย่างทั้งหมด
// ทุกบัญชีขึ้นต้นด้วย demo. และทุกรุ่นขึ้นต้นด้วย DEMO ลบทั้งชุดได้โดยไม่แตะข้อมูลอื่น
import { eq, inArray, like, or } from "drizzle-orm";
import { learnLinks } from "../src/data/learn";
import { db } from "../server/db/client";
import {
  announcements,
  assignments,
  auditLogs,
  cardOverrides,
  cohortAssignments,
  cohortMentors,
  cohorts,
  mentorCards,
  notifications,
  pageNotes,
  progress,
  submissions,
  threadMessages,
  threads,
  users,
} from "../server/db/schema";

// กันพลาดรันใส่ฐานจริง: รับเฉพาะฐานในเครื่อง
const host = new URL(process.env.DATABASE_URL ?? "").hostname;
if (!["localhost", "127.0.0.1"].includes(host)) {
  console.error(`ไม่รัน: DATABASE_URL ชี้ไปที่ ${host} (สคริปต์นี้ใช้กับฐานในเครื่องเท่านั้น)`);
  process.exit(1);
}

const PASSWORD = "demo-password-123";
const now = Date.now();
const ago = (hours: number) => new Date(now - hours * 3600_000);
const day = (offset: number) => new Date(now + offset * 86400_000).toISOString().slice(0, 10);

async function clean() {
  const demo = await db.select({ id: users.id }).from(users).where(like(users.username, "demo.%"));
  const ids = demo.map((u) => u.id);
  if (ids.length) {
    const own = await db.select({ id: threads.id }).from(threads).where(inArray(threads.createdBy, ids));
    if (own.length) await db.delete(threads).where(inArray(threads.id, own.map((t) => t.id)));
    await db.delete(threadMessages).where(inArray(threadMessages.authorId, ids));
    await db.delete(submissions).where(or(inArray(submissions.userId, ids), inArray(submissions.reviewedBy, ids)));
    await db.delete(mentorCards).where(inArray(mentorCards.authorId, ids));
    await db.delete(pageNotes).where(inArray(pageNotes.authorId, ids));
    await db.delete(announcements).where(inArray(announcements.authorId, ids));
    await db.delete(cardOverrides).where(inArray(cardOverrides.updatedBy, ids));
    await db.delete(auditLogs).where(inArray(auditLogs.actorId, ids));
  }
  await db.delete(cohorts).where(like(cohorts.name, "DEMO%"));
  if (ids.length) await db.delete(users).where(inArray(users.id, ids));
  return ids.length;
}

if (process.argv.includes("--clean")) {
  console.log(`ลบข้อมูลตัวอย่างแล้ว (${await clean()} บัญชี)`);
  process.exit(0);
}
await clean();

const hash = await Bun.password.hash(PASSWORD);
const [starter] = await db.select().from(assignments).where(eq(assignments.slug, "starter"));
if (!starter) throw new Error("ไม่มีโจทย์ starter (ต้อง migrate ถึง 0015 ก่อน)");

// รุ่น: กำลังฝึก · จบแล้ว · ยังไม่เริ่ม (เปิดรับสมัคร)
const [running, ended, upcoming] = await db
  .insert(cohorts)
  .values([
    { name: "DEMO 3/2569 ร้านค้า", startsOn: day(-12), endsOn: day(18) },
    { name: "DEMO 2/2569", startsOn: day(-80), endsOn: day(-40), endedAt: ago(24 * 38) },
    { name: "DEMO 4/2570", startsOn: day(30), endsOn: day(70), signupOpen: true, signupUntil: day(25), seatLimit: 12 },
  ])
  .returning({ id: cohorts.id });
await db.insert(cohortAssignments).values([running, ended, upcoming].map((c) => ({ cohortId: c.id, assignmentId: starter.id })));

// พี่เลี้ยง 2 คน
const mentorRows = await db
  .insert(users)
  .values([
    { username: "demo.boss", role: "dev", secretHash: hash, secretKind: "password", fullName: "ธนากร ใจดี", nickname: "บอส", jobTitle: "Senior Developer", expertise: "Backend, PostgreSQL", email: "boss@example.com", lineId: "boss.dev", lastLoginAt: ago(1) },
    { username: "demo.fon", role: "dev", secretHash: hash, secretKind: "password", fullName: "ฝนทิพย์ แสงทอง", nickname: "ฝน", jobTitle: "Frontend Lead", expertise: "React, UX", email: "fon@example.com", lastLoginAt: ago(20) },
  ])
  .returning({ id: users.id });
const [boss, fon] = mentorRows.map((m) => m.id);
await db.insert(cohortMentors).values([
  { cohortId: running.id, userId: boss },
  { cohortId: running.id, userId: fon },
  { cohortId: ended.id, userId: boss },
]);

// น้อง: ความคืบหน้าต่างกัน (share = สัดส่วนการ์ดที่ติ๊กแล้ว) · มีคนติด PIN, คนถูกล็อก, คนขอรีเซ็ต
type Intern = { username: string; fullName: string; nickname: string; school: string; major: string; edu: "bachelor" | "pvs" | "pvc"; share: number; login: number | null; cohort: number; extra?: Partial<typeof users.$inferInsert> };
const internSpec: Intern[] = [
  { username: "demo.mint", fullName: "มินตรา ศรีสุข", nickname: "มิ้นท์", school: "มหาวิทยาลัยสงขลานครินทร์", major: "วิศวกรรมคอมพิวเตอร์", edu: "bachelor", share: 0.85, login: 0.5, cohort: running.id },
  { username: "demo.ton", fullName: "ธนวัฒน์ แก้วมณี", nickname: "ต้น", school: "มหาวิทยาลัยทักษิณ", major: "วิทยาการคอมพิวเตอร์", edu: "bachelor", share: 0.6, login: 3, cohort: running.id },
  { username: "demo.ploy", fullName: "พลอยไพลิน ทองดี", nickname: "พลอย", school: "วิทยาลัยเทคนิคหาดใหญ่", major: "เทคโนโลยีสารสนเทศ", edu: "pvs", share: 0.45, login: 8, cohort: running.id },
  { username: "demo.arm", fullName: "อาทิตย์ บุญมา", nickname: "อาร์ม", school: "มหาวิทยาลัยราชภัฏสงขลา", major: "เทคโนโลยีสารสนเทศ", edu: "bachelor", share: 0.3, login: 26, cohort: running.id },
  { username: "demo.nan", fullName: "นันทนา พรหมแก้ว", nickname: "แนน", school: "วิทยาลัยเทคนิคหาดใหญ่", major: "คอมพิวเตอร์ธุรกิจ", edu: "pvs", share: 0.15, login: 70, cohort: running.id, extra: { failedCount: 5, lockedUntil: new Date(now + 10 * 60_000) } },
  { username: "demo.bank", fullName: "ธนาคาร ศักดิ์ดี", nickname: "แบงก์", school: "มหาวิทยาลัยสงขลานครินทร์", major: "วิศวกรรมคอมพิวเตอร์", edu: "bachelor", share: 0.05, login: 100, cohort: running.id, extra: { resetRequestedAt: ago(2) } },
  { username: "demo.fah", fullName: "ฟ้าใส ใจงาม", nickname: "ฟ้า", school: "วิทยาลัยอาชีวศึกษาสงขลา", major: "เทคโนโลยีสารสนเทศ", edu: "pvc", share: 0, login: null, cohort: running.id, extra: { secretKind: "pin" } },
  { username: "demo.golf", fullName: "กอล์ฟ สมบูรณ์", nickname: "กอล์ฟ", school: "มหาวิทยาลัยทักษิณ", major: "วิทยาการคอมพิวเตอร์", edu: "bachelor", share: 1, login: 24 * 40, cohort: ended.id },
  { username: "demo.aom", fullName: "ออมสิน รักเรียน", nickname: "ออม", school: "มหาวิทยาลัยราชภัฏสงขลา", major: "วิทยาการคอมพิวเตอร์", edu: "bachelor", share: 0.9, login: 24 * 41, cohort: ended.id },
];
const internRows = await db
  .insert(users)
  .values(
    internSpec.map((i) => ({
      username: i.username,
      role: "intern" as const,
      secretHash: hash,
      secretKind: "password" as const,
      fullName: i.fullName,
      nickname: i.nickname,
      schoolType: i.edu === "bachelor" ? ("university" as const) : ("vocational" as const),
      schoolName: i.school,
      major: i.major,
      eduLevel: i.edu,
      cohortId: i.cohort,
      lastLoginAt: i.login === null ? null : ago(i.login),
      createdAt: ago(24 * 13),
      ...i.extra,
    })),
  )
  .returning({ id: users.id, username: users.username });
const id = (u: string) => internRows.find((r) => r.username === `demo.${u}`)!.id;

// ความคืบหน้า: ติ๊กการ์ดตามลำดับในเส้นทาง กระจายเวลาย้อนหลัง
const cardLinks = [...learnLinks];
await db.insert(progress).values(
  internSpec.flatMap((i) => {
    const n = Math.round(cardLinks.length * i.share);
    return cardLinks.slice(0, n).map((link, k) => ({ userId: id(i.username.slice(5)), link, doneAt: ago(24 * 12 - (k * 24 * 11) / Math.max(n, 1)) }));
  }),
);

// แชท: คำถาม (รอตอบ / ตอบแล้ว / ปิด) + คำขอเนื้อหา (ทุกสถานะ)
type Msg = [who: number, body: string, hoursAgo: number];
async function thread(by: number, kind: "question" | "content_request", subject: string, status: string, pageUrl: string | null, msgs: Msg[], devRead = true) {
  const last = msgs[msgs.length - 1];
  const role = last[0] === boss || last[0] === fon ? "dev" : "intern";
  const [t] = await db
    .insert(threads)
    .values({ createdBy: by, kind, subject, status: status as never, pageUrl, lastMessageAt: ago(last[2]), lastAuthorRole: role, createdAt: ago(msgs[0][2]), internReadAt: ago(last[2] - 0.1), devReadAt: devRead ? ago(last[2] - 0.1) : null })
    .returning({ id: threads.id });
  await db.insert(threadMessages).values(msgs.map(([authorId, body, h]) => ({ threadId: t.id, authorId, body, createdAt: ago(h) })));
}
await thread(id("ton"), "question", "migrate แล้วขึ้น relation already exists", "waiting", "/learn/cards/migration", [[id("ton"), "รัน `bun run db:migrate` รอบสองแล้วขึ้น error ว่า relation \"categories\" already exists ครับ ลบตารางเองใน pgAdmin ได้ไหม", 1.5]], false);
await thread(id("ploy"), "question", "cookie ไม่ติดไปกับ fetch ตอนเรียก /api/admin", "waiting", "/learn/cards/jwt-cookie", [[id("ploy"), "login ผ่านแล้ว แต่เรียก /api/admin/services ได้ 401 ตลอด ดูใน DevTools แล้ว cookie มีค่ะ", 5], [fon, "ใน fetch ใส่ credentials: \"include\" หรือยัง และหน้าเว็บกับ API อยู่คนละพอร์ตไหม", 4], [id("ploy"), "ใส่แล้วค่ะ อยู่คนละพอร์ต 5173 กับ 3000", 3]], false);
await thread(id("mint"), "question", "Zod ตรวจเบอร์โทรที่มีขีดยังไง", "answered", "/learn/cards/validation", [[id("mint"), "อยากให้กรอก 081-234-5678 ได้ แต่เก็บเป็นตัวเลขล้วน ควรทำตรงไหนคะ", 30], [boss, "ใช้ .transform() ตัดขีดออกก่อน แล้วค่อย .regex() ตรวจ 9–10 หลัก ดูตัวอย่างในการ์ด Validation หัวข้อ \"ทริค\" ข้อ 2", 28]]);
await thread(id("arm"), "question", "Docker เปิดไม่ขึ้นบน Windows", "closed", "/02-docker", [[id("arm"), "เปิด Docker Desktop แล้วค้างที่ Starting", 72], [boss, "เปิด WSL 2 ใน Windows Features แล้วรีสตาร์ตเครื่อง", 70], [id("arm"), "ได้แล้วครับ ขอบคุณครับ", 69]]);
await thread(id("mint"), "content_request", "อยากได้ตัวอย่าง upload รูปขึ้น server", "new", null, [[id("mint"), "งานเสริมมีอัปโหลดรูป อยากได้การ์ดที่สอนรับไฟล์ด้วย Hono แล้วเก็บไว้ที่ไหนดีค่ะ", 6]], false);
await thread(id("ton"), "content_request", "เพิ่มตัวอย่าง pagination ฝั่ง API", "accepted", null, [[id("ton"), "การ์ดหน้าจัดการข้อมูลมีแบ่งหน้าฝั่งหน้าเว็บ แต่ API ยังไม่มีตัวอย่าง limit/offset", 50], [boss, "รับเรื่องแล้ว จะเพิ่มในการ์ด SQL พื้นฐาน", 48]]);
await thread(id("ploy"), "content_request", "อธิบาย CORS เป็นภาษาง่ายๆ", "in_progress", null, [[id("ploy"), "อ่านบทเดิมแล้วยังงงว่าทำไม browser บล็อกค่ะ", 90], [fon, "กำลังเขียนการ์ดใหม่ใช้ตัวอย่างร้านอาหาร", 40]]);
await thread(id("golf"), "content_request", "สรุปคำสั่ง Git ที่ใช้บ่อย 1 หน้า", "done", null, [[id("golf"), "อยากได้ cheat sheet", 24 * 50], [boss, "เพิ่มไว้ท้ายบทที่ 1 แล้ว", 24 * 45]]);
await thread(id("arm"), "content_request", "สอน Next.js แทน React Router", "declined", null, [[id("arm"), "อยากใช้ Next.js ทำงานครับ", 100], [boss, "โจทย์กำหนด Vite + React Router ไว้ เพื่อให้เห็นแยกหน้าเว็บกับ API ชัด รอบนี้ยังไม่ทำ", 98]]);

// งานที่ส่ง: ลิงก์ repo วันที่ 1 + ครบทุกสถานะ (รอตรวจ, ให้แก้, ผ่าน, ส่งซ้ำ, ส่งเป็น commit) · fah ยังไม่ส่งลิงก์ (ขึ้นในรายการ "ยังไม่ส่ง")
const sub = (u: string, round: string, ref: string, note: string, h: number, verdict?: "pass" | "revise", review?: string, by = boss) => ({
  userId: id(u),
  assignmentId: starter.id,
  round,
  repoUrl: `https://github.com/${u}-demo/starter`,
  ref,
  note,
  createdAt: ago(h),
  verdict: verdict ?? null,
  review: review ?? null,
  reviewedBy: verdict ? by : null,
  reviewedAt: verdict ? ago(h - 2) : null,
});
await db.insert(submissions).values([
  ...["mint", "ton", "ploy", "arm", "golf"].map((u) => sub(u, "start", "HEAD", "", u === "golf" ? 24 * 68 : 24 * 9)),
  sub("bank", "start", "HEAD", "", 20),
  sub("mint", "review-1", "review-1", "ตาราง 6 ตาราง + API หน้าบ้านครบ", 24 * 7, "pass", "ตารางดีมาก foreign key ครบ"),
  sub("mint", "review-2", "review-2", "ทั้งระบบเสร็จ ขอให้ดูหน้า admin/services บนมือถือเป็นพิเศษ", 3),
  sub("ton", "review-1", "review-1", "", 24 * 6, "revise", "POST /api/contact ยังไม่ตรวจด้วย Zod (ส่งเบอร์ 20 หลักแล้วผ่าน) และ README ขาดวิธีรัน seed"),
  sub("ton", "review-1", "review-1-fix1", "แก้ Zod ที่ฟอร์มติดต่อ + เพิ่มขั้น seed ใน README แล้วครับ", 24 * 5, "pass", "ทดสอบเบอร์ผิดแล้วได้ 400 ถูกต้อง"),
  sub("ploy", "review-1", "review-1", "ยังไม่ได้ทำ rate limit ค่ะ", 24 * 6, "revise", "เรียก /api/admin/services ตอนไม่ได้ login ยังได้ 200 (ข้อนี้ตกทันที) ใส่ middleware ให้กลุ่ม /api/admin ทั้งกลุ่ม", fon),
  sub("ploy", "review-1", "a1b2c3d", "ลืมปัก tag เลยส่งเป็น commit ค่ะ ใส่ middleware แล้ว", 5),
  sub("arm", "review-1", "review-1", "", 26),
  sub("golf", "review-1", "review-1", "", 24 * 60, "pass"),
  sub("golf", "review-2", "review-2", "", 24 * 56, "pass"),
  sub("golf", "final", "final", "พร้อมนำเสนอครับ", 24 * 55, "pass", "นำเสนอดีมาก ตอบคำถามเรื่อง JWT ได้ชัด"),
]);

// การ์ดของพี่เลี้ยง: เผยแพร่ 2 ใบ + ร่าง 1 ใบ
await db.insert(mentorCards).values([
  { slug: "demo-git-daily", title: "Git ทุกวันแบบไม่หลง", step: "coding", topic: "ops", minutes: 8, body: "## ความหมาย\n\nพูดง่ายๆ คือ push งานขึ้น GitHub ทุกเย็น\n\n## ลองเอง\n\nปัก tag `review-1` แล้วส่งในหน้าส่งงาน", status: "published", authorId: boss, publishedAt: ago(48), createdAt: ago(60), updatedAt: ago(48) },
  { slug: "demo-cors", title: "CORS เข้าใจใน 10 นาที", step: "coding", topic: "api", minutes: 10, needs: ["hono"], body: "## ความหมาย\n\nพูดง่ายๆ คือ browser ถามเจ้าของ API ก่อนว่าให้หน้าเว็บนี้เรียกไหม", status: "draft", authorId: fon, createdAt: ago(40), updatedAt: ago(10) },
  { slug: "demo-demo-day", title: "เตรียมนำเสนอ 15 นาที", step: "documentation", topic: "plan", minutes: 6, body: "## ความหมาย\n\nเล่าเรื่องธุรกิจ → โชว์หน้าเว็บ → แก้ข้อมูลหลังบ้านให้ดู → ตอบคำถามโค้ด", status: "published", authorId: fon, publishedAt: ago(24 * 5), createdAt: ago(24 * 6), updatedAt: ago(24 * 5) },
]);

// โน้ตท้ายหน้า: 2 ใบที่น้องเห็น + 1 ใบซ่อน
await db.insert(pageNotes).values([
  { pageUrl: "/learn/cards/migration", body: "รุ่นนี้หลายคนเจอ relation already exists ให้ดูว่ารัน migrate กับฐานเดียวกันสองรอบหรือเปล่า ก่อนลบตารางเอง", authorId: boss, createdAt: ago(20), updatedAt: ago(20) },
  { pageUrl: "/starter/submission", body: "ส่ง review-1 ภายใน 17:00 วันที่ 5 นะครับ พี่จะตรวจเช้าวันที่ 6", authorId: boss, createdAt: ago(30), updatedAt: ago(30) },
  { pageUrl: "/learn/cards/jwt-cookie", body: "(ร่าง) เพิ่มรูป DevTools แท็บ Application", visible: false, authorId: fon, createdAt: ago(5), updatedAt: ago(5) },
]);

// การ์ดในระบบ: ปรับเวลาอ่าน 1 ใบ (ใบที่มีคนปรับไว้แล้วไม่ทับ)
await db.insert(cardOverrides).values({ slug: "vercel-deployment", minutes: 15, updatedBy: fon, updatedAt: ago(12) }).onConflictDoNothing();

// ประกาศ: ใช้อยู่ 2 (น้อง, ทุกคน) + จบแล้ว 1
await db.insert(announcements).values([
  { body: "พรุ่งนี้ (วันที่ 5) ส่ง review-1 ในหน้าส่งงานก่อน 17:00 พี่ตรวจเช้าวันที่ 6", audience: "intern", authorId: boss, startsAt: ago(6), endsAt: new Date(now + 30 * 3600_000), createdAt: ago(6) },
  { body: "ศุกร์นี้ประชุมรวม 15:00 ห้องประชุมใหญ่", audience: "all", authorId: fon, startsAt: ago(24), endsAt: new Date(now + 3 * 86400_000), createdAt: ago(24) },
  { body: "เซิร์ฟเวอร์ปิดปรับปรุง 22:00–23:00", audience: "all", authorId: boss, startsAt: ago(24 * 4), endsAt: ago(24 * 3), createdAt: ago(24 * 4) },
]);

// แจ้งเตือนของน้องตัวอย่าง (เห็นที่กระดิ่งเมื่อ login เป็น demo.ton)
await db.insert(notifications).values([
  { userId: id("ton"), kind: "submission_review", title: "ผลตรวจรอบ 1 (review-1-fix1): ผ่านรอบนี้", link: "/starter/submission#-ส่งงานของคุณ", createdAt: ago(24 * 5 - 2) },
  { userId: id("ton"), kind: "dev_reply", title: "พี่เลี้ยงตอบแล้ว: เพิ่มตัวอย่าง pagination ฝั่ง API", link: "/questions", createdAt: ago(48) },
  { userId: id("ton"), kind: "announcement", title: "ประกาศ: พรุ่งนี้ (วันที่ 5) ส่ง review-1", link: "/today", createdAt: ago(6) },
]);

// บันทึกการกระทำ
await db.insert(auditLogs).values([
  { actorId: boss, action: "cohort.create", target: "DEMO 3/2569 ร้านค้า", createdAt: ago(24 * 14) },
  { actorId: boss, action: "user.create", target: "demo.mint", detail: "intern", createdAt: ago(24 * 13) },
  { actorId: fon, action: "user.reset_pin", target: "demo.fah", createdAt: ago(24 * 2) },
  { actorId: boss, action: "card.publish", target: "Git ทุกวันแบบไม่หลง", createdAt: ago(48) },
  { actorId: boss, action: "submission.review", target: "demo.ton", detail: "ตรวจรอบ 1 review-1-fix1 · ผ่านรอบนี้", createdAt: ago(24 * 5 - 2) },
  { actorId: fon, action: "announcement.create", target: "ศุกร์นี้ประชุมรวม 15:00", createdAt: ago(24) },
]);

console.log(`ใส่ข้อมูลตัวอย่างแล้ว: 3 รุ่น · พี่เลี้ยง 2 · น้อง ${internSpec.length} · ทุกบัญชีรหัส ${PASSWORD}
  พี่เลี้ยง: demo.boss, demo.fon → /dev/admin
  น้อง: demo.mint (เกือบจบ), demo.ton (ส่งงานแก้แล้วผ่าน), demo.ploy (รอตรวจ), demo.fah (ยังถือ PIN), demo.golf (รุ่นที่จบแล้ว)
  ลบทั้งชุด: bun --env-file=.env scripts/seed-demo.ts --clean`);
process.exit(0);
