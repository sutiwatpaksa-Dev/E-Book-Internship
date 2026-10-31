import { KIND_LABEL, timeAgo } from "@/lib/thread-labels";
import type { ThreadSummary } from "@/types";
import { StatusBadge } from "./status-badge";

type Props = { threads: ThreadSummary[]; selectedId: number | null; titles: Record<string, string>; onSelect: (id: number) => void };

// รายการเรื่องด้านซ้ายของแชท: ล่าสุดอยู่บน จุดสีส้ม = มีข้อความใหม่ที่ยังไม่อ่าน
export function ThreadList({ threads, selectedId, titles, onSelect }: Props) {
  return (
    <ul className="flex flex-col">
      {threads.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => onSelect(t.id)}
            aria-current={t.id === selectedId}
            className={`flex w-full flex-col gap-1 border-b border-fd-border px-3 py-2.5 text-left text-sm hover:bg-fd-accent ${t.id === selectedId ? "bg-fd-primary/10" : ""}`}
          >
            <span className="flex items-center gap-2">
              <span className={`min-w-0 flex-1 line-clamp-2 break-words ${t.unread ? "font-bold" : "font-medium"}`}>{t.subject}</span>
              {t.unread && <span aria-label="มีข้อความใหม่" className="size-2.5 shrink-0 rounded-full bg-orange-500" />}
            </span>
            <span className="flex items-center gap-2 text-sm text-fd-muted-foreground">
              <StatusBadge status={t.status} />
              <span className="min-w-0 truncate">
                {t.owner && `${t.owner} · `}
                {t.pageUrl ? (titles[t.pageUrl] ?? t.pageUrl) : KIND_LABEL[t.kind].label}
              </span>
              <span className="ms-auto shrink-0">{timeAgo(t.lastMessageAt)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
