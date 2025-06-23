"use client";

import { DataTable } from "@/components/ui/data-table";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

import { createAppointmentsTableColumns } from "../../appointments/_components/table-columns";

export type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
};

interface DashboardAppointmentsTableProps {
  appointments: AppointmentWithRelations[];
  patients: typeof patientsTable.$inferSelect[];
  doctors: typeof doctorsTable.$inferSelect[];
}

export default function DashboardAppointmentsTable({
  appointments,
  patients,
  doctors,
}: DashboardAppointmentsTableProps) {
  const columns = createAppointmentsTableColumns({
    patients,
    doctors,
  });

  return <DataTable columns={columns} data={appointments} />;
}
