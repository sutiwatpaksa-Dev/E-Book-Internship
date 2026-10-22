import { REQUIREMENT_PDF_URL } from "@/api/files.api";
import type { AdminState } from "@/hooks/use-admin";

const fmt = (d: string) => new Date(d).toLocaleString("th-TH");
const card = "flex flex-col gap-2 rounded-xl border border-fd-border bg-fd-card p-4 text-sm";

// แท็บไฟล์และตั้งค่า
export function AdminFiles({ admin }: { admin: AdminState }) {
  const { pdf, exampleRepo } = admin;
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <section className={card}>
        <h2 className="text-base font-semibold">เอกสาร Requirement (PDF)</h2>
        <p className="text-fd-muted-foreground">
          {pdf ? (
            <>
              ไฟล์ปัจจุบัน {Math.round(pdf.size / 1024)} KB · อัปเดต {fmt(pdf.updatedAt)} ·{" "}
              <a className="text-fd-primary underline" href={REQUIREMENT_PDF_URL} target="_blank" rel="noopener">
                เปิดดู
              </a>
            </>
          ) : (
            "ยังไม่มีไฟล์ น้องจะเปิดแผง Requirement ไม่ได้จนกว่าจะอัปโหลด"
          )}
        </p>
        <label className="w-fit cursor-pointer rounded-lg bg-fd-primary px-3 py-2 font-medium text-fd-primary-foreground focus-within:ring-2 focus-within:ring-fd-primary/40 hover:opacity-90">
          อัปโหลดไฟล์ใหม่
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) admin.uploadRequirement(file);
              e.target.value = "";
            }}
          />
        </label>
        <span className="text-xs text-fd-muted-foreground">PDF เท่านั้น ไม่เกิน 4 MB</span>
      </section>

      <section className={card}>
        <h2 className="text-base font-semibold">ลิงก์ระบบตัวอย่าง</h2>
        <p className="text-fd-muted-foreground">
          {exampleRepo ? (
            <a className="break-all text-fd-primary underline" href={exampleRepo} target="_blank" rel="noopener">
              {exampleRepo}
            </a>
          ) : (
            "ยังไม่ได้ตั้ง"
          )}
        </p>
        <p className="text-xs text-fd-muted-foreground">
          เห็นเฉพาะคนที่ login · ตั้งค่าที่ตัวแปร <code>EXAMPLE_REPO_URL</code> บน Vercel แล้ว redeploy (แก้จากหน้านี้ได้: เร็วๆ นี้)
        </p>
      </section>
    </div>
  );
}
