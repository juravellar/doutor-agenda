"use client";

import { ColumnDef } from "@tanstack/react-table";

import { patientsTable } from "@/db/schema";

import { PatientTableActions } from "./table-actions";

type Patient = typeof patientsTable.$inferSelect;

export const patientsTableColumns: ColumnDef<Patient>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Nome",
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "phoneNumber",
    accessorKey: "phoneNumber",
    header: "Telefone",
    cell: (params) => {
      const phoneNumber = params.row.original.phoneNumber;
      return phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    },
  },
  {
    id: "sex",
    accessorKey: "sex",
    header: "Sexo",
    cell: (params) => {
      const patient = params.row.original;
      return patient.sex === "male" ? "Masculino" : "Feminino";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <PatientTableActions patient={row.original} />,
  },
];
