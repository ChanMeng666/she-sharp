CREATE TABLE "contact_form_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"organisation" varchar(200),
	"message" text NOT NULL,
	"status" "form_status" DEFAULT 'submitted' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"review_notes" text
);
--> statement-breakpoint
ALTER TABLE "contact_form_submissions" ADD CONSTRAINT "contact_form_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_form_email_idx" ON "contact_form_submissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contact_form_status_idx" ON "contact_form_submissions" USING btree ("status");