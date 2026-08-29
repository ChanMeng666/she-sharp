CREATE TABLE "email_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"svix_id" varchar(64) NOT NULL,
	"email_id" varchar(64),
	"type" varchar(32) NOT NULL,
	"email_hash" varchar(64) NOT NULL,
	"stream" varchar(32),
	"issue_tag" varchar(64),
	"bounce_type" varchar(32),
	"occurred_at" timestamp NOT NULL,
	"link_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_events_svix_id_unique" UNIQUE("svix_id")
);
--> statement-breakpoint
CREATE INDEX "idx_email_events_email_id" ON "email_events" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "idx_email_events_issue_tag" ON "email_events" USING btree ("issue_tag");--> statement-breakpoint
CREATE INDEX "idx_email_events_type" ON "email_events" USING btree ("type");