CREATE TYPE "public"."event_attend_again" AS ENUM('yes', 'maybe', 'no');--> statement-breakpoint
-- Drop and re-add rather than ALTER ... USING: Postgres has no cast from
-- boolean to an enum, so the generated `would_attend_again::event_attend_again`
-- fails at parse time even against an empty table. Dropping is lossless here
-- because 0029 created this column minutes earlier and nothing has written to
-- it. Were there rows, this would need a three-step add/backfill/rename instead.
ALTER TABLE "event_feedback_submissions" DROP COLUMN "would_attend_again";--> statement-breakpoint
ALTER TABLE "event_feedback_submissions" ADD COLUMN "would_attend_again" "public"."event_attend_again";
