-- 0023: รุ่น 1 ──< โจทย์ (เดิม M:N ผ่าน cohort_assignments) + ตารางสายงาน (มีแค่ IT)
-- ลำดับ: สร้าง tracks → ผูกทุกรุ่นกับ IT → แยกโจทย์ที่ใช้หลายรุ่นเป็นสำเนาของแต่ละรุ่น → ย้ายงาน/โพสต์/การ์ดไปสำเนา → บังคับ NOT NULL
-- cohort_assignments ยังไม่ลบ (โค้ดเลิกอ่านแล้ว) ลบใน migration ถัดไปหลังตรวจบน production แล้ว
CREATE TABLE "tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submit_kinds" jsonb DEFAULT '["link"]'::jsonb NOT NULL,
	"criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"kpi" jsonb DEFAULT '{"work":70,"attendance":20,"engagement":10,"passPercent":60}'::jsonb NOT NULL,
	"template_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
INSERT INTO "tracks" ("slug", "name", "steps", "submit_kinds", "criteria") VALUES (
	'it', 'เทคโนโลยีสารสนเทศ (IT)',
	'["problem","design","coding","testing","documentation","deploy","maintenance"]'::jsonb,
	'["repo"]'::jsonb,
	'[{"id":"works","label":"ทำงานได้ตามโจทย์","max":40},{"id":"code","label":"โค้ดอ่านง่าย แยกชั้นตามที่สอน","max":30},{"id":"git","label":"ใช้ Git: commit เป็นช่วง ข้อความชัด","max":20},{"id":"readme","label":"README และการอธิบายงาน","max":10}]'::jsonb
);
--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "track_id" integer;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "track_template_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE "cohorts" SET "track_id" = (SELECT "id" FROM "tracks" WHERE "slug" = 'it');--> statement-breakpoint
ALTER TABLE "cohorts" ALTER COLUMN "track_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_slug_unique";--> statement-breakpoint
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_pdf_key_unique";--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "cohort_id" integer;--> statement-breakpoint
DO $$
DECLARE
	orphans text;
	a record;
	c record;
	owner_id integer;
	copy_id integer;
BEGIN
	-- โจทย์ที่ไม่มีรุ่นใช้เลย: ไม่รู้ว่าเป็นของรุ่นไหน หยุดก่อน ให้คนตัดสิน (ไม่เดา)
	SELECT string_agg(x."id" || ':' || x."slug", ', ') INTO orphans
	FROM "assignments" x
	WHERE NOT EXISTS (SELECT 1 FROM "cohort_assignments" ca WHERE ca."assignment_id" = x."id");
	IF orphans IS NOT NULL THEN
		RAISE EXCEPTION '0023: โจทย์ที่ไม่มีรุ่นใช้ ต้องผูกกับรุ่นหรือลบก่อน: %', orphans;
	END IF;

	FOR a IN SELECT * FROM "assignments" ORDER BY "id" LOOP
		-- แถวเดิมเป็นของรุ่นที่มีงานส่งมากสุด (ย้ายข้อมูลน้อยสุด) เสมอกันเอารุ่นที่ id น้อยสุด
		SELECT ca."cohort_id" INTO owner_id
		FROM "cohort_assignments" ca
		LEFT JOIN "users" u ON u."cohort_id" = ca."cohort_id"
		LEFT JOIN "submissions" s ON s."user_id" = u."id" AND s."assignment_id" = a."id"
		WHERE ca."assignment_id" = a."id"
		GROUP BY ca."cohort_id"
		ORDER BY count(s."id") DESC, ca."cohort_id" ASC
		LIMIT 1;
		UPDATE "assignments" SET "cohort_id" = owner_id WHERE "id" = a."id";

		FOR c IN SELECT "cohort_id" FROM "cohort_assignments" WHERE "assignment_id" = a."id" AND "cohort_id" <> owner_id ORDER BY "cohort_id" LOOP
			INSERT INTO "assignments" ("cohort_id", "slug", "name", "brief", "pdf_key", "sections", "rubric", "overview", "archived_at", "created_at")
			VALUES (c."cohort_id", a."slug", a."name", a."brief", a."pdf_key", a."sections", a."rubric", a."overview", a."archived_at", a."created_at")
			RETURNING "id" INTO copy_id;

			INSERT INTO "assignment_cards" ("assignment_id", "card_slug", "note")
			SELECT copy_id, "card_slug", "note" FROM "assignment_cards" WHERE "assignment_id" = a."id";

			-- งานที่ส่ง: ย้ายไปสำเนาของรุ่นที่ผู้ส่งอยู่ตอนนี้ (น้องที่ไม่มีรุ่นหรือรุ่นไม่ได้ใช้โจทย์นี้ อยู่กับแถวเดิม)
			UPDATE "submissions" s SET "assignment_id" = copy_id
			FROM "users" u
			WHERE s."user_id" = u."id" AND u."cohort_id" = c."cohort_id" AND s."assignment_id" = a."id";

			-- โพสต์ที่ส่งถึงรุ่นเดียว: ย้ายไปสำเนาของรุ่นนั้น · โพสต์หลายรุ่นอยู่กับแถวเดิม
			UPDATE "posts" p SET "assignment_id" = copy_id
			WHERE p."assignment_id" = a."id"
				AND (SELECT count(*) FROM "post_cohorts" pc WHERE pc."post_id" = p."id") = 1
				AND EXISTS (SELECT 1 FROM "post_cohorts" pc WHERE pc."post_id" = p."id" AND pc."cohort_id" = c."cohort_id");
		END LOOP;
	END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "assignments" ALTER COLUMN "cohort_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_cohort_slug_uq" ON "assignments" USING btree ("cohort_id","slug");
