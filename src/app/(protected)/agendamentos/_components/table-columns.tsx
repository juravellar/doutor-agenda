"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { appointmentsTable, doctorsTable } from "@/db/schema";

import type { PatientOption } from "./patient-option";
import { AppointmentsTableActions } from "./table-actions";

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: PatientOption;
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
};

interface CreateAppointmentsTableColumnsParams {
  patients: PatientOption[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}

export function createAppointmentsTableColumns({
  patients,
  doctors,
}: CreateAppointmentsTableColumnsParams): ColumnDef<AppointmentWithRelations>[] {
  return [
    {
      id: "patient",
      accessorKey: "patient.name",
      header: "Paciente",
    },
    {
      id: "doctor",
      accessorKey: "doctor.name",
      header: "Médico",
      cell: (params) => {
        const appointment = params.row.original;
        return `${appointment.doctor.name}`;
      },
    },
    {
      id: "date",
      accessorKey: "date",
      header: "Data e Hora",
      cell: (params) => {
        const appointment = params.row.original;
        return format(new Date(appointment.date), "dd/MM/yyyy 'às' HH:mm", {
          locale: ptBR,
        });
      },
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
        const appointment = params.row.original;
        const price = appointment.appointmentPriceInCents / 100;
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(price);
      },
    },
    {
      id: "actions",
      cell: (params) => {
        const appointment = params.row.original;
        return (
          <AppointmentsTableActions
            appointment={appointment}
            patients={patients}
            doctors={doctors}
          />
        );
      },
    },
  ];
}
