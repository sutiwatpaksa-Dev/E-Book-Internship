CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"asked_by" integer NOT NULL,
	"page_url" text NOT NULL,
	"body" text NOT NULL,
	"answer" text,
	"answered_by" integer,
	"answered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_asked_by_users_id_fk" FOREIGN KEY ("asked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_answered_by_users_id_fk" FOREIGN KEY ("answered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "questions_asked_by_idx" ON "questions" USING btree ("asked_by");