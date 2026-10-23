import type { ProgressEntry } from "@/types";
import { jsonBody, request } from "./client";

export const progressApi = {
  list: () => request<ProgressEntry[]>("/progress"),
  set: (link: string, done: boolean) => request<null>("/progress", jsonBody("PUT", { link, done })),
  importLocal: (links: string[]) => request<ProgressEntry[]>("/progress/import", jsonBody("POST", { links })),
};
