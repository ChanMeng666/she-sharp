ALTER TYPE "public"."invitation_code_type" ADD VALUE 'test';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_test_user" boolean DEFAULT false NOT NULL;