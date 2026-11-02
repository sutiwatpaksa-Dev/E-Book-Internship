import { Hono } from "hono";
import type { AuthVars } from "../middleware/require-role";
import { postService } from "../services/post.service";
import { pinSchema, postSchema } from "../validators/post.validator";

// หลังบ้าน: โพสต์ในฟีด · ต่ออยู่ใต้ admin.routes.ts จึงผ่านด่าน requireRole("dev") ของที่นั่นแล้ว
export const adminPostRoutes = new Hono<AuthVars>();

const json = (c: { req: { json: () => Promise<unknown> } }) => c.req.json().catch(() => null);
const postId = (c: { req: { param: (k: string) => string } }) => {
  const n = Number(c.req.param("id"));
  if (!Number.isInteger(n) || n <= 0) throw new Error("POST_NOT_FOUND");
  return n;
};
// ข้อความผิดข้อแรกจากกฎใน src/lib/post.ts (ฟอร์มใช้กฎเดียวกัน)
const firstError = (error: { issues: { message: string }[] }) => error.issues[0]?.message ?? "ข้อมูลโพสต์ไม่ถูกต้อง";

adminPostRoutes.get("/", async (c) => c.json(await postService.listAll()));

adminPostRoutes.post("/", async (c) => {
  const parsed = postSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: firstError(parsed.error) }, 400);
  return c.json(await postService.create(c.get("user").id, parsed.data), 201);
});

adminPostRoutes.put("/:id", async (c) => {
  const parsed = postSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: firstError(parsed.error) }, 400);
  await postService.update(c.get("user").id, postId(c), parsed.data);
  return c.json({ ok: true });
});

adminPostRoutes.patch("/:id/pin", async (c) => {
  const parsed = pinSchema.safeParse(await json(c));
  if (!parsed.success) return c.json({ error: "ส่ง pinned เป็น true หรือ false" }, 400);
  await postService.setPinned(c.get("user").id, postId(c), parsed.data.pinned);
  return c.json({ ok: true });
});

adminPostRoutes.patch("/:id/archive", async (c) => {
  await postService.archive(c.get("user").id, postId(c));
  return c.json({ ok: true });
});

adminPostRoutes.get("/:id/acks", async (c) => c.json(await postService.ackStatus(postId(c))));
