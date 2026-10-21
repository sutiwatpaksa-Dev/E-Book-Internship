// สร้างบัญชีแรก (ปกติสร้างบัญชีผ่านหน้า admin แต่บัญชี Dev คนแรกต้องสร้างจากตรงนี้)
// ใช้: bun scripts/create-user.ts <username> <intern|dev>
import { db } from "../server/db/client";
import { ROLES, users, type Role } from "../server/db/schema";
import { hashPin, newPin } from "../server/lib/pin";

const [username, role] = process.argv.slice(2);
if (!username || !ROLES.includes(role as Role)) {
  console.error("ใช้: bun scripts/create-user.ts <username> <intern|dev>");
  process.exit(1);
}
const pin = newPin();
const [u] = await db
  .insert(users)
  .values({ username: username.toLowerCase(), role: role as Role, secretHash: await hashPin(pin) })
  .onConflictDoNothing()
  .returning({ id: users.id });
if (!u) {
  console.error(`มี username "${username}" แล้ว`);
  process.exit(1);
}
// PIN แสดงครั้งเดียว ระบบเก็บแค่ hash
console.log(`สร้าง ${username} (${role}) แล้ว PIN: ${pin}`);
process.exit(0);
