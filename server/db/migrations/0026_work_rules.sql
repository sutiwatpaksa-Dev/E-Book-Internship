CREATE TABLE "cohort_work_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_id" integer NOT NULL,
	"effective_from" date NOT NULL,
	"work_start" time NOT NULL,
	"work_end" time NOT NULL,
	"late_grace_minutes" integer NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_work_rule_order" CHECK ("cohort_work_rules"."work_end" > "cohort_work_rules"."work_start"),
	CONSTRAINT "cohort_work_rule_grace" CHECK ("cohort_work_rules"."late_grace_minutes" between 0 and 120)
);
--> statement-breakpoint
ALTER TABLE "cohort_work_rules" ADD CONSTRAINT "cohort_work_rules_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_work_rules" ADD CONSTRAINT "cohort_work_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cohort_work_rule_uniq" ON "cohort_work_rules" USING btree ("cohort_id","effective_from");