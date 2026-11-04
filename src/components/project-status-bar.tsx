"use client";

import { ExternalLink, FileText, ListChecks, Send } from "lucide-react";
import Link from "next/link";
import { requirementUrl } from "@/api/files.api";
import { useMyWork } from "@/hooks/use-my-work";
import { useSession } from "@/hooks/use-session";
import { projectStatus } from "@/lib/project-status";
import { ProjectBadge } from "./status-badge";
import { nextLine } from "./project-next-line";
import { taskHref } from "./work-board";

// แถบสถานะบนสุดของหน้าโจทย์: เห็นทันทีว่าไปถึงไหน ต้องทำอะไรต่อ แล้วกดไปเปิด PDF / ส่งงาน / ดูเกณฑ์ได้เลย
// สถานะมาจากผลตรวจจริงของพี่เลี้ยง (กระดานงานชุดเดียวกัน) ไม่มีปุ่มติ๊กเอง · พี่เลี้ยงไม่มีงานของตัวเอง จึงเห็นแค่ปุ่มลัด
const BTN = "inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold";
const OUTLINE = `${BTN} border border-fd-border hover:bg-fd-accent`;

export function ProjectStatusBar({ slug }: { slug: string }) {
  const { role } = useSession();
  const work = useMyWork(role === "intern" ? "intern" : null);
  const intern = role === "intern";
  const status = work.data ? projectStatus(work.plan, slug) : null;
  const next = status?.next ?? null;

  return (
    <section aria-label="สถานะโจทย์" className="not-prose mb-6 flex flex-col gap-3 rounded-2xl border border-fd-border bg-fd-card p-4">
      {intern && (
        // จองความสูงไว้ตอนโหลด แถบจึงไม่ดันเนื้อหาลงเมื่อสถานะมา
        <div className="flex min-h-[3.25rem] flex-col justify-center gap-1">
          {work.failed ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              โหลดสถานะไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง
            </p>
          ) : !status ? (
            <div aria-hidden className="h-7 w-48 animate-pulse rounded bg-fd-muted" />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <ProjectBadge state={status.state} />
                {status.total > 0 && (
                  <span className="text-sm text-fd-muted-foreground">
                    ส่งแล้ว {status.sent}/{status.total} รอบ · ผ่าน {status.passed}
                  </span>
                )}
              </div>
              {next && <p className="text-sm">{nextLine(next)}</p>}
            </>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {intern && (
          <Link href={next ? taskHref(next) : "/work"} className={`${BTN} bg-fd-primary text-fd-primary-foreground hover:brightness-110`}>
            <Send className="size-4" aria-hidden />
            {next ? "ส่งงาน" : "ดูงานของฉัน"}
          </Link>
        )}
        <a href={requirementUrl(slug)} target="_blank" rel="noopener" className={OUTLINE}>
          <FileText className="size-4" aria-hidden />
          เปิด PDF
          <ExternalLink className="size-3.5 text-fd-muted-foreground" aria-hidden />
        </a>
        <Link href="/starter/submission" className={OUTLINE}>
          <ListChecks className="size-4" aria-hidden />
          ดูเกณฑ์
        </Link>
      </div>
    </section>
  );
}
