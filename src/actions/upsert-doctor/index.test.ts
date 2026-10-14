import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const onConflictDoUpdate = vi.fn();
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  return {
    execute: vi.fn(),
    getSession: vi.fn(),
    findDoctor: vi.fn(),
    countDoctors: vi.fn(),
    values,
    onConflictDoUpdate,
  };
});

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => {
  const db: Record<string, unknown> = {
    query: { doctorsTable: { findFirst: mocks.findDoctor } },
    $count: mocks.countDoctors,
    insert: () => ({ values: mocks.values }),
  };
  db.transaction = async (fn: (tx: unknown) => unknown) =>
    fn({ ...db, execute: mocks.execute });
  return { db };
});

import { upsertDoctor } from ".";

const CLINIC_ID = "11111111-1111-4111-8111-111111111111";
const DOCTOR_ID = "22222222-2222-4222-8222-222222222222";

const input = {
  id: DOCTOR_ID,
  name: "Dra. Ana",
  specialty: "Cardiologia",
  appointmentPriceInCents: 20000,
  availableFromWeekDay: 1,
  availableToWeekDay: 5,
  availableFromTime: "08:00:00",
  availableToTime: "18:00:00",
};

describe("upsertDoctor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({
      user: { plan: "essential", clinic: { id: CLINIC_ID } },
    });
    mocks.countDoctors.mockResolvedValue(0);
  });

  it("rejects unauthenticated requests before touching the database", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await upsertDoctor(input);

    expect(result?.serverError).toBeDefined();
    expect(mocks.findDoctor).not.toHaveBeenCalled();
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("refuses to overwrite a doctor from another clinic", async () => {
    mocks.findDoctor.mockResolvedValue({ id: DOCTOR_ID, clinicId: "other" });

    const result = await upsertDoctor(input);

    expect(result?.serverError).toBeDefined();
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("updates a doctor from the same clinic, storing times in UTC", async () => {
    mocks.findDoctor.mockResolvedValue({ id: DOCTOR_ID, clinicId: CLINIC_ID });

    const result = await upsertDoctor(input);

    expect(result?.serverError).toBeUndefined();
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: CLINIC_ID,
        availableFromTime: "11:00:00",
        availableToTime: "21:00:00",
      }),
    );
    expect(mocks.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ setWhere: expect.anything() }),
    );
  });

  it("creates a doctor when the id does not exist yet", async () => {
    mocks.findDoctor.mockResolvedValue(undefined);

    const result = await upsertDoctor(input);

    expect(result?.serverError).toBeUndefined();
    expect(mocks.values).toHaveBeenCalledOnce();
  });

  it("accepts a weekly range that wraps around the weekend", async () => {
    mocks.findDoctor.mockResolvedValue(undefined);

    const result = await upsertDoctor({
      ...input,
      availableFromWeekDay: 5,
      availableToWeekDay: 1,
    });

    expect(result?.validationErrors).toBeUndefined();
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        availableFromWeekDay: 5,
        availableToWeekDay: 1,
      }),
    );
  });

  it("blocks a second doctor on the Free plan", async () => {
    mocks.getSession.mockResolvedValue({
      user: { plan: null, clinic: { id: CLINIC_ID } },
    });
    mocks.findDoctor.mockResolvedValue(undefined);
    mocks.countDoctors.mockResolvedValue(1);

    const result = await upsertDoctor(input);

    expect(result?.serverError).toBe(
      "Seu plano permite até 1 médico. Faça upgrade em Assinatura para continuar.",
    );
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("allows up to 5 doctors on the Essencial plan", async () => {
    mocks.findDoctor.mockResolvedValue(undefined);
    mocks.countDoctors.mockResolvedValue(4);

    const result = await upsertDoctor(input);

    expect(result?.serverError).toBeUndefined();
    expect(mocks.values).toHaveBeenCalledOnce();
  });

  it("does not count limits when editing an existing doctor", async () => {
    mocks.getSession.mockResolvedValue({
      user: { plan: null, clinic: { id: CLINIC_ID } },
    });
    mocks.findDoctor.mockResolvedValue({ id: DOCTOR_ID, clinicId: CLINIC_ID });
    mocks.countDoctors.mockResolvedValue(1);

    const result = await upsertDoctor(input);

    expect(result?.serverError).toBeUndefined();
    expect(mocks.countDoctors).not.toHaveBeenCalled();
  });

  it("locks the clinic before counting its doctors", async () => {
    mocks.findDoctor.mockResolvedValue(undefined);

    await upsertDoctor(input);

    const lockQuery = new PgDialect().sqlToQuery(
      mocks.execute.mock.calls[0][0],
    );
    expect(lockQuery.sql).toContain("pg_advisory_xact_lock");
    expect(lockQuery.params).toEqual([CLINIC_ID]);
    expect(mocks.execute.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.countDoctors.mock.invocationCallOrder[0],
    );
  });
});
