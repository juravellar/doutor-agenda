type DoctorPrice = { id: string; appointmentPriceInCents: number };
type BookedPrice = { doctorId: string; appointmentPriceInCents: number };

// The price to fill in when the doctor is picked, or null to keep the one the
// user typed. An appointment keeps the price it was booked with while it stays
// with its doctor.
export const priceInCentsForDoctor = (
  doctor: DoctorPrice,
  booked: BookedPrice | undefined,
  priceEdited: boolean,
): number | null => {
  if (booked && booked.doctorId === doctor.id) {
    return booked.appointmentPriceInCents;
  }
  return priceEdited ? null : doctor.appointmentPriceInCents;
};
