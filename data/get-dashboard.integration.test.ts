import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Runs against a real Postgres only when INTEGRATION_DATABASE_URL is set (see
// the test:integration script); regular test runs skip it.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;

describe.skipIf(!databaseUrl)("dashboard days against Postgres", () => {
  const CLINIC_ID = "55555555-5555-4555-8555-555555555555";
  const DOCTOR_ID = "66666666-6666-4666-8666-666666666666";
  const PATIENT_ID = "77777777-7777-4777-8777-777777777777";

  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-14T15:00:00Z"));
    process.env.DATABASE_URL = databaseUrl;
    const { db } = await import("@/db");
    const schema = await import("@/db/schema");
    await db
      .insert(schema.clinicsTable)
      .values({ id: CLINIC_ID, name: "Dashboard" })
      .onConflictDoNothing();
    await db
      .insert(schema.doctorsTable)
      .values({
        id: DOCTOR_ID,
        clinicId: CLINIC_ID,
        name: "D",
        specialty: "S",
        availableFromWeekDay: 0,
        availableToWeekDay: 6,
        availableFromTime: "08:00:00",
        availableToTime: "23:59:00",
        appointmentPriceInCents: 100,
      })
      .onConflictDoNothing();
    await db
      .insert(schema.patientsTable)
      .values({
        id: PATIENT_ID,
        clinicId: CLINIC_ID,
        name: "P",
        email: "p@example.com",
        phoneNumber: "1",
        sex: "female",
      })
      .onConflictDoNothing();
    await db
      .delete(schema.appointmentsTable)
      .where(
        (await import("drizzle-orm")).eq(
          schema.appointmentsTable.clinicId,
          CLINIC_ID,
        ),
      );
    // 23:30 on the 12th in São Paulo is 02:30 UTC on the 13th.
    await db.insert(schema.appointmentsTable).values({
      clinicId: CLINIC_ID,
      doctorId: DOCTOR_ID,
      patientId: PATIENT_ID,
      date: new Date("2026-10-13T02:30:00Z"),
      appointmentPriceInCents: 100,
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const dashboardFor = async (from: string, to: string) => {
    const { getDashboard } = await import("./get-dashboard");
    return getDashboard({
      from,
      to,
      session: { user: { clinic: { id: CLINIC_ID } } },
    });
  };

  it("counts a late-evening appointment on its clinic day", async () => {
    const onTheDay = await dashboardFor("2026-10-12", "2026-10-12");
    const dayAfter = await dashboardFor("2026-10-13", "2026-10-13");

    expect(onTheDay.totalAppointments.total).toBe(1);
    expect(dayAfter.totalAppointments.total).toBe(0);
  });

  it("groups the chart by clinic day", async () => {
    const { dailyAppointmentsData } = await dashboardFor(
      "2026-10-01",
      "2026-10-31",
    );

    expect(dailyAppointmentsData).toEqual([
      expect.objectContaining({ date: "2026-10-12", appointments: 1 }),
    ]);
  });
});
