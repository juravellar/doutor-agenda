import { z } from "zod";

export const updateClinicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Nome é obrigatório." })
    .max(120, { message: "Use até 120 caracteres." }),
  address: z.string().trim().max(200).optional(),
  phoneNumber: z.string().trim().max(20).optional(),
});

export type UpdateClinicSchema = z.infer<typeof updateClinicSchema>;
