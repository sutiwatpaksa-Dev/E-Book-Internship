"use client";

import { FileUp, Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { requirementUrl } from "@/api/files.api";
import type { AdminState } from "@/hooks/use-admin";
import type { AdminAssignment, AssignmentInput, AssignmentSection } from "@/types";
import { Button } from "./button";
import { Field, Input, inputClass } from "./field";

const fmt = (d: string) => new Date(d).toLocaleString("th-TH");
const card = "flex flex-col gap-2 rounded-xl border border-fd-border bg-fd-card p-4 text-sm";

// หัวข้อเขียนบรรทัดละ 1 หัวข้อ "key | ชื่อหัวข้อ | หน้า" แก้ในช่องข้อความเดียวได้เร็วกว่าฟอร์มทีละแถว
// key ต้องเหมือนกันทุกโจทย์ (เช่น api, database) เพราะลิงก์ในคู่มือชี้ด้วย key แล้ว server แปลงเป็นเลขหน้าของโจทย์นั้น
const toText = (s: AssignmentSection[]) => s.map((x) => `${x.key} | ${x.label} | ${x.page}`).join("\n");
function parseSections(text: string): AssignmentSection[] | string {
  const out: AssignmentSection[] = [];
  for (const [i, line] of text.split("\n").entries()) {
    if (!line.trim()) continue;
    const [key, label, page] = line.split("|").map((x) => x.trim());
    if (!key || !/^[a-z0-9-]{1,40}$/.test(key) || !label || !/^\d+$/.test(page ?? "") || Number(page) < 1)
      return `บรรทัด ${i + 1}: ต้องเป็น "key | ชื่อหัวข้อ | เลขหน้า" (key ใช้ a-z 0-9 -)`;
    if (out.some((x) => x.key === key)) return `บรรทัด ${i + 1}: key "${key}" ซ้ำ`;
    out.push({ key, label, page: Number(page) });
  }
  return out;
}

// แท็บโจทย์และตั้งค่า: โจทย์ฝึกงานทุกชิ้น (PDF + หัวข้อ) และลิงก์ระบบตัวอย่าง
export function AdminFiles({ admin }: { admin: AdminState }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const { assignments, exampleRepo } = admin;
  const cohortName = (id: number) => admin.cohorts.find((c) => c.id === id)?.name ?? `รุ่น ${id}`;
  // โจทย์ใหม่เริ่มจากหัวข้อของ STARTER: key เดียวกัน ลิงก์ในคู่มือจึงใช้ได้ทันที แก้แค่เลขหน้า
  const template = assignments.find((a) => a.slug === "starter")?.sections ?? [];

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fd-muted-foreground">
          โจทย์แต่ละชิ้นมี PDF และหัวข้อของตัวเอง · เลือกโจทย์ให้รุ่นได้ในหน้ารุ่น (รุ่นหนึ่งมีได้หลายโจทย์) · น้องเห็นเฉพาะโจทย์ของรุ่นตัวเอง
        </p>
        {!creating && (
          <Button onClick={() => setCreating(true)} className="min-h-11">
            <Plus className="size-4" /> โจทย์ใหม่
          </Button>
        )}
      </div>

      {creating && (
        <AssignmentForm
          initial={{ name: "", brief: "", sections: template }}
          onCancel={() => setCreating(false)}
          onSave={async (slug, input) => {
            if (await admin.saveAssignment(null, slug, input)) setCreating(false);
          }}
        />
      )}

      {assignments.map((a) => (
        <section key={a.id} aria-labelledby={`asg-${a.id}`} className={card}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 id={`asg-${a.id}`} className="text-base font-semibold">
                {a.name}
              </h2>
              <span className="text-xs text-fd-muted-foreground">
                {a.slug} · {a.sections.length} หัวข้อ · {a.cohortIds.length ? `ใช้ใน ${a.cohortIds.map(cohortName).join(", ")}` : "ยังไม่มีรุ่นใช้"}
              </span>
            </div>
            <Button variant="ghost" onClick={() => setEditing(editing === a.id ? null : a.id)} aria-expanded={editing === a.id} className="min-h-11">
              <Pencil className="size-4" /> แก้โจทย์
            </Button>
          </div>
          {a.brief && <p>{a.brief}</p>}

          {editing === a.id && (
            <AssignmentForm
              initial={a}
              slug={a.slug}
              onCancel={() => setEditing(null)}
              onSave={async (_, input) => {
                if (await admin.saveAssignment(a.id, a.slug, input)) setEditing(null);
              }}
            />
          )}

          <Pdf admin={admin} assignment={a} />
        </section>
      ))}

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

function Pdf({ admin, assignment: a }: { admin: AdminState; assignment: AdminAssignment }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-fd-border pt-3">
      <span className="text-fd-muted-foreground">
        {a.pdf ? (
          <>
            PDF {Math.round(a.pdf.size / 1024)} KB · อัปเดต {fmt(a.pdf.updatedAt)} ·{" "}
            <a className="text-fd-primary underline" href={requirementUrl(a.slug)} target="_blank" rel="noopener">
              เปิดดู
            </a>
          </>
        ) : (
          <span className="text-orange-800 dark:text-orange-300">ยังไม่มี PDF น้องในรุ่นที่ใช้โจทย์นี้จะเปิดเอกสารไม่ได้</span>
        )}
      </span>
      <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-lg bg-fd-primary px-3 font-medium text-fd-primary-foreground focus-within:ring-2 focus-within:ring-fd-primary/40 hover:opacity-90">
        <FileUp className="size-4" /> {a.pdf ? "อัปโหลดไฟล์ใหม่" : "อัปโหลด PDF"}
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) admin.uploadAssignmentPdf(a, file);
            e.target.value = "";
          }}
        />
      </label>
      <span className="text-xs text-fd-muted-foreground">PDF เท่านั้น ไม่เกิน 4 MB</span>
    </div>
  );
}

