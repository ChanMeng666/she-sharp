CREATE TYPE "public"."programme_status" AS ENUM('draft', 'active', 'closed', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "mentor_programme_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_user_id" integer NOT NULL,
	"programme_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" integer,
	"max_mentees_in_programme" integer DEFAULT 2,
	"current_mentees_in_programme" integer DEFAULT 0 NOT NULL,
	"notes" text,
	CONSTRAINT "mentor_programme_assignments_mentor_user_id_programme_id_unique" UNIQUE("mentor_user_id","programme_id")
);
--> statement-breakpoint
CREATE TABLE "programmes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"status" "programme_status" DEFAULT 'draft' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"application_deadline" timestamp,
	"max_mentees" integer,
	"current_mentee_count" integer DEFAULT 0 NOT NULL,
	"requires_payment" boolean DEFAULT true NOT NULL,
	"partner_organisation" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "programmes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "ai_match_results" ADD COLUMN "programme_id" integer;--> statement-breakpoint
ALTER TABLE "ai_matching_runs" ADD COLUMN "programme_id" integer;--> statement-breakpoint
ALTER TABLE "mentee_form_submissions" ADD COLUMN "programme_id" integer;--> statement-breakpoint
ALTER TABLE "mentee_waiting_queue" ADD COLUMN "programme_id" integer;--> statement-breakpoint
ALTER TABLE "mentorship_relationships" ADD COLUMN "programme_id" integer;--> statement-breakpoint
ALTER TABLE "mentor_programme_assignments" ADD CONSTRAINT "mentor_programme_assignments_mentor_user_id_users_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_programme_assignments" ADD CONSTRAINT "mentor_programme_assignments_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_programme_assignments" ADD CONSTRAINT "mentor_programme_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentor_programme_mentor_idx" ON "mentor_programme_assignments" USING btree ("mentor_user_id");--> statement-breakpoint
CREATE INDEX "mentor_programme_programme_idx" ON "mentor_programme_assignments" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX "programmes_slug_idx" ON "programmes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "programmes_status_idx" ON "programmes" USING btree ("status");--> statement-breakpoint
ALTER TABLE "ai_match_results" ADD CONSTRAINT "ai_match_results_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_matching_runs" ADD CONSTRAINT "ai_matching_runs_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentee_form_submissions" ADD CONSTRAINT "mentee_form_submissions_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentee_waiting_queue" ADD CONSTRAINT "mentee_waiting_queue_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_match_results_programme_idx" ON "ai_match_results" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX "mentee_form_submissions_programme_idx" ON "mentee_form_submissions" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX "waiting_queue_programme_idx" ON "mentee_waiting_queue" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX "relationships_programme_idx" ON "mentorship_relationships" USING btree ("programme_id");--> statement-breakpoint
INSERT INTO "programmes" ("name", "slug", "description", "status", "start_date", "end_date", "requires_payment", "partner_organisation", "max_mentees")
VALUES ('HER WAKA', 'her-waka', 'MSD employment programme - Navigating pathways into sustainable employment', 'active', '2026-03-25', '2026-06-02', false, 'Ministry of Social Development', 25);