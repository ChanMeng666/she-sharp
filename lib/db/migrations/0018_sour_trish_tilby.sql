DO $$ BEGIN
  CREATE TYPE "public"."volunteer_current_status" AS ENUM('high_school_student', 'university_student', 'industry', 'sponsor_partner', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."volunteer_type" AS ENUM('ambassador', 'volunteer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"action_url" varchar(500),
	"action_label" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "volunteer_form_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "volunteer_type" NOT NULL,
	"email" varchar(255) NOT NULL,
	"status" "form_status" DEFAULT 'submitted' NOT NULL,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"review_notes" text,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"current_status" "volunteer_current_status" NOT NULL,
	"current_status_other" varchar(200),
	"organisation" varchar(200),
	"how_heard_about" text NOT NULL,
	"skill_sets" text NOT NULL,
	"linkedin_url" varchar(500),
	"it_industry_interest" text,
	"volunteer_hours_per_week" varchar(20),
	"cv_url" varchar(500),
	"cv_file_name" varchar(255),
	"events_per_year" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "volunteer_form_submissions" ADD CONSTRAINT "volunteer_form_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_form_status_idx" ON "volunteer_form_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_form_email_idx" ON "volunteer_form_submissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_form_type_idx" ON "volunteer_form_submissions" USING btree ("type");