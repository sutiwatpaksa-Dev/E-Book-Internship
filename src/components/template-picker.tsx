"use client";

import { ClipboardList } from "lucide-react";
import { COMMENT_KIND_LABEL, fillTemplate, type CommentKind, type CommentTemplate } from "@/lib/rubric";

// เมนูแทรก template ความเห็น: เลือกแล้วช่องแทนที่ ({ชื่อน้อง} {รอบ} {ref}) ถูกเติมให้ แล้วส่งข้อความกลับไปใส่ในช่องพิมพ์ ให้พี่เลี้ยงแก้ต่อได้ก่อนส่ง
// kind ว่าง = แสดงทุกประเภท · ไม่มี template = บอกทางไปสร้าง
export function TemplatePicker({ templates, kind, vars, onPick }: { templates: CommentTemplate[]; kind?: CommentKind; vars: Record<string, string>; onPick: (text: string) => void }) {
  const list = kind ? templates.filter((t) => t.kind === kind) : templates;
  return (
    <details className="group relative w-fit">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-fd-border bg-fd-background px-3 text-sm font-medium hover:bg-fd-accent">
        <ClipboardList className="size-4" aria-hidden /> แทรก template{list.length ? ` (${list.length})` : ""}
      </summary>
      <div className="absolute start-0 z-10 mt-1 flex max-h-72 w-72 max-w-[80vw] flex-col gap-1 overflow-y-auto rounded-xl border border-fd-border bg-fd-popover p-2 shadow-lg">
        {list.length === 0 ? (
          <p className="p-2 text-sm text-fd-muted-foreground">ยังไม่มี template{kind ? ` ประเภท "${COMMENT_KIND_LABEL[kind]}"` : ""} สร้างได้ที่หน้าโจทย์ในหลังบ้าน</p>
        ) : (
          list.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={(e) => {
                onPick(fillTemplate(t.body, vars));
                e.currentTarget.closest("details")?.removeAttribute("open");
              }}
              className="flex min-h-11 flex-col items-start rounded-lg px-2 py-1.5 text-start hover:bg-fd-accent"
            >
              <span className="text-sm font-semibold">{t.title}</span>
              <span className="line-clamp-2 text-xs text-fd-muted-foreground">{t.body}</span>
            </button>
          ))
        )}
      </div>
    </details>
  );
}
