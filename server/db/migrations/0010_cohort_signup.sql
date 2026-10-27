ALTER TABLE "cohorts" ADD COLUMN "invite_hash" text;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "signup_open" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "signup_until" date;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "seat_limit" integer;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_invite_hash_unique" UNIQUE("invite_hash");