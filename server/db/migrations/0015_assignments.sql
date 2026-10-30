CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"brief" text DEFAULT '' NOT NULL,
	"pdf_key" text NOT NULL,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_slug_unique" UNIQUE("slug"),
	CONSTRAINT "assignments_pdf_key_unique" UNIQUE("pdf_key")
);
--> statement-breakpoint
CREATE TABLE "cohort_assignments" (
	"cohort_id" integer NOT NULL,
	"assignment_id" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_assignments_cohort_id_assignment_id_pk" PRIMARY KEY("cohort_id","assignment_id")
);
--> statement-breakpoint
ALTER TABLE "cohort_assignments" ADD CONSTRAINT "cohort_assignments_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_assignments" ADD CONSTRAINT "cohort_assignments_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

-- โจทย์แรก = STARTER ที่ใช้อยู่ · pdf_key ใช้ key เดิมของไฟล์ PDF ไฟล์บนเว็บจริงไม่ต้องย้าย
-- sections = หัวข้อกับเลขหน้าของ PDF ฉบับนี้ (ย้ายมาจาก SECTIONS ใน requirement-viewer.tsx)
INSERT INTO "assignments" ("slug", "name", "brief", "pdf_key", "sections") VALUES (
  'starter',
  'STARTER (Mini Project)',
  'เว็บไซต์ร้านค้าสมมติ 1 เว็บ ครบทั้งหน้าบ้าน หลังบ้าน และฐานข้อมูล · เลือกประเภทร้านเอง',
  'starter-requirement',
  '[{"key":"overview","label":"1. ภาพรวมโปรเจกต์","page":1},{"key":"scope","label":"2. ขอบเขตงาน + เลือกธุรกิจ","page":2},{"key":"stack","label":"3. Tech stack + โฟลเดอร์","page":3},{"key":"public","label":"4. หน้าบ้าน (Public)","page":4},{"key":"admin","label":"5. หลังบ้าน (Admin)","page":5},{"key":"admin-detail","label":"5. หลังบ้าน (ต่อ)","page":6},{"key":"database","label":"6. ฐานข้อมูล","page":7},{"key":"api","label":"7. API Spec","page":8},{"key":"api-response","label":"7. API: รูปแบบคำตอบ","page":9},{"key":"nfr","label":"8. Non-functional","page":10},{"key":"timeline","label":"9. Timeline 10 วัน","page":11},{"key":"submission","label":"10. สิ่งที่ต้องส่ง + เกณฑ์","page":12},{"key":"bonus","label":"11. Bonus","page":13},{"key":"checklist","label":"Checklist รายวัน","page":14},{"key":"study","label":"ควรศึกษาก่อน (รายวัน)","page":16}]'::jsonb
);--> statement-breakpoint

-- ทุกรุ่นที่มีอยู่ใช้ STARTER ต่อ (น้องที่กำลังฝึกไม่เห็นอะไรเปลี่ยน)
INSERT INTO "cohort_assignments" ("cohort_id", "assignment_id")
SELECT c."id", a."id" FROM "cohorts" c CROSS JOIN "assignments" a WHERE a."slug" = 'starter';
