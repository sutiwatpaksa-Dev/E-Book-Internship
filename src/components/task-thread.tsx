"use client";

import { GitCommitHorizontal, Lightbulb, MessageSquare, BookOpen } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "@/hooks/use-toast";
import { COMMENT_KIND_LABEL, COMMENT_KINDS, type CommentKind, type CommentTemplate } from "@/lib/rubric";
import { refProblem } from "@/lib/submission";
import { timeAgo } from "@/lib/thread-labels";
import type { CommentSend, TaskComment } from "@/types";
import { Button } from "./button";
import { ErrorText } from "./error-text";
import { inputClass } from "./field";
import { TemplatePicker } from "./template-picker";

const KIND_ICON: Record<CommentKind, typeof MessageSquare> = { review: MessageSquare, commit: GitCommitHorizontal, card: BookOpen, extra: Lightbulb };

// ความเห็นใต้งาน: เห็นเฉพาะน้องเจ้าของงานกับพี่เลี้ยง · ใช้ทั้งหน้างานของน้องและหน้าตรวจของพี่เลี้ยง
// mentor = พี่เลี้ยงเลือกประเภทได้ (ความเห็นงาน / commit / แนะนำการ์ด / เนื้อหาเพิ่มเติม) และแทรก template ได้ · น้องเขียนได้แค่ความเห็นงาน
type Props = {
  load: () => Promise<TaskComment[]>;
  send: (input: CommentSend) => Promise<unknown>;
  mentor?: { templates: CommentTemplate[]; vars: Record<string, string> };
};

export function TaskThread({ load, send, mentor }: Props) {
  const [items, setItems] = useState<TaskComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<CommentKind>("review");
  const [ref, setRef] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = useCallback(
    () =>
      load()
        .then((r) => (setItems(r), setError(null)))
        .catch((e: Error) => setError(e.message)),
    [load],
  );
  useEffect(() => {
    reload();
  }, [reload]);

  const refErr = kind === "commit" && ref.trim() ? refProblem(ref) : null;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return void toast.error("เขียนความเห็นก่อนส่ง");
    if (refErr) return void toast.error(refErr);
    setSaving(true);
    try {
      await send({ kind, ref: kind === "commit" ? ref.trim() : "", body: body.trim() });
      toast.success("ส่งความเห็นแล้ว");
      setBody("");
      setRef("");
      await reload();
    } catch (err) {
      toast.error(`ส่งความเห็นไม่สำเร็จ: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="ความเห็นใต้งาน" className="flex flex-col gap-3">
      {error && <ErrorText>{error}</ErrorText>}
      {items === null && !error ? (
        <p className="text-sm text-fd-muted-foreground">กำลังโหลดความเห็น…</p>
      ) : (
        items && (
          <ol className="flex flex-col gap-2">
            {items.length === 0 && <li className="text-sm text-fd-muted-foreground">ยังไม่มีความเห็น</li>}
            {items.map((c) => {
              const Icon = KIND_ICON[c.kind];
              return (
                <li key={c.id} className={`flex flex-col gap-1 rounded-xl border p-3 text-sm ${c.authorRole === "dev" ? "border-fd-primary/30 bg-fd-primary/5" : "border-fd-border bg-fd-card"}`}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Icon className="size-4 text-fd-primary" aria-hidden />
                    <span className="font-semibold">{c.author}</span>
                    {c.authorRole === "dev" && <span className="rounded-md bg-fd-primary/10 px-1.5 text-xs font-semibold text-fd-primary">พี่เลี้ยง</span>}
                    <span className="text-xs text-fd-muted-foreground">{COMMENT_KIND_LABEL[c.kind]}</span>
                    {c.ref && <span className="rounded bg-fd-muted px-1.5 font-mono text-xs">{c.ref}</span>}
                    <span className="ms-auto text-xs text-fd-muted-foreground">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{c.body}</p>
                </li>
              );
            })}
          </ol>
        )
      )}

      <form onSubmit={submit} className="flex flex-col gap-2">
        {mentor && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              ประเภท
              <select className={`${inputClass} w-auto`} value={kind} onChange={(e) => setKind(e.target.value as CommentKind)}>
                {COMMENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {COMMENT_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            {kind === "commit" && (
              <label className="flex items-center gap-2 text-sm font-medium">
                commit / tag
                <input className={`${inputClass} w-40 font-mono`} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="เช่น review-1" maxLength={100} aria-invalid={!!refErr} />
              </label>
            )}
            <TemplatePicker templates={mentor.templates} kind={kind} vars={{ ...mentor.vars, ref: ref.trim() || mentor.vars.ref || "" }} onPick={(t) => setBody((b) => (b.trim() ? `${b.trimEnd()}\n${t}` : t))} />
          </div>
        )}
        {refErr && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{refErr}</p>}
        <textarea
          className={`${inputClass} min-h-20`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          aria-label="ความเห็น"
          placeholder={mentor ? "เขียนความเห็นถึงน้อง (เห็นกันแค่น้องคนนี้กับพี่เลี้ยง)" : "ถามหรือเล่าความคืบหน้าเกี่ยวกับงานนี้ (เห็นแค่เรากับพี่เลี้ยง)"}
        />
        <Button type="submit" disabled={saving} className="min-h-11 w-fit">
          ส่งความเห็น
        </Button>
      </form>
    </section>
  );
}
