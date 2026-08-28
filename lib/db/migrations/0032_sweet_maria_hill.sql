CREATE TYPE "public"."subscriber_status" AS ENUM('pending', 'subscribed', 'unsubscribed', 'bounced', 'complained');--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"email_hash" varchar(64) NOT NULL,
	"first_name" varchar(80),
	"last_name" varchar(80),
	"status" "subscriber_status" DEFAULT 'pending' NOT NULL,
	"source" varchar(64) NOT NULL,
	"consent_source" text NOT NULL,
	"consent_date" timestamp NOT NULL,
	"consent_ip" varchar(45),
	"consent_user_agent" text,
	"confirm_token" varchar(64),
	"confirm_sent_at" timestamp,
	"confirm_expires_at" timestamp,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	"unsubscribe_reason" varchar(32),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "newsletter_subscribers_email_hash_unique" UNIQUE("email_hash"),
	CONSTRAINT "newsletter_subscribers_confirm_token_unique" UNIQUE("confirm_token")
);
--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscribers_status" ON "newsletter_subscribers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscribers_created_at" ON "newsletter_subscribers" USING btree ("created_at");