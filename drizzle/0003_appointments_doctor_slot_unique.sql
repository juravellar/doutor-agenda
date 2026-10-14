-- Double bookings made before this index existed would make it fail. Keep the
-- first booking of each slot and move the others 1 minute later per duplicate,
-- so no appointment is lost and the clinic can see and reschedule them.
UPDATE "appointments" AS a
SET "date" = a."date" + (d.rn - 1) * interval '1 minute'
FROM (
  SELECT "id", row_number() OVER (
    PARTITION BY "doctor_id", "date" ORDER BY "created_at", "id"
  ) AS rn
  FROM "appointments"
) AS d
WHERE a."id" = d."id" AND d.rn > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_doctor_id_date_unique" ON "appointments" USING btree ("doctor_id","date");
