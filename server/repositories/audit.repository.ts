import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { auditLogs, users } from "../db/schema";

export type NewAuditLog = Omit<typeof auditLogs.$inferInsert, "id" | "createdAt">;

export const auditRepository = {
  add: (entry: NewAuditLog) => db.insert(auditLogs).values(entry),
  latest: (limit: number) =>
    db
      .select({ id: auditLogs.id, actor: users.username, action: auditLogs.action, target: auditLogs.target, detail: auditLogs.detail, createdAt: auditLogs.createdAt })
      .from(auditLogs)
      .innerJoin(users, eq(users.id, auditLogs.actorId))
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit),
};
