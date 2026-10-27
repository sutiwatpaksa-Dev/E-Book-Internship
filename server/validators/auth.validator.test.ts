import { describe, expect, test } from "bun:test";
import { sign } from "hono/jwt";
import { createSessionToken, readSessionToken } from "../lib/session";
import { loginSchema, passwordProblem } from "./auth.validator";

describe("login: ช่องเดียวรับ PIN หรือรหัสผ่าน", () => {
  test("PIN 6 หลัก หรือรหัสผ่าน 10 ตัวขึ้นไป", () => {
    expect(loginSchema.safeParse({ username: "A.B", secret: "123456" }).data).toEqual({ username: "a.b", secret: "123456" });
    expect(loginSchema.safeParse({ username: "a", secret: "correct horse" }).success).toBe(true);
    expect(loginSchema.safeParse({ username: "a", secret: "12345" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "a", secret: "short" }).success).toBe(false);
  });
  test("แท็บเก่าที่ยังส่ง pin มา ยัง login ได้", () => {
    expect(loginSchema.safeParse({ username: "a", pin: "123456" }).data?.secret).toBe("123456");
  });
});

describe("กติการหัสผ่าน", () => {
  test("ผ่านเมื่อยาวพอ ไม่ซ้ำตัวเดียว ไม่มีชื่อผู้ใช้", () => {
    expect(passwordProblem("ห้องสมุดเปิด8โมง", "somchai.j")).toBeNull();
    expect(passwordProblem("short", "a")).toContain("อย่างน้อย 10");
    expect(passwordProblem("aaaaaaaaaaaa", "b")).toContain("ซ้ำ");
    expect(passwordProblem("xxSomchai.J2026", "somchai.j")).toContain("ชื่อผู้ใช้");
  });
});

describe("บัตรผ่าน", () => {
  const secret = "x".repeat(32);
  test("เก็บ ver และ tmp", async () => {
    const t = await createSessionToken({ userId: 1, username: "a", role: "intern", ver: 3, tmp: true }, secret);
    expect(await readSessionToken(t, secret)).toEqual({ userId: 1, username: "a", role: "intern", ver: 3, tmp: true });
  });
  test("บัตรที่ออกก่อนอัปเดต (ไม่มี ver/tmp) ยังใช้ได้ เป็นรอบ 0", async () => {
    const old = await sign({ sub: "1", username: "a", role: "dev", exp: Math.floor(Date.now() / 1000) + 60 }, secret, "HS256");
    expect(await readSessionToken(old, secret)).toEqual({ userId: 1, username: "a", role: "dev", ver: 0, tmp: false });
  });
});
