"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { submissionsApi } from "@/api/submissions.api";
import { useMyMentors } from "@/hooks/use-my-mentors";
import { toast } from "@/hooks/use-toast";
import { sendToLine } from "@/lib/mentors";
import { deployProblem, repoProblem, type RoundDef } from "@/lib/submission";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { Field, Input, inputClass } from "./field";

// กล่องส่งงานของโพสต์ 1 ชิ้น (6 พ.ย. 2569): อยู่ในหน้างานเลย ไม่ต้องไปเลือกรอบอีกหน้า · ไม่ใช้ tag พี่เลี้ยงเปิดโค้ดล่าสุดตอนตรวจ
// ช่องลิงก์เว็บขึ้นเฉพาะโพสต์ที่พี่เลี้ยงติ๊ก "ต้องส่งลิงก์เว็บ" และเป็นช่องบังคับ (server ตรวจซ้ำ)
// ปุ่มส่งไม่ปิด: กดแล้วบอกว่ายังขาดอะไรใต้ปุ่ม (ปุ่มที่กดไม่ได้โดยไม่บอกเหตุผลทำให้น้องงง)
export function PostSubmitBox({ assignment, round, lastRepo, lastDeploy, resend, onSent }: { assignment: string; round: RoundDef; lastRepo: string; lastDeploy: string; resend: boolean; onSent: () => void }) {
  const [repoUrl, setRepoUrl] = useState(lastRepo);
  const [deployUrl, setDeployUrl] = useState(lastDeploy);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const to = sendToLine(useMyMentors());

  const repoErr = repoUrl || tried ? repoProblem(repoUrl) : null;
  const deployErr = !round.deploy ? null : deployUrl ? deployProblem(deployUrl) : tried ? "ใส่ลิงก์เว็บที่ deploy แล้ว (ขึ้นต้นด้วย https://)" : null;
  const missing = [repoProblem(repoUrl) && "ลิงก์ repo", round.deploy && (!deployUrl.trim() || deployProblem(deployUrl)) && "ลิงก์เว็บ"].filter(Boolean) as string[];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (missing.length) return;
    setSending(true);
    setError(null);
    try {
      await submissionsApi.submit({ assignment, round: round.id, repoUrl, ref: "", deployUrl: round.deploy ? deployUrl : "", note });
      toast.success(to ? `ส่งงานแล้ว ${to.replace("ส่งถึง", "แจ้ง")} แล้ว` : "ส่งงานแล้ว พี่เลี้ยงได้รับแจ้งเตือน");
      setNote("");
      setTried(false);
      onSent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form id="ส่งงาน" onSubmit={submit} aria-labelledby="send-title" className="flex flex-col gap-3 rounded-2xl border-2 border-fd-primary bg-fd-card p-4 text-sm sm:p-5">
      <div>
        <h2 id="send-title" className="text-lg font-bold">
          {resend ? "ส่งงานที่แก้แล้ว" : "ส่งงานรอบนี้"}
        </h2>
        <p className="text-fd-muted-foreground">push โค้ดล่าสุดขึ้น GitHub แล้วกดส่ง พี่เลี้ยงเปิดดูโค้ดล่าสุดตอนตรวจ</p>
      </div>
      <Field label="ลิงก์ repo บน GitHub" hint={lastRepo ? "เติมจากครั้งก่อนให้แล้ว" : "repo แบบ private ต้องเชิญพี่เลี้ยงเป็น collaborator ก่อน"}>
        <Input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/somchai/starter" inputMode="url" autoCapitalize="none" spellCheck={false} maxLength={300} aria-invalid={!!repoErr} />
      </Field>
      {repoErr && <p role="alert" className="-mt-2 text-red-700 dark:text-red-400">{repoErr}</p>}
      {round.deploy && (
        <>
          <Field label="ลิงก์เว็บที่ deploy แล้ว" hint="ต้องเปิดได้โดยไม่ login ลองเปิดในหน้าต่าง Incognito ก่อนส่ง">
            <Input value={deployUrl} onChange={(e) => setDeployUrl(e.target.value)} placeholder="https://starter-ชื่อเล่น.vercel.app" inputMode="url" autoCapitalize="none" spellCheck={false} maxLength={300} aria-invalid={!!deployErr} />
          </Field>
          {deployErr && <p role="alert" className="-mt-2 text-red-700 dark:text-red-400">{deployErr}</p>}
        </>
      )}
      <Field label="ข้อความถึงพี่เลี้ยง (ไม่บังคับ)">
        <textarea className={`${inputClass} min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="รอบนี้ทำอะไรเสร็จ ยังค้างตรงไหน อยากให้ดูอะไรเป็นพิเศษ" />
      </Field>
      {error && <ErrorText>ส่งไม่สำเร็จ: {error}</ErrorText>}
      {tried && missing.length > 0 && <p className="font-medium text-amber-800 dark:text-amber-300">ยังขาด: {missing.join(", ")}</p>}
      <Button type="submit" disabled={sending} className="min-h-12 w-full justify-center text-base">
        <Send className="size-4" /> {sending ? "กำลังส่ง…" : resend ? "ส่งงานที่แก้แล้ว" : "ส่งงาน"}
      </Button>
      {to && <p className="text-xs text-fd-muted-foreground">{to} ทันทีที่กดส่ง</p>}
    </form>
  );
}
