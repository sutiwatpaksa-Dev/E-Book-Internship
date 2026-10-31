import { describe, expect, test } from "bun:test";
import { devSwitchAllowed } from "./dev-switch";

const local = { NODE_ENV: "development", DATABASE_URL: "postgres://u:p@localhost:5544/ebook", APP_ORIGIN: "http://localhost:3000" };

describe("ปุ่มสลับบัญชีในเครื่อง", () => {
  test("เปิดเมื่อครบ: ไม่ใช่ production + ฐานในเครื่อง + เว็บ localhost", () => {
    expect(devSwitchAllowed(local)).toBe(true);
  });
  test("production ปิดเสมอ แม้ค่าอื่นเป็น localhost", () => {
    expect(devSwitchAllowed({ ...local, NODE_ENV: "production" })).toBe(false);
  });
  test("ฐานข้อมูลไม่ใช่ในเครื่อง = ปิด", () => {
    expect(devSwitchAllowed({ ...local, DATABASE_URL: "postgres://u:p@ep-x.neon.tech/db" })).toBe(false);
  });
  test("เว็บไม่ได้เปิดจาก localhost = ปิด", () => {
    expect(devSwitchAllowed({ ...local, APP_ORIGIN: "https://e-book-internship.vercel.app" })).toBe(false);
  });
  test("ค่าเสีย = ปิด", () => {
    expect(devSwitchAllowed({ ...local, DATABASE_URL: "not a url" })).toBe(false);
  });
});
