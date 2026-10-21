import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { ipFailures } from "../db/schema";

// นับใน DB เพราะบน Vercel แต่ละคำขออาจวิ่งไปคนละเครื่อง ตัวนับในหน่วยความจำจึงใช้ไม่ได้
export const ipFailureRepository = {
  async find(ip: string) {
    const [row] = await db.select().from(ipFailures).where(eq(ipFailures.ip, ip));
    return row;
  },
  // นับเพิ่ม 1 ถ้าหน้าต่างเวลาเดิมหมดแล้ว (เริ่มก่อน windowStartAfter) เริ่มนับใหม่ที่ 1
  async increment(ip: string, now: Date, windowStartAfter: Date) {
    const expired = sql`${ipFailures.windowStart} < ${windowStartAfter}`;
    await db
      .insert(ipFailures)
      .values({ ip, count: 1, windowStart: now })
      .onConflictDoUpdate({
        target: ipFailures.ip,
        set: {
          count: sql`case when ${expired} then 1 else ${ipFailures.count} + 1 end`,
          windowStart: sql`case when ${expired} then ${now} else ${ipFailures.windowStart} end`,
        },
      });
  },
};
