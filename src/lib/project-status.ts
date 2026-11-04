import { nextWork, type PlanItem } from "./work-plan";

// สถานะรวมของโจทย์ 1 ชิ้นสำหรับน้อง 1 คน (ใช้บนหน้ารายการโจทย์และแถบสถานะบนหน้าโจทย์)
// มาจากแผนงานเดียวกับกระดานงาน (ผลตรวจจริงของพี่เลี้ยง) ไม่มีการติ๊กเอง
// empty = โจทย์นี้ยังไม่มีรอบส่ง · notstarted = ทุกรอบยังไม่ส่ง · progress = ผ่านบางรอบ ที่เหลือยังไม่ส่ง · closed = รุ่นจบแล้วและยังไม่ผ่านครบ
export type ProjectState = "empty" | "notstarted" | "progress" | "waiting" | "revise" | "late" | "pass" | "closed";

export type ProjectStatus = {
  state: ProjectState;
  total: number;
  passed: number;
  // รอบที่ส่งแล้ว (รอตรวจ ให้แก้ หรือผ่าน)
  sent: number;
  // งานถัดไปที่ต้องทำ (ยังไม่ส่ง เลยกำหนด หรือให้แก้) · null = ไม่มีอะไรต้องทำ
  next: PlanItem | null;
};

export function projectStatus(plan: PlanItem[], slug: string): ProjectStatus {
  const items = plan.filter((p) => p.assignment === slug);
  const total = items.length;
  const passed = items.filter((p) => p.state === "pass").length;
  const sent = items.filter((p) => p.state === "waiting" || p.state === "revise" || p.state === "pass").length;
  const next = nextWork(items);
  const has = (s: PlanItem["state"]) => items.some((p) => p.state === s);
  const state: ProjectState =
    total === 0 ? "empty"
    : passed === total ? "pass"
    : has("late") ? "late"
    : has("revise") ? "revise"
    : has("waiting") ? "waiting"
    : has("todo") ? (items.every((p) => p.state === "todo") ? "notstarted" : "progress")
    : "closed";
  return { state, total, passed, sent, next };
}

export const PROJECT_STATE_LABEL: Record<ProjectState, string> = {
  empty: "ยังไม่มีรอบส่ง",
  notstarted: "ยังไม่เริ่มส่ง",
  progress: "กำลังทำ",
  waiting: "รอพี่เลี้ยงตรวจ",
  revise: "ต้องแก้ส่งใหม่",
  late: "เลยกำหนดส่ง",
  pass: "ผ่านครบแล้ว",
  closed: "จบรุ่นแล้ว",
};
