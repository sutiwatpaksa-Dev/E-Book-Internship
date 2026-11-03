import type { Role } from "../db/schema";
import { dueDateFor, feedOrder, POST_KIND_LABEL, visibleTo, type PostInput } from "../../src/lib/post";
import { assignmentRepository } from "../repositories/assignment.repository";
import { cohortRepository } from "../repositories/cohort.repository";
import { postRepository } from "../repositories/post.repository";
import { userRepository } from "../repositories/user.repository";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";

type Viewer = { id: number; role: Role };
const FEED_LINK = (id: number) => `/feed#post-${id}`;
// น้องเห็นผู้โพสต์เป็นชื่อเล่น/ชื่อจริงของพี่เลี้ยง ไม่ใช่ชื่อบัญชี login
const authorLabel = (p: { author: string; authorNickname: string | null; authorFullName: string | null }) =>
  p.authorNickname?.trim() ? `พี่${p.authorNickname.trim()}` : p.authorFullName?.trim() || "พี่เลี้ยง";

// รุ่นของคนดู + วันเริ่มรุ่น (ใช้แปลง "วันทำงานที่ N" เป็นวันที่ของรุ่นนั้น)
async function viewerCohort(userId: number) {
  const u = await userRepository.findById(userId);
  const c = u?.cohortId ? await cohortRepository.findById(u.cohortId) : undefined;
  return { cohortId: u?.cohortId ?? null, startsOn: c?.startsOn ?? null };
}

// น้องเห็นโพสต์นี้ไหม · เห็นไม่ได้ = ตอบเหมือนไม่มี (ไม่บอกว่ามีโพสต์ของรุ่นอื่นอยู่)
async function assertVisible(viewer: Viewer, id: number) {
  const p = await postRepository.find(id);
  if (!p || p.archivedAt) throw new Error("POST_NOT_FOUND");
  if (viewer.role === "dev") return p;
  const { cohortId } = await viewerCohort(viewer.id);
  if (!visibleTo({ allCohorts: p.allCohorts, cohortIds: await postRepository.cohortIdsOf(id) }, cohortId)) throw new Error("POST_NOT_FOUND");
  return p;
}

// น้องที่อยู่ในกลุ่มเป้าหมายของโพสต์ (ยังไม่ปิดบัญชี)
async function audienceOf(allCohorts: boolean, cohortIds: number[]) {
  if (allCohorts) return userRepository.activeInterns({});
  const lists = await Promise.all(cohortIds.map((cohortId) => userRepository.activeInterns({ cohortId })));
  return lists.flat();
}

async function checkRefs(input: PostInput) {
  if (input.assignmentId !== null && !(await assignmentRepository.findById(input.assignmentId))) throw new Error("POST_ASSIGNMENT_NOT_FOUND");
  for (const id of input.cohortIds) if (!(await cohortRepository.findById(id))) throw new Error("POST_COHORT_NOT_FOUND");
}

const values = (input: PostInput) => ({
  kind: input.kind,
  assignmentId: input.assignmentId,
  title: input.title.trim(),
  body: input.body,
  links: input.links.map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
  allCohorts: input.allCohorts,
  dueDay: input.dueDay,
  dueAt: input.dueAt,
  pinned: input.pinned,
});
// ติ๊กทุกรุ่นแล้วไม่ต้องเก็บรายชื่อรุ่น (กันข้อมูลสองแบบขัดกัน)
const cohortsOf = (input: PostInput) => (input.allCohorts ? [] : [...new Set(input.cohortIds)]);

export const postService = {
  // ---- ฝั่งน้อง (และพี่เลี้ยงที่เปิดดูหน้าฟีด = เห็นทุกโพสต์ที่ยังไม่เก็บ) ----
  async feed(viewer: Viewer) {
    const { cohortId, startsOn } = await viewerCohort(viewer.id);
    const rows = await postRepository.listVisible(viewer.role === "dev" ? "any" : cohortId, viewer.id);
    const items = rows.map(({ ackedAt, archivedAt: _, authorNickname, authorFullName, ...p }) => ({
      ...p,
      author: authorLabel({ author: p.author, authorNickname, authorFullName }),
      due: dueDateFor(p, startsOn),
      acked: !!ackedAt,
    }));
    return feedOrder(items.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
  },
  async setAck(viewer: Viewer, id: number, acked: boolean) {
    await assertVisible(viewer, id);
    await (acked ? postRepository.ack(id, viewer.id) : postRepository.unack(id, viewer.id));
  },

  // ---- หลังบ้าน ----
  async listAll() {
    const rows = await postRepository.listAll();
    const ids = rows.map((r) => r.id);
    const [cohortRows, counts, interns] = await Promise.all([postRepository.cohortRows(ids), postRepository.ackCounts(ids), userRepository.activeInterns({})]);
    return rows.map((r) => {
      const cohortIds = cohortRows.filter((c) => c.postId === r.id).map((c) => c.cohortId);
      const audience = interns.filter((i) => visibleTo({ allCohorts: r.allCohorts, cohortIds }, i.cohortId)).length;
      return { ...r, cohortIds, acks: counts.find((c) => c.postId === r.id)?.n ?? 0, audience };
    });
  },
  async create(devId: number, input: PostInput) {
    await checkRefs(input);
    const id = await postRepository.create({ ...values(input), authorId: devId }, cohortsOf(input));
    await auditService.log(devId, "post.create", `#${id} ${input.title.trim()}`, POST_KIND_LABEL[input.kind]);
    const to = await audienceOf(input.allCohorts, cohortsOf(input));
    await notificationService.toUsers(to.map((u) => u.id), { kind: "new_post", title: `${POST_KIND_LABEL[input.kind]}ใหม่: ${input.title.trim()}`, link: FEED_LINK(id) });
    return { id };
  },
  async update(devId: number, id: number, input: PostInput) {
    if (!(await postRepository.find(id))) throw new Error("POST_NOT_FOUND");
    await checkRefs(input);
    await postRepository.update(id, { ...values(input), editedAt: new Date() }, cohortsOf(input));
    await auditService.log(devId, "post.update", `#${id} ${input.title.trim()}`);
  },
  async setPinned(devId: number, id: number, pinned: boolean) {
    const p = await postRepository.find(id);
    if (!p) throw new Error("POST_NOT_FOUND");
    await postRepository.setPinned(id, pinned);
    await auditService.log(devId, "post.pin", `#${id} ${p.title}`, pinned ? "ปักหมุด" : "เลิกปักหมุด");
  },
  async archive(devId: number, id: number) {
    const p = await postRepository.find(id);
    if (!p) throw new Error("POST_NOT_FOUND");
    await postRepository.archive(id, new Date());
    await auditService.log(devId, "post.archive", `#${id} ${p.title}`);
  },
  // ใครรับทราบแล้ว / ยังไม่รับทราบ (เฉพาะน้องในกลุ่มเป้าหมาย)
  async ackStatus(id: number) {
    const p = await postRepository.find(id);
    if (!p) throw new Error("POST_NOT_FOUND");
    const [audience, acks] = await Promise.all([audienceOf(p.allCohorts, await postRepository.cohortIdsOf(id)), postRepository.acksOf(id)]);
    return audience.map((u) => ({ username: u.username, ackedAt: acks.find((a) => a.userId === u.id)?.ackedAt ?? null }));
  },
};
