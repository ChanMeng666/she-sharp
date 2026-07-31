CREATE TABLE "email_optouts" (
	"email_hash" varchar(64) PRIMARY KEY NOT NULL,
	"stream" varchar(32) NOT NULL,
	"reason" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_email_optouts_created_at" ON "email_optouts" USING btree ("created_at");