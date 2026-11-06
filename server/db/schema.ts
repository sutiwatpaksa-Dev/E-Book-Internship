import { type AnyPgColumn, boolean, customType, date, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { CommentKind, CommentTemplate, Criterion, Scores } from "../../src/lib/rubric";
import type { PostKind, Requirement } from "../../src/lib/post";
import { DEFAULT_ROUNDS, type RoundDef, type TaskLink } from "../../src/lib/submission";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const ROLES = ["intern", "dev"] as const;
export type Role = (typeof ROLES)[number];

// การศึกษาของน้อง: รองรับทั้งมหาวิทยาลัยและวิทยาลัย/อาชีวะ (ปวช. ปวส.) · ป้ายภาษาไทยอยู่ที่ src/lib/education.ts
export const SCHOOL_TYPES = ["university", "vocational", "other"] as const;
export type SchoolType = (typeof SCHOOL_TYPES)[number];
export const EDU_LEVELS = ["pvc", "pvs", "bachelor", "other"] as const;
export type EduLevel = (typeof EDU_LEVELS)[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  // เก็บแค่ hash (argon2id) ไม่เก็บ PIN จริง
  secretHash: text("secret_hash").notNull(),
  // pin = รหัสชั่วคราว 6 หลักที่พี่เลี้ยงออกให้ (login แล้วต้องตั้งรหัสผ่านก่อนใช้งาน) · password = ตั้งเองแล้ว 10 ตัวขึ้นไป
  secretKind: text("secret_kind").$type<"pin" | "password">().notNull().default("pin"),
  role: text("role").$type<Role>().notNull(),
  // Super admin = พี่เลี้ยงที่จัดการบัญชีพี่เลี้ยงคนอื่นได้ (สร้าง เลื่อน ปิด ออก PIN) · มีผลเฉพาะ role dev
  // เป็นธงแยก ไม่ใช่ role ที่ 3: ที่อื่น (แชท ประกาศ หน้าเว็บ) ยังเห็นเป็น dev เหมือนเดิม ไม่ต้องรื้อ
  // ตั้งได้จาก Terminal เท่านั้น (scripts/set-super-admin.ts) บัญชีพี่เลี้ยงที่หลุดจึงตั้งตัวเองไม่ได้
  superAdmin: boolean("super_admin").notNull().default(false),
  disabled: boolean("disabled").notNull().default(false),
  // เลขรอบของบัตรผ่าน: เปลี่ยนรหัสผ่านหรือออก PIN ใหม่ = +1 บัตรที่ออกก่อนหน้า (ทุกเครื่อง) ใช้ไม่ได้ทันที
  sessionVersion: integer("session_version").notNull().default(0),
  // ลืมรหัสผ่าน: เวลาที่เจ้าของบัญชีกดขอ (หลังบ้านขึ้นเป็นงานให้พี่เลี้ยง) · ออก PIN ให้แล้วล้างเป็น null
  resetRequestedAt: timestamp("reset_requested_at", { withTimezone: true }),
  // PIN ที่ออกใหม่ (ลืมรหัสผ่าน) ใช้ได้ถึงเวลานี้ · null = ไม่หมดอายุ (PIN แรกตอนสร้างบัญชี)
  pinExpiresAt: timestamp("pin_expires_at", { withTimezone: true }),
  // โปรไฟล์ที่เจ้าของบัญชีกรอกเอง · ว่างได้ทั้งหมด (บัญชีเก่ายังไม่ได้กรอก)
  // น้อง: การศึกษา (ไม่เก็บเบอร์โทร) · พี่เลี้ยง: schoolName/major = จบจากที่ไหน
  fullName: text("full_name"),
  nickname: text("nickname"),
  schoolType: text("school_type").$type<SchoolType>(),
  schoolName: text("school_name"),
  major: text("major"),
  eduLevel: text("edu_level").$type<EduLevel>(),
  // ของพี่เลี้ยงเท่านั้น: น้องในรุ่นที่พี่ดูแลเห็น ใช้กรอกเอกสารฝึกงาน (ชื่อ ตำแหน่ง เบอร์ของผู้ดูแล)
  jobTitle: text("job_title"),
  phone: text("phone"),
  email: text("email"),
  expertise: text("expertise"),
  lineId: text("line_id"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  failedCount: integer("failed_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  // หน้าเว็บที่เปิดอยู่ส่งสัญญาณมาทุก ~1 นาที: ใช้โชว์ "ออนไลน์" ให้พี่เลี้ยง (ไม่ใช่เวลา login)
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // รุ่นที่น้องอยู่ · ว่าง = พี่เลี้ยง หรือบัญชีที่สร้างก่อนมีระบบรุ่น ("ไม่มีรุ่น") · ลบรุ่นแล้วบัญชียังอยู่
  cohortId: integer("cohort_id").references((): AnyPgColumn => cohorts.id, { onDelete: "set null" }),
});

// สายงาน (IT, Content Creator, ...): แม่แบบที่รุ่นคัดลอกไปตอนสร้าง · แก้แม่แบบแล้วรุ่นเดิมไม่เปลี่ยน
// template_version เพิ่มทุกครั้งที่บันทึกแม่แบบ รุ่นจำไว้ว่าเริ่มจากฉบับไหน (cohorts.track_template_version)
export type TrackKpi = { work: number; attendance: number; engagement: number; passPercent: number };
export type SubmitKind = "repo" | "link" | "file";
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  // ขั้นของแผนที่การเรียน (slug เรียงตามลำดับ) · ล็อกชื่อขั้นเมื่อสายมีรุ่นแล้ว (บังคับที่ API)
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  submitKinds: jsonb("submit_kinds").$type<SubmitKind[]>().notNull().default(["link"]),
  criteria: jsonb("criteria").$type<Criterion[]>().notNull().default([]),
  kpi: jsonb("kpi").$type<TrackKpi>().notNull().default({ work: 70, attendance: 20, engagement: 10, passPercent: 60 }),
  templateVersion: integer("template_version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// รุ่นฝึกงาน: ช่วงเวลาที่น้องกลุ่มหนึ่งฝึกพร้อมกัน ใช้กรองภาพรวม แชท และประกาศในหลังบ้าน
// วันเริ่ม/จบเป็น date (ไม่มีเวลา) เพราะนับเป็นวันทำงาน · สถานะคิดจากวันที่ + ended_at ไม่เก็บซ้ำ
export const cohorts = pgTable("cohorts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // 1 รุ่น = 1 สาย · รุ่นเก่าทั้งหมดเป็นสาย IT (migration 0023)
  trackId: integer("track_id")
    .notNull()
    .references((): AnyPgColumn => tracks.id, { onDelete: "restrict" }),
  trackTemplateVersion: integer("track_template_version").notNull().default(1),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on").notNull(),
  // พี่เลี้ยงกด "จบรุ่น" แล้ว: น้องยังอ่านคู่มือได้ แต่เปิดเรื่องถามใหม่ไม่ได้ · กดเปิดรุ่นกลับได้ (ล้างค่า)
  endedAt: timestamp("ended_at", { withTimezone: true }),
  // สมัครเองด้วยรหัสรุ่น: เก็บแค่ hash ของรหัส (พี่เลี้ยงเห็นรหัสครั้งเดียวตอนสร้าง) · unique = หารุ่นจากรหัสได้ทันที
  inviteHash: text("invite_hash").unique(),
  signupOpen: boolean("signup_open").notNull().default(false),
  // วันสุดท้ายที่รับสมัคร (รวมวันนั้น) · null = ไม่กำหนด
  signupUntil: date("signup_until"),
  // รับได้กี่คน (นับน้องที่อยู่ในรุ่นทั้งหมด) · null = ไม่จำกัด
  seatLimit: integer("seat_limit"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// พี่เลี้ยงประจำรุ่น (หลายคนต่อรุ่น, คนเดียวดูหลายรุ่นได้) · พี่เลี้ยงทุกคนยังเห็นทุกรุ่น ตารางนี้ใช้บอกว่าใครรับผิดชอบ
export const cohortMentors = pgTable(
  "cohort_mentors",
  {
    cohortId: integer("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cohortId, t.userId] })],
);

// หัวข้อในเอกสารโจทย์กับเลขหน้า PDF · key ใช้ในลิงก์ของคู่มือ (?sec=api) โจทย์แต่ละชิ้นจึงเรียงหน้าต่างกันได้
export type AssignmentSection = { key: string; label: string; page: number };

// ข้อมูลการตรวจของโจทย์ที่พี่เลี้ยงแก้เองจากหลังบ้าน (เฟส 1: รอบส่ง) · ค่าเริ่มต้นคือแผน 10 วันของ STARTER
// criteria/templates ไม่มี = ยังไม่ตั้ง (โจทย์เก่าทำงานเหมือนเดิม ไม่มีช่องให้คะแนน)
export type AssignmentRubric = { rounds: RoundDef[]; criteria?: Criterion[]; templates?: CommentTemplate[] };

// โจทย์ฝึกงาน (เช่น STARTER) · โครงงาน 10 วัน เกณฑ์ และ stack เหมือนกันทุกโจทย์ ต่างกันที่ระบบทำให้ใคร
// เก็บใน DB ไม่ใช่ MDX เพราะ repo นี้เปิดสาธารณะ โจทย์ของรุ่นถัดไปต้องไม่หลุดก่อนรุ่นเริ่ม
// โจทย์เป็นของรุ่นเดียว (migration 0023): แก้โจทย์รุ่นนี้ไม่กระทบรุ่นอื่น · slug ซ้ำได้ข้ามรุ่น (น้องเปิด /projects/starter ระบบหาจากรุ่นของน้อง)
export const assignments = pgTable(
  "assignments",
  {
  id: serial("id").primaryKey(),
  cohortId: integer("cohort_id")
    .notNull()
    .references((): AnyPgColumn => cohorts.id, { onDelete: "restrict" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  brief: text("brief").notNull().default(""),
  // แถวในตาราง files ที่เก็บ PDF ของโจทย์นี้ (STARTER ใช้ key เดิม "starter-requirement" ไฟล์บนเว็บจริงจึงไม่ต้องย้าย)
  // ไม่ unique: สำเนาของรุ่นใหม่ใช้ไฟล์เดิมร่วมกันจนกว่ารุ่นนั้นจะอัปโหลดไฟล์ของตัวเอง
  pdfKey: text("pdf_key").notNull(),
  sections: jsonb("sections").$type<AssignmentSection[]>().notNull().default([]),
  rubric: jsonb("rubric").$type<AssignmentRubric>().notNull().default({ rounds: DEFAULT_ROUNDS }),
  // ภาพรวมโจทย์ใหญ่ (Markdown) แทนหน้า MDX ใน repo · ว่าง = ยังไม่ได้เขียน
  overview: text("overview").notNull().default(""),
  // เก็บโจทย์แล้ว: ไม่ให้เลือกใช้กับรุ่นใหม่ แต่งานและคะแนนเดิมยังเปิดดูได้
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("assignments_cohort_slug_uq").on(t.cohortId, t.slug)],
);

// โจทย์ของแต่ละรุ่น: รุ่นหนึ่งเพิ่มได้หลายชิ้นจนกว่าจะจบรุ่น · ลบโจทย์ที่ยังมีรุ่นใช้อยู่ไม่ได้ (restrict)
export const cohortAssignments = pgTable(
  "cohort_assignments",
  {
    cohortId: integer("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    assignmentId: integer("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "restrict" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.cohortId, t.assignmentId] })],
);

// การ์ดความรู้ที่โจทย์นี้ใช้ + โน้ต "การ์ดนี้ใช้ตอนไหนของโจทย์นี้" (พี่เลี้ยงผูกเองในหลังบ้าน)
// card_slug = slug ใน src/data/learn.ts (ตรวจตอนบันทึก ไม่มี FK เพราะการ์ดอยู่ในไฟล์ ไม่ใช่ตาราง)
// STARTER ที่ยังไม่มีแถวใช้ข้อความ starter ใน learn.ts เป็นค่าสำรอง
export const assignmentCards = pgTable(
  "assignment_cards",
  {
    assignmentId: integer("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    cardSlug: text("card_slug").notNull(),
    note: text("note").notNull().default(""),
  },
  (t) => [primaryKey({ columns: [t.assignmentId, t.cardSlug] }), index("assignment_cards_card_idx").on(t.cardSlug)],
);

// การส่งงาน: โค้ดอยู่บน GitHub ของน้อง ที่นี่เก็บแค่ลิงก์ repo + tag/commit ที่ส่ง (ไม่เก็บไฟล์)
// ส่งซ้ำ = แถวใหม่ (ประวัติไม่หาย พี่เลี้ยงเทียบรอบก่อนได้) · หน้าเว็บโชว์แถวล่าสุดของแต่ละรอบ
// round = review-1 | review-2 | final · verdict = pass | revise (กฎอยู่ใน src/lib/submission.ts)
export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignmentId: integer("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "restrict" }),
    round: text("round").notNull(),
    repoUrl: text("repo_url").notNull(),
    ref: text("ref").notNull(),
    deployUrl: text("deploy_url"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // ผลตรวจ: ว่าง = รอพี่เลี้ยงตรวจ
    verdict: text("verdict"),
    review: text("review"),
    reviewedBy: integer("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    // คะแนนรายข้อ ณ ตอนตรวจ (สำเนาชื่อและคะแนนเต็ม) · ว่าง = ตรวจแบบไม่ให้คะแนน หรือเป็นงานเก่า
    scores: jsonb("scores").$type<Scores>(),
  },
  (t) => [index("submissions_user_idx").on(t.userId, t.createdAt), index("submissions_waiting_idx").on(t.reviewedAt)],
);

// ความเห็นใต้งานของน้อง 1 คน: เห็นได้เฉพาะน้องคนนั้นกับพี่เลี้ยง (ไม่ใช่ทั้งรุ่น)
// task = "<slug โจทย์>/<รหัสรอบ>" หรือ "post/<id>" · kind = ความเห็นงาน / commit / แนะนำการ์ด / เนื้อหาเพิ่มเติม · ref = tag หรือ commit ที่พูดถึง
export const taskComments = pgTable(
  "task_comments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    task: text("task").notNull(),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<CommentKind>().notNull().default("review"),
    ref: text("ref"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("task_comments_task_idx").on(t.userId, t.task, t.createdAt)],
);

// นับครั้งที่ login ผิดต่อ IP เก็บใน DB เพราะบน Vercel แต่ละคำขออาจวิ่งไปคนละเครื่อง ตัวนับในหน่วยความจำจึงใช้ไม่ได้
export const ipFailures = pgTable("ip_failures", {
  ip: text("ip").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

// ไฟล์ที่ต้อง login ก่อนดู (เช่น Requirement PDF) เก็บใน DB แทน public/ เพราะ repo นี้เปิดสาธารณะ
export const files = pgTable("files", {
  key: text("key").primaryKey(),
  data: bytea("data").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// เรื่องที่น้องคุยกับพี่เลี้ยง: ถามเรื่องที่ติด หรือขอเนื้อหาเพิ่ม (เช่น "อยากได้บท Python")
// เห็นกันแค่เจ้าของเรื่องกับพี่เลี้ยง น้องคนอื่นไม่เห็น
// feedback = น้องบอกว่าการฝึกงานเป็นยังไง (ส่งได้แม้รุ่นจบแล้ว) · ใช้สถานะแบบขอเนื้อหา พี่เลี้ยงเลื่อนเองว่าจะทำอะไรต่อ
// mentor_message = พี่เลี้ยงเริ่มเรื่องหาน้อง (น้องยังเป็นเจ้าของเรื่อง ตอบกลับได้) · ใช้สถานะแบบคำถาม
export const THREAD_KINDS = ["question", "content_request", "feedback", "mentor_message"] as const;
// ประเภทที่น้องเปิดเองได้ (mentor_message เปิดได้เฉพาะฝั่งพี่เลี้ยง)
export const INTERN_THREAD_KINDS = ["question", "content_request", "feedback"] as const;
export type ThreadKind = (typeof THREAD_KINDS)[number];
// คำถาม: ระบบเปลี่ยนเองตามว่าใครพิมพ์ล่าสุด (รอตอบ ↔ ตอบแล้ว) พี่เลี้ยงปิดเรื่องได้
// ขอเนื้อหา: พี่เลี้ยงเลื่อนเองทีละขั้น ไม่ทำต้องบอกเหตุผล
export const QUESTION_STATUSES = ["waiting", "answered", "closed"] as const;
export const REQUEST_STATUSES = ["new", "accepted", "in_progress", "done", "declined"] as const;
export type ThreadStatus = (typeof QUESTION_STATUSES)[number] | (typeof REQUEST_STATUSES)[number];

export const threads = pgTable(
  "threads",
  {
    id: serial("id").primaryKey(),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
    kind: text("kind").$type<ThreadKind>().notNull(),
    subject: text("subject").notNull(),
    // หน้าที่น้องกดถาม (เช่น /08b-db-to-backend) พี่เลี้ยงเปิดไปดูบริบทได้ · ขอเนื้อหาไม่ต้องมี
    pageUrl: text("page_url"),
    status: text("status").$type<ThreadStatus>().notNull(),
    // เก็บซ้ำจากข้อความล่าสุด หน้ารายการจะได้เรียงและบอก "ยังไม่อ่าน" โดยไม่ต้อง join ข้อความทุกแถว
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    lastAuthorRole: text("last_author_role").$type<Role>().notNull(),
    // อ่านล่าสุดเมื่อไร แยกฝั่งน้องกับฝั่งพี่เลี้ยง (พี่เลี้ยงทุกคนใช้ค่าร่วมกัน)
    internReadAt: timestamp("intern_read_at", { withTimezone: true }),
    devReadAt: timestamp("dev_read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("threads_created_by_idx").on(t.createdBy)],
);

export const threadMessages = pgTable(
  "thread_messages",
  {
    id: serial("id").primaryKey(),
    threadId: integer("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    // true = ระบบบันทึกเอง (เช่น "เปลี่ยนสถานะเป็น กำลังทำ") แสดงเป็นบรรทัดกลางแชท ไม่ใช่ฟองข้อความ
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("thread_messages_thread_idx").on(t.threadId, t.createdAt)],
);

// บทที่น้องติ๊ก "ผ่านแล้ว" เก็บกับบัญชี (เดิมอยู่ในเบราว์เซอร์อย่างเดียว พี่เลี้ยงจึงไม่เห็น และเปลี่ยนเครื่องแล้วหาย)
// คีย์คู่ (user, link): บทเดียวกันติ๊กซ้ำได้แค่แถวเดียว ยกเลิกติ๊ก = ลบแถว
export const progress = pgTable(
  "progress",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    link: text("link").notNull(),
    doneAt: timestamp("done_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.link] })],
);

// บันทึกว่าพี่เลี้ยงคนไหนทำอะไรกับระบบเมื่อไร (ออก PIN, ปิดบัญชี, อัปโหลดไฟล์ ...) ไว้ย้อนดูเวลามีปัญหา
// เพิ่มอย่างเดียว ไม่มีหน้าแก้หรือลบ บันทึกที่แก้ได้ก็เชื่อไม่ได้
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    actorId: integer("actor_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(),
    // ชื่อสิ่งที่ถูกกระทำ เก็บเป็นข้อความ (เช่น username ตอนนั้น) บัญชีเปลี่ยนชื่อหรือถูกลบภายหลังก็ยังอ่านรู้เรื่อง
    target: text("target").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)],
);

// ---- เนื้อหาที่พี่เลี้ยงเพิ่มเองจากหลังบ้าน (v2.2) ----
// การ์ดในโค้ด (src/data/learn.ts + MDX) เป็นของถาวรที่ผ่านการตรวจแล้ว ส่วนนี้เป็นของที่พี่เลี้ยงเติมได้ทันทีโดยไม่ต้อง deploy
// เก็บเป็น Markdown ไม่รับ HTML (หน้าเว็บแปลงด้วย micromark ซึ่งไม่ยอมให้ HTML ดิบผ่าน)

export const CARD_STATUSES = ["draft", "published"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export const mentorCards = pgTable(
  "mentor_cards",
  {
    id: serial("id").primaryKey(),
    // ส่วนท้าย URL: /learn/cards/m/<slug> · แยก path จากการ์ดในโค้ด ชื่อจึงชนกันไม่ได้
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    // ขั้นและหมวดเก็บเป็นข้อความ ตรวจกับรายการใน src/data/learn.ts ตอนรับข้อมูล (Zod) เพิ่มขั้นใหม่จะไม่ต้องแก้ตาราง
    step: text("step").notNull(),
    topic: text("topic").notNull(),
    minutes: integer("minutes").notNull().default(10),
    // การ์ดที่ควรอ่านก่อน: slug การ์ดในโค้ด หรือ "m/<slug>" ของการ์ดพี่เลี้ยง
    needs: text("needs").array().notNull().default([]),
    body: text("body").notNull().default(""),
    status: text("status").$type<CardStatus>().notNull().default("draft"),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    updatedBy: integer("updated_by").references(() => users.id),
    // เผยแพร่ครั้งแรกเมื่อไร (ใช้แจ้งเตือนน้องครั้งเดียว ไม่เด้งซ้ำทุกครั้งที่แก้)
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("mentor_cards_status_idx").on(t.status)],
);

// โน้ตของพี่เลี้ยงท้ายหน้าที่มีอยู่แล้ว (การ์ดหรือบทเดิม) โดยไม่แก้ไฟล์ MDX
export const pageNotes = pgTable(
  "page_notes",
  {
    id: serial("id").primaryKey(),
    pageUrl: text("page_url").notNull(),
    body: text("body").notNull(),
    visible: boolean("visible").notNull().default(true),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("page_notes_page_idx").on(t.pageUrl)],
);

export const AUDIENCES = ["intern", "dev", "all"] as const;
export type Audience = (typeof AUDIENCES)[number];

// ประกาศบนหน้าวันนี้ เช่น "Review รอบ 2 วันศุกร์ 14:00" · หมดเวลาแล้วหายเอง ไม่ต้องตามลบ
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  body: text("body").notNull(),
  audience: text("audience").$type<Audience>().notNull().default("intern"),
  // ว่าง = ทุกรุ่น · ใส่รุ่น = เห็นเฉพาะน้องในรุ่นนั้น
  cohortId: integer("cohort_id").references(() => cohorts.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  // ว่าง = แสดงจนกว่าพี่เลี้ยงจะกดปิด (ปิด = ตั้งเวลาจบเป็นตอนนี้ ประวัติยังอยู่)
  endsAt: timestamp("ends_at", { withTimezone: true }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// โพสต์ในฟีด (งาน / ประกาศ / แหล่งเรียนรู้) · กฎอยู่ใน src/lib/post.ts
// งานที่ผูกโจทย์ใหญ่ (assignment_id) = งานย่อยของโจทย์ กำหนดส่งเป็นวันทำงานที่ N ของรุ่น (due_day)
// โพสต์อื่นใช้วันที่จริง (due_at) · เห็นได้เฉพาะรุ่นใน post_cohorts หรือ all_cohorts (ไม่มีค่าเริ่มที่ทำให้หลุดไปรุ่นอื่น)
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").$type<PostKind>().notNull(),
    assignmentId: integer("assignment_id").references(() => assignments.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    links: jsonb("links").$type<TaskLink[]>().notNull().default([]),
    allCohorts: boolean("all_cohorts").notNull().default(false),
    dueDay: integer("due_day"),
    dueAt: date("due_at"),
    // ช่องที่น้องต้องส่ง (ใช้ในเฟส B)
    requires: jsonb("requires").$type<Requirement[]>().notNull().default([]),
    pinned: boolean("pinned").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [index("posts_created_idx").on(t.createdAt), index("posts_assignment_idx").on(t.assignmentId)],
);

export const postCohorts = pgTable(
  "post_cohorts",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    cohortId: integer("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.cohortId] }), index("post_cohorts_cohort_idx").on(t.cohortId)],
);

// "รับทราบ" คนละครั้งต่อโพสต์ · กดซ้ำ = ยกเลิก (ลบแถว)
export const postAcks = pgTable(
  "post_acks",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ackedAt: timestamp("acked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

// ปรับการ์ดในโค้ดโดยไม่แก้ไฟล์: ซ่อนจากรายการ หรือเปลี่ยนชื่อ/เวลาอ่าน/หมวดที่แสดง · ไม่มีแถว = ใช้ค่าในโค้ด
export const cardOverrides = pgTable("card_overrides", {
  slug: text("slug").primaryKey(),
  hidden: boolean("hidden").notNull().default(false),
  title: text("title"),
  minutes: integer("minutes"),
  topic: text("topic"),
  updatedBy: integer("updated_by")
    .notNull()
    .references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// แจ้งเตือนรายคน: สร้างตอนเกิดเรื่อง (พี่เลี้ยงตอบ, มีคำถามใหม่ ...) คนละแถวต่อผู้รับ อ่านแล้วจดเวลา
// เก็บข้อความสำเร็จรูปไว้เลย (ไม่ join กลับไปหาต้นเรื่อง) ต้นเรื่องถูกลบภายหลังก็ยังอ่านรู้เรื่อง
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt)],
);
