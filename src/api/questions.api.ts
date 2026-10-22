import type { Question } from "@/types";
import { jsonBody, request } from "./client";

export const questionsApi = {
  mine: () => request<Question[]>("/questions/mine"),
  ask: (pageUrl: string, body: string) => request<Question>("/questions", jsonBody("POST", { pageUrl, body })),
};
