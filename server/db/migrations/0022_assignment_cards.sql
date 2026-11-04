CREATE TABLE "assignment_cards" (
	"assignment_id" integer NOT NULL,
	"card_slug" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	CONSTRAINT "assignment_cards_assignment_id_card_slug_pk" PRIMARY KEY("assignment_id","card_slug")
);
--> statement-breakpoint
ALTER TABLE "assignment_cards" ADD CONSTRAINT "assignment_cards_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignment_cards_card_idx" ON "assignment_cards" USING btree ("card_slug");