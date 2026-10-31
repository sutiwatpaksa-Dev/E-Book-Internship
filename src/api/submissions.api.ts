import type { AdminSubmission, CommentSend, MySubmissions, SubmitInput, TaskComment } from "@/types";
import { jsonBody, request } from "./client";

export const submissionsApi = {
  mine: () => request<MySubmissions>("/submissions"),
  submit: (input: SubmitInput) => request<{ id: number }>("/submissions", jsonBody("POST", input)),
  // หลังบ้าน
  all: () => request<{ items: AdminSubmission[]; waiting: number }>("/admin/submissions"),
  review: (id: number, verdict: "pass" | "revise", review: string, scores?: Record<string, number>) =>
    request<null>(`/admin/submissions/${id}/review`, jsonBody("PUT", { verdict, review, ...(scores ? { scores } : {}) })),
  // ความเห็นใต้งาน: งาน = โจทย์ + รอบ · ของน้อง (ตัวเอง) และของพี่เลี้ยง (ระบุน้อง)
  comments: (assignment: string, round: string) => request<TaskComment[]>(`/submissions/${assignment}/${round}/comments`),
  comment: (assignment: string, round: string, input: CommentSend) => request<{ id: number }>(`/submissions/${assignment}/${round}/comments`, jsonBody("POST", input)),
  commentsOf: (userId: number, assignment: string, round: string) => request<TaskComment[]>(`/admin/submissions/comments/${userId}/${assignment}/${round}`),
  commentTo: (userId: number, assignment: string, round: string, input: CommentSend) =>
    request<{ id: number }>(`/admin/submissions/comments/${userId}/${assignment}/${round}`, jsonBody("POST", input)),
};
