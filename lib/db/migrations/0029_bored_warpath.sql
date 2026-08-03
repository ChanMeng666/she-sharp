CREATE TYPE "public"."event_feedback_source" AS ENUM('deck_qr', 'event_page', 'direct_link', 'email');--> statement-breakpoint
CREATE TABLE "event_feedback_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_slug" varchar(200) NOT NULL,
	"event_title" varchar(300),
	"overall_rating" integer NOT NULL,
	"recommend_score" integer,
	"would_attend_again" boolean,
	"what_worked" text,
	"what_to_improve" text,
	"interested_in_mentorship" boolean DEFAULT false NOT NULL,
	"interested_in_volunteering" boolean DEFAULT false NOT NULL,
	"interested_in_newsletter" boolean DEFAULT false NOT NULL,
	"name" varchar(100),
	"email" varchar(255),
	"source" "event_feedback_source" DEFAULT 'direct_link' NOT NULL,
	"status" "form_status" DEFAULT 'submitted' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"review_notes" text
);
--> statement-breakpoint
ALTER TABLE "event_feedback_submissions" ADD CONSTRAINT "event_feedback_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_feedback_event_slug_idx" ON "event_feedback_submissions" USING btree ("event_slug");--> statement-breakpoint
CREATE INDEX "event_feedback_submitted_at_idx" ON "event_feedback_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "event_feedback_email_idx" ON "event_feedback_submissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "event_feedback_status_idx" ON "event_feedback_submissions" USING btree ("status");