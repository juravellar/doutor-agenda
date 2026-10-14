import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const onConflictDoUpdate = vi.fn();
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  return {
    execute: vi.fn(),
    getSession: vi.fn(),
    findPatient: vi.fn(),
    countPatients: vi.fn(),
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
    query: { patientsTable: { findFirst: mocks.findPatient } },
    $count: mocks.countPatients,
    insert: () => ({ values: mocks.values }),
  };
  db.transaction = async (fn: (tx: unknown) => unknown) =>
    fn({ ...db, execute: mocks.execute });
  return { db };
});

import { upsertPatient } from ".";

const CLINIC_ID = "11111111-1111-4111-8111-111111111111";
const PATIENT_ID = "33333333-3333-4333-8333-333333333333";

const input = {
  id: PATIENT_ID,
  name: "João Silva",
  email: "joao@example.com",
  phoneNumber: "11999999999",
  sex: "male" as const,
};

describe("upsertPatient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({
      user: { plan: null, clinic: { id: CLINIC_ID } },
    });
    mocks.findPatient.mockResolvedValue(undefined);
    mocks.countPatients.mockResolvedValue(0);
  });

  it("creates a patient within the Free limit", async () => {
    mocks.countPatients.mockResolvedValue(19);

    const result = await upsertPatient(input);

    expect(result?.serverError).toBeUndefined();
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ clinicId: CLINIC_ID }),
    );
    expect(mocks.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ setWhere: expect.anything() }),
    );
  });

  it("blocks the 21st patient on the Free plan", async () => {
    mocks.countPatients.mockResolvedValue(20);

    const result = await upsertPatient(input);

    expect(result?.serverError).toBe(
      "Seu plano permite até 20 pacientes. Faça upgrade em Assinatura para continuar.",
    );
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("refuses to overwrite a patient from another clinic", async () => {
    mocks.findPatient.mockResolvedValue({ id: PATIENT_ID, clinicId: "other" });

    const result = await upsertPatient(input);

    expect(result?.serverError).toBeDefined();
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("locks the clinic before counting its patients", async () => {
    await upsertPatient(input);

    expect(mocks.execute).toHaveBeenCalledOnce();
    expect(mocks.execute.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.countPatients.mock.invocationCallOrder[0],
    );
  });
});
