import { and, count, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "../db/client";
import { assignments, postAcks, postCohorts, posts, users } from "../db/schema";

type NewPost = typeof posts.$inferInsert;

const columns = {
  id: posts.id,
  kind: posts.kind,
  assignmentId: posts.assignmentId,
  assignmentName: assignments.name,
  title: posts.title,
  body: posts.body,
  links: posts.links,
  allCohorts: posts.allCohorts,
  dueDay: posts.dueDay,
  dueAt: posts.dueAt,
  pinned: posts.pinned,
  author: users.username,
  authorNickname: users.nickname,
  authorFullName: users.fullName,
  createdAt: posts.createdAt,
  editedAt: posts.editedAt,
  archivedAt: posts.archivedAt,
};

// โพสต์ที่รุ่นนี้เห็น (ยังไม่เก็บ) · cohortId null = น้องไม่มีรุ่น เห็นแค่โพสต์ทุกรุ่น · "any" = พี่เลี้ยงดูตัวอย่าง เห็นทุกโพสต์
const scopeOf = (cohortId: number | null | "any") =>
  cohortId === "any"
    ? undefined
    : cohortId === null
      ? eq(posts.allCohorts, true)
      : or(eq(posts.allCohorts, true), inArray(posts.id, db.select({ id: postCohorts.postId }).from(postCohorts).where(eq(postCohorts.cohortId, cohortId))));

export const postRepository = {
  listVisible: (cohortId: number | null | "any", userId: number) =>
    db
      .select({ ...columns, ackedAt: postAcks.ackedAt })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .leftJoin(assignments, eq(assignments.id, posts.assignmentId))
      .leftJoin(postAcks, and(eq(postAcks.postId, posts.id), eq(postAcks.userId, userId)))
      .where(and(isNull(posts.archivedAt), scopeOf(cohortId)))
      .orderBy(desc(posts.createdAt))
      .limit(200),
  // หลังบ้าน: ทุกโพสต์รวมที่เก็บแล้ว
  listAll: () =>
    db.select(columns).from(posts).innerJoin(users, eq(users.id, posts.authorId)).leftJoin(assignments, eq(assignments.id, posts.assignmentId)).orderBy(desc(posts.createdAt)).limit(300),
  cohortRows: (postIds: number[]) => (postIds.length ? db.select().from(postCohorts).where(inArray(postCohorts.postId, postIds)) : Promise.resolve([])),
  ackCounts: (postIds: number[]) =>
    postIds.length ? db.select({ postId: postAcks.postId, n: count() }).from(postAcks).where(inArray(postAcks.postId, postIds)).groupBy(postAcks.postId) : Promise.resolve([]),
  async find(id: number) {
    const [p] = await db.select().from(posts).where(eq(posts.id, id));
    return p;
  },
  cohortIdsOf: async (id: number) => (await db.select({ c: postCohorts.cohortId }).from(postCohorts).where(eq(postCohorts.postId, id))).map((r) => r.c),
  // โพสต์ + รุ่นต้องเกิดพร้อมกัน ไม่งั้นอาจได้โพสต์ที่ไม่มีใครเห็น (หรือเห็นผิดรุ่นชั่วขณะ)
  create: (values: NewPost, cohortIds: number[]) =>
    db.transaction(async (tx) => {
      const [p] = await tx.insert(posts).values(values).returning({ id: posts.id });
      if (cohortIds.length) await tx.insert(postCohorts).values(cohortIds.map((cohortId) => ({ postId: p.id, cohortId })));
      return p.id;
    }),
  update: (id: number, values: Partial<NewPost>, cohortIds: number[]) =>
    db.transaction(async (tx) => {
      await tx.update(posts).set(values).where(eq(posts.id, id));
      await tx.delete(postCohorts).where(eq(postCohorts.postId, id));
      if (cohortIds.length) await tx.insert(postCohorts).values(cohortIds.map((cohortId) => ({ postId: id, cohortId })));
    }),
  setPinned: (id: number, pinned: boolean) => db.update(posts).set({ pinned }).where(eq(posts.id, id)),
  archive: (id: number, at: Date) => db.update(posts).set({ archivedAt: at, pinned: false }).where(eq(posts.id, id)),
  ack: (postId: number, userId: number) => db.insert(postAcks).values({ postId, userId }).onConflictDoNothing(),
  unack: (postId: number, userId: number) => db.delete(postAcks).where(and(eq(postAcks.postId, postId), eq(postAcks.userId, userId))),
  acksOf: (postId: number) => db.select({ userId: postAcks.userId, ackedAt: postAcks.ackedAt }).from(postAcks).where(eq(postAcks.postId, postId)),
};
