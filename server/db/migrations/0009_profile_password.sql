ALTER TABLE "users" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "full_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "school_type" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "school_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "major" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "edu_level" text;