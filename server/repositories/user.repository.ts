import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { users, type Role } from "../db/schema";

type NewUser = typeof users.$inferInsert;
type UserChanges = Partial<Omit<NewUser, "id" | "createdAt">>;

// คอลัมน์ที่ส่งออกไปนอก server ได้ (ไม่มี hash)
const publicColumns = {
  id: users.id,
  username: users.username,
  role: users.role,
  disabled: users.disabled,
  lockedUntil: users.lockedUntil,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
};
export type PublicUser = { [K in keyof typeof publicColumns]: (typeof users.$inferSelect)[K] };

export const userRepository = {
  async findById(id: number) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u;
  },
  async findByUsername(username: string) {
    const [u] = await db.select().from(users).where(eq(users.username, username));
    return u;
  },
  listPublic: () => db.select(publicColumns).from(users).orderBy(asc(users.username)),
  // ผู้รับแจ้งเตือน: บัญชีที่ยังเปิดใช้ ของบทบาทที่ระบุ
  activeIdsByRole: async (roles: Role[]) =>
    (await db.select({ id: users.id }).from(users).where(and(eq(users.disabled, false), inArray(users.role, roles)))).map((u) => u.id),
  // ชื่อซ้ำคืน undefined (ให้ service ตัดสินว่าจะทำอะไรต่อ)
  async create(values: NewUser): Promise<PublicUser | undefined> {
    const [u] = await db.insert(users).values(values).onConflictDoNothing().returning(publicColumns);
    return u;
  },
  async update(id: number, changes: UserChanges): Promise<PublicUser | undefined> {
    const [u] = await db.update(users).set(changes).where(eq(users.id, id)).returning(publicColumns);
    return u;
  },
};
