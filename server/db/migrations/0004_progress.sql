CREATE TABLE "progress" (
	"user_id" integer NOT NULL,
	"link" text NOT NULL,
	"done_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progress_user_id_link_pk" PRIMARY KEY("user_id","link")
);
--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;