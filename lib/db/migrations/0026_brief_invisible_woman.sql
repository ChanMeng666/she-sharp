CREATE TYPE "public"."funding_source" AS ENUM('beehive', 'treasury', 'gets', 'data_govt', 'mbie', 'women_govt');--> statement-breakpoint
CREATE TABLE "funding_opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" "funding_source" NOT NULL,
	"external_id" varchar(500) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"title" varchar(500) NOT NULL,
	"url" varchar(1000) NOT NULL,
	"summary" text,
	"published_at" timestamp,
	"deadline" timestamp,
	"relevance_score" integer,
	"relevance_reason" text,
	"raw_metadata" jsonb,
	"posted_to_slack_at" timestamp,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "funding_source_external_unique" UNIQUE("source","external_id")
);
--> statement-breakpoint
CREATE INDEX "idx_funding_content_hash" ON "funding_opportunities" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "idx_funding_relevance_score" ON "funding_opportunities" USING btree ("relevance_score");--> statement-breakpoint
CREATE INDEX "idx_funding_first_seen" ON "funding_opportunities" USING btree ("first_seen_at");