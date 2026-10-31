// ตัวแทนระหว่างโหลด: กล่องเทากะพริบ แทนข้อความ "กำลังโหลด…" และตัวเลข 0/– ที่ดูเหมือนข้อมูลว่าง
export function Skeleton({ className = "h-4 w-24" }: { className?: string }) {
  return <span aria-hidden className={`inline-block animate-pulse rounded bg-fd-muted ${className}`} />;
}

// รายการหลายแถวระหว่างโหลด (บอก screen reader ครั้งเดียวว่ากำลังโหลด)
export function SkeletonList({ rows = 4, label = "กำลังโหลด" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="h-12 animate-pulse rounded-xl bg-fd-muted" />
      ))}
    </div>
  );
}
