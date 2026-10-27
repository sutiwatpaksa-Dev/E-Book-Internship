import type { Profile, ProfileFields } from "@/types";
import { jsonBody, request } from "./client";

export const profileApi = {
  get: () => request<Profile>("/profile"),
  update: (p: ProfileFields) => request<ProfileFields>("/profile", jsonBody("PUT", p)),
};
