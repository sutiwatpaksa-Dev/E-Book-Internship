import { and, asc, count, desc, eq, inArray, isNull, lt, notInArray, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { threadMessages, threads, users, type Role, type ThreadStatus } from "../db/schema";

type NewThread = typeof threads.$inferInsert;
// สถานะที่ถือว่าจบเรื่องแล้ว (ไม่นับเป็นเรื่องค้าง)
const FINISHED: ThreadStatus[] = ["closed", "done", "declined"];

// "ยังไม่อ่าน" ของแต่ละฝั่ง = อีกฝั่งพิมพ์ล่าสุด และเราอ่านครั้งล่าสุดก่อนข้อความนั้น
const unreadFor = (side: Role) => {
  const readAt = side === "intern" ? threads.internReadAt : threads.devReadAt;
  const other: Role = side === "intern" ? "dev" : "intern";
  return and(eq(threads.lastAuthorRole, other), or(isNull(readAt), lt(readAt, threads.lastMessageAt)));
};

const listColumns = {
  id: threads.id,
  kind: threads.kind,
  subject: threads.subject,
  pageUrl: threads.pageUrl,
  status: threads.status,
  lastMessageAt: threads.lastMessageAt,
  createdAt: threads.createdAt,
};

export const threadRepository = {
  find: async (id: number) => (await db.select().from(threads).where(eq(threads.id, id)))[0],

  listByOwner: (ownerId: number) =>
    db
      .select({ ...listColumns, unread: sql<boolean>`coalesce(${unreadFor("intern")}, false)` })
      .from(threads)
      .where(eq(threads.createdBy, ownerId))
      .orderBy(desc(threads.lastMessageAt)),

  listAll: () =>
    db
      .select({ ...listColumns, owner: users.username, unread: sql<boolean>`coalesce(${unreadFor("dev")}, false)` })
      .from(threads)
      .innerJoin(users, eq(users.id, threads.createdBy))
      .orderBy(desc(threads.lastMessageAt)),

  messages: (threadId: number) =>
    db
      .select({
        id: threadMessages.id,
        body: threadMessages.body,
        isSystem: threadMessages.isSystem,
        createdAt: threadMessages.createdAt,
        author: users.username,
        authorRole: users.role,
      })
      .from(threadMessages)
      .innerJoin(users, eq(users.id, threadMessages.authorId))
      .where(eq(threadMessages.threadId, threadId))
      .orderBy(asc(threadMessages.createdAt), asc(threadMessages.id)),

  async countOpenByOwner(ownerId: number) {
    const [r] = await db
      .select({ n: count() })
      .from(threads)
      .where(and(eq(threads.createdBy, ownerId), notInArray(threads.status, FINISHED)));
    return r.n;
  },

  async countUnread(side: Role, ownerId?: number) {
    const [r] = await db
      .select({ n: count() })
      .from(threads)
      .where(and(unreadFor(side), ownerId === undefined ? undefined : eq(threads.createdBy, ownerId)));
    return r.n;
  },

  // เรื่องใหม่ + ข้อความแรก ต้องเกิดพร้อมกัน ไม่งั้นอาจได้เรื่องที่ไม่มีข้อความ
  create: (row: Omit<NewThread, "lastAuthorRole" | "internReadAt">, body: string) =>
    db.transaction(async (tx) => {
      const now = new Date();
      const [t] = await tx
        .insert(threads)
        .values({ ...row, lastAuthorRole: "intern", lastMessageAt: now, internReadAt: now, createdAt: now })
        .returning({ id: threads.id });
      await tx.insert(threadMessages).values({ threadId: t.id, authorId: row.createdBy, body, createdAt: now });
      return t.id;
    }),

  // เพิ่มข้อความ (ข้อความธรรมดาหรือบรรทัดของระบบ) แล้วอัปเดตหัวเรื่องในครั้งเดียว
  // คนพิมพ์ถือว่าอ่านถึงข้อความนี้แล้ว อีกฝั่งจะเห็นเป็น "ยังไม่อ่าน"
  addMessages: (threadId: number, authorId: number, side: Role, items: { body: string; isSystem?: boolean }[], status?: ThreadStatus) =>
    db.transaction(async (tx) => {
      const now = new Date();
      await tx.insert(threadMessages).values(items.map((m) => ({ threadId, authorId, body: m.body, isSystem: m.isSystem ?? false, createdAt: now })));
      await tx
        .update(threads)
        .set({
          lastMessageAt: now,
          lastAuthorRole: side,
          ...(side === "intern" ? { internReadAt: now } : { devReadAt: now }),
          ...(status ? { status } : {}),
        })
        .where(eq(threads.id, threadId));
    }),

  markRead: (ids: number[], side: Role) =>
    db
      .update(threads)
      .set(side === "intern" ? { internReadAt: new Date() } : { devReadAt: new Date() })
      .where(inArray(threads.id, ids)),
};
