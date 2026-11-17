import type { LeaveKind, LeaveRow } from "@/lib/attendance";
import { jsonBody, request } from "./client";

export const leaveApi = {
  mine: () => request<LeaveRow[]>("/leave"),
  request: (input: { workDate: string; kind: LeaveKind; reason: string }) => request<null>("/leave", jsonBody("POST", input)),
  withdraw: (id: number) => request<null>(`/leave/${id}`, { method: "DELETE" }),
};
