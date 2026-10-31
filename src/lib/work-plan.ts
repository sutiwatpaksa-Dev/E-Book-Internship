import { daysBetween, todayTH, workdayDate } from "./cohort";
import { isReviewable, latestOnly, type RoundDef } from "./submission";

// แผนงานของน้อง: รอบส่งของโจทย์ (วันที่ N ของรุ่น) แปลงเป็นวันที่จริง + สถานะจากงานที่ส่งแล้ว
// ใช้คำนวณทั้งหน้า Dashboard ของน้อง และเป็นฐานของมุมมองพี่เลี้ยง · กฎอยู่ที่นี่ที่เดียวเพื่อให้ทดสอบได้
// closed = รุ่นจบแล้วและงานนี้ยังไม่ได้ผ่าน (ส่งเพิ่มไม่ได้แล้ว) แสดงสีเทา ไม่ใช่ "เลยกำหนด" สีแดง
export type WorkState = "todo" | "late" | "waiting" | "revise" | "pass" | "closed";

export type PlanSubmission = { assignment: string; round: string; createdAt: string; verdict: "pass" | "revise" | null; reviewedAt: string | null; review?: string | null };
export type PlanItem = {
  assignment: string;
  assignmentName: string;
  round: RoundDef;
  // ว่าง = น้องยังไม่มีรุ่น (ไม่รู้วันเริ่ม) จึงบอกได้แค่ "วันที่ N"
  dueOn: string | null;
  // กี่วันจากวันนี้ถึงกำหนด (ติดลบ = เลยมาแล้ว) · null เมื่อไม่มี dueOn
  daysLeft: number | null;
  state: WorkState;
  // ส่งหลังกำหนดกี่วัน (0 = ทันหรือยังไม่ส่ง)
  lateDays: number;
  // ความเห็นของพี่เลี้ยงในการส่งล่าสุดของรอบนี้ (ถ้ามี)
  review: string | null;
};

type Input = {
  assignments: { slug: string; name: string; rounds: RoundDef[] }[];
  // เรียงใหม่สุดก่อน (เหมือนที่ API ส่งมา)
  submissions: PlanSubmission[];
  startsOn: string | null;
  // รุ่นจบแล้ว: งานที่ยังไม่ผ่านและไม่ได้รอตรวจเป็น closed
  ended?: boolean;
  today?: string;
};

const dayOf = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });

export function buildPlan({ assignments, submissions, startsOn, ended = false, today = todayTH() }: Input): PlanItem[] {
  const latest = latestOnly(submissions.map((s) => ({ ...s, userId: 0 })));
  const items: PlanItem[] = [];
  for (const a of assignments) {
    for (const round of a.rounds) {
      if (!isReviewable(round.id)) continue;
      const sub = latest.find((s) => s.assignment === a.slug && s.round === round.id);
      const dueOn = startsOn ? workdayDate(startsOn, round.day) : null;
      const daysLeft = dueOn ? daysBetween(today, dueOn) : null;
      const open: WorkState = !sub ? (daysLeft !== null && daysLeft < 0 ? "late" : "todo") : sub.verdict === "pass" ? "pass" : sub.verdict === "revise" ? "revise" : "waiting";
      const state: WorkState = ended && (open === "todo" || open === "late" || open === "revise") ? "closed" : open;
      const lateDays = sub && dueOn ? Math.max(0, daysBetween(dueOn, dayOf(sub.createdAt))) : 0;
      items.push({ assignment: a.slug, assignmentName: a.name, round, dueOn, daysLeft, state, lateDays, review: sub?.review ?? null });
    }
  }
  // เรียงตามกำหนดส่ง (ไม่มีวันที่ = เรียงตามวันที่ N) แล้วค่อยตามชื่อโจทย์ให้ลำดับคงที่
  return items.sort((x, y) => (x.dueOn ?? "").localeCompare(y.dueOn ?? "") || x.round.day - y.round.day || x.assignmentName.localeCompare(y.assignmentName));
}

// งานถัดไปที่น้องต้องทำ: รอบแรกที่ยังไม่ผ่าน (รอตรวจนับว่าส่งแล้ว ข้ามไปรอบถัดไป)
export const nextWork = (plan: PlanItem[]) => plan.find((p) => p.state === "todo" || p.state === "late" || p.state === "revise") ?? null;

export const WORK_STATE_LABEL: Record<WorkState, string> = { todo: "ยังไม่ส่ง", late: "เลยกำหนด", waiting: "รอตรวจ", revise: "ให้แก้", pass: "ผ่านแล้ว", closed: "จบรุ่นแล้ว" };

// "เหลือ 2 วัน" / "วันนี้" / "เลยมา 3 วัน" ใช้ข้างวันที่กำหนดส่ง
export function dueLabel(daysLeft: number | null): string | null {
  if (daysLeft === null) return null;
  if (daysLeft === 0) return "ส่งวันนี้";
  return daysLeft > 0 ? `เหลือ ${daysLeft} วัน` : `เลยมา ${-daysLeft} วัน`;
}

// ค่าเริ่มต้นของธงเตือนฝั่งพี่เลี้ยง (T2) · ยังไม่มีเลขจากพี่เลี้ยง จึงตั้งไว้ตรงนี้ที่เดียว แก้เลขแล้วทุกหน้าตามกัน
export const REVIEW_WAIT_DAYS = 2;

// สรุปงานของน้อง 1 คนสำหรับหน้าภาพรวมของพี่เลี้ยง: เลยกำหนดกี่รอบ / รอตรวจกี่รอบ (รอนานเกินเกณฑ์กี่รอบ) / ให้แก้กี่รอบ
export function workSummary(plan: PlanItem[], submissions: { createdAt: string; round: string; assignment: string; reviewedAt: string | null }[], today = todayTH()) {
  const waitingItems = plan.filter((p) => p.state === "waiting");
  const oldWaiting = waitingItems.filter((p) => {
    const sub = submissions.find((x) => x.assignment === p.assignment && x.round === p.round.id);
    return !!sub && daysBetween(dayOf(sub.createdAt), today) >= REVIEW_WAIT_DAYS;
  });
  return {
    late: plan.filter((p) => p.state === "late").length,
    waiting: waitingItems.length,
    oldWaiting: oldWaiting.length,
    revise: plan.filter((p) => p.state === "revise").length,
    passed: plan.filter((p) => p.state === "pass").length,
    total: plan.length,
  };
}
