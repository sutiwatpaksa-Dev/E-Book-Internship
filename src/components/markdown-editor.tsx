"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { adminApi } from "@/api/admin.api";
import { toast } from "@/hooks/use-toast";
import { IMAGE_TYPES, shrinkImage } from "@/lib/image-upload";
import { inputClass } from "./field";
import { MarkdownBody } from "./markdown-body";

// ช่องเขียน Markdown ของหลังบ้าน (โพสต์ ภาพรวมโจทย์): แท็บเขียน/ตัวอย่าง ปุ่มช่วยแทรก และรูป
// รูป = กดปุ่ม "รูป" · วางภาพหน้าจอ (Ctrl/⌘+V) · หรือลากไฟล์มาวางในช่อง · ระบบย่อรูปให้ แล้วใส่ ![คำอธิบาย](ลิงก์) ตรงที่เคอร์เซอร์อยู่
const TOOLS: { label: string; snippet: string }[] = [
  { label: "หัวข้อ", snippet: "\n## หัวข้อ\n" },
  { label: "รายการ", snippet: "\n- รายการ\n" },
  { label: "ติ๊กได้", snippet: "\n- [ ] สิ่งที่ต้องทำ\n" },
  { label: "โค้ด", snippet: "\n```bash\nคำสั่ง\n```\n" },
  { label: "ตาราง", snippet: "\n| ข้อ | รายละเอียด |\n|---|---|\n| 1 | … |\n" },
  { label: "กล่องเตือน", snippet: "\n> [!CAUTION]\n> เรื่องที่ต้องทำก่อนข้ออื่น\n" },
  { label: "ระดับ", snippet: "\n### 🔴 ต้องแก้ทันที · หัวข้อ\n### 🟠 ควรแก้ · หัวข้อ\n### ⚪ เก็บกวาด · หัวข้อ\n" },
];
const ACCEPT = IMAGE_TYPES.join(",");
const isImage = (f: File) => (IMAGE_TYPES as readonly string[]).includes(f.type);

type Props = { value: string; onChange: (v: string) => void; max: number; label: string; minHeight?: string };

export function MarkdownEditor({ value, onChange, max, label, minHeight = "min-h-40" }: Props) {
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(0);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  // อัปโหลดใช้เวลา ระหว่างนั้นพี่เลี้ยงพิมพ์ต่อได้ จึงอ่านข้อความล่าสุดจาก ref ตอนอัปโหลดเสร็จ ไม่ใช้ค่าตอนกดปุ่ม
  const latest = useRef(value);
  latest.current = value;

  const insert = (snippet: string) => {
    const el = area.current;
    const text = latest.current;
    const a = el ? el.selectionStart : text.length;
    const b = el ? el.selectionEnd : text.length;
    const next = text.slice(0, a) + snippet + text.slice(b);
    if (next.length > max) return void toast.error(`ข้อความยาวเกิน ${max.toLocaleString("en-US")} ตัวอักษร ตัดบางส่วนก่อนแทรก`);
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = a + snippet.length;
    });
  };

  const upload = async (files: File[]) => {
    const images = files.filter(isImage);
    if (images.length < files.length) toast.error("รับเฉพาะรูป PNG, JPG หรือ WebP");
    for (const file of images) {
      setUploading((n) => n + 1);
      try {
        const { url } = await adminApi.uploadImage(await shrinkImage(file));
        // คำอธิบายรูป (alt) เริ่มต้นเป็น "ภาพหน้าจอ" ให้พี่เลี้ยงแก้เป็นสิ่งที่รูปแสดง ผู้อ่านที่ใช้โปรแกรมอ่านจอจะได้ยินข้อความนี้
        insert(`\n![ภาพหน้าจอ](${url})\n`);
      } catch (e) {
        toast.error(`อัปโหลดรูปไม่สำเร็จ: ${(e as Error).message}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const onPaste = (e: ClipboardEvent) => {
    const files = [...e.clipboardData.files].filter(isImage);
    if (files.length === 0) return; // วางข้อความตามปกติ
    e.preventDefault();
    void upload(files);
  };
  const onDrop = (e: DragEvent) => {
    if (e.dataTransfer.files.length === 0) return;
    e.preventDefault();
    void upload([...e.dataTransfer.files]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{label} (Markdown)</span>
        <div role="tablist" aria-label="เขียนหรือดูตัวอย่าง" className="flex gap-1">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              role="tab"
              aria-selected={preview === v}
              onClick={() => setPreview(v)}
              className={`min-h-11 rounded-lg px-3 text-sm font-medium ${preview === v ? "bg-fd-primary text-fd-primary-foreground" : "border border-fd-border hover:bg-fd-accent"}`}
            >
              {v ? "ตัวอย่าง" : "เขียน"}
            </button>
          ))}
        </div>
      </div>
      {preview ? (
        <div className={`${minHeight} rounded-lg border border-fd-border p-3`}>
          {value.trim() ? <MarkdownBody md={value} className="text-sm" /> : <p className="text-sm text-fd-muted-foreground">ยังไม่ได้เขียนอะไร</p>}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {TOOLS.map((t) => (
              <button key={t.label} type="button" onClick={() => insert(t.snippet)} className="min-h-9 rounded-lg border border-fd-border px-2.5 text-xs font-medium hover:bg-fd-accent">
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => picker.current?.click()}
              disabled={uploading > 0}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-fd-border px-2.5 text-xs font-medium hover:bg-fd-accent disabled:opacity-60"
            >
              <ImagePlus className="size-3.5" aria-hidden /> รูป
            </button>
            <input
              ref={picker}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-label="เลือกรูปจากเครื่อง"
              onChange={(e) => {
                void upload([...(e.target.files ?? [])]);
                e.target.value = ""; // เลือกไฟล์เดิมซ้ำได้
              }}
            />
          </div>
          <textarea
            ref={area}
            className={`${inputClass} ${minHeight} font-mono text-sm`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={onPaste}
            onDrop={onDrop}
            maxLength={max}
            aria-label={`${label} (Markdown)`}
          />
          <p className="text-xs text-fd-muted-foreground">
            {uploading > 0 ? (
              <span role="status">กำลังอัปโหลดรูป…</span>
            ) : (
              <>วางภาพหน้าจอ (Ctrl/⌘+V) หรือลากรูปมาวางในช่องได้ · แก้ข้อความใน [ ] ให้บอกว่ารูปแสดงอะไร · เห็นรูปเฉพาะคนที่ login</>
            )}
          </p>
        </>
      )}
    </div>
  );
}
