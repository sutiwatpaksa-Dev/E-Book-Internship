"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { authApi } from "@/api/auth.api";
import { HOME } from "@/lib/home-path";
import type { Role } from "@/types";

// สลับบัญชีทดสอบ อยู่ในเมนูบัญชีมุมขวาบน (พี่เลี้ยง ↔ น้อง) ไม่ต้อง login ใหม่ทีละบัญชี
// แสดงเฉพาะตอนรัน dev (NODE_ENV ถูกฝังตอน build จึงไม่มีโค้ดนี้บน Vercel) และ API ตอบเฉพาะเมื่อฐานกับเว็บอยู่ในเครื่อง
// ไม่มีบัญชี demo.* (ยังไม่ได้ seed) = ไม่แสดงอะไรเลย
const ROLE_LABEL: Record<Role, string> = { dev: "พี่เลี้ยง", intern: "น้อง" };
// จำบัญชีจริงที่ใช้อยู่ก่อนสลับครั้งแรก เพื่อมีทางกลับ (เก็บแค่ชื่อ ไม่มีรหัส)
const FROM_KEY = "dev.switch.from";

export function DevSwitchMenu({ me }: { me: string | null }) {
  if (process.env.NODE_ENV === "production") return null;
  return <Items me={me} />;
}

function Items({ me }: { me: string | null }) {
  const [accounts, setAccounts] = useState<{ username: string; role: Role }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authApi
      .devAccounts()
      .then(setAccounts)
      .catch(() => setAccounts([]));
  }, []);

  if (accounts.length === 0) return null;
  const from = typeof localStorage === "undefined" ? null : localStorage.getItem(FROM_KEY);
  const isDemo = (u: string) => u.startsWith("demo.");
  // บัญชีจริงที่จำไว้ (ถ้ามี) อยู่บนสุดเป็นทางกลับ
  const list = from && !accounts.some((a) => a.username === from) ? [{ username: from, role: "dev" as Role, real: true }, ...accounts] : accounts;

  const go = async (a: { username: string; role: Role }) => {
    setBusy(true);
    try {
      if (me && !isDemo(me)) localStorage.setItem(FROM_KEY, me);
      const res = await authApi.devSwitch(a.username);
      // โหลดหน้าใหม่ทั้งหน้า: ทุก state ที่ผูกกับบัญชีเดิมต้องล้าง
      location.assign(HOME[res.role]);
    } catch {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mx-1.5 my-1 h-px bg-fd-border" />
      <p className="flex items-center gap-1.5 px-2.5 pt-1 text-xs font-semibold text-fd-muted-foreground">
        <Users className="size-3.5" aria-hidden /> Dev: สลับบัญชี (เฉพาะในเครื่อง)
      </p>
      <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
        {list.map((a) => (
          <button
            key={a.username}
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => go(a)}
            className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-2.5 text-start text-sm hover:bg-fd-accent disabled:opacity-50 ${a.username === me ? "bg-fd-primary/10 font-semibold" : ""}`}
          >
            <span className="truncate">{a.username}</span>
            <span className="shrink-0 text-xs text-fd-muted-foreground">{"real" in a ? "บัญชีเดิมของฉัน" : ROLE_LABEL[a.role]}</span>
          </button>
        ))}
      </div>
    </>
  );
}
