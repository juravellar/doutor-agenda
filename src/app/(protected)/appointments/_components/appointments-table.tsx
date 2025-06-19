"use client";

import { DataTable } from "@/components/ui/data-table";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

import { createAppointmentsTableColumns } from "./table.columns";

type Appointment = typeof appointmentsTable.$inferSelect & {
  patient: { name: string };
  doctor: { name: string; specialty: string };
};

interface AppointmentsTableProps {
  appointments: Appointment[];
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}

export function AppointmentsTable({
  appointments,
  patients,
  doctors,
}: AppointmentsTableProps) {
  const columns = createAppointmentsTableColumns({ patients, doctors });

  return <DataTable columns={columns} data={appointments} />;
}