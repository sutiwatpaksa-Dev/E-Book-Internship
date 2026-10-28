ALTER TABLE "users" ADD COLUMN "reset_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin_expires_at" timestamp with time zone;