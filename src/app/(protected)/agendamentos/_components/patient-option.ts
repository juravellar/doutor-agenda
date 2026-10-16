import type { patientsTable } from "@/db/schema";

// What the appointment screens need from a patient. The full row also holds
// CPF, address, insurance and notes, which must not reach the browser just to
// show a name (LGPD data minimization).
export type PatientOption = Pick<
  typeof patientsTable.$inferSelect,
  "id" | "name"
>;

export const PATIENT_OPTION_COLUMNS = { id: true, name: true } as const;
