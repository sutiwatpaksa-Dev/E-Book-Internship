import type { AdminSubmission, MySubmissions, SubmitInput } from "@/types";
import { jsonBody, request } from "./client";

export const submissionsApi = {
  mine: () => request<MySubmissions>("/submissions"),
  submit: (input: SubmitInput) => request<{ id: number }>("/submissions", jsonBody("POST", input)),
  // หลังบ้าน
  all: () => request<{ items: AdminSubmission[]; waiting: number }>("/admin/submissions"),
  review: (id: number, verdict: "pass" | "revise", review: string) => request<null>(`/admin/submissions/${id}/review`, jsonBody("PUT", { verdict, review })),
};
