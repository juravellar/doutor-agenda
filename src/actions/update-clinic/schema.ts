import { z } from "zod";

import { isAcceptablePhone } from "@/helpers/phone";

export const updateClinicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Nome é obrigatório." })
    .max(120, { message: "Use até 120 caracteres." }),
  address: z.string().trim().max(200).optional(),
  // Checked against the saved number by clinicFormSchema and the action.
  phoneNumber: z.string().trim().max(20).optional(),
});

export type UpdateClinicSchema = z.infer<typeof updateClinicSchema>;

export const INVALID_PHONE_MESSAGE = "Telefone inválido.";

// The form's rules: the shared ones, plus a phone that is empty, valid, or
// unchanged from the one saved.
export const clinicFormSchema = (savedPhone?: string | null) =>
  updateClinicSchema.refine(
    ({ phoneNumber }) =>
      !phoneNumber || isAcceptablePhone(phoneNumber, savedPhone),
    { message: INVALID_PHONE_MESSAGE, path: ["phoneNumber"] },
  );
