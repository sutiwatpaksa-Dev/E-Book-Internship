// ออก PIN ใหม่จาก Terminal ใช้ตอนพี่เลี้ยงลืม PIN จนเข้าหน้า admin ไม่ได้ (ปกติรีเซ็ตให้กันผ่านหน้า admin)
// ใช้: bun scripts/reset-pin.ts <username>
// อยากตั้ง PIN เอง: ใส่ใน env NEW_PIN (ผ่าน read -s ไม่ใส่ในคำสั่ง จะได้ไม่ติด history) ไม่ใส่ = สุ่มให้
// เรียกผ่าน service ชั้นเดียวกับหน้า admin: ได้กฎเดียวกัน (ปลดล็อก ล้างจำนวนครั้งที่ผิด) ไม่ต้องเขียนซ้ำ
import { userRepository } from "../server/repositories/user.repository";
import { userService } from "../server/services/user.service";

const [username] = process.argv.slice(2);
if (!username) {
  console.error("ใช้: bun scripts/reset-pin.ts <username>");
  process.exit(1);
}
const chosen = process.env.NEW_PIN;
if (chosen !== undefined && !/^\d{6}$/.test(chosen)) {
  console.error("NEW_PIN ต้องเป็นตัวเลข 6 หลัก");
  process.exit(1);
}
const found = await userRepository.findByUsername(username.toLowerCase());
if (!found) {
  console.error(`ไม่มี username "${username}"`);
  process.exit(1);
}
const { user, pin } = await userService.resetPin(found.id, chosen);
// PIN แสดงครั้งเดียว ระบบเก็บแค่ hash
console.log(chosen ? `ตั้ง PIN ที่เลือกให้ ${user.username} (${user.role}) แล้ว` : `ออก PIN ใหม่ให้ ${user.username} (${user.role}) แล้ว PIN: ${pin}`);
process.exit(0);
