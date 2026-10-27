import { learnLinks } from "../../src/data/learn";
import { extraLinks, requiredLinks } from "../../src/data/roadmap";
import { progressRepository } from "../repositories/progress.repository";
import { mentorCardService } from "./mentor-card.service";

// รับเฉพาะบทที่มีจริงในแผนที่ (และการ์ดของโครงใหม่ 7 ขั้น) กันคนยิง API ใส่ข้อความอะไรก็ได้ลงตาราง
const KNOWN = new Set([...requiredLinks, ...extraLinks, ...learnLinks]);
// การ์ดของพี่เลี้ยงอยู่ใน DB ไม่ได้อยู่ในรายการตายตัวข้างบน จึงถาม DB ว่าเผยแพร่อยู่จริงไหม
const isKnown = async (link: string) => KNOWN.has(link) || (await mentorCardService.isPublishedLink(link));

export const progressService = {
  listMine: (userId: number) => progressRepository.listByUser(userId),

  async set(userId: number, link: string, done: boolean) {
    if (!(await isKnown(link))) throw new Error("UNKNOWN_CHAPTER");
    if (done) await progressRepository.add(userId, [link]);
    else await progressRepository.remove(userId, link);
  },

  // ย้ายติ๊กเก่าในเบราว์เซอร์ขึ้นบัญชีตอน login ครั้งแรก · บทที่ไม่รู้จัก (เช่นบทที่เลิกใช้แล้ว) ทิ้งเงียบๆ
  async importLocal(userId: number, links: string[]) {
    const unique = [...new Set(links)];
    const ok = await Promise.all(unique.map(isKnown));
    await progressRepository.add(userId, unique.filter((_, i) => ok[i]));
    return progressRepository.listByUser(userId);
  },

  // หลังบ้าน: บทที่แต่ละคนผ่าน พร้อมเวลา { userId: [{ link, doneAt }] }
  async byUser() {
    const out: Record<number, { link: string; doneAt: Date }[]> = {};
    for (const r of await progressRepository.listAll()) (out[r.userId] ??= []).push({ link: r.link, doneAt: r.doneAt });
    return out;
  },
};
