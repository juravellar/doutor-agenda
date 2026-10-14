import { describe, expect, it } from "vitest";

// Runs against a real Postgres only when INTEGRATION_DATABASE_URL is set (see
// the test:integration script); regular test runs skip it.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;

describe.skipIf(!databaseUrl)("clinic lock against Postgres", () => {
  const CLINIC_ID = "11111111-1111-4111-8111-111111111111";
  const DOCTOR_ID = "22222222-2222-4222-8222-222222222222";

  const load = async () => {
    process.env.DATABASE_URL = databaseUrl;
    const { withClinicLock } = await import("./clinic-lock");
    const { computeAvailableTimes } = await import("@/lib/available-times");
    const { db } = await import("@/db");
    const { doctorsTable } = await import("@/db/schema");
    return { withClinicLock, computeAvailableTimes, db, doctorsTable };
  };

  it("does not exhaust the pool when many bookings wait on the same lock", async () => {
    const { withClinicLock, computeAvailableTimes } = await load();

    // More concurrent transactions than the pool's 10 connections.
    const results = await Promise.all(
      Array.from({ length: 30 }, () =>
        withClinicLock(CLINIC_ID, (tx) =>
          computeAvailableTimes(tx, {
            clinicId: CLINIC_ID,
            doctorId: DOCTOR_ID,
            date: "2026-10-12",
          }),
        ),
      ),
    );

    expect(results).toHaveLength(30);
  }, 20_000);

  it("lets only one of many concurrent requests pass a count-then-insert check", async () => {
    const { withClinicLock, db, doctorsTable } = await load();
    const { eq } = await import("drizzle-orm");
    const LIMIT = 2; // the seeded doctor plus one more

    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        withClinicLock(CLINIC_ID, async (tx) => {
          const count = await tx.$count(
            doctorsTable,
            eq(doctorsTable.clinicId, CLINIC_ID),
          );
          if (count >= LIMIT) {
            throw new Error("limit");
          }
          await tx.insert(doctorsTable).values({
            clinicId: CLINIC_ID,
            name: `Concurrent ${i}`,
            specialty: "S",
            availableFromWeekDay: 1,
            availableToWeekDay: 5,
            availableFromTime: "11:00:00",
            availableToTime: "21:00:00",
            appointmentPriceInCents: 100,
          });
        }),
      ),
    );

    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(1);
    expect(
      await db.$count(doctorsTable, eq(doctorsTable.clinicId, CLINIC_ID)),
    ).toBe(LIMIT);
  });
});
