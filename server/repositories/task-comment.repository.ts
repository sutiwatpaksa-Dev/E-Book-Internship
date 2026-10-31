import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { taskComments, users } from "../db/schema";

type NewComment = typeof taskComments.$inferInsert;

export const taskCommentRepository = {
  // เรื่องของน้อง 1 คนในงาน 1 ชิ้น เก่าสุดก่อน (อ่านเป็นเส้นเวลา) · ชื่อผู้เขียนมากับแถว ไม่ส่ง id ออกไป
  forTask: (userId: number, task: string) =>
    db
      .select({ id: taskComments.id, kind: taskComments.kind, ref: taskComments.ref, body: taskComments.body, createdAt: taskComments.createdAt, author: users.username, authorRole: users.role })
      .from(taskComments)
      .innerJoin(users, eq(users.id, taskComments.authorId))
      .where(and(eq(taskComments.userId, userId), eq(taskComments.task, task)))
      .orderBy(asc(taskComments.createdAt), asc(taskComments.id)),
  async create(values: NewComment) {
    const [c] = await db.insert(taskComments).values(values).returning({ id: taskComments.id });
    return c;
  },
};