// slug = มีแล้ว (แก้โจทย์เดิม เปลี่ยน slug ไม่ได้ เพราะลิงก์ PDF ที่ส่งไปแล้วใช้ slug)
function AssignmentForm({ initial, slug: fixedSlug, onSave, onCancel }: { initial: AssignmentInput; slug?: string; onSave: (slug: string, v: AssignmentInput) => void; onCancel: () => void }) {
  const [slug, setSlug] = useState(fixedSlug ?? "");
  const [name, setName] = useState(initial.name);
  const [brief, setBrief] = useState(initial.brief);
  const [sections, setSections] = useState(toText(initial.sections));
  const parsed = parseSections(sections);
  const badSlug = !fixedSlug && slug !== "" && !/^[a-z0-9-]{2,40}$/.test(slug);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (typeof parsed === "string" || badSlug) return;
    onSave(slug, { name: name.trim(), brief: brief.trim(), sections: parsed });
  };
  return (
    <form onSubmit={submit} aria-label={fixedSlug ? "แก้โจทย์" : "สร้างโจทย์ใหม่"} className="grid gap-3 rounded-xl border border-fd-primary/40 p-4 sm:grid-cols-2">
      <Field label="ชื่อโจทย์">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น คลินิกสัตว์" minLength={2} maxLength={80} required />
      </Field>
      <Field label="ชื่อใน URL" hint={fixedSlug ? "เปลี่ยนไม่ได้หลังสร้าง" : "a-z 0-9 - ยาว 2–40 ตัว เปลี่ยนไม่ได้หลังสร้าง"}>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="clinic"
          pattern="[a-z0-9\-]{2,40}"
          disabled={!!fixedSlug}
          required
          aria-invalid={badSlug}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="สรุปโจทย์ 1–2 ประโยค (น้องเห็นในแผงเอกสาร)">
          <textarea className={`${inputClass} min-h-20`} value={brief} onChange={(e) => setBrief(e.target.value)} maxLength={500} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="หัวข้อใน PDF" hint='บรรทัดละหัวข้อ "key | ชื่อหัวข้อ | เลขหน้า" · key ใช้ชุดเดียวกับ STARTER ลิงก์ในคู่มือจะพาไปหน้าที่ถูกของโจทย์นี้'>
          <textarea className={`${inputClass} min-h-48 font-mono text-xs`} value={sections} onChange={(e) => setSections(e.target.value)} spellCheck={false} />
        </Field>
        {typeof parsed === "string" && <p className="mt-1 text-sm text-red-700 dark:text-red-400">{parsed}</p>}
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="min-h-11">
          ยกเลิก
        </Button>
        <Button type="submit" disabled={typeof parsed === "string" || badSlug} className="min-h-11">
          {fixedSlug ? "บันทึก" : "สร้างโจทย์"}
        </Button>
      </div>
    </form>
  );
}
