import { z } from "zod";

import { BRAZILIAN_STATES, isValidCpf, onlyDigits } from "@/helpers/cpf";
import { clinicToday } from "@/helpers/time";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: `Use até ${max} caracteres.` })
    .optional();

const isValidBirthDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  value >= "1900-01-01" &&
  value <= clinicToday();

// Shared by the form and the server action, so both apply the same rules.
export const upsertPatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  phoneNumber: z.string().trim().min(1, {
    message: "Número de telefone é obrigatório.",
  }),
  sex: z.enum(["male", "female"], {
    required_error: "Sexo é obrigatório.",
  }),
  birthDate: z
    .string()
    .optional()
    .refine((value) => !value || isValidBirthDate(value), {
      message: "Data de nascimento inválida.",
    }),
  cpf: z
    .string()
    .optional()
    .refine((value) => !value || isValidCpf(value), {
      message: "CPF inválido.",
    }),
  healthInsurance: text(100),
  healthInsuranceNumber: text(50),
  addressZip: z
    .string()
    .optional()
    .refine((value) => !value || onlyDigits(value).length === 8, {
      message: "CEP inválido.",
    }),
  addressStreet: text(200),
  addressNumber: text(20),
  addressComplement: text(100),
  addressDistrict: text(100),
  addressCity: text(100),
  addressState: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || (BRAZILIAN_STATES as readonly string[]).includes(value),
      { message: "UF inválida." },
    ),
  emergencyContactName: text(120),
  emergencyContactPhone: z
    .string()
    .optional()
    .refine((value) => !value || [10, 11].includes(onlyDigits(value).length), {
      message: "Telefone inválido.",
    }),
  notes: text(1000),
});

export type UpsertPatientSchema = z.infer<typeof upsertPatientSchema>;

const orNull = (value: string | undefined) => (value ? value : null);
const digitsOrNull = (value: string | undefined) =>
  value ? onlyDigits(value) || null : null;

// The columns to store: empty fields become null, and CPF, CEP and phones
// keep only their digits.
export const patientColumns = (input: Omit<UpsertPatientSchema, "id">) => ({
  name: input.name,
  email: input.email,
  phoneNumber: input.phoneNumber,
  sex: input.sex,
  birthDate: orNull(input.birthDate),
  cpf: digitsOrNull(input.cpf),
  healthInsurance: orNull(input.healthInsurance),
  healthInsuranceNumber: orNull(input.healthInsuranceNumber),
  addressZip: digitsOrNull(input.addressZip),
  addressStreet: orNull(input.addressStreet),
  addressNumber: orNull(input.addressNumber),
  addressComplement: orNull(input.addressComplement),
  addressDistrict: orNull(input.addressDistrict),
  addressCity: orNull(input.addressCity),
  addressState: orNull(input.addressState),
  emergencyContactName: orNull(input.emergencyContactName),
  emergencyContactPhone: digitsOrNull(input.emergencyContactPhone),
  notes: orNull(input.notes),
});
