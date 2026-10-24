import { learnLinks } from "../../src/data/learn";
import { extraLinks, requiredLinks } from "../../src/data/roadmap";
import { progressRepository } from "../repositories/progress.repository";

// รับเฉพาะบทที่มีจริงในแผนที่ (และการ์ดของโครงใหม่ 7 ขั้น) กันคนยิง API ใส่ข้อความอะไรก็ได้ลงตาราง
const KNOWN = new Set([...requiredLinks, ...extraLinks, ...learnLinks]);

export const progressService = {
  listMine: (userId: number) => progressRepository.listByUser(userId),

  async set(userId: number, link: string, done: boolean) {
    if (!KNOWN.has(link)) throw new Error("UNKNOWN_CHAPTER");
    if (done) await progressRepository.add(userId, [link]);
    else await progressRepository.remove(userId, link);
  },

  // ย้ายติ๊กเก่าในเบราว์เซอร์ขึ้นบัญชีตอน login ครั้งแรก · บทที่ไม่รู้จัก (เช่นบทที่เลิกใช้แล้ว) ทิ้งเงียบๆ
  async importLocal(userId: number, links: string[]) {
    await progressRepository.add(userId, [...new Set(links)].filter((l) => KNOWN.has(l)));
    return progressRepository.listByUser(userId);
  },

  // หลังบ้าน: บทที่แต่ละคนผ่าน พร้อมเวลา { userId: [{ link, doneAt }] }
  async byUser() {
    const out: Record<number, { link: string; doneAt: Date }[]> = {};
    for (const r of await progressRepository.listAll()) (out[r.userId] ??= []).push({ link: r.link, doneAt: r.doneAt });
    return out;
  },
};
