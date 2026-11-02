import { Hono } from "hono";
import { z } from "zod";
import { requireRole, type AuthVars } from "../middleware/require-role";
import { postService } from "../services/post.service";

// ฟีดของน้อง: เห็นเฉพาะโพสต์ของรุ่นตัวเองหรือทุกรุ่น (กรองที่ service) · id ผู้ใช้มาจากบัตรผ่านเสมอ
export const postRoutes = new Hono<AuthVars>();
postRoutes.use("*", requireRole("intern", "dev"));

const postId = (c: { req: { param: (k: string) => string } }) => {
  const n = Number(c.req.param("id"));
  if (!Number.isInteger(n) || n <= 0) throw new Error("POST_NOT_FOUND");
  return n;
};

postRoutes.get("/", async (c) => c.json(await postService.feed(c.get("user"))));

postRoutes.put("/:id/ack", async (c) => {
  const parsed = z.object({ acked: z.boolean() }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "ส่ง acked เป็น true หรือ false" }, 400);
  await postService.setAck(c.get("user"), postId(c), parsed.data.acked);
  return c.json({ ok: true });
});
