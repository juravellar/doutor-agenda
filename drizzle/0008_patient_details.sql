ALTER TABLE "patients" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "cpf" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "health_insurance" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "health_insurance_number" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_zip" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_street" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_number" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_complement" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_district" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_city" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_state" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "notes" text;--> statement-breakpoint
CREATE UNIQUE INDEX "patients_clinic_cpf_unique" ON "patients" USING btree ("clinic_id","cpf") WHERE "patients"."cpf" is not null;