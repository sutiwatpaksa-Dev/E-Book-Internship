import { boolean, customType, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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

// คำถามจากน้องถึงพี่เลี้ยง เห็นกันแค่คนถามกับพี่เลี้ยง (ไม่มีหน้ารวมให้น้องคนอื่นเห็น)
export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    askedBy: integer("asked_by")
      .notNull()
      .references(() => users.id),
    // หน้าที่น้องกดถาม (เช่น /08b-db-to-backend) พี่เลี้ยงเปิดไปดูบริบทได้
    pageUrl: text("page_url").notNull(),
    body: text("body").notNull(),
    // ยังไม่มีคำตอบ = รอตอบ (ไม่ต้องมีคอลัมน์สถานะแยก ค่าจะได้ไม่ขัดกันเอง)
    answer: text("answer"),
    answeredBy: integer("answered_by").references(() => users.id),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // หน้าของน้องค้นด้วย "คำถามของฉัน" ทุกครั้ง
  (t) => [index("questions_asked_by_idx").on(t.askedBy)],
);
