import type { PostInput } from "@/lib/post";
import type { AdminPost, FeedPost, PostAck } from "@/types";
import { jsonBody, request } from "./client";

// ฟีดของน้อง (server กรองตามรุ่นให้แล้ว)
export const postsApi = {
  feed: () => request<FeedPost[]>("/posts"),
  setAck: (id: number, acked: boolean) => request<{ ok: true }>(`/posts/${id}/ack`, jsonBody("PUT", { acked })),
};

// หลังบ้าน: โพสต์ทุกชิ้น
export const adminPostsApi = {
  list: () => request<AdminPost[]>("/admin/posts"),
  create: (p: PostInput) => request<{ id: number }>("/admin/posts", jsonBody("POST", p)),
  update: (id: number, p: PostInput) => request<{ ok: true }>(`/admin/posts/${id}`, jsonBody("PUT", p)),
  setPinned: (id: number, pinned: boolean) => request<{ ok: true }>(`/admin/posts/${id}/pin`, jsonBody("PATCH", { pinned })),
  archive: (id: number) => request<{ ok: true }>(`/admin/posts/${id}/archive`, jsonBody("PATCH", {})),
  acks: (id: number) => request<PostAck[]>(`/admin/posts/${id}/acks`),
};
