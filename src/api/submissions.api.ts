import type { AdminSubmission, CommentSend, MySubmissions, ReviewPage, ReviewQuery, ReviewSummary, SubmitInput, TaskComment } from "@/types";
import { jsonBody, request } from "./client";

const queryOf = (q: ReviewQuery) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const submissionsApi = {
  mine: () => request<MySubmissions>("/submissions"),
  submit: (input: SubmitInput) => request<{ id: number }>("/submissions", jsonBody("POST", input)),
  // หลังบ้าน
  all: () => request<{ items: AdminSubmission[]; waiting: number }>("/admin/submissions"),
  // หน้าตรวจงานแบบเจาะลง: กรอง/นับ/แบ่งหน้าที่ server · ส่งเฉพาะค่าที่ตั้ง (ไม่ส่ง = ใช้ค่าเริ่มต้นของ server)
  reviewPage: (q: ReviewQuery) => request<ReviewPage>(`/admin/submissions/page${queryOf(q)}`),
  reviewSummary: (cohort: number) => request<ReviewSummary>(`/admin/submissions/summary?cohort=${cohort}`),
  review: (id: number, verdict: "pass" | "revise", review: string, scores?: Record<string, number>) =>
    request<null>(`/admin/submissions/${id}/review`, jsonBody("PUT", { verdict, review, ...(scores ? { scores } : {}) })),
  // ความเห็นใต้งาน: งาน = โจทย์ + รอบ · ของน้อง (ตัวเอง) และของพี่เลี้ยง (ระบุน้อง)
  comments: (assignment: string, round: string) => request<TaskComment[]>(`/submissions/${assignment}/${round}/comments`),
  comment: (assignment: string, round: string, input: CommentSend) => request<{ id: number }>(`/submissions/${assignment}/${round}/comments`, jsonBody("POST", input)),
  commentsOf: (userId: number, assignment: string, round: string) => request<TaskComment[]>(`/admin/submissions/comments/${userId}/${assignment}/${round}`),
  commentTo: (userId: number, assignment: string, round: string, input: CommentSend) =>
    request<{ id: number }>(`/admin/submissions/comments/${userId}/${assignment}/${round}`, jsonBody("POST", input)),
};
