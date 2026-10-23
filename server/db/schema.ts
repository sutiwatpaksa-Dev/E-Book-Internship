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
