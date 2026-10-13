import { z } from "zod";

// Shared with the client form, whose fields have a different shape.
export const timeRangeRule = {
  isValid: (from: string, to: string) => from < to,
  message: "O horário de término deve ser posterior ao horário de início.",
};

export const weekDayRangeRule = {
  isValid: (from: number, to: number) => from <= to,
  message: "O dia final deve ser igual ou posterior ao dia inicial.",
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
    appointmentPriceInCents: z.number().min(1, {
      message: "Preço da consulta é obrigatório.",
    }),
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
  )
  .refine(
    (data) =>
      weekDayRangeRule.isValid(
        data.availableFromWeekDay,
        data.availableToWeekDay,
      ),
    { message: weekDayRangeRule.message, path: ["availableToWeekDay"] },
  );

export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;
