import { questionRepository } from "../repositories/question.repository";

// กันกดส่งรัวๆ: ถามค้างได้ไม่เกินเท่านี้ พี่เลี้ยงตอบแล้วถามต่อได้
const MAX_OPEN_PER_USER = 10;

export const questionService = {
  mine: (userId: number) => questionRepository.listByAsker(userId),

  async ask(userId: number, pageUrl: string, body: string) {
    if ((await questionRepository.countOpenByAsker(userId)) >= MAX_OPEN_PER_USER) throw new Error("TOO_MANY_OPEN_QUESTIONS");
    return questionRepository.create({ askedBy: userId, pageUrl, body });
  },

  listAll: () => questionRepository.listAll(),

  // ตอบซ้ำได้ (แก้คำตอบ) ค่าใหม่ทับค่าเดิม
  async answer(id: number, devId: number, answer: string) {
    if (!(await questionRepository.answer(id, devId, answer))) throw new Error("QUESTION_NOT_FOUND");
  },
};
