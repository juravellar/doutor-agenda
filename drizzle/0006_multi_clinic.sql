DROP INDEX "users_to_clinics_user_id_unique";--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active_clinic_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clinic_choice_made_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clinic_choice_changed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users_to_clinics" ADD COLUMN "kept_in_plan" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_active_clinic_id_clinics_id_fk" FOREIGN KEY ("active_clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_to_clinics_user_clinic_unique" ON "users_to_clinics" USING btree ("user_id","clinic_id");