import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

// Runs against a real Postgres only when INTEGRATION_DATABASE_URL is set (see
// the test:integration script); regular test runs skip it.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;

describe.skipIf(!databaseUrl)("account data against Postgres", () => {
  const load = async () => {
    process.env.DATABASE_URL = databaseUrl;
    const { db } = await import("@/db");
    const schema = await import("@/db/schema");
    const accountData = await import("./account-data");
    const { withUserLock } = await import("@/db/clinic-lock");
    return { db, schema, ...accountData, withUserLock };
  };

  const seedUserWithClinic = async (clinicName: string) => {
    const { db, schema } = await load();
    const userId = randomUUID();
    const clinicId = randomUUID();
    const now = new Date();
    await db.insert(schema.usersTable).values({
      id: userId,
      name: "Dona da clínica",
      email: `${userId}@exemplo.com`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    await db
      .insert(schema.clinicsTable)
      .values({ id: clinicId, name: clinicName });
    await db.insert(schema.usersToClinicsTable).values({ userId, clinicId });
    const [doctor] = await db
      .insert(schema.doctorsTable)
      .values({
        clinicId,
        name: "Dra. Ana",
        specialty: "Clínica geral",
        availableFromWeekDay: 1,
        availableToWeekDay: 5,
        availableFromTime: "11:00:00",
        availableToTime: "21:00:00",
        appointmentPriceInCents: 20000,
      })
      .returning();
    const [patient] = await db
      .insert(schema.patientsTable)
      .values({
        clinicId,
        name: "Maria Silva",
        email: "maria@exemplo.com",
        phoneNumber: "11999999999",
        sex: "female",
      })
      .returning();
    await db.insert(schema.appointmentsTable).values({
      clinicId,
      doctorId: doctor.id,
      patientId: patient.id,
      date: new Date("2026-10-20T14:00:00Z"),
      appointmentPriceInCents: 20000,
    });
    return { userId, clinicId };
  };

  it("exports the account with its clinics, doctors, patients and appointments", async () => {
    const { collectAccountData } = await load();
    const { userId, clinicId } = await seedUserWithClinic("Exportação");

    const data = await collectAccountData(userId);

    expect(data?.account.email).toBe(`${userId}@exemplo.com`);
    expect(data?.clinics).toHaveLength(1);
    expect(data?.clinics[0]).toMatchObject({
      id: clinicId,
      doctors: [expect.objectContaining({ name: "Dra. Ana" })],
      patients: [expect.objectContaining({ name: "Maria Silva" })],
      appointments: [expect.objectContaining({ clinicId })],
    });
    expect(JSON.stringify(data)).not.toMatch(/password|token/i);
  });

  it("deletes the user and everything in their own clinics", async () => {
    const { db, schema, deleteAccountData, withUserLock } = await load();
    const { eq } = await import("drizzle-orm");
    const { userId, clinicId } = await seedUserWithClinic("Exclusão");

    const deletedClinics = await withUserLock(userId, (tx) =>
      deleteAccountData(tx, userId),
    );

    expect(deletedClinics).toBe(1);
    const left = await Promise.all([
      db.$count(schema.usersTable, eq(schema.usersTable.id, userId)),
      db.$count(schema.clinicsTable, eq(schema.clinicsTable.id, clinicId)),
      db.$count(
        schema.doctorsTable,
        eq(schema.doctorsTable.clinicId, clinicId),
      ),
      db.$count(
        schema.patientsTable,
        eq(schema.patientsTable.clinicId, clinicId),
      ),
      db.$count(
        schema.appointmentsTable,
        eq(schema.appointmentsTable.clinicId, clinicId),
      ),
    ]);
    expect(left).toEqual([0, 0, 0, 0, 0]);
  });

  it("keeps a clinic that another user also belongs to", async () => {
    const { db, schema, deleteAccountData, withUserLock } = await load();
    const { eq } = await import("drizzle-orm");
    const { userId, clinicId } = await seedUserWithClinic("Compartilhada");
    const { userId: otherUserId } = await seedUserWithClinic("Outra");
    await db
      .insert(schema.usersToClinicsTable)
      .values({ userId: otherUserId, clinicId });

    const deletedClinics = await withUserLock(userId, (tx) =>
      deleteAccountData(tx, userId),
    );

    expect(deletedClinics).toBe(0);
    expect(
      await db.$count(
        schema.patientsTable,
        eq(schema.patientsTable.clinicId, clinicId),
      ),
    ).toBe(1);
  });
});
