import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dialect: "postgresql",
  // migrate ต่อตรงถ้ามี (Neon ให้ DATABASE_URL_UNPOOLED): pooler (pgbouncer) ไม่เหมาะกับคำสั่งสร้าง/แก้ตาราง
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL! },
});
