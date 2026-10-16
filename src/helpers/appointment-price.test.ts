import { describe, expect, it } from "vitest";

import { priceInCentsForDoctor } from "./appointment-price";

const ana = { id: "ana", appointmentPriceInCents: 20000 };
const booked = { doctorId: "ana", appointmentPriceInCents: 15000 };

describe("priceInCentsForDoctor", () => {
  it("fills in the doctor's default on a new appointment", () => {
    expect(priceInCentsForDoctor(ana, undefined, false)).toBe(20000);
  });

  it("keeps a typed price when another doctor is picked", () => {
    expect(priceInCentsForDoctor(ana, undefined, true)).toBeNull();
  });

  it("brings back the booked price when the appointment's doctor is picked again", () => {
    expect(priceInCentsForDoctor(ana, booked, true)).toBe(15000);
  });

  it("uses the new doctor's default when an appointment changes doctor", () => {
    const bia = { id: "bia", appointmentPriceInCents: 30000 };
    expect(priceInCentsForDoctor(bia, booked, false)).toBe(30000);
  });
});
