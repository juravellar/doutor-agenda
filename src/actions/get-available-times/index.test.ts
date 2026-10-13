import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findDoctor: vi.fn(),
  findAppointments: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => ({
  db: {
    query: {
      doctorsTable: { findFirst: mocks.findDoctor },
      appointmentsTable: { findMany: mocks.findAppointments },
    },
  },
}));

import { getAvailableTimes } from ".";

const CLINIC_ID = "11111111-1111-4111-8111-111111111111";
const DOCTOR_ID = "22222222-2222-4222-8222-222222222222";
const MONDAY = "2026-10-12";

const doctor = {
  id: DOCTOR_ID,
  clinicId: CLINIC_ID,
  availableFromWeekDay: 1,
  availableToWeekDay: 5,
  availableFromTime: "11:00:00",
  availableToTime: "13:00:00",
};

describe("getAvailableTimes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({
      user: { clinic: { id: CLINIC_ID } },
    });
    mocks.findAppointments.mockResolvedValue([]);
  });

  it("hides doctors from another clinic", async () => {
    mocks.findDoctor.mockResolvedValue({ ...doctor, clinicId: "other" });

    const result = await getAvailableTimes({
      doctorId: DOCTOR_ID,
      date: MONDAY,
    });

    expect(result?.serverError).toBeDefined();
    expect(mocks.findAppointments).not.toHaveBeenCalled();
  });

  it("returns slots in clinic time for availability stored in UTC", async () => {
    mocks.findDoctor.mockResolvedValue(doctor);

    const result = await getAvailableTimes({
      doctorId: DOCTOR_ID,
      date: MONDAY,
    });

    expect(result?.data?.map((slot) => slot.value)).toEqual([
      "08:00:00",
      "08:30:00",
      "09:00:00",
      "09:30:00",
      "10:00:00",
    ]);
  });

  it("marks slots booked in clinic time as unavailable", async () => {
    mocks.findDoctor.mockResolvedValue(doctor);
    mocks.findAppointments.mockResolvedValue([
      { date: new Date("2026-10-12T11:30:00.000Z") },
      { date: new Date("2026-10-13T12:00:00.000Z") },
    ]);

    const result = await getAvailableTimes({
      doctorId: DOCTOR_ID,
      date: MONDAY,
    });

    const unavailable = result?.data
      ?.filter((slot) => !slot.available)
      .map((slot) => slot.value);
    expect(unavailable).toEqual(["08:30:00"]);
  });
});
