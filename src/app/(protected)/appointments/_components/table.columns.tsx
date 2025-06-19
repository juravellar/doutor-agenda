"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

import { AppointmentTableActions } from "./table-actions";

type Appointment = typeof appointmentsTable.$inferSelect & {
  patient: { name: string };
  doctor: { name: string; specialty: string };
};

interface AppointmentsTableColumnsProps {
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}

export const createAppointmentsTableColumns = ({
  patients,
  doctors,
}: AppointmentsTableColumnsProps): ColumnDef<Appointment>[] => [
  {
    id: "patient",
    accessorKey: "patient.name",
    header: "Paciente",
  },
  
  {
    id: "dateTime",
    header: "Data",
    cell: (params) => {
      const { date, time } = params.row.original;
      const [hours, minutes] = time.split(":").map(Number);
      const dateTime = new Date(date);
      dateTime.setHours(hours, minutes, 0, 0);
      return format(dateTime, "dd/MM/yyyy, HH:mm", { locale: ptBR });
    },
  },
  {
    id: "doctor",
    accessorKey: "doctor.name",
    header: "Médico",
  },
  {
    id: "specialty",
    accessorKey: "doctor.specialty",
    header: "Especialidade",
  },
  {
    id: "price",
    accessorKey: "appointmentPriceInCents",
    header: "Valor",
    cell: (params) => {
      const price = params.row.original.appointmentPriceInCents;
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(price / 100);
    },
  },
  
  {
    id: "actions",
    cell: ({ row }) => (
      <AppointmentTableActions
        appointment={row.original}
        patients={patients}
        doctors={doctors}
      />
    ),
  },
];
