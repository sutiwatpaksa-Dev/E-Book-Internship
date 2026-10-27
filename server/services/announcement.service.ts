import type { Audience, Role } from "../db/schema";
import { announcementRepository } from "../repositories/announcement.repository";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";

type Input = { body: string; audience: Audience; startsAt?: string; endsAt?: string | null };

const ROLES_OF: Record<Audience, Role[]> = { intern: ["intern"], dev: ["dev"], all: ["intern", "dev"] };
const short = (s: string) => (s.length > 60 ? `${s.slice(0, 60)}…` : s);

export const announcementService = {
  // ประกาศที่คนนี้ควรเห็นตอนนี้ (พี่เลี้ยงเห็นของพี่เลี้ยง + ของทุกคน · น้องเห็นของน้อง + ของทุกคน)
  activeFor: (role: Role) => announcementRepository.listActive([role, "all"], new Date()),
  listAll: () => announcementRepository.listAll(),

  async create(devId: number, input: Input) {
    const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    if (endsAt && endsAt <= startsAt) throw new Error("INVALID_PERIOD");
    const a = await announcementRepository.create({ body: input.body, audience: input.audience, startsAt, endsAt, authorId: devId });
    await auditService.log(devId, "announcement.create", short(input.body), input.audience);
    // แจ้งเตือนตอนสร้างเลย แม้ตั้งเวลาเริ่มไว้ล่วงหน้า (น้องรู้ล่วงหน้าว่ามีนัด) · กดแล้วไปหน้าวันนี้ที่ประกาศแสดงอยู่
    await notificationService.toRoles(ROLES_OF[input.audience], { kind: "announcement", title: `ประกาศ: ${short(input.body)}`, link: "/today" }, devId);
    return a;
  },

  // ปิดประกาศ = ตั้งเวลาจบเป็นตอนนี้ ไม่ลบแถว ประวัติยังดูได้ในหลังบ้าน
  async end(devId: number, id: number) {
    const a = await announcementRepository.findById(id);
    if (!a) throw new Error("ANNOUNCEMENT_NOT_FOUND");
    await announcementRepository.end(id, new Date());
    await auditService.log(devId, "announcement.end", short(a.body));
  },
};
