import { pageNoteRepository } from "../repositories/page-note.repository";
import { auditService } from "./audit.service";

type NoteInput = { pageUrl: string; body: string; visible: boolean };

// ตัดข้อความยาวให้พอดีบรรทัดใน audit log
const short = (s: string) => (s.length > 60 ? `${s.slice(0, 60)}…` : s);

async function found(id: number) {
  const n = await pageNoteRepository.findById(id);
  if (!n) throw new Error("NOTE_NOT_FOUND");
  return n;
}

export const pageNoteService = {
  listFor: (pageUrl: string) => pageNoteRepository.listVisibleFor(pageUrl),
  listAll: () => pageNoteRepository.listAll(),

  async create(devId: number, input: NoteInput) {
    const n = await pageNoteRepository.create({ ...input, authorId: devId });
    await auditService.log(devId, "note.create", input.pageUrl, short(input.body));
    return n;
  },
  async update(devId: number, id: number, input: NoteInput) {
    await found(id);
    await pageNoteRepository.update(id, input);
    await auditService.log(devId, "note.update", input.pageUrl, input.visible ? short(input.body) : "ซ่อน");
  },
  async remove(devId: number, id: number) {
    const n = await found(id);
    await pageNoteRepository.remove(id);
    await auditService.log(devId, "note.delete", n.pageUrl, short(n.body));
  },
};
