"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { clinicWriteActionClient } from "@/lib/clinic-action";

import { updateClinicSchema } from "./schema";

export const updateClinic = clinicWriteActionClient
  .schema(updateClinicSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db
      .update(clinicsTable)
      .set({
        name: parsedInput.name,
        address: parsedInput.address || null,
        phoneNumber: parsedInput.phoneNumber || null,
      })
      .where(eq(clinicsTable.id, ctx.clinic.id));
    revalidatePath("/", "layout");
  });
