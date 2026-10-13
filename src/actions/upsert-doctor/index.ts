"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { clinicTimeToUtc } from "@/helpers/time";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertDoctorSchema } from "./schema";

export const upsertDoctor = actionClient
  .schema(upsertDoctorSchema)
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
    if (parsedInput.id) {
      const existingDoctor = await db.query.doctorsTable.findFirst({
        where: eq(doctorsTable.id, parsedInput.id),
      });
      if (existingDoctor && existingDoctor.clinicId !== clinicId) {
        throw new Error("Médico não encontrado");
      }
    }

    const availableFromTime = clinicTimeToUtc(parsedInput.availableFromTime);
    const availableToTime = clinicTimeToUtc(parsedInput.availableToTime);

    await db
      .insert(doctorsTable)
      .values({
        ...parsedInput,
        clinicId,
        availableFromTime,
        availableToTime,
      })
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        setWhere: eq(doctorsTable.clinicId, clinicId),
        set: {
          ...parsedInput,
          availableFromTime,
          availableToTime,
        },
      });
    revalidatePath("/doctors");
  });
