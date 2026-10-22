import type { Question } from "@/types";

const fmt = (d: string) => new Date(d).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

// ชิ้นส่วนพื้นฐาน (ระดับ 1): คำถามหนึ่งข้อ + คำตอบ (ใช้ทั้งหน้าน้องและหลังบ้าน)
export function QuestionThread({ q, meta }: { q: Question; meta?: string }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-fd-muted-foreground">
        <span
          className={`rounded-full px-2 py-0.5 font-semibold ${q.answer ? "bg-green-600/15 text-green-800 dark:text-green-300" : "bg-orange-500/15 text-orange-800 dark:text-orange-300"}`}
        >
          {q.answer ? "ตอบแล้ว" : "รอพี่เลี้ยงตอบ"}
        </span>
        {meta && <span>{meta}</span>}
        <span>ถามเมื่อ {fmt(q.createdAt)}</span>
      </div>
      <p className="whitespace-pre-wrap break-words">{q.body}</p>
      {q.answer && (
        <div className="rounded-lg border-s-4 border-fd-primary bg-fd-primary/5 px-3 py-2">
          <div className="mb-1 text-xs font-semibold text-fd-primary">คำตอบจากพี่เลี้ยง{q.answeredAt && ` · ${fmt(q.answeredAt)}`}</div>
          <p className="whitespace-pre-wrap break-words">{q.answer}</p>
        </div>
      )}
    </div>
  );
}
