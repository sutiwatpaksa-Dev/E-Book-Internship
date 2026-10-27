"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "@/hooks/use-session";
import { safeNext } from "@/lib/home-path";
import type { Role } from "@/types";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";

// หน้า login ใช้บนมือถือบ่อย ช่องกรอกและปุ่มสูง 48px (เกินขั้นต่ำ 44px) และตัวอักษร 16px กัน iOS ซูมเข้าเองตอนแตะช่อง
const bigInput = `${inputClass} min-h-12 text-base`;

// ไม่มี ?next= (กด "เข้าสู่ระบบ" จากเมนูเอง) → ไปหน้าแรกของบทบาทนั้น
const nextPath = (role: Role) => safeNext(new URLSearchParams(location.search).get("next"), role);

export function LoginForm() {
  const { login } = useSession();
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(username, secret);
      // โหลดหน้าใหม่ทั้งหน้า ให้ server ตรวจสิทธิ์พร้อม cookie ใหม่
      // เข้าด้วย PIN ชั่วคราว: ไปตั้งรหัสผ่านก่อน แล้วค่อยไปหน้าที่ตั้งใจ (ส่ง next ต่อไปด้วย)
      const next = nextPath(user.role);
      location.assign(user.mustSetPassword ? `/set-password?next=${encodeURIComponent(next)}` : next);
    } catch (err) {
      setError((err as Error).message);
      setSecret("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="ชื่อผู้ใช้">
        <Input
          className={bigInput}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </Field>
      {/* ช่องเดียวรับทั้ง PIN ชั่วคราวจากพี่เลี้ยง (ครั้งแรก) และรหัสผ่านที่ตั้งเอง จึงไม่บังคับแป้นตัวเลข */}
      <Field label="รหัสผ่าน หรือ PIN จากพี่เลี้ยง" hint="ครั้งแรกใช้ PIN 6 หลักที่พี่เลี้ยงส่งให้ แล้วระบบจะให้ตั้งรหัสผ่านของตัวเอง">
        <Input className={bigInput} value={secret} onChange={(e) => setSecret(e.target.value)} type="password" autoComplete="current-password" maxLength={128} required />
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" disabled={busy} className="min-h-12 text-base">
        {busy ? "กำลังตรวจ…" : "เข้าสู่ระบบ"}
      </Button>
    </form>
  );
}
