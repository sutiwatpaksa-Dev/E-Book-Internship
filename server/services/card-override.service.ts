import { cards } from "../../src/data/learn";
import { cardOverrideRepository } from "../repositories/card-override.repository";
import { auditService } from "./audit.service";

type Input = { hidden: boolean; title: string | null; minutes: number | null; topic: string | null };

export const cardOverrideService = {
  // อ่านได้ทุกคน (ไม่มีความลับ): คนไม่ login ก็ต้องไม่เห็นการ์ดที่ถูกซ่อนในคลังเหมือนกัน
  listAll: () => cardOverrideRepository.listAll(),

  async set(devId: number, slug: string, input: Input) {
    const card = cards.find((c) => c.slug === slug);
    if (!card) throw new Error("CARD_NOT_FOUND");
    // ทุกช่องกลับเป็นค่าเดิม = ลบแถวทิ้ง ไม่เก็บแถวที่ไม่ได้ปรับอะไร
    const changed = input.hidden || input.title !== null || input.minutes !== null || input.topic !== null;
    if (changed) await cardOverrideRepository.upsert({ slug, ...input, updatedBy: devId });
    else await cardOverrideRepository.remove(slug);
    const what = [input.hidden && "ซ่อน", input.title && `ชื่อ "${input.title}"`, input.minutes && `${input.minutes} นาที`, input.topic && `หมวด ${input.topic}`].filter(Boolean);
    await auditService.log(devId, "card.override", card.title, what.length ? what.join(", ") : "กลับเป็นค่าเดิม");
  },
};
