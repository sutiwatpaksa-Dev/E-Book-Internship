import { boolean, customType, index, integer, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const ROLES = ["intern", "dev"] as const;
export type Role = (typeof ROLES)[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  // เก็บแค่ hash (argon2id) ไม่เก็บ PIN จริง
  secretHash: text("secret_hash").notNull(),
  // ตอนนี้เป็น PIN ถ้าวันหน้าเปลี่ยนเป็นรหัสผ่านยาว แค่เพิ่มค่าใหม่ ไม่ต้องรื้อตาราง
  secretKind: text("secret_kind").$type<"pin" | "password">().notNull().default("pin"),
  role: text("role").$type<Role>().notNull(),
  disabled: boolean("disabled").notNull().default(false),
  failedCount: integer("failed_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
export const THREAD_KINDS = ["question", "content_request"] as const;
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
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  // ว่าง = แสดงจนกว่าพี่เลี้ยงจะกดปิด (ปิด = ตั้งเวลาจบเป็นตอนนี้ ประวัติยังอยู่)
  endsAt: timestamp("ends_at", { withTimezone: true }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
