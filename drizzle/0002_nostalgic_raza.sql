ALTER TABLE "users" ALTER COLUMN "stripe_customer_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "stripe_subscription_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan" DROP DEFAULT;