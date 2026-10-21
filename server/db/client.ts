import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "./schema";

// serverless เปิดหลายเครื่องพร้อมกันได้ ให้แต่ละเครื่องถือ connection น้อยๆ (ใช้ connection string แบบ pooled ของ Neon)
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 3 });
export const db = drizzle(pool, { schema });
