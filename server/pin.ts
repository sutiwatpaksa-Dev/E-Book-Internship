import { randomInt } from "node:crypto";

// PIN 6 หลักสุ่มแยกรายคน (randomInt ใช้ตัวสุ่มที่ปลอดภัยพอสำหรับงานความปลอดภัย ต่างจาก Math.random)
export function newPin() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export const hashPin = (pin: string) => Bun.password.hash(pin); // argon2id
