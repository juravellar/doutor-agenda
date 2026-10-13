import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findPatient: vi.fn(),
  getAvailableTimes: vi.fn(),
  insertValues: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => ({
  db: {
    query: { patientsTable: { findFirst: mocks.findPatient } },
    insert: () => ({ values: mocks.insertValues }),
  },
}));
vi.mock("../get-available-times", () => ({
  getAvailableTimes: mocks.getAvailableTimes,
}));

import { upsertAppointment } from ".";

const CLINIC_ID = "11111111-1111-4111-8111-111111111111";
const DOCTOR_ID = "22222222-2222-4222-8222-222222222222";
const PATIENT_ID = "33333333-3333-4333-8333-333333333333";

// Midnight in São Paulo, as the browser date picker sends it.
const MONDAY_IN_CLINIC = new Date("2026-10-12T03:00:00.000Z");

const input = {
  patientId: PATIENT_ID,
  doctorId: DOCTOR_ID,
  date: MONDAY_IN_CLINIC,
  time: "08:00:00",
  appointmentPriceInCents: 20000,
};

describe("upsertAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({
      user: { clinic: { id: CLINIC_ID } },
    });
    mocks.findPatient.mockResolvedValue({
      id: PATIENT_ID,
      clinicId: CLINIC_ID,
    });
    mocks.getAvailableTimes.mockResolvedValue({
      data: [{ value: "08:00:00", available: true }],
    });
  });

  it("stores the appointment at the clinic-time instant", async () => {
    const result = await upsertAppointment(input);

    expect(result?.serverError).toBeUndefined();
    expect(mocks.getAvailableTimes).toHaveBeenCalledWith({
      doctorId: DOCTOR_ID,
      date: "2026-10-12",
    });
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: CLINIC_ID,
        date: new Date("2026-10-12T11:00:00.000Z"),
      }),
    );
  });

  it("refuses a patient from another clinic", async () => {
    mocks.findPatient.mockResolvedValue({ id: PATIENT_ID, clinicId: "other" });

    const result = await upsertAppointment(input);

    expect(result?.serverError).toBeDefined();
    expect(mocks.insertValues).not.toHaveBeenCalled();
  });

  it("refuses a slot that is not available", async () => {
    mocks.getAvailableTimes.mockResolvedValue({
      data: [{ value: "08:00:00", available: false }],
    });

    const result = await upsertAppointment(input);

    expect(result?.serverError).toBeDefined();
    expect(mocks.insertValues).not.toHaveBeenCalled();
  });
});
