import type { Notification } from "@/types";
import { jsonBody, request } from "./client";

export const notificationsApi = {
  list: () => request<{ items: Notification[]; unread: number }>("/notifications"),
  unread: () => request<{ count: number }>("/notifications/unread"),
  // ไม่ส่ง ids = อ่านทั้งหมด
  markRead: (ids?: number[]) => request<null>("/notifications/read", jsonBody("POST", { ids })),
};
