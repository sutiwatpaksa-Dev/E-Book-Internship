"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { submissionsApi } from "@/api/submissions.api";
import { useMyMentors } from "@/hooks/use-my-mentors";
import { toast } from "@/hooks/use-toast";
import { sendToLine } from "@/lib/mentors";
import { deployProblem, hasLink, hasRepo, submitProblem, type DeliverableKind, type RoundDef } from "@/lib/submission";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { Field, Input } from "./field";
import { SubmitLinkField, SubmitNoteField } from "./submit-link-field";

// กล่องส่งงานของโพสต์ 1 ชิ้น (6 พ.ย. 2569): อยู่ในหน้างานเลย ไม่ต้องไปเลือกรอบอีกหน้า · ไม่ใช้ tag พี่เลี้ยงเปิดโค้ดล่าสุดตอนตรวจ
// ช่องลิงก์เว็บขึ้นเฉพาะโพสต์ที่พี่เลี้ยงติ๊ก "ต้องส่งลิงก์เว็บ" และเป็นช่องบังคับ (server ตรวจซ้ำ)
// ปุ่มส่งไม่ปิด: กดแล้วบอกว่ายังขาดอะไรใต้ปุ่ม (ปุ่มที่กดไม่ได้โดยไม่บอกเหตุผลทำให้น้องงง)
export function PostSubmitBox({ assignment, kind, round, lastRepo, lastDeploy, resend, onSent }: { assignment: string; kind: DeliverableKind; round: RoundDef; lastRepo: string; lastDeploy: string; resend: boolean; onSent: () => void }) {
  const [repoUrl, setRepoUrl] = useState(lastRepo);
  const [deployUrl, setDeployUrl] = useState(lastDeploy);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const to = sendToLine(useMyMentors());

  // กฎช่องส่งขึ้นกับชนิดงาน: ลิงก์ (repo/ทั่วไป) หรือข้อความอย่างเดียว
  const problem = submitProblem(kind, repoUrl, note);
  const repoErr = hasLink(kind) && (repoUrl || tried) ? problem : null;
  const noteErr = !hasLink(kind) && tried ? problem : null;
  const deployErr = !round.deploy ? null : deployUrl ? deployProblem(deployUrl) : tried ? "ใส่ลิงก์เว็บที่ deploy แล้ว (ขึ้นต้นด้วย https://)" : null;
  const missing = [problem && (hasLink(kind) ? (hasRepo(kind) ? "ลิงก์ repo" : "ลิงก์งาน") : "ข้อความที่ทำ"), round.deploy && (!deployUrl.trim() || deployProblem(deployUrl)) && "ลิงก์เว็บ"].filter(Boolean) as string[];

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
        <p className="text-fd-muted-foreground">
          {kind === "repo" ? "push โค้ดล่าสุดขึ้น GitHub แล้วกดส่ง พี่เลี้ยงเปิดดูโค้ดล่าสุดตอนตรวจ" : kind === "link" ? "ใส่ลิงก์งานของคุณแล้วกดส่ง พี่เลี้ยงเปิดลิงก์นี้ตอนตรวจ" : "เขียนสิ่งที่ทำในช่องด้านล่างแล้วกดส่ง"}
        </p>
      </div>
      <SubmitLinkField kind={kind} value={repoUrl} onChange={setRepoUrl} error={repoErr} hint={lastRepo && hasRepo(kind) ? "เติมจากครั้งก่อนให้แล้ว" : undefined} />
      {round.deploy && (
        <>
          <Field label="ลิงก์เว็บที่ deploy แล้ว" hint="ต้องเปิดได้โดยไม่ login ลองเปิดในหน้าต่าง Incognito ก่อนส่ง">
            <Input value={deployUrl} onChange={(e) => setDeployUrl(e.target.value)} placeholder="https://starter-ชื่อเล่น.vercel.app" inputMode="url" autoCapitalize="none" spellCheck={false} maxLength={300} aria-invalid={!!deployErr} />
          </Field>
          {deployErr && <p role="alert" className="-mt-2 text-red-700 dark:text-red-400">{deployErr}</p>}
        </>
      )}
      <SubmitNoteField kind={kind} value={note} onChange={setNote} error={noteErr} />
      {error && <ErrorText>ส่งไม่สำเร็จ: {error}</ErrorText>}
      {tried && missing.length > 0 && <p className="font-medium text-amber-800 dark:text-amber-300">ยังขาด: {missing.join(", ")}</p>}
      <Button type="submit" disabled={sending} className="min-h-12 w-full justify-center text-base">
        <Send className="size-4" /> {sending ? "กำลังส่ง…" : resend ? "ส่งงานที่แก้แล้ว" : "ส่งงาน"}
      </Button>
      {to && <p className="text-xs text-fd-muted-foreground">{to} ทันทีที่กดส่ง</p>}
    </form>
  );
}
