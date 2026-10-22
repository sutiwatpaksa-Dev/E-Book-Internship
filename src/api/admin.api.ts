import type { AdminQuestion, FileInfo, IssuedPin, Role, User } from "@/types";
import { jsonBody, request } from "./client";

export const adminApi = {
  listUsers: () => request<User[]>("/admin/users"),
  createUser: (username: string, role: Role) => request<IssuedPin>("/admin/users", jsonBody("POST", { username, role })),
  resetPin: (id: number) => request<IssuedPin>(`/admin/users/${id}/reset-pin`, { method: "POST" }),
  updateUser: (id: number, changes: { role?: Role; disabled?: boolean; unlock?: true }) =>
    request<User>(`/admin/users/${id}`, jsonBody("PATCH", changes)),
  getRequirementInfo: () => request<FileInfo | null>("/admin/requirement"),
  uploadRequirement: (file: File) =>
    request<FileInfo>("/admin/requirement", { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file }),
  listQuestions: () => request<AdminQuestion[]>("/admin/questions"),
  answerQuestion: (id: number, answer: string) => request<null>(`/admin/questions/${id}/answer`, jsonBody("PUT", { answer })),
};
