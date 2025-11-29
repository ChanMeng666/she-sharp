CREATE TYPE "public"."meeting_format" AS ENUM('online', 'in_person', 'hybrid');--> statement-breakpoint
ALTER TABLE "mentee_form_submissions" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "mentee_form_submissions" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "mentee_form_submissions" ADD COLUMN "preferred_meeting_format" "meeting_format";--> statement-breakpoint
ALTER TABLE "mentor_form_submissions" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "mentor_form_submissions" ADD COLUMN "preferred_meeting_format" "meeting_format";