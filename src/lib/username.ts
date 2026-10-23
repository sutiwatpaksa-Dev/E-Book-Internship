// กติกาชื่อผู้ใช้ที่เดียว ใช้ทั้งฝั่ง server (zod) และหน้าเว็บ (ตรวจก่อนส่ง) กฎสองฝั่งจึงไม่มีวันไม่ตรงกัน
// ตัวพิมพ์เล็ก ตัวเลข . _ - เท่านั้น ยาว 3–64 ตัว รูปแบบจริงพี่เลี้ยงกำหนดเอง
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,64}$/;

// บอกว่าผิดเพราะอะไร พี่เลี้ยงจะได้แก้ถูกจุด (null = ใช้ได้)
export function usernameProblem(name: string): string | null {
  if (name.length < 3) return "สั้นกว่า 3 ตัว";
  if (name.length > 64) return "ยาวเกิน 64 ตัว";
  if (/\s/.test(name)) return "มีช่องว่าง";
  if (!USERNAME_PATTERN.test(name)) return "มีตัวอักษรที่ใช้ไม่ได้ (ใช้ได้แค่ a-z 0-9 . _ -)";
  return null;
}

// รายชื่อที่วางมา: บรรทัดละคน (คั่นด้วยจุลภาค / แท็บจาก Excel ก็ได้) · ไม่แยกด้วยช่องว่าง
// เพราะ "somchai j" คือคนเดียวที่พิมพ์ผิด ถ้าแยกจะได้สองบัญชีที่ไม่มีใครตั้งใจสร้าง
export function parseUsernameList(text: string) {
  const names = [...new Set(text.split(/[\r\n,;\t]+/).map((n) => n.trim().toLowerCase()).filter(Boolean))];
  const valid: string[] = [];
  const invalid: { username: string; error: string }[] = [];
  for (const username of names) {
    const error = usernameProblem(username);
    if (error) invalid.push({ username, error });
    else valid.push(username);
  }
  return { valid, invalid };
}
