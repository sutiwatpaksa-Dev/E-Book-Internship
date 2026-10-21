import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { files } from "../db/schema";

type FileRow = typeof files.$inferInsert;

export const fileRepository = {
  async find(key: string) {
    const [f] = await db.select().from(files).where(eq(files.key, key));
    return f;
  },
  async findInfo(key: string) {
    const [f] = await db.select({ size: files.size, updatedAt: files.updatedAt }).from(files).where(eq(files.key, key));
    return f;
  },
  async upsert(row: FileRow) {
    const { key, ...rest } = row;
    await db.insert(files).values(row).onConflictDoUpdate({ target: files.key, set: rest });
  },
};
