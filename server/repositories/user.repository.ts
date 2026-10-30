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
  superAdmin: users.superAdmin,
  disabled: users.disabled,
  lockedUntil: users.lockedUntil,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
  cohortId: users.cohortId,
  // pin = ยังไม่ได้ตั้งรหัสผ่านเอง (หลังบ้านแสดงว่า "รอตั้งรหัสผ่าน") · ไม่ใช่ค่าลับ บอกแค่ชนิด
  secretKind: users.secretKind,
  resetRequestedAt: users.resetRequestedAt,
  fullName: users.fullName,
  nickname: users.nickname,
  schoolType: users.schoolType,
  schoolName: users.schoolName,
  major: users.major,
  eduLevel: users.eduLevel,
  // ช่องติดต่อ: list นี้ส่งให้หลังบ้านเท่านั้น (route ของพี่เลี้ยง) หน้าน้องรายคนใช้แสดง
  phone: users.phone,
  email: users.email,
  expertise: users.expertise,
  lineId: users.lineId,
  instagram: users.instagram,
  facebook: users.facebook,
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
  // Super admin ที่ยังเปิดใช้ (ผู้รับคำขอรีเซ็ตของบัญชีพี่เลี้ยง)
  activeSuperAdminIds: async () =>
    (await db.select({ id: users.id }).from(users).where(and(eq(users.disabled, false), eq(users.role, "dev"), eq(users.superAdmin, true)))).map((u) => u.id),
  listPublic: () => db.select(publicColumns).from(users).orderBy(asc(users.username)),
  // ผู้รับแจ้งเตือน: บัญชีที่ยังเปิดใช้ ของบทบาทที่ระบุ
  // น้องที่ยังใช้งานอยู่ ตามรายชื่อหรือรุ่น (ใช้ตอนพี่เลี้ยงส่งข้อความ)
  activeInterns: (where: { ids?: number[]; cohortId?: number }) =>
    db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(and(eq(users.disabled, false), eq(users.role, "intern"), where.ids ? inArray(users.id, where.ids) : undefined, where.cohortId ? eq(users.cohortId, where.cohortId) : undefined))
      .orderBy(asc(users.username)),
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
