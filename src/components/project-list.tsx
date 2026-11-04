"use client";

import { ArrowRight, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useMyWork } from "@/hooks/use-my-work";
import { projectStatus } from "@/lib/project-status";
import { EmptyState } from "./empty-state";
import { nextLine } from "./project-next-line";
import { ProjectBadge } from "./status-badge";

type Item = { slug: string; name: string; brief: string };

// หน้ารายการโจทย์ของรุ่น: การ์ดต่อโจทย์ บอกสถานะ งานถัดไป และปุ่มเปิดโจทย์
// รุ่นที่มีโจทย์เดียวไม่เห็นหน้านี้ (server พาไปหน้าโจทย์เลย) · พี่เลี้ยงเห็นทุกโจทย์แต่ไม่มีสถานะ เพราะไม่ได้ส่งงานเอง
export function ProjectList({ list, intern }: { list: Item[]; intern: boolean }) {
  const work = useMyWork(intern ? "intern" : null);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">โจทย์ฝึกงาน</h1>
        <p className="text-fd-muted-foreground">{intern ? "โจทย์ที่รุ่นของคุณได้รับ เปิดดูรายละเอียด เอกสาร PDF และเกณฑ์ผ่านของแต่ละชิ้น" : "โจทย์ทั้งหมดในระบบ (พี่เลี้ยงเห็นทุกรุ่น)"}</p>
      </header>

      {list.length === 0 ? (
        <EmptyState icon={FolderKanban} title="ยังไม่มีโจทย์">
          เมื่อพี่เลี้ยงเพิ่มโจทย์ให้รุ่นของคุณ จะขึ้นที่นี่
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((a) => {
            const status = work.data ? projectStatus(work.plan, a.slug) : null;
            return (
              <li key={a.slug} className="flex flex-col gap-2 rounded-2xl border border-fd-border bg-fd-card p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="text-lg font-semibold">{a.name}</h2>
                  {status && <ProjectBadge state={status.state} />}
                </div>
                {a.brief && <p className="text-sm">{a.brief}</p>}
                {intern && (
                  <p className="min-h-5 text-sm text-fd-muted-foreground">
                    {work.failed ? "โหลดสถานะไม่สำเร็จ" : !status ? "" : status.next ? nextLine(status.next) : status.total > 0 ? `ส่งแล้ว ${status.sent}/${status.total} รอบ · ผ่าน ${status.passed}` : ""}
                  </p>
                )}
                <div>
                  <Link href={`/projects/${a.slug}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-fd-primary px-4 text-sm font-semibold text-fd-primary-foreground hover:brightness-110">
                    เปิดโจทย์ <span className="sr-only">{a.name}</span>
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
