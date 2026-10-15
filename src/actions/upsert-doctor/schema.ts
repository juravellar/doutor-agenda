import { z } from "zod";

import { priceInCentsSchema } from "@/helpers/currency";

// Shared with the client form, whose fields have a different shape.
export const timeRangeRule = {
  isValid: (from: string, to: string) => from < to,
  message: "O horário de término deve ser posterior ao horário de início.",
};

export const upsertDoctorSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    specialty: z.string().trim().min(1, {
      message: "Especialidade é obrigatória.",
    }),
    appointmentPriceInCents: priceInCentsSchema(
      "Preço da consulta é obrigatório.",
    ),
    availableFromWeekDay: z.number().min(0).max(6),
    availableToWeekDay: z.number().min(0).max(6),
    availableFromTime: z.string().min(1, {
      message: "Hora de início é obrigatória.",
    }),
    availableToTime: z.string().min(1, {
      message: "Hora de término é obrigatória.",
    }),
  })
  .refine(
    (data) =>
      timeRangeRule.isValid(data.availableFromTime, data.availableToTime),
    { message: timeRangeRule.message, path: ["availableToTime"] },
  );

export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;
