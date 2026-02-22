CREATE TYPE "public"."communication_method" AS ENUM('email', 'phone');--> statement-breakpoint
CREATE TYPE "public"."experience_rating" AS ENUM('excellent', 'good', 'average', 'below_average', 'poor');--> statement-breakpoint
CREATE TYPE "public"."how_heard_about" AS ENUM('attended_event', 'linkedin', 'word_of_mouth', 'search_engine', 'social_media', 'other');--> statement-breakpoint
CREATE TYPE "public"."recruitment_stage" AS ENUM('new', 'contacted', 'screening', 'interview_requested', 'interview_scheduled', 'approved', 'rejected', 'onboarding', 'nda_sent', 'nda_signed', 'active');--> statement-breakpoint
ALTER TYPE "public"."volunteer_type" ADD VALUE 'ex_ambassador';--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ALTER COLUMN "current_status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ALTER COLUMN "how_heard_about" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ALTER COLUMN "skill_sets" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "how_heard_about_option" "how_heard_about";--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "how_heard_about_other" varchar(200);--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "current_role_title" varchar(200);--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "joined_she_sharp_year" integer;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "left_role_year" integer;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "still_ambassador" boolean;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "experience_rating" "experience_rating";--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "most_valuable_part" varchar(100);--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "most_valuable_part_other" varchar(200);--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "would_recommend" boolean;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "want_featured" boolean;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "preferred_communication" "communication_method";--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "additional_comments" text;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "recruitment_stage" "recruitment_stage" DEFAULT 'new';--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "recruitment_stage_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "recruitment_stage_updated_by" integer;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "interview_requested_by" varchar(100);--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "interview_scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "interview_notes" text;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "joined_date" timestamp;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "nda_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "nda_signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "slack_invited_at" timestamp;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "admin_notes" text;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "ai_screening_result" jsonb;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD COLUMN "ai_screened_at" timestamp;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD CONSTRAINT "volunteer_form_submissions_recruitment_stage_updated_by_users_id_fk" FOREIGN KEY ("recruitment_stage_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "volunteer_form_recruitment_stage_idx" ON "volunteer_form_submissions" USING btree ("recruitment_stage");