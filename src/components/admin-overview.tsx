import { daysSince, isLockedNow, type AdminState } from "@/hooks/use-admin";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("th-TH") : "ยังไม่เคยเข้า");
const STALE_DAYS = 7;

// แท็บภาพรวม: ตัวเลขทั้งหมดคำนวณจากรายชื่อบัญชีจริง (ไม่มีข้อมูลตัวอย่าง)
export function AdminOverview({ admin }: { admin: AdminState }) {
  const interns = admin.users.filter((u) => u.role === "intern" && !u.disabled);
  const locked = admin.users.filter(isLockedNow);
  // ไม่เคยเข้า หรือเข้าล่าสุดนานเกิน 7 วัน: ควรทักไปถามความคืบหน้า
  const stale = interns.filter((u) => (daysSince(u.lastLoginAt) ?? Infinity) > STALE_DAYS);

  const stats = [
    { label: "น้องที่ใช้งานอยู่", value: interns.length, note: "บัญชี Internship ที่ยังไม่ปิด", warn: false },
    { label: "บัญชีที่ถูกล็อก", value: locked.length, note: "ใส่ PIN ผิด 5 ครั้ง ปลดได้ในแท็บบัญชีผู้ใช้", warn: locked.length > 0 },
    { label: `ไม่ได้เข้ามาเกิน ${STALE_DAYS} วัน`, value: stale.length, note: "รวมคนที่ยังไม่เคย login", warn: stale.length > 0 },
    { label: "ไฟล์ Requirement", value: admin.pdf ? "พร้อม" : "ยังไม่มี", note: admin.pdf ? "น้องเปิดแผง PDF ได้" : "อัปโหลดในแท็บไฟล์และตั้งค่า", warn: !admin.pdf },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-xl border border-fd-border bg-fd-card p-4">
            <span className="text-sm text-fd-muted-foreground">{s.label}</span>
            <span className={`text-3xl font-bold ${s.warn ? "text-orange-700 dark:text-orange-400" : ""}`}>{s.value}</span>
            <span className="text-xs text-fd-muted-foreground">{s.note}</span>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">น้องแต่ละคน</h2>
        <div className="overflow-x-auto rounded-xl border border-fd-border">
          <table className="w-full text-sm">
            <thead className="bg-fd-muted text-left">
              <tr>
                <th className="px-3 py-2">ชื่อผู้ใช้</th>
                <th className="px-3 py-2">สถานะ</th>
                <th className="px-3 py-2">เข้าล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {interns.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-fd-muted-foreground">
                    {admin.loading ? "กำลังโหลด…" : "ยังไม่มีบัญชีน้อง สร้างได้ในแท็บบัญชีผู้ใช้"}
                  </td>
                </tr>
              )}
              {interns.map((u) => {
                const isStale = (daysSince(u.lastLoginAt) ?? Infinity) > STALE_DAYS;
                return (
                  <tr key={u.id} className="border-t border-fd-border">
                    <td className="px-3 py-2 font-medium">{u.username}</td>
                    <td className="px-3 py-2">{isLockedNow(u) ? "ล็อกชั่วคราว" : "ใช้งาน"}</td>
                    <td className={`px-3 py-2 whitespace-nowrap ${isStale ? "text-orange-700 dark:text-orange-400" : ""}`}>{fmt(u.lastLoginAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-fd-muted-foreground">
          ด่านที่น้องอยู่และจำนวนบทที่ผ่าน: <strong>เร็วๆ นี้</strong> ตอนนี้น้องติ๊กความคืบหน้าเก็บไว้ในเบราว์เซอร์ของตัวเอง
          ระบบหลังบ้านจึงยังไม่เห็นข้อมูลนี้
        </p>
      </section>
    </div>
  );
}
