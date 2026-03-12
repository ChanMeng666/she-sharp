DROP TABLE "industry_options" CASCADE;--> statement-breakpoint
DROP TABLE "invitations" CASCADE;--> statement-breakpoint
DROP TABLE "membership_benefits" CASCADE;--> statement-breakpoint
DROP TABLE "membership_features" CASCADE;--> statement-breakpoint
DROP TABLE "skill_options" CASCADE;--> statement-breakpoint
DROP TABLE "team_members" CASCADE;--> statement-breakpoint
DROP TABLE "teams" CASCADE;--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "team_id";--> statement-breakpoint
DROP TYPE "public"."skill_category";