-- Users could create more than one clinic before this index. The app always
-- showed the oldest membership, so that one is kept; the other clinics' data
-- stays in the database, only the extra memberships are removed.
DELETE FROM "users_to_clinics" AS m
USING (
  SELECT "user_id", "clinic_id", row_number() OVER (
    PARTITION BY "user_id" ORDER BY "created_at", "clinic_id"
  ) AS rn
  FROM "users_to_clinics"
) AS d
WHERE m."user_id" = d."user_id" AND m."clinic_id" = d."clinic_id" AND d.rn > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "users_to_clinics_user_id_unique" ON "users_to_clinics" USING btree ("user_id");
