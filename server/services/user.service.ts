import { env } from "../config/env";
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

  // ชื่อซ้ำหรือมีอยู่แล้วไม่ทำให้ทั้งชุดล้ม: คนอื่นยังได้บัญชี แล้วบอกว่าชื่อไหนข้ามไป
  async createMany(usernames: string[], role: Role) {
    const results: ({ username: string; pin: string } | { username: string; error: string })[] = [];
    for (const username of [...new Set(usernames)]) {
      try {
        const { pin } = await userService.create(username, role);
        results.push({ username, pin });
      } catch (e) {
        if ((e as Error).message !== "USERNAME_TAKEN") throw e;
        results.push({ username, error: "มีชื่อนี้แล้ว" });
      }
    }
    return results;
  },

  // ตั้ง FIRST_DEV_* ไว้ และยังไม่มีบัญชีชื่อนี้ → สร้างเป็น Dev (ทางเข้าหน้า admin เมื่อยังไม่มีใครเข้าได้)
  // ชื่อนี้มีอยู่แล้วไม่แตะเลย (ไม่เปลี่ยน PIN ไม่ปลดล็อก) env จึงใช้ยึดบัญชีของคนอื่นไม่ได้
  // ไม่จำกัดว่า "ต้องยังไม่มี Dev" เพราะคนที่แก้ env ของ Production ได้ ก็เปลี่ยน DATABASE_URL ได้อยู่แล้ว
  // การจำกัดแบบนั้นไม่ได้กันอะไรเพิ่ม แต่ทำให้พี่เลี้ยงที่ลืม PIN ทุกคนเข้าไม่ได้เลย
  async ensureFirstDev() {
    const { FIRST_DEV_USERNAME: name, FIRST_DEV_PIN: pin } = env;
    if (!name || !pin) return;
    const username = name.toLowerCase();
    if (await userRepository.findByUsername(username)) {
      console.info(`FIRST_DEV: มีบัญชี ${username} อยู่แล้ว ไม่ได้สร้างใหม่ (ลบ FIRST_DEV_* ออกจาก env ได้)`);
      return;
    }
    await userRepository.create({ username, role: "dev", secretHash: await hashPin(pin) });
    console.info(`FIRST_DEV: สร้างบัญชี Dev ${username} แล้ว login ได้แล้วให้ลบ FIRST_DEV_PIN ออกจาก env`);
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
