import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const onConflictDoUpdate = vi.fn();
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  return {
    getSession: vi.fn(),
    findDoctor: vi.fn(),
    values,
    onConflictDoUpdate,
  };
});

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => ({
  db: {
    query: { doctorsTable: { findFirst: mocks.findDoctor } },
    insert: () => ({ values: mocks.values }),
  },
}));

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
      user: { clinic: { id: CLINIC_ID } },
    });
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

  it("rejects an inverted weekday range", async () => {
    const result = await upsertDoctor({
      ...input,
      availableFromWeekDay: 5,
      availableToWeekDay: 1,
    });

    expect(result?.validationErrors).toBeDefined();
    expect(mocks.values).not.toHaveBeenCalled();
  });
});
