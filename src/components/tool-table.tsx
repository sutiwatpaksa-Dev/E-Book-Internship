import { type ToolGroupId, type ToolLevel, toolGroups } from "@/data/tool-groups";

const LEVEL: Record<ToolLevel, { label: string; className: string }> = {
  team: { label: "🟢 ทีมใช้", className: "bg-fd-primary/10 text-fd-primary" },
  know: { label: "🔵 ควรรู้จัก", className: "bg-fd-muted text-fd-foreground" },
  aware: { label: "⚪ รู้ว่ามี", className: "bg-fd-muted text-fd-muted-foreground" },
};

// ตาราง "ในกลุ่มนี้มีใครบ้าง" ดึงจาก src/data/tool-groups.ts เพิ่มเครื่องมือใหม่ที่นั่น ไม่ต้องแก้บทเรียน
export function ToolTable({ group }: { group: ToolGroupId }) {
  const g = toolGroups[group];
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-fd-muted text-left text-xs text-fd-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-semibold">{g.title}</th>
            <th className="px-3 py-2 font-semibold">{g.detailLabel}</th>
            <th className="px-3 py-2 font-semibold">ใช้ที่ไหน / เด่นตรงไหน</th>
            <th className="px-3 py-2 font-semibold">ระดับ</th>
          </tr>
        </thead>
        <tbody>
          {g.tools.map((t) => (
            <tr key={t.name} className="border-t align-top">
              <td className="px-3 py-2 font-medium">
                <a href={t.url} target="_blank" rel="noopener" className="text-fd-primary underline-offset-2 hover:underline">
                  {t.name}
                </a>
              </td>
              <td className="px-3 py-2">
                <code className="text-xs">{t.detail}</code>
              </td>
              <td className="px-3 py-2 text-fd-muted-foreground">{t.summary}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`rounded-full px-2 py-0.5 text-xs ${LEVEL[t.level].className}`}>{LEVEL[t.level].label}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-3 py-2 text-xs text-fd-muted-foreground">
        ข้อมูลจากเอกสารทางการของแต่ละตัว (กดชื่อเพื่อเปิด) · ตรวจล่าสุด {g.checkedAt}
      </p>
    </div>
  );
}
