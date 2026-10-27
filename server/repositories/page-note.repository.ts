import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { pageNotes, users } from "../db/schema";

type NewNote = typeof pageNotes.$inferInsert;

const columns = {
  id: pageNotes.id,
  pageUrl: pageNotes.pageUrl,
  body: pageNotes.body,
  visible: pageNotes.visible,
  author: users.username,
  updatedAt: pageNotes.updatedAt,
};

export const pageNoteRepository = {
  listAll: () => db.select(columns).from(pageNotes).innerJoin(users, eq(users.id, pageNotes.authorId)).orderBy(desc(pageNotes.updatedAt)),
  listVisibleFor: (pageUrl: string) =>
    db
      .select(columns)
      .from(pageNotes)
      .innerJoin(users, eq(users.id, pageNotes.authorId))
      .where(and(eq(pageNotes.pageUrl, pageUrl), eq(pageNotes.visible, true)))
      .orderBy(asc(pageNotes.createdAt)),
  async findById(id: number) {
    const [n] = await db.select().from(pageNotes).where(eq(pageNotes.id, id));
    return n;
  },
  async create(values: NewNote) {
    const [n] = await db.insert(pageNotes).values(values).returning({ id: pageNotes.id });
    return n;
  },
  update: (id: number, changes: Partial<Pick<NewNote, "pageUrl" | "body" | "visible">>) =>
    db
      .update(pageNotes)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(pageNotes.id, id)),
  remove: (id: number) => db.delete(pageNotes).where(eq(pageNotes.id, id)),
};
