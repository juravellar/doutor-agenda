"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { withClinicLock } from "@/db/clinic-lock";
import { patientsTable } from "@/db/schema";
import { clinicWriteActionClient } from "@/lib/clinic-action";
import { ensurePlanAllows } from "@/lib/plan-limits";
import { resolvePlan } from "@/lib/plans";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = clinicWriteActionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.clinic.id;
    await withClinicLock(clinicId, async (tx) => {
      const existingPatient = parsedInput.id
        ? await tx.query.patientsTable.findFirst({
            where: eq(patientsTable.id, parsedInput.id),
          })
        : undefined;
      if (existingPatient && existingPatient.clinicId !== clinicId) {
        throw new Error("Paciente não encontrado");
      }
      if (!existingPatient) {
        const patientCount = await tx.$count(
          patientsTable,
          eq(patientsTable.clinicId, clinicId),
        );
        ensurePlanAllows(resolvePlan(ctx.user.plan), "patients", patientCount);
      }

      await tx
        .insert(patientsTable)
        .values({
          ...parsedInput,
          clinicId,
        })
        .onConflictDoUpdate({
          target: [patientsTable.id],
          setWhere: eq(patientsTable.clinicId, clinicId),
          set: {
            ...parsedInput,
          },
        });
    });
    revalidatePath("/patients");
  });
