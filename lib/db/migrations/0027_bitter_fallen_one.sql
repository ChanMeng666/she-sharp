CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_session_id" varchar(255) NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"donor_email" varchar(255),
	"donor_name" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NZD' NOT NULL,
	"status" varchar(50) DEFAULT 'completed' NOT NULL,
	"receipt_sent" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "donations_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE INDEX "donations_donor_email_idx" ON "donations" USING btree ("donor_email");--> statement-breakpoint
CREATE INDEX "donations_created_at_idx" ON "donations" USING btree ("created_at");