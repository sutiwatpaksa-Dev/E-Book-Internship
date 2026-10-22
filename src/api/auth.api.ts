import type { Role } from "@/types";
import { jsonBody, request } from "./client";

export const authApi = {
  login: (username: string, pin: string) => request<{ username: string; role: Role }>("/auth/login", jsonBody("POST", { username, pin })),
  logout: () => request<null>("/auth/logout", { method: "POST" }),
  me: () => request<{ username: string; role: Role }>("/auth/me"),
};
