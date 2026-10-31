CREATE TABLE "task_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"task" text NOT NULL,
	"author_id" integer NOT NULL,
	"kind" text DEFAULT 'review' NOT NULL,
	"ref" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_id" integer NOT NULL,
	"assignment_id" integer,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"due_on" date,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "cohort_id" integer;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "scores" jsonb;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_posts" ADD CONSTRAINT "task_posts_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_posts" ADD CONSTRAINT "task_posts_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_posts" ADD CONSTRAINT "task_posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_comments_task_idx" ON "task_comments" USING btree ("user_id","task","created_at");--> statement-breakpoint
CREATE INDEX "task_posts_cohort_idx" ON "task_posts" USING btree ("cohort_id","created_at");--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;