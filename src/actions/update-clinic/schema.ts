import { z } from "zod";

import { isValidPhone } from "@/helpers/phone";

export const updateClinicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Nome é obrigatório." })
    .max(120, { message: "Use até 120 caracteres." }),
  address: z.string().trim().max(200).optional(),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidPhone(value), {
      message: "Telefone inválido.",
    }),
});

export type UpdateClinicSchema = z.infer<typeof updateClinicSchema>;
