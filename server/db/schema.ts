import { boolean, customType, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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
