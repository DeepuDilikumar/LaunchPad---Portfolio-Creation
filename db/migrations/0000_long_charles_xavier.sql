CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"user_id" uuid,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"kind" text NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"scope" text,
	"max_redemptions" integer,
	"redemptions" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"note" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project" text NOT NULL,
	"module" text NOT NULL,
	"cell_id" text NOT NULL,
	"text" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"to" text NOT NULL,
	"template" text NOT NULL,
	"subject" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"organization" text NOT NULL,
	"kind" text NOT NULL,
	"seats" integer,
	"message" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notify_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"user_id" uuid,
	"module_slug" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"slug" text NOT NULL,
	"price_inr" integer NOT NULL,
	"price_usd" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"handle" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"github_username" text,
	"avatar_url" text,
	"preferred_tool" text DEFAULT 'claude' NOT NULL,
	"experience_level" text,
	"target_role" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"marketing_emails" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"project" text NOT NULL,
	"module" text NOT NULL,
	"cell_id" text NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proof_packs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"project" text NOT NULL,
	"repo_url" text,
	"live_url" text,
	"verify_token" text NOT NULL,
	"checks" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verified_at" timestamp with time zone,
	"metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_decision_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"case_study_md" text,
	"bullets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_slug" text NOT NULL,
	"project_slug" text,
	"provider" text NOT NULL,
	"provider_order_id" text NOT NULL,
	"provider_payment_id" text,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"coupon_code" text,
	"return_to" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutor_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"project" text NOT NULL,
	"module" text NOT NULL,
	"cell_id" text,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"type" text DEFAULT '' NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_event_created_idx" ON "analytics_events" USING btree ("event","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_once_key" ON "coupon_redemptions" USING btree ("coupon_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "decisions_user_cell_key" ON "decisions" USING btree ("user_id","project","module","cell_id");--> statement-breakpoint
CREATE INDEX "email_log_user_template_idx" ON "email_log" USING btree ("user_id","template");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlements_grant_key" ON "entitlements" USING btree ("user_id","scope","source","source_id");--> statement-breakpoint
CREATE INDEX "entitlements_user_idx" ON "entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notify_requests_key" ON "notify_requests" USING btree ("module_slug","email","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_handle_key" ON "profiles" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX "progress_user_cell_key" ON "progress" USING btree ("user_id","project","module","cell_id");--> statement-breakpoint
CREATE INDEX "progress_user_updated_idx" ON "progress" USING btree ("user_id","updatedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_packs_user_project_key" ON "proof_packs" USING btree ("user_id","project");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_provider_payment_id_key" ON "purchases" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_provider_order_id_key" ON "purchases" USING btree ("provider","provider_order_id");--> statement-breakpoint
CREATE INDEX "purchases_user_idx" ON "purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tutor_messages_user_created_idx" ON "tutor_messages" USING btree ("user_id","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_event_key" ON "webhook_events" USING btree ("provider","event_id");