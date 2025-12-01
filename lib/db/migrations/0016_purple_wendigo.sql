CREATE TYPE "public"."confidence_level" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."queue_status" AS ENUM('waiting', 'matching_in_progress', 'matched', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "mentee_waiting_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentee_user_id" integer NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"status" "queue_status" DEFAULT 'waiting' NOT NULL,
	"priority" integer DEFAULT 0,
	"best_match_score" numeric(5, 2),
	"match_attempts" integer DEFAULT 0,
	"last_match_attempt_at" timestamp,
	"notified_at" timestamp,
	"expires_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mentee_waiting_queue_mentee_user_id_unique" UNIQUE("mentee_user_id")
);
--> statement-breakpoint
ALTER TABLE "ai_match_results" ADD COLUMN "logistics_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "ai_match_results" ADD COLUMN "ai_explanation" text;--> statement-breakpoint
ALTER TABLE "ai_match_results" ADD COLUMN "ai_recommendation" text;--> statement-breakpoint
ALTER TABLE "ai_match_results" ADD COLUMN "confidence_level" "confidence_level";--> statement-breakpoint
ALTER TABLE "ai_match_results" ADD COLUMN "potential_challenges" jsonb;--> statement-breakpoint
ALTER TABLE "ai_match_results" ADD COLUMN "suggested_focus_areas" jsonb;--> statement-breakpoint
ALTER TABLE "ai_match_results" ADD COLUMN "processing_time_ms" integer;--> statement-breakpoint
ALTER TABLE "ai_match_results" ADD COLUMN "token_usage" jsonb;--> statement-breakpoint
ALTER TABLE "ai_matching_runs" ADD COLUMN "mentee_user_id" integer;--> statement-breakpoint
ALTER TABLE "ai_matching_runs" ADD COLUMN "total_api_calls" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ai_matching_runs" ADD COLUMN "total_tokens_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ai_matching_runs" ADD COLUMN "average_processing_time_ms" integer;--> statement-breakpoint
ALTER TABLE "ai_matching_runs" ADD COLUMN "error_details" jsonb;--> statement-breakpoint
ALTER TABLE "mentee_waiting_queue" ADD CONSTRAINT "mentee_waiting_queue_mentee_user_id_users_id_fk" FOREIGN KEY ("mentee_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "waiting_queue_mentee_user_id_idx" ON "mentee_waiting_queue" USING btree ("mentee_user_id");--> statement-breakpoint
CREATE INDEX "waiting_queue_status_idx" ON "mentee_waiting_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "waiting_queue_priority_idx" ON "mentee_waiting_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "waiting_queue_best_score_idx" ON "mentee_waiting_queue" USING btree ("best_match_score");--> statement-breakpoint
ALTER TABLE "ai_matching_runs" ADD CONSTRAINT "ai_matching_runs_mentee_user_id_users_id_fk" FOREIGN KEY ("mentee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;