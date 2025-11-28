-- Create new enum types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE "public"."bio_method" AS ENUM('self_written', 'ai_generated', 'already_sent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."career_stage" AS ENUM('undergraduate', 'postgraduate', 'early_career', 'mid_career', 'senior', 'career_transition');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."event_type" AS ENUM('workshop', 'networking', 'training', 'social', 'thrive');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."form_status" AS ENUM('not_started', 'in_progress', 'submitted', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."gender" AS ENUM('female', 'male', 'non_binary', 'prefer_not_to_say', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."invitation_code_status" AS ENUM('active', 'used', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."invitation_code_type" AS ENUM('payment', 'mentor_approved', 'admin_generated');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."location_type" AS ENUM('online', 'in_person', 'hybrid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."match_status" AS ENUM('pending_review', 'approved', 'rejected', 'active', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."mbti_type" AS ENUM('INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."meeting_type" AS ENUM('intro', 'regular', 'milestone', 'final');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."membership_tier" AS ENUM('free', 'basic', 'premium');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."mentee_type_preference" AS ENUM('undergraduate', 'postgraduate', 'professional');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."points_transaction_type" AS ENUM('event_attendance', 'meeting_completed', 'referral_bonus', 'milestone_reward', 'redemption', 'admin_adjustment');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."relationship_status" AS ENUM('pending', 'active', 'paused', 'completed', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."resource_access_level" AS ENUM('public', 'member', 'premium');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."resource_type" AS ENUM('document', 'video', 'link', 'template', 'guide');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."skill_category" AS ENUM('soft_basic', 'soft_expert', 'industry_basic', 'industry_expert');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."user_role_type" AS ENUM('mentor', 'mentee', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"can_view_all_data" boolean DEFAULT true,
	"can_edit_users" boolean DEFAULT true,
	"can_manage_relationships" boolean DEFAULT true,
	"can_access_analytics" boolean DEFAULT true,
	"can_manage_content" boolean DEFAULT true,
	"can_verify_mentors" boolean DEFAULT true,
	"can_manage_events" boolean DEFAULT true,
	"granted_by" integer,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_permissions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_match_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_user_id" integer NOT NULL,
	"mentee_user_id" integer NOT NULL,
	"overall_score" numeric(5, 2) NOT NULL,
	"mbti_compatibility_score" numeric(5, 2),
	"skill_match_score" numeric(5, 2),
	"goal_alignment_score" numeric(5, 2),
	"industry_match_score" numeric(5, 2),
	"matching_factors" jsonb,
	"ai_model_version" varchar(50),
	"matching_algorithm" varchar(100),
	"status" "match_status" DEFAULT 'pending_review' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"review_notes" text,
	"relationship_id" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_match_results_mentor_user_id_mentee_user_id_unique" UNIQUE("mentor_user_id","mentee_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_matching_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'running' NOT NULL,
	"mentees_processed" integer DEFAULT 0,
	"matches_generated" integer DEFAULT 0,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"triggered_by" integer,
	"summary" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"role_in_event" varchar(50),
	"checked_in_at" timestamp,
	"checked_out_at" timestamp,
	"attendance_duration" integer,
	"feedback_submitted" boolean DEFAULT false,
	"feedback_score" integer,
	"feedback_comments" text,
	"certificate_issued" boolean DEFAULT false,
	"certificate_url" varchar(500),
	"attendance_confirmed" boolean DEFAULT false,
	"attendance_confirmed_by" integer,
	"attendance_confirmed_at" timestamp,
	"points_awarded" integer DEFAULT 0,
	CONSTRAINT "event_registrations_event_id_user_id_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_role_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role_type" varchar(50) NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" integer,
	"notes" text,
	CONSTRAINT "event_role_assignments_event_id_user_id_role_type_unique" UNIQUE("event_id","user_id","role_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"event_type" "event_type" NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"timezone" varchar(50) DEFAULT 'America/Los_Angeles',
	"location_type" "location_type" NOT NULL,
	"location_details" jsonb,
	"capacity" integer,
	"current_registrations" integer DEFAULT 0,
	"registration_deadline" timestamp,
	"waitlist_enabled" boolean DEFAULT false,
	"is_members_only" boolean DEFAULT false,
	"required_membership_tier" "membership_tier",
	"agenda" jsonb,
	"speakers" jsonb,
	"materials" jsonb,
	"actual_attendance" integer,
	"feedback_score" numeric(3, 2),
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "experience_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"min_points" integer NOT NULL,
	"max_points" integer,
	"badge_image_url" varchar(500),
	"benefits" jsonb,
	"color" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "experience_levels_level_unique" UNIQUE("level")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "industry_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "industry_options_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitation_code_usages" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_id" integer NOT NULL,
	"used_by_user_id" integer NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitation_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"code_type" "invitation_code_type" DEFAULT 'payment' NOT NULL,
	"status" "invitation_code_status" DEFAULT 'active' NOT NULL,
	"max_uses" integer DEFAULT 1,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"purchase_id" integer,
	"generated_by" integer,
	"generated_for" varchar(255),
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"relationship_id" integer NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 60,
	"meeting_type" "meeting_type" DEFAULT 'regular' NOT NULL,
	"meeting_link" varchar(500),
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"topics_discussed" jsonb,
	"goals_set" jsonb,
	"action_items" jsonb,
	"mentor_notes" text,
	"mentee_feedback" text,
	"rating" integer,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"recording_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "membership_benefits" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier" "membership_tier" NOT NULL,
	"benefit_key" varchar(100) NOT NULL,
	"benefit_name" varchar(200) NOT NULL,
	"description" text,
	"is_included" boolean DEFAULT false,
	"quantity_limit" integer,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_benefits_tier_benefit_key_unique" UNIQUE("tier","benefit_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "membership_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier" "membership_tier" NOT NULL,
	"feature_name" varchar(100) NOT NULL,
	"feature_value" jsonb,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_features_tier_feature_name_unique" UNIQUE("tier","feature_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "membership_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"stripe_payment_intent_id" varchar(255),
	"stripe_price_id" varchar(255),
	"amount_paid" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NZD' NOT NULL,
	"membership_tier" "membership_tier" NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"subscription_status" "subscription_status" NOT NULL,
	"auto_renew" boolean DEFAULT true,
	"canceled_at" timestamp,
	"cancel_reason" text,
	"invoice_url" varchar(500),
	"receipt_url" varchar(500),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_purchases_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentee_form_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(255),
	"status" "form_status" DEFAULT 'not_started' NOT NULL,
	"last_saved_at" timestamp,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"review_notes" text,
	"full_name" varchar(200),
	"age" integer,
	"phone" varchar(50),
	"current_stage" "career_stage",
	"photo_url" varchar(500),
	"photo_uploaded_at" timestamp,
	"bio" text,
	"current_job_title" varchar(200),
	"current_industry" varchar(200),
	"preferred_industries" jsonb,
	"soft_skills_basic" jsonb,
	"industry_skills_basic" jsonb,
	"soft_skills_expert" jsonb,
	"industry_skills_expert" jsonb,
	"long_term_goals" text,
	"short_term_goals" text,
	"why_mentor" text,
	"program_expectations" text,
	"mbti_type" "mbti_type",
	"preferred_meeting_frequency" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mentee_form_submissions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentee_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"learning_goals" jsonb,
	"career_stage" varchar(100),
	"preferred_expertise_areas" jsonb,
	"preferred_meeting_frequency" varchar(50),
	"bio" text,
	"current_challenge" text,
	"profile_completed_at" timestamp,
	"mbti_type" "mbti_type",
	"photo_url" varchar(500),
	"form_submission_id" integer,
	CONSTRAINT "mentee_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentor_form_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(255),
	"status" "form_status" DEFAULT 'not_started' NOT NULL,
	"last_saved_at" timestamp,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"review_notes" text,
	"full_name" varchar(200),
	"gender" "gender",
	"phone" varchar(50),
	"job_title" varchar(200),
	"company" varchar(200),
	"photo_url" varchar(500),
	"photo_uploaded_at" timestamp,
	"bio_method" "bio_method",
	"bio" text,
	"soft_skills_basic" jsonb,
	"industry_skills_basic" jsonb,
	"soft_skills_expert" jsonb,
	"industry_skills_expert" jsonb,
	"expected_mentee_goals_long_term" text,
	"expected_mentee_goals_short_term" text,
	"program_expectations" text,
	"preferred_mentee_types" jsonb,
	"preferred_industries" jsonb,
	"mbti_type" "mbti_type",
	"years_experience" integer,
	"linkedin_url" varchar(500),
	"availability_hours_per_month" integer,
	"max_mentees" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mentor_form_submissions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentor_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expertise_areas" jsonb,
	"years_experience" integer,
	"company" varchar(200),
	"job_title" varchar(200),
	"bio" text,
	"linkedin_url" varchar(500),
	"availability_hours_per_month" integer,
	"max_mentees" integer DEFAULT 3,
	"current_mentees_count" integer DEFAULT 0,
	"is_accepting_mentees" boolean DEFAULT true,
	"profile_completed_at" timestamp,
	"verified_at" timestamp,
	"verified_by" integer,
	"mbti_type" "mbti_type",
	"photo_url" varchar(500),
	"form_submission_id" integer,
	CONSTRAINT "mentor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentorship_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_user_id" integer NOT NULL,
	"mentee_user_id" integer NOT NULL,
	"status" "relationship_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"paused_at" timestamp,
	"meeting_frequency" varchar(50),
	"next_meeting_date" timestamp,
	"relationship_goals" text,
	"mentor_notes" text,
	"mentee_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"milestone_type" varchar(50) NOT NULL,
	"target_value" integer NOT NULL,
	"reward_points" integer DEFAULT 0,
	"badge_image_url" varchar(500),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "points_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_type" "points_transaction_type" NOT NULL,
	"event_type" "event_type",
	"points_amount" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "points_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"transaction_type" "points_transaction_type" NOT NULL,
	"points" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"source_entity_type" varchar(50),
	"source_entity_id" integer,
	"description" text,
	"confirmed_by" integer,
	"confirmed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resource_access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"accessed_at" timestamp DEFAULT now() NOT NULL,
	"action" varchar(20) NOT NULL,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"resource_type" "resource_type" NOT NULL,
	"file_url" varchar(500),
	"file_size" integer,
	"mime_type" varchar(100),
	"access_level" "resource_access_level" DEFAULT 'member' NOT NULL,
	"required_roles" jsonb,
	"categories" jsonb,
	"tags" jsonb,
	"uploaded_by" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"download_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"average_rating" numeric(3, 2)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reward_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reward_id" integer NOT NULL,
	"points_spent" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"fulfilled_at" timestamp,
	"fulfilled_by" integer,
	"notes" text,
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"points_cost" integer NOT NULL,
	"image_url" varchar(500),
	"category" varchar(100),
	"quantity_available" integer,
	"quantity_redeemed" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skill_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "skill_category" NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_system_defined" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_by" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skill_options_category_name_unique" UNIQUE("category","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tier" "membership_tier" DEFAULT 'free' NOT NULL,
	"expires_at" timestamp,
	"features_access" jsonb,
	"last_payment_at" timestamp,
	"next_billing_date" timestamp,
	"cancelled_at" timestamp,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"current_purchase_id" integer,
	"event_priority_access" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_memberships_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_memberships_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_mentorship_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mentees_count" integer DEFAULT 0,
	"mentors_count" integer DEFAULT 0,
	"total_meetings" integer DEFAULT 0,
	"completed_meetings" integer DEFAULT 0,
	"total_meeting_hours" numeric(10, 2) DEFAULT '0',
	"events_attended" integer DEFAULT 0,
	"events_registered" integer DEFAULT 0,
	"resources_uploaded" integer DEFAULT 0,
	"resources_accessed" integer DEFAULT 0,
	"last_activity_at" timestamp,
	"stats_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_mentorship_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"milestone_id" integer NOT NULL,
	"achieved_at" timestamp DEFAULT now() NOT NULL,
	"points_awarded" integer,
	CONSTRAINT "user_milestones_user_id_milestone_id_unique" UNIQUE("user_id","milestone_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"current_points" integer DEFAULT 0 NOT NULL,
	"lifetime_points" integer DEFAULT 0 NOT NULL,
	"experience_level" integer DEFAULT 1 NOT NULL,
	"experience_level_name" varchar(100) DEFAULT 'Newcomer',
	"events_attended" integer DEFAULT 0 NOT NULL,
	"meetings_completed" integer DEFAULT 0 NOT NULL,
	"last_milestone_achieved" varchar(100),
	"next_milestone_target" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_points_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role_type" "user_role_type" NOT NULL,
	"activated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"activation_step" integer DEFAULT 0,
	"verified_at" timestamp,
	CONSTRAINT "user_roles_user_id_role_type_unique" UNIQUE("user_id","role_type")
);
--> statement-breakpoint
-- Safely drop constraint if exists
DO $$ BEGIN
    ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_team_id_teams_id_fk";
EXCEPTION WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
-- Add columns if they don't exist
DO $$ BEGIN
    ALTER TABLE "activity_logs" ADD COLUMN "entity_type" varchar(50);
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "activity_logs" ADD COLUMN "entity_id" integer;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "activity_logs" ADD COLUMN "metadata" jsonb;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "users" ADD COLUMN "gender" "gender";
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "users" ADD COLUMN "phone" varchar(50);
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "users" ADD COLUMN "age" integer;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "users" ADD COLUMN "registered_via_invite_code" integer;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
-- Add columns to event_registrations if table already exists
DO $$ BEGIN
    ALTER TABLE "event_registrations" ADD COLUMN "attendance_confirmed" boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "event_registrations" ADD COLUMN "attendance_confirmed_by" integer;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "event_registrations" ADD COLUMN "attendance_confirmed_at" timestamp;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "event_registrations" ADD COLUMN "points_awarded" integer DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
-- Add foreign key constraints (ignore if already exists)
DO $$ BEGIN
    ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "ai_match_results" ADD CONSTRAINT "ai_match_results_mentor_user_id_users_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "ai_match_results" ADD CONSTRAINT "ai_match_results_mentee_user_id_users_id_fk" FOREIGN KEY ("mentee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "ai_match_results" ADD CONSTRAINT "ai_match_results_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "ai_match_results" ADD CONSTRAINT "ai_match_results_relationship_id_mentorship_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."mentorship_relationships"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "ai_matching_runs" ADD CONSTRAINT "ai_matching_runs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_attendance_confirmed_by_users_id_fk" FOREIGN KEY ("attendance_confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "event_role_assignments" ADD CONSTRAINT "event_role_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "event_role_assignments" ADD CONSTRAINT "event_role_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "event_role_assignments" ADD CONSTRAINT "event_role_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "invitation_code_usages" ADD CONSTRAINT "invitation_code_usages_code_id_invitation_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."invitation_codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "invitation_code_usages" ADD CONSTRAINT "invitation_code_usages_used_by_user_id_users_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "meetings" ADD CONSTRAINT "meetings_relationship_id_mentorship_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."mentorship_relationships"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "membership_purchases" ADD CONSTRAINT "membership_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "mentee_form_submissions" ADD CONSTRAINT "mentee_form_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "mentee_form_submissions" ADD CONSTRAINT "mentee_form_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "mentee_profiles" ADD CONSTRAINT "mentee_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "mentor_form_submissions" ADD CONSTRAINT "mentor_form_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "mentor_form_submissions" ADD CONSTRAINT "mentor_form_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_mentor_user_id_users_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_mentee_user_id_users_id_fk" FOREIGN KEY ("mentee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "resource_access_logs" ADD CONSTRAINT "resource_access_logs_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "resource_access_logs" ADD CONSTRAINT "resource_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "resources" ADD CONSTRAINT "resources_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_fulfilled_by_users_id_fk" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "skill_options" ADD CONSTRAINT "skill_options_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_mentorship_stats" ADD CONSTRAINT "user_mentorship_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_milestones" ADD CONSTRAINT "user_milestones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_milestones" ADD CONSTRAINT "user_milestones_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_permissions_user_id_idx" ON "admin_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_match_results_mentor_idx" ON "ai_match_results" USING btree ("mentor_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_match_results_mentee_idx" ON "ai_match_results" USING btree ("mentee_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_match_results_status_idx" ON "ai_match_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_match_results_score_idx" ON "ai_match_results" USING btree ("overall_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "registrations_event_idx" ON "event_registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "registrations_user_idx" ON "event_registrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_role_assignments_event_idx" ON "event_role_assignments" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_role_assignments_user_idx" ON "event_role_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_role_assignments_role_type_idx" ON "event_role_assignments" USING btree ("role_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_start_time_idx" ON "events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_created_by_idx" ON "events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitation_code_usages_code_id_idx" ON "invitation_code_usages" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitation_code_usages_user_id_idx" ON "invitation_code_usages" USING btree ("used_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitation_codes_code_idx" ON "invitation_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitation_codes_status_idx" ON "invitation_codes" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitation_codes_expires_at_idx" ON "invitation_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_relationship_idx" ON "meetings" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_scheduled_at_idx" ON "meetings" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_status_idx" ON "meetings" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_features_tier_idx" ON "membership_features" USING btree ("tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_purchases_user_id_idx" ON "membership_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_purchases_stripe_sub_idx" ON "membership_purchases" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_purchases_status_idx" ON "membership_purchases" USING btree ("subscription_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_purchases_period_end_idx" ON "membership_purchases" USING btree ("period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentee_form_submissions_user_id_idx" ON "mentee_form_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentee_form_submissions_status_idx" ON "mentee_form_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentee_form_submissions_email_idx" ON "mentee_form_submissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentee_profiles_user_id_idx" ON "mentee_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentor_form_submissions_user_id_idx" ON "mentor_form_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentor_form_submissions_status_idx" ON "mentor_form_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentor_form_submissions_email_idx" ON "mentor_form_submissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentor_profiles_user_id_idx" ON "mentor_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "relationships_mentor_idx" ON "mentorship_relationships" USING btree ("mentor_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "relationships_mentee_idx" ON "mentorship_relationships" USING btree ("mentee_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "relationships_status_idx" ON "mentorship_relationships" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "points_transactions_user_id_idx" ON "points_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "points_transactions_type_idx" ON "points_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "points_transactions_source_idx" ON "points_transactions" USING btree ("source_entity_type","source_entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "access_logs_resource_idx" ON "resource_access_logs" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "access_logs_user_idx" ON "resource_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_type_idx" ON "resources" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_access_level_idx" ON "resources" USING btree ("access_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_uploaded_by_idx" ON "resources" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skill_options_category_idx" ON "skill_options" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_user_id_idx" ON "user_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_tier_idx" ON "user_memberships" USING btree ("tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_mentorship_stats_user_id_idx" ON "user_mentorship_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_mentorship_stats_updated_idx" ON "user_mentorship_stats" USING btree ("stats_updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_points_user_id_idx" ON "user_points" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_points_level_idx" ON "user_points" USING btree ("experience_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_role_type_idx" ON "user_roles" USING btree ("role_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_user_idx" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_entity_idx" ON "activity_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "users" DROP COLUMN "role";
EXCEPTION WHEN undefined_column THEN null;
END $$;