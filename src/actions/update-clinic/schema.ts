import { z } from "zod";

import {
  BRAND_COLOR_PATTERN,
  LOGO_DATA_URL_PATTERN,
  MAX_LOGO_LENGTH,
} from "@/lib/branding";

export const updateClinicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Nome é obrigatório." })
    .max(120, { message: "Use até 120 caracteres." }),
  address: z.string().trim().max(200).optional(),
  phoneNumber: z.string().trim().max(20).optional(),
  // Empty removes the color or the logo.
  brandColor: z
    .string()
    .optional()
    .refine((value) => !value || BRAND_COLOR_PATTERN.test(value), {
      message: "Cor inválida.",
    }),
  logoDataUrl: z
    .string()
    .max(MAX_LOGO_LENGTH, { message: "Logo muito grande." })
    .optional()
    .refine((value) => !value || LOGO_DATA_URL_PATTERN.test(value), {
      message: "Use uma imagem PNG, JPG ou WebP.",
    }),
});

export type UpdateClinicSchema = z.infer<typeof updateClinicSchema>;
