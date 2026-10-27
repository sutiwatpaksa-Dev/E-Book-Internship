"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "@/hooks/use-session";
import type { Role } from "@/types";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";

// หน้า login ใช้บนมือถือบ่อย ช่องกรอกและปุ่มสูง 48px (เกินขั้นต่ำ 44px) และตัวอักษร 16px กัน iOS ซูมเข้าเองตอนแตะช่อง
const bigInput = `${inputClass} min-h-12 text-base`;

// ไม่มี ?next= (กด "เข้าสู่ระบบ" จากเมนูเอง) → ไปหน้าที่ใช้บ่อยที่สุดของบทบาทนั้น: พี่เลี้ยงไปหลังบ้าน น้องไปหน้าวันนี้ (ทำต่อจากที่ค้าง)
const HOME: Record<Role, string> = { dev: "/dev/admin", intern: "/today" };

// รับเฉพาะ path ภายในเว็บเรา กันคนส่งลิงก์ login?next=https://เว็บปลอม มาหลอก
function nextPath(role: Role) {
  const next = new URLSearchParams(location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : HOME[role];
}

export function LoginForm() {
  const { login } = useSession();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const role = await login(username, pin);
      // โหลดหน้าใหม่ทั้งหน้า ให้ server ตรวจสิทธิ์พร้อม cookie ใหม่
      location.assign(nextPath(role));
    } catch (err) {
      setError((err as Error).message);
      setPin("");
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
      <Field label="PIN 6 หลัก">
        <Input
          className={`${bigInput} tracking-[0.4em]`}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="\d{6}"
          maxLength={6}
          required
        />
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" disabled={busy} className="min-h-12 text-base">
        {busy ? "กำลังตรวจ…" : "เข้าสู่ระบบ"}
      </Button>
    </form>
  );
}
