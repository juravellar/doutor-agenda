-- Double bookings made before this index existed would make it fail. Keep the
-- first booking of each slot and move each other one to the next free second:
-- the time shown (HH:mm) is unchanged, no appointment is lost and the shift
-- can't collide with any other booking.
DO $$
DECLARE
  duplicate record;
  shift integer;
BEGIN
  FOR duplicate IN
    SELECT "id", "doctor_id", "date"
    FROM (
      SELECT "id", "doctor_id", "date", row_number() OVER (
        PARTITION BY "doctor_id", "date" ORDER BY "created_at", "id"
      ) AS rn
      FROM "appointments"
    ) AS ranked
    WHERE rn > 1
  LOOP
    shift := 1;
    WHILE EXISTS (
      SELECT 1 FROM "appointments"
      WHERE "doctor_id" = duplicate."doctor_id"
        AND "date" = duplicate."date" + shift * interval '1 second'
    ) LOOP
      shift := shift + 1;
    END LOOP;
    UPDATE "appointments"
    SET "date" = duplicate."date" + shift * interval '1 second'
    WHERE "id" = duplicate."id";
  END LOOP;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_doctor_id_date_unique" ON "appointments" USING btree ("doctor_id","date");
