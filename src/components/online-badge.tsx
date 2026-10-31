import { isOnline, presenceLabel } from "@/lib/presence";

// จุดเขียว "ออนไลน์" หรือข้อความ "เห็นล่าสุด …" (ไม่พึ่งสีอย่างเดียว: มีข้อความกำกับเสมอ)
export function OnlineBadge({ lastSeenAt, quiet = false }: { lastSeenAt: string | null; quiet?: boolean }) {
  const label = presenceLabel(lastSeenAt);
  if (!label) return quiet ? null : <span className="text-sm text-fd-muted-foreground">ยังไม่เคยเห็น</span>;
  const on = isOnline(lastSeenAt);
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm whitespace-nowrap ${on ? "font-medium text-green-700 dark:text-green-400" : "text-fd-muted-foreground"}`}>
      <span aria-hidden className={`size-2 rounded-full ${on ? "bg-green-600" : "bg-fd-border"}`} />
      {label}
    </span>
  );
}
