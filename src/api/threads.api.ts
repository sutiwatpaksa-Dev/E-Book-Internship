import type { NewThread, ThreadDetail, ThreadSummary } from "@/types";
import { jsonBody, request } from "./client";

export const threadsApi = {
  list: () => request<ThreadSummary[]>("/threads"),
  unread: () => request<{ count: number }>("/threads/unread-count"),
  create: (t: NewThread) => request<{ id: number }>("/threads", jsonBody("POST", t)),
  get: (id: number) => request<ThreadDetail>(`/threads/${id}`),
  reply: (id: number, body: string) => request<null>(`/threads/${id}/messages`, jsonBody("POST", { body })),
};
