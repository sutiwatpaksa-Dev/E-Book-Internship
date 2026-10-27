import { env } from "../config/env";
import type { Role } from "../db/schema";
import { hashPin, newPin } from "../lib/pin";
import { cohortRepository } from "../repositories/cohort.repository";
import { userRepository, type PublicUser } from "../repositories/user.repository";
import { auditService } from "./audit.service";

// คนที่ได้บัญชีพี่เลี้ยงเห็นแชทของน้องทุกคนและแก้คู่มือได้ จึงให้เฉพาะ Super admin เป็นคนแจก/ยึดคืน
// actor = คนที่กดในหน้า admin (มาจาก requireRole ซึ่งอ่าน DB ทุกครั้ง ธงจึงสดเสมอ)
type Actor = { id: number; superAdmin: boolean };
const needSuper = (actor: Actor) => {
  if (!actor.superAdmin) throw new Error("SUPER_ADMIN_ONLY");
};

// PIN คืนออกไปครั้งเดียวตอนสร้าง/ออกใหม่ ระบบเก็บแค่ hash จึงดูย้อนหลังไม่ได้
export const userService = {
  list: () => userRepository.listPublic(),

  async create(actor: Actor, username: string, role: Role, cohortId?: number | null) {
    if (role === "dev") needSuper(actor);
    const inCohort = role === "intern" && cohortId ? cohortId : null;
    if (inCohort && !(await cohortRepository.findById(inCohort))) throw new Error("COHORT_NOT_FOUND");
    const pin = newPin();
    const user = await userRepository.create({ username, role, secretHash: await hashPin(pin), cohortId: inCohort });
    if (!user) throw new Error("USERNAME_TAKEN");
    await auditService.log(actor.id, "user.create", username, role);
    return { user, pin };
  },

  // ชื่อซ้ำหรือมีอยู่แล้วไม่ทำให้ทั้งชุดล้ม: คนอื่นยังได้บัญชี แล้วบอกว่าชื่อไหนข้ามไป
  async createMany(actor: Actor, usernames: string[], role: Role, cohortId?: number | null) {
    const results: ({ username: string; pin: string } | { username: string; error: string })[] = [];
    for (const username of [...new Set(usernames)]) {
      try {
        const { pin } = await userService.create(actor, username, role, cohortId);
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
    // ระบบใหม่ที่ยังไม่มีใคร: บัญชีแรกต้องเป็น Super admin ไม่งั้นไม่มีใครสร้างพี่เลี้ยงคนต่อไปได้
    await userRepository.create({ username, role: "dev", superAdmin: true, secretHash: await hashPin(pin) });
    console.info(`FIRST_DEV: สร้างบัญชี Dev ${username} แล้ว login ได้แล้วให้ลบ FIRST_DEV_PIN ออกจาก env`);
  },

  // pin ส่งมาเองได้เฉพาะสคริปต์ใน Terminal (หน้า admin สุ่มให้เสมอ) · actor มีเฉพาะตอนสั่งจากหน้า admin
  // ออก PIN ใหม่ให้พี่เลี้ยงคนอื่น = ยึดบัญชีเขาได้ จึงต้องเป็น Super admin (ออกให้ตัวเองได้)
  async resetPin(id: number, pin = newPin(), actor?: Actor) {
    if (actor && actor.id !== id && (await userRepository.findById(id))?.role === "dev") needSuper(actor);
    const user = await userRepository.update(id, { secretHash: await hashPin(pin), secretKind: "pin", failedCount: 0, lockedUntil: null });
    if (!user) throw new Error("NOT_FOUND");
    if (actor) await auditService.log(actor.id, "user.reset_pin", user.username);
    return { user, pin };
  },

  async update(actor: Actor, id: number, changes: { role?: Role; disabled?: boolean; unlock?: true }) {
    const actorId = actor.id;
    // กันพี่เลี้ยงปิดหรือลดสิทธิ์ตัวเองจนไม่มีใครเข้าหน้า admin ได้
    if (actorId === id && (changes.disabled === true || changes.role === "intern")) throw new Error("CANNOT_CHANGE_SELF");
    // แตะบัญชีพี่เลี้ยง (ปิด/เปิด เปลี่ยนบทบาท) หรือเลื่อนน้องเป็นพี่เลี้ยง ต้องเป็น Super admin
    // ปลดล็อกอย่างเดียวไม่ต้อง: แค่ให้เจ้าของบัญชีลองใส่ PIN ของตัวเองใหม่ ไม่ได้ให้สิทธิ์ใคร
    const touchesDev = changes.role === "dev" || ((changes.role !== undefined || changes.disabled !== undefined) && (await userRepository.findById(id))?.role === "dev");
    if (touchesDev) needSuper(actor);
    const { unlock, ...rest } = changes;
    const user: PublicUser | undefined = await userRepository.update(id, { ...rest, ...(unlock ? { failedCount: 0, lockedUntil: null } : {}) });
    if (!user) throw new Error("NOT_FOUND");
    if (unlock) await auditService.log(actorId, "user.unlock", user.username);
    if (changes.disabled !== undefined) await auditService.log(actorId, changes.disabled ? "user.disable" : "user.enable", user.username);
    if (changes.role) await auditService.log(actorId, "user.role", user.username, changes.role);
    return user;
  },
};
