-- One-off fix for rows written while the server converted times with its own
-- timezone. On Vercel (UTC) that stored clinic time (America/Sao_Paulo, UTC-3)
-- as if it were UTC, so these rows are 3 hours early.
--
-- Check first: if a doctor who starts at 08:00 shows available_from_time = 08:00
-- (not 11:00), the rows are in clinic time and need this fix. Rows written from
-- a machine already in UTC-3 are correct and must not be shifted.
--
-- Run once, right after deploying the fix:
--
--   psql "$DATABASE_URL" -v cutoff='2026-10-14 15:00:00' -f scripts/fix-clinic-timezone.sql
--
-- cutoff: UTC timestamp of the deploy. Rows created or edited after it are
-- already correct and are left alone.

\set ON_ERROR_STOP on

BEGIN;

-- time + interval wraps around midnight, which is what availability needs.
UPDATE doctors
SET available_from_time = available_from_time + interval '3 hours',
    available_to_time   = available_to_time   + interval '3 hours'
WHERE COALESCE(updated_at, created_at) < :'cutoff';

UPDATE appointments
SET date = date + interval '3 hours'
WHERE COALESCE(updated_at, created_at) < :'cutoff';

SELECT name, available_from_time, available_to_time FROM doctors ORDER BY name;

COMMIT;
