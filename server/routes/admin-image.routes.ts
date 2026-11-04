import { Hono } from "hono";
import type { AuthVars } from "../middleware/require-role";
import { imageService } from "../services/image.service";

// หลังบ้าน: อัปโหลดรูปใส่ Markdown · ต่ออยู่ใต้ admin.routes.ts จึงผ่านด่าน requireRole("dev") แล้ว
// ส่งไฟล์ดิบเป็น body (เหมือน PDF) ตอบ { url } ให้ใส่ใน ![คำอธิบาย](url)
export const adminImageRoutes = new Hono<AuthVars>();

adminImageRoutes.post("/", async (c) =>
  c.json(await imageService.save(c.get("user").id, Buffer.from(await c.req.arrayBuffer()), c.req.header("content-type") ?? ""), 201),
);
