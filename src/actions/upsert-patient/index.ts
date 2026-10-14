"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { ensurePlanAllows } from "@/lib/plan-limits";
import { resolvePlan } from "@/lib/plans";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = actionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const clinicId = session.user.clinic?.id;
    if (!clinicId) {
      throw new Error("Clinic not found");
    }
    const existingPatient = parsedInput.id
      ? await db.query.patientsTable.findFirst({
          where: eq(patientsTable.id, parsedInput.id),
        })
      : undefined;
    if (existingPatient && existingPatient.clinicId !== clinicId) {
      throw new Error("Paciente não encontrado");
    }
    if (!existingPatient) {
      const patientCount = await db.$count(
        patientsTable,
        eq(patientsTable.clinicId, clinicId),
      );
      ensurePlanAllows(
        resolvePlan(session.user.plan),
        "patients",
        patientCount,
      );
    }

    await db
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
    revalidatePath("/patients");
  });
