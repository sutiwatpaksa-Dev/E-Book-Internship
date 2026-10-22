import type { Role } from "../db/schema";
import { hashPin, newPin } from "../lib/pin";
import { userRepository } from "../repositories/user.repository";

// PIN คืนออกไปครั้งเดียวตอนสร้าง/ออกใหม่ ระบบเก็บแค่ hash จึงดูย้อนหลังไม่ได้
export const userService = {
  list: () => userRepository.listPublic(),

  async create(username: string, role: Role) {
    const pin = newPin();
    const user = await userRepository.create({ username, role, secretHash: await hashPin(pin) });
    if (!user) throw new Error("USERNAME_TAKEN");
    return { user, pin };
  },

  // pin ส่งมาเองได้เฉพาะสคริปต์ใน Terminal (หน้า admin สุ่มให้เสมอ)
  async resetPin(id: number, pin = newPin()) {
    const user = await userRepository.update(id, { secretHash: await hashPin(pin), secretKind: "pin", failedCount: 0, lockedUntil: null });
    if (!user) throw new Error("NOT_FOUND");
    return { user, pin };
  },

  async update(actorId: number, id: number, changes: { role?: Role; disabled?: boolean; unlock?: true }) {
    // กันพี่เลี้ยงปิดหรือลดสิทธิ์ตัวเองจนไม่มีใครเข้าหน้า admin ได้
    if (actorId === id && (changes.disabled === true || changes.role === "intern")) throw new Error("CANNOT_CHANGE_SELF");
    const { unlock, ...rest } = changes;
    const user = await userRepository.update(id, { ...rest, ...(unlock ? { failedCount: 0, lockedUntil: null } : {}) });
    if (!user) throw new Error("NOT_FOUND");
    return user;
  },
};
