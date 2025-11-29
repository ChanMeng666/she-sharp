ALTER TABLE "invitation_codes" ADD COLUMN "target_role" "user_role_type";--> statement-breakpoint
ALTER TABLE "invitation_codes" ADD COLUMN "linked_form_id" integer;--> statement-breakpoint
ALTER TABLE "invitation_codes" ADD COLUMN "linked_form_type" varchar(20);--> statement-breakpoint
ALTER TABLE "mentee_form_submissions" ADD COLUMN "payment_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "mentee_form_submissions" ADD COLUMN "payment_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "mentee_form_submissions" ADD COLUMN "purchase_id" integer;--> statement-breakpoint
ALTER TABLE "mentee_form_submissions" ADD COLUMN "invitation_code_id" integer;--> statement-breakpoint
CREATE INDEX "invitation_codes_target_role_idx" ON "invitation_codes" USING btree ("target_role");--> statement-breakpoint
CREATE INDEX "mentee_form_submissions_payment_idx" ON "mentee_form_submissions" USING btree ("payment_completed");