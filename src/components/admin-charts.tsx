"use client";

import { useState, type ReactNode } from "react";

// กราฟของหลังบ้าน เขียนด้วย React + Tailwind ล้วน ไม่ใช้ไลบรารีกราฟ (ข้อมูลน้อย แท่งไม่กี่สิบแท่ง ไม่คุ้มเพิ่ม dependency)
// กติกาที่ใช้ทุกกราฟ: แท่งบางไม่เกิน 24px หัวมน 4px โคนเหลี่ยม · เส้นตารางบาง 1px สีจาง · ตัวหนังสือใช้สีตัวหนังสือ ไม่ใช้สีแท่ง
// ทุกค่าที่อยู่ใน tooltip ต้องดูได้โดยไม่ hover ด้วย (ปุ่ม "ดูเป็นตาราง" ใต้กราฟ) เพราะมือถือและคีย์บอร์ด hover ไม่ได้

// กรอบของกราฟ 1 ใบ: หัวข้อ + ตัวเลขเด่น (ถ้ามี) + กราฟ + ตารางสำรอง
export function ChartCard({
  title,
  sub,
  figure,
  children,
  table,
}: {
  title: string;
  sub?: string;
  figure?: ReactNode;
  children: ReactNode;
  table: { head: string[]; rows: (string | number)[][] };
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {sub && <p className="text-xs text-fd-muted-foreground">{sub}</p>}
        </div>
        {figure && <div className="shrink-0 text-end">{figure}</div>}
      </div>
      {children}
      <details className="text-xs">
        <summary className="inline-flex min-h-9 cursor-pointer items-center text-fd-muted-foreground hover:text-fd-foreground">ดูเป็นตาราง</summary>
        <div className="mt-1 max-h-56 overflow-auto rounded-lg border border-fd-border">
          <table className="w-full text-start">
            <thead className="sticky top-0 bg-fd-muted">
              <tr>
                {table.head.map((h) => (
                  <th key={h} className="px-2 py-1 text-start font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-t border-fd-border">
                  {r.map((c, j) => (
                    <td key={j} className={`px-2 py-1 ${typeof c === "number" ? "tabular-nums" : ""}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

// ตัวเลขเด่นมุมขวาของกราฟ (เช่น รวม 14 วัน)
export function Figure({ value, label }: { value: number; label: string }) {
  return (
    <>
      <span className="block text-2xl leading-tight font-bold">{value.toLocaleString("th-TH")}</span>
      <span className="text-xs text-fd-muted-foreground">{label}</span>
    </>
  );
}

// เพดานแกน y เป็นเลขกลม (1, 2, 5, 10, 20 …) ไม่ใช่ค่าสูงสุดเป๊ะ แท่งสูงสุดจะได้ไม่ชนขอบบน
function niceMax(v: number) {
  if (v <= 1) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 5, 10].find((m) => m * p >= v) ?? 10) * p;
}

// กราฟแท่งตั้งตามวัน (ชุดข้อมูลเดียว จึงไม่มีกล่องคำอธิบายสี หัวข้อบอกแล้วว่าคืออะไร)
// แท่งทั้งช่องเป็นเป้าของ hover/focus ไม่ใช่แค่ส่วนที่มีสี วันที่เป็น 0 ก็ชี้ดูได้
export function ColumnChart({ data, unit }: { data: { key: string; label: string; value: number }[]; unit: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const a = active === null ? null : data[active];
  // ป้ายแกน x แค่ 3 จุด (ต้น กลาง ท้าย) ใส่ทุกวันจะเบียดจนอ่านไม่ออก
  const marks = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);

  return (
    // grid 2 คอลัมน์: แกน y | พื้นที่กราฟ · ป้ายแกน x อยู่แถวล่างคอลัมน์เดียวกับกราฟ จึงตรงกับแท่งเสมอ
    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
      <div className="flex h-36 flex-col justify-between text-end text-xs leading-none text-fd-muted-foreground tabular-nums" aria-hidden>
        <span>{max}</span>
        <span>{max / 2}</span>
        <span>0</span>
      </div>
      <div className="relative h-36 min-w-0" onPointerLeave={() => setActive(null)}>
        {/* เส้นตาราง 3 เส้น (บน กลาง ฐาน) */}
        {["top-0", "top-1/2", "bottom-0"].map((t) => (
          <span key={t} aria-hidden className={`absolute inset-x-0 h-px bg-(--chart-grid) ${t}`} />
        ))}
        <div className="relative flex h-full items-stretch gap-0.5">
          {data.map((d, i) => (
            <button
              key={d.key}
              type="button"
              aria-label={`${d.label}: ${d.value} ${unit}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="flex min-w-0 flex-1 items-end justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/40"
            >
              <span
                className={`block w-full max-w-6 rounded-t-[4px] bg-(--chart-bar) transition-opacity ${active !== null && active !== i ? "opacity-45" : ""}`}
                style={{ height: `${(d.value / max) * 100}%` }}
              />
            </button>
          ))}
        </div>
        {a && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-fd-border bg-fd-popover px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
            style={{ left: `${Math.min(Math.max(((active + 0.5) / data.length) * 100, 12), 88)}%`, bottom: `calc(${(a.value / max) * 100}% + 6px)` }}
          >
            <strong className="block text-sm">
              {a.value} {unit}
            </strong>
            <span className="text-fd-muted-foreground">{a.label}</span>
          </div>
        )}
      </div>
      <span aria-hidden />
      <div className="flex justify-between text-xs text-fd-muted-foreground" aria-hidden>
        {[...marks].map((i) => (
          <span key={i}>{data[i]?.label}</span>
        ))}
      </div>
    </div>
  );
}

// แถบความคืบหน้าแนวนอน 1 แถวต่อขั้น: ร่อง (สีอ่อนโทนเดียวกัน) + ส่วนที่ทำแล้ว · ค่าทุกแถวเขียนไว้ตรงๆ (มีไม่กี่แถว)
export function ProgressRows({ rows }: { rows: { key: string; label: string; pct: number; note: string }[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.key} className="flex flex-col gap-1">
          <span className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate font-medium">{r.label}</span>
            <span className="shrink-0 tabular-nums">
              <strong>{r.pct}%</strong> <span className="text-xs text-fd-muted-foreground">{r.note}</span>
            </span>
          </span>
          <span className="block h-2 overflow-hidden rounded-full bg-(--chart-track)" role="img" aria-label={`${r.label} ${r.pct}%`}>
            <span className="block h-full rounded-full bg-(--chart-bar)" style={{ width: `${r.pct}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

const RAMP = ["bg-(--chart-r1)", "bg-(--chart-r2)", "bg-(--chart-r3)", "bg-(--chart-r4)"];

// แท่งเดียวแบ่งส่วน (ส่วนของทั้งหมด) สำหรับกลุ่มที่มีลำดับ: สีไล่จากเข้มไปอ่อนตามลำดับ ไม่ใช่สีต่างกันมั่วๆ
// ส่วนต่อกันเว้นช่อง 2px · มีกล่องคำอธิบายพร้อมจำนวนเสมอ (ไม่ให้ต้องเดาจากสีอย่างเดียว)
export function SegmentBar({ parts, unit }: { parts: { key: string; label: string; value: number }[]; unit: string }) {
  const [active, setActive] = useState<string | null>(null);
  const total = parts.reduce((s, p) => s + p.value, 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div className="flex h-6 gap-0.5 overflow-hidden rounded-[4px]" onPointerLeave={() => setActive(null)}>
          {total === 0 ? (
            <span className="flex-1 bg-(--chart-track)" />
          ) : (
            parts.map((p, i) =>
              p.value === 0 ? null : (
                <button
                  key={p.key}
                  type="button"
                  aria-label={`${p.label}: ${p.value} ${unit} (${pct(p.value)}%)`}
                  onPointerEnter={() => setActive(p.key)}
                  onFocus={() => setActive(p.key)}
                  onBlur={() => setActive(null)}
                  className={`${RAMP[i]} outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/40 focus-visible:ring-inset ${active && active !== p.key ? "opacity-45" : ""}`}
                  style={{ flexGrow: p.value, flexBasis: 0 }}
                />
              ),
            )
          )}
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {parts.map((p, i) => (
          <li key={p.key} className={`flex items-center gap-1.5 ${active && active !== p.key ? "opacity-60" : ""}`}>
            <span aria-hidden className={`size-2.5 rounded-[3px] ${RAMP[i]}`} />
            <span className="text-fd-muted-foreground">{p.label}</span>
            <strong className="tabular-nums">{p.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
