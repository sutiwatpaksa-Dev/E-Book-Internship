// ตั้งหรือถอด Super admin จาก Terminal (หน้า admin ทำไม่ได้โดยตั้งใจ: บัญชีพี่เลี้ยงที่หลุดจะได้ตั้งตัวเองไม่ได้)
// ใช้: bun scripts/set-super-admin.ts <username>          ตั้งให้
//      bun scripts/set-super-admin.ts <username> --off    ถอดออก
// กับฐาน preview/production: ใส่ --env-file=<ไฟล์ env ของฐานนั้น> และต้องได้รับอนุมัติก่อน (เป็นการเขียน DB)
import { userRepository } from "../server/repositories/user.repository";

const [username, flag] = process.argv.slice(2);
if (!username || (flag && flag !== "--off")) {
  console.error("ใช้: bun scripts/set-super-admin.ts <username> [--off]");
  process.exit(1);
}
const found = await userRepository.findByUsername(username.toLowerCase());
if (!found) {
  console.error(`ไม่มี username "${username}"`);
  process.exit(1);
}
// ธงมีผลกับพี่เลี้ยงเท่านั้น ตั้งให้บัญชีน้องไว้ก่อนแล้วค่อยเลื่อนทีหลัง จะได้สิทธิ์โดยไม่มีใครตั้งใจ
if (found.role !== "dev") {
  console.error(`${found.username} เป็น ${found.role} ตั้ง Super admin ได้เฉพาะบัญชีพี่เลี้ยง (dev)`);
  process.exit(1);
}
const on = flag !== "--off";
await userRepository.update(found.id, { superAdmin: on });
const supers = (await userRepository.listPublic()).filter((u) => u.role === "dev" && u.superAdmin && !u.disabled);
console.log(`${on ? "ตั้ง" : "ถอด"} Super admin ของ ${found.username} แล้ว · ตอนนี้มี Super admin ${supers.length} คน: ${supers.map((u) => u.username).join(", ") || "ไม่มี"}`);
if (supers.length === 0) console.log("ไม่มี Super admin เหลือ: จะไม่มีใครสร้างหรือจัดการบัญชีพี่เลี้ยงจากหน้า admin ได้ จนกว่าจะตั้งใหม่");
process.exit(0);
