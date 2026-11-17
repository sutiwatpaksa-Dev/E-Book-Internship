CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"work_date" date NOT NULL,
	"check_in_at" timestamp with time zone NOT NULL,
	"check_out_at" timestamp with time zone,
	"edited_by" integer,
	"edited_at" timestamp with time zone,
	"edit_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_out_after_in" CHECK ("attendance_records"."check_out_at" is null or "attendance_records"."check_out_at" >= "attendance_records"."check_in_at")
);
--> statement-breakpoint
CREATE TABLE "cohort_holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_id" integer NOT NULL,
	"holiday_date" date NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"period" date NOT NULL,
	"criterion" text NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"scored_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kpi_scores_range" CHECK ("kpi_scores"."score" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"work_date" date NOT NULL,
	"kind" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"decided_by" integer,
	"decided_at" timestamp with time zone,
	"decision_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leave_kind_chk" CHECK ("leave_requests"."kind" in ('leave', 'late')),
	CONSTRAINT "leave_status_chk" CHECK ("leave_requests"."status" in ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "kpi" jsonb DEFAULT '{"work":70,"attendance":20,"engagement":10,"passPercent":60}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "work_start" time DEFAULT '09:00:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "work_end" time DEFAULT '18:00:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "late_grace_minutes" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_edited_by_users_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_holidays" ADD CONSTRAINT "cohort_holidays_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_scores" ADD CONSTRAINT "kpi_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_scores" ADD CONSTRAINT "kpi_scores_scored_by_users_id_fk" FOREIGN KEY ("scored_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_user_date_uniq" ON "attendance_records" USING btree ("user_id","work_date");--> statement-breakpoint
CREATE UNIQUE INDEX "cohort_holiday_uniq" ON "cohort_holidays" USING btree ("cohort_id","holiday_date");--> statement-breakpoint
CREATE UNIQUE INDEX "kpi_scores_uniq" ON "kpi_scores" USING btree ("user_id","period","criterion");--> statement-breakpoint
CREATE INDEX "leave_user_date_idx" ON "leave_requests" USING btree ("user_id","work_date");--> statement-breakpoint
CREATE INDEX "leave_status_idx" ON "leave_requests" USING btree ("status");--> statement-breakpoint
-- รุ่นเดิมคัดลอกน้ำหนัก KPI จากสายของตัวเอง (ไม่ใช่ค่าเริ่มต้นกลาง) แก้ได้ต่อรุ่นทีหลัง
UPDATE "cohorts" SET "kpi" = "tracks"."kpi" FROM "tracks" WHERE "cohorts"."track_id" = "tracks"."id";
